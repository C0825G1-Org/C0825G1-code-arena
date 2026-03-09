import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../../../shared/hooks/useSocket';
import { getIceServers } from '../../../../shared/config/webrtcConfig';
import { SnapshotViewerModal } from '../components/SnapshotViewerModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { AdminLayout } from '../../../admin/components/AdminLayout';
import { ModeratorLayout } from '../../components/ModeratorLayout';
import { ArrowLeft } from '@phosphor-icons/react';
import { GroupChat } from '../../../chat/components/GroupChat';
import { Avatar } from '../../../../shared/components/Avatar';

export const MonitorPanelPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const backPath = isAdmin ? '/admin/contests' : '/moderator/contests';
    const resultsPath = `/moderator/contests/${id}/results`;
    const socket: any = useSocket();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        activeParticipantsCount: 0,
        totalSubmissionsCount: 0,
        remainingTimeSeconds: 0,
        remainingStartTimeSeconds: 0,
        status: 'UNKNOWN',
        endTime: undefined as string | undefined
    });

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [feed, setFeed] = useState<any[]>([]);

    // Pagination state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 5;

    // WebRTC Active Proctoring State
    const [viewingUser, setViewingUser] = useState<any | null>(null);
    const viewingUserRef = React.useRef<any>(null);
    const peerRef = React.useRef<RTCPeerConnection | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [streamToPlay, setStreamToPlay] = useState<MediaStream | null>(null);
    const [isInitiatingCamera, setIsInitiatingCamera] = useState(false);

    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
    const [snapshotViewUser, setSnapshotViewUser] = useState<any | null>(null);

    // Camera Action Modal State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionUser, setActionUser] = useState<any | null>(null);

    const [isKickConfirmOpen, setIsKickConfirmOpen] = useState(false);

    useEffect(() => {
        if (streamToPlay && videoRef.current) {
            console.log("[Moderator] Binding stream to video element...", streamToPlay.id);
            videoRef.current.srcObject = streamToPlay;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("[Moderator] AutoPlay prevented:", e));
            };
        }
    }, [streamToPlay]);

    useEffect(() => {
        fetchInitialData();
        fetchLeaderboard(0);
    }, [id]);

    useEffect(() => {
        if (!socket || !id) return;

        setConnected(socket.connected);

        const handleConnect = () => {
            setConnected(true);
            socket.emit('join_monitor', id);
        };
        const handleDisconnect = () => setConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Nếu đã connect từ trước thì join luôn
        if (socket.connected) {
            handleConnect();
        }

        // Xóa listener cũ tránh duplicate
        socket.off('monitor_submission_update');
        socket.off('monitor_leaderboard_update');
        socket.off('monitor_new_participant');

        socket.on('monitor_submission_update', (newSub: any) => {
            setFeed(prev => [newSub, ...prev].slice(0, 50));

            // Re-fetch current page to reflect new scores and potentially new participants
            fetchLeaderboard(page);

            setStats(s => {
                let newParticipantsCount = s.activeParticipantsCount;

                // We use the leaderboard state as a heuristic: 
                // If a user submits and they aren't natively tracked, we can assume it's their first
                // But since fetchLeaderboard is called concurrently, the most accurate way without backend event
                // is to wait for leaderboard update or check current state
                return { ...s, totalSubmissionsCount: s.totalSubmissionsCount + 1 };
            });
            toast.success(`Thí sinh ${newSub.fullname} vừa nộp bài!`, { icon: '🔔' });
        });

        socket.on('monitor_leaderboard_update', () => {
            // Incase backend pushes an event
            fetchLeaderboard(page);
        });

        socket.on('monitor_new_participant', () => {
            setStats(s => ({ ...s, activeParticipantsCount: s.activeParticipantsCount + 1 }));
            toast.success(`Một thí sinh mới vừa tham gia vòng thi!`, { icon: '👋' });
        });

        socket.on('monitor_camera_violation', (data: { userId: number, isCameraViolating: boolean }) => {
            setLeaderboard(prev => prev.map(u => 
                u.userId === data.userId ? { ...u, isCameraViolating: data.isCameraViolating } : u
            ));
            if (data.isCameraViolating) {
                toast.error(`Thí sinh vừa bị phát hiện vi phạm Camera!`, { icon: '📷' });
            }
        });

        const handleWebrtcSignal = async (data: any) => {
            console.log("[Moderator] Received WebRTC signal from Contestant", data.fromUserId, ":", data.signal.type || "candidate");
            const pc = peerRef.current;
            if (!pc) {
                console.warn("[Moderator] Received signal but peerRef is not active.");
                return;
            }
            // Verify signal is from the person we are CURRENTLY viewing
            if (!viewingUserRef.current || data.fromUserId !== viewingUserRef.current.userId) {
                console.log("[Moderator] Ignored signal from User", data.fromUserId, "because viewing User is", viewingUserRef.current?.userId);
                return;
            }
            try {
                const signal = data.signal;
                if (signal.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    console.log("[Moderator] Set remote description (answer)");
                } else if (signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal));
                    console.log("[Moderator] Added ICE candidate");
                }
            } catch (err) {
                console.error("[Moderator] Signal processing error:", err);
            }
        };

        const handleStopProctoring = () => {
            // If the student closes their stream or hardware disconnects
            stopViewingCamera();
        };

        const handleCameraDenied = (data: any) => {
            console.log("[Moderator] Camera denied by contestant:", data.reason);
            toast.error(data.reason || 'Thí sinh đã từ chối bật Camera.', {
                icon: '🚫',
                duration: 5000,
            });
            stopViewingCamera();
        };

        const handleProctoringDisconnected = (data: any) => {
            console.log("[Moderator] Proctoring disconnected:", data.reason);
            toast.error(data.reason || 'Thí sinh đã ngắt kết nối camera.', {
                icon: '⚠️',
                duration: 5000,
            });
            stopViewingCamera();
        };

        socket.on('webrtc-signal', handleWebrtcSignal);
        socket.on('stop-proctoring', handleStopProctoring);
        socket.on('camera-denied', handleCameraDenied);
        socket.on('proctoring-disconnected', handleProctoringDisconnected);

        return () => {
            socket.emit('leave_monitor', id);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('monitor_submission_update');
            socket.off('monitor_leaderboard_update');
            socket.off('monitor_new_participant');
            socket.off('monitor_camera_violation');
            socket.off('webrtc-signal', handleWebrtcSignal);
            socket.off('stop-proctoring', handleStopProctoring);
            socket.off('camera-denied', handleCameraDenied);
            socket.off('proctoring-disconnected', handleProctoringDisconnected);
            stopViewingCamera();
        };
    }, [socket, id]);

    // Timer đếm ngược
    useEffect(() => {
        const timer = setInterval(() => {
            setStats(s => {
                if (s.status === 'upcoming' && s.remainingStartTimeSeconds > 0) {
                    if (s.remainingStartTimeSeconds === 1) {
                        toast.success('Cuộc thi đã bắt đầu!', { icon: '🔥' });
                        // Chờ một chút rồi reload data để chuyển trạng thái sang ACTIVE
                        setTimeout(() => fetchInitialData(), 2000);
                    }
                    return { ...s, remainingStartTimeSeconds: s.remainingStartTimeSeconds - 1 };
                }

                if (s.status === 'active' && s.remainingTimeSeconds > 0) {
                    if (s.remainingTimeSeconds === 1) {
                        toast.success('Cuộc thi đã kết thúc! Đang chuyển sang màn hình thống kê kết quả.', { icon: '🏁' });
                        setTimeout(() => navigate(resultsPath), 3000);
                    }
                    return { ...s, remainingTimeSeconds: s.remainingTimeSeconds - 1 };
                }
                return s;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const res: any = await axiosClient.get(`/moderator/dashboard/contests/${id}/monitor`);

            let startCountdown = 0;
            if (res.status?.toLowerCase() === 'upcoming' && res.startTime) {
                const diff = (new Date(res.startTime).getTime() - new Date().getTime()) / 1000;
                startCountdown = diff > 0 ? Math.floor(diff) : 0;
            }

            setStats({
                activeParticipantsCount: res.activeParticipantsCount || 0,
                totalSubmissionsCount: res.totalSubmissionsCount || 0,
                remainingTimeSeconds: res.remainingTimeSeconds || 0,
                remainingStartTimeSeconds: startCountdown,
                status: res.status?.toLowerCase() || 'unknown',
                endTime: res.endTime
            });
            setFeed(res.recentSubmissions || []);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu Monitor.');
            navigate(backPath);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async (pageNumber: number) => {
        try {
            const res: any = await axiosClient.get(`/moderator/dashboard/contests/${id}/monitor/leaderboard?page=${pageNumber}&size=${size}`);
            setLeaderboard(res.content || []);
            setTotalPages(res.totalPages || 1);
            setPage(pageNumber);
        } catch (error) {
            console.error("Failed to load monitor leaderboard", error);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "Đã kết thúc";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startViewingCamera = async (user: any) => {
        if (isInitiatingCamera) {
            toast.error('Vui lòng đợi 3 giây trước khi gọi Camera tiếp theo.', { id: 'web-rtc-wait' });
            return;
        }

        // Enforce single thread: Kill previous connection if any
        if (viewingUserRef.current && viewingUserRef.current.userId !== user.userId) {
            stopViewingCamera();
        }

        setIsInitiatingCamera(true);
        setTimeout(() => setIsInitiatingCamera(false), 5000);

        viewingUserRef.current = user;
        setViewingUser(user);
        setStreamToPlay(null);
        toast('Đang thiết lập kết nối ...', { icon: '🔒' });

        // STEP 1: Tell contestant to open camera FIRST
        socket.emit('request-camera', { toUserId: user.userId });

        // STEP 2: Wait for contestant to create RTCPeerConnection before sending offer
        setTimeout(async () => {
            try {
                // Check if we're still viewing this user (might have cancelled)
                if (viewingUserRef.current?.userId !== user.userId) return;

                const iceServers = await getIceServers();
                const pc = new RTCPeerConnection({ iceServers });
                peerRef.current = pc;

                // Send ICE candidates to contestant
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("[Moderator] ICE candidate type:", event.candidate.type, "| protocol:", event.candidate.protocol, "| address:", event.candidate.address);
                        socket.emit('webrtc-signal', {
                            toUserId: user.userId,
                            signal: event.candidate.toJSON()
                        });
                    } else {
                        console.log("[Moderator] ICE gathering complete");
                    }
                };

                // Receive remote video stream
                pc.ontrack = (event) => {
                    console.log("[Moderator] Received remote track from Contestant!", event.streams[0]?.id);
                    if (event.streams && event.streams[0]) {
                        setStreamToPlay(event.streams[0]);
                        toast.success('Đã kết nối luồng Live Video trực tiếp!', { icon: '🟢' });
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log("[Moderator] Connection state:", pc.connectionState);
                    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                        console.log("[Moderator] WebRTC connection FAILED/DISCONNECTED");
                        toast.error('Mất kết nối Camera với thí sinh.');
                        stopViewingCamera();
                    }
                };

                // Create offer requesting video
                const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
                await pc.setLocalDescription(offer);
                console.log("[Moderator] Created and set local offer, sending to Contestant", user.userId);

                socket.emit('webrtc-signal', {
                    toUserId: user.userId,
                    signal: pc.localDescription
                });
            } catch (err) {
                console.error("[Moderator] RTCPeerConnection creation failed", err);
                toast.error('Lỗi khi khởi tạo kết nối WebRTC.');
                stopViewingCamera();
            }
        }, 1000); // Wait 1 second for contestant to open camera & create peer
    };

    const stopViewingCamera = () => {
        if (viewingUserRef.current && socket) {
            socket.emit('stop-proctoring', { toUserId: viewingUserRef.current.userId });
        }
        viewingUserRef.current = null;
        setViewingUser(null);
        setStreamToPlay(null);

        if (peerRef.current) {
            try { peerRef.current.close(); } catch (e) { }
            peerRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'AC') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (status === 'WA') return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        if (status === 'TLE' || status === 'MLE') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        if (status === 'judging' || status === 'pending') return 'text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse';
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse flex flex-col items-center gap-4">
            <i className="ph-duotone ph-activity text-4xl text-blue-500 animate-spin"></i>
            Đang khởi tạo Live Monitor...
        </div>;
    }

    const content = (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <i className="ph-fill ph-activity text-blue-500"></i>
                        Live Monitor
                        <span className={`text-xs px-2 py-1 rounded-full border ${connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                            {connected ? '● LIVE' : '○ DISCONNECTED'}
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-1">Giám sát theo thời gian thực cuộc thi #{id}</p>
                </div>
                <button onClick={() => navigate(backPath)} className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2">
                    <ArrowLeft size={18} />
                    Trở lại danh sách
                </button>
            </div>

            {/* TOP STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-400/80 font-medium text-sm mb-1 uppercase tracking-wider">Lượt nộp bài</p>
                            <h3 className="text-4xl font-bold text-white">{stats.totalSubmissionsCount}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <i className="ph-duotone ph-terminal-window text-2xl text-indigo-400"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-400/80 font-medium text-sm mb-1 uppercase tracking-wider">Thí sinh đang thi đấu</p>
                            <h3 className="text-4xl font-bold text-white">{stats.activeParticipantsCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <i className="ph-duotone ph-users text-2xl text-blue-400"></i>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br border rounded-2xl p-6 flex flex-col justify-between ${stats.status === 'upcoming' ? 'from-purple-500/10 to-indigo-500/5 border-purple-500/30' :
                    (stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'from-amber-500/10 to-rose-500/5 border-amber-500/30' : 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20')
                    }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`font-medium text-sm mb-1 uppercase tracking-wider ${stats.status === 'upcoming' ? 'text-purple-400' :
                                (stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'text-amber-400' : 'text-emerald-400/80')
                                }`}>
                                {stats.status === 'upcoming' ? 'Bắt đầu sau' : 'Thời gian còn lại'}
                            </p>
                            <h3 className="text-4xl font-bold text-white font-mono">
                                {stats.status === 'upcoming' ? formatTime(stats.remainingStartTimeSeconds) : formatTime(stats.remainingTimeSeconds)}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stats.status === 'upcoming' ? 'bg-purple-500/20' :
                            (stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'bg-amber-500/20' : 'bg-emerald-500/20')
                            }`}>
                            <i className={`ph-fill ${stats.status === 'upcoming' ? 'ph-hourglass-high text-purple-400' : 'ph-clock'} text-2xl ${stats.status === 'upcoming' ? 'animate-pulse' :
                                (stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400')
                                }`}></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* SPLIT PANES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEADERBOARD (Top 5) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg flex items-center gap-2 font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        <i className="ph-duotone ph-trophy text-yellow-500"></i> Bảng xếp hạng (Live)
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase bg-slate-800/50">
                                    <th className="py-4 px-4 font-semibold rounded-l-lg">Hạng</th>
                                    <th className="py-4 px-4 font-semibold">Thí sinh</th>
                                    <th className="py-4 px-4 font-semibold text-center">Tỉ lệ AC</th>
                                    <th className="py-4 px-4 font-semibold text-center">Penalty</th>
                                    <th className="py-4 px-4 font-semibold text-center">Tổng điểm</th>
                                    <th className="py-4 px-4 font-semibold text-center rounded-r-lg">Ghi hình</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((user) => (
                                    <tr key={user.userId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-4 px-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : user.rank === 2 ? 'bg-slate-300/20 text-slate-300' : user.rank === 3 ? 'bg-amber-700/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                                                {user.rank}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{user.fullname}</div>
                                                {user.isCameraViolating && (
                                                    <button 
                                                        onClick={() => {
                                                            setActionUser(user);
                                                            setIsActionModalOpen(true);
                                                        }}
                                                        className="text-rose-500 animate-pulse cursor-pointer hover:scale-110 transition-transform"
                                                        title="Vi phạm Camera! Click để xử lý"
                                                    >
                                                        <i className="ph-fill ph-video-camera-slash text-lg"></i>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">@{user.username}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {user.status === 'DISQUALIFIED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-xs font-bold">
                                                    <i className="ph-fill ph-prohibit"></i> Bị loại
                                                </span>
                                            ) : (
                                                <span className="text-sm text-emerald-400 font-mono">{user.acRate.toFixed(1)}%</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="text-rose-400 font-mono text-sm">{user.totalPenalty}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-mono text-blue-400 text-sm">{user.totalScore}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => startViewingCamera(user)}
                                                    disabled={isInitiatingCamera && viewingUser?.userId !== user.userId}
                                                    className={`p-2 rounded-lg transition-colors border flex items-center justify-center w-9 h-9 ${viewingUser?.userId === user.userId ? 'bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-rose-400 border-rose-500/50' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                                    title="Xem Live Camera"
                                                >
                                                    <i className={`ph-bold ${viewingUser?.userId === user.userId ? 'ph-video-camera-slash animate-pulse' : 'ph-video-camera'}`}></i>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSnapshotViewUser(user);
                                                        setIsSnapshotModalOpen(true);
                                                    }}
                                                    className="p-2 rounded-lg transition-colors border bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700 hover:border-slate-600 flex items-center justify-center w-9 h-9"
                                                    title="Xem Lịch sử Hình ảnh (Snapshots)"
                                                >
                                                    <i className="ph-bold ph-images"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">
                                            Chưa có dữ liệu bảng xếp hạng.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-between items-center bg-slate-800/20 p-2 rounded-xl">
                            <span className="text-sm text-slate-400 pl-4">
                                Trang <strong className="text-white">{page + 1}</strong> / {totalPages}
                            </span>
                            <div className="flex gap-2 pr-2">
                                <button
                                    onClick={() => fetchLeaderboard(page - 1)}
                                    disabled={page === 0}
                                    className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    <i className="ph-bold ph-caret-left"></i>
                                </button>
                                <button
                                    onClick={() => fetchLeaderboard(page + 1)}
                                    disabled={page === totalPages - 1}
                                    className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    <i className="ph-bold ph-caret-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* LIVE FEED */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl z-10 shadow-sm shadow-black/50">
                        <h2 className="text-lg flex items-center gap-2 font-bold text-white">
                            <i className="ph-bold ph-activity text-green-500"></i> Luồng Submission
                        </h2>
                        <span className="text-xs font-mono bg-slate-800 text-slate-400 py-1 px-2 rounded-lg">{feed.length} bản ghi</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {feed.map((log, i) => (
                            <div key={log.submissionId + "-" + i} className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl transition-all animate-slide-up group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            src={log.userAvatar}
                                            userId={log.userId}
                                            size="sm"
                                            borderColor="border-blue-500/30"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-white leading-tight">{log.fullname}</p>
                                            <span className="text-xs text-slate-500">{new Date(log.submittedAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getStatusColor(log.status)}`}>
                                        {log.status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-300 line-clamp-1 group-hover:text-blue-300">
                                    <span className="text-slate-500">Bài:</span> {log.problemTitle}
                                </div>
                                {log.status === 'AC' && <div className="mt-2 text-xs text-emerald-500/80 font-mono block text-right">+ {log.score} pts</div>}
                            </div>
                        ))}
                        {feed.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                                <i className="ph-duotone ph-terminal-window text-4xl opacity-50"></i>
                                <p>Đang chờ lượt nộp bài đầu tiên...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* FLOATING PROCTORING VIDEO CASTER */}
            {viewingUser && (
                <div className="fixed bottom-6 right-6 w-[22rem] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden z-[100] animate-slide-up flex flex-col">
                    <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <i className="ph-fill ph-video-camera text-blue-400 animate-pulse text-lg"></i>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide truncate max-w-[150px] leading-tight">{viewingUser.fullname}</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mt-1">Live Proctoring</p>
                            </div>
                        </div>
                        <button onClick={stopViewingCamera} className="text-slate-400 hover:text-white transition-all w-8 h-8 flex items-center justify-center bg-slate-700/50 hover:bg-rose-500 rounded-lg">
                            <i className="ph-bold ph-x text-sm"></i>
                        </button>
                    </div>
                    {/* 4:3 Aspect Ratio for Webcams */}
                    <div className="relative aspect-[4/3] bg-black flex items-center justify-center border-t border-white/5">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                        {!streamToPlay && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-900/80 backdrop-blur-sm z-10">
                                <i className="ph-duotone ph-spinner-gap text-3xl animate-spin text-blue-500 drop-shadow-lg"></i>
                                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Thiết lập luồng P2P...</span>
                            </div>
                        )}

                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-red-500 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border border-red-500/20 flex items-center gap-2 z-20">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></span> LIVE
                        </div>
                    </div>
                </div>
            )}

            {/* SNAPSHOT VIEWER MODAL */}
            <SnapshotViewerModal
                isOpen={isSnapshotModalOpen}
                onClose={() => {
                    setIsSnapshotModalOpen(false);
                    setTimeout(() => setSnapshotViewUser(null), 300); // clear after animation
                }}
                contestId={Number(id)}
                user={snapshotViewUser}
            />

            {/* CAMERA ACTION MODAL */}
            {isActionModalOpen && actionUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                                <i className="ph-fill ph-warning-octagon text-3xl text-rose-500"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Xử lý vi phạm Camera</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Thí sinh <strong>{actionUser.fullname}</strong> đang từ chối bật camera. Bạn muốn làm gì?
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button 
                                    onClick={() => {
                                        socket.emit('moderator-warn-participant', { toUserId: actionUser.userId });
                                        toast.success('Đã gửi cảnh báo tới thí sinh');
                                        setIsActionModalOpen(false);
                                    }}
                                    className="py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all"
                                >
                                    Cảnh báo
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsKickConfirmOpen(true);
                                    }}
                                    className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all"
                                >
                                    Kick
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setIsActionModalOpen(false)}
                                className="mt-4 text-slate-500 hover:text-slate-300 text-sm font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* KICK CONFIRMATION MODAL */}
            {isKickConfirmOpen && actionUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-rose-500/10">
                                <i className="ph-fill ph-warning-octagon text-4xl text-rose-500 animate-pulse"></i>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Xác nhận truất quyền thi?</h3>
                            <p className="text-slate-400 leading-relaxed mb-8">
                                Bạn có chắc chắn muốn kick thí sinh <strong className="text-white bg-slate-800 px-2 py-0.5 rounded">{actionUser.fullname}</strong> khỏi cuộc thi? Hành động này <strong className="text-rose-400">không thể hoàn tác</strong>.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button 
                                    onClick={() => setIsKickConfirmOpen(false)}
                                    className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all border border-slate-700"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={() => {
                                        socket.emit('moderator-kick-participant', { toUserId: actionUser.userId, contestId: parseInt(id!) });
                                        toast.error('Đã truất quyền thi thí sinh', {
                                            icon: '🚫',
                                            style: {
                                                borderRadius: '12px',
                                                background: '#1e293b',
                                                color: '#fff',
                                            },
                                        });
                                        setIsKickConfirmOpen(false);
                                        setIsActionModalOpen(false);
                                        // Update local status to avoid flicker
                                        setLeaderboard(prev => prev.map(u => u.userId === actionUser.userId ? { ...u, status: 'DISQUALIFIED', isCameraViolating: false } : u));
                                    }}
                                    className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98]"
                                >
                                    Xác nhận Kick
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHAT DÀNH CHO GIÁM THỊ */}
            {user && id && (
                <GroupChat
                    contestId={Number(id)}
                    currentUser={{
                        id: user.id,
                        username: user.username,
                        fullName: user.fullName || '',
                        role: user.role,
                        isContestChatLocked: user.isContestChatLocked
                    }}
                    contestTitle={`Phòng thi ${id}`}
                    contestStatus={stats.status}
                    endTime={stats.endTime}
                />
            )}
        </div>
    );
    if (isAdmin) {
        return (
            <AdminLayout title={`Live Monitor #${id}`} activeTab="contests">
                {content}
            </AdminLayout>
        );
    }

    return (
        <ModeratorLayout headerTitle={`Live Monitor #${id}`}>
            {content}
        </ModeratorLayout>
    );
};
