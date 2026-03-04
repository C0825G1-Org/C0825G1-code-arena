import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../../../shared/hooks/useSocket';
import Peer from 'simple-peer';
import { iceServers } from '../../../../shared/config/webrtcConfig';

export const MonitorPanelPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const socket: any = useSocket();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        activeParticipantsCount: 0,
        totalSubmissionsCount: 0,
        remainingTimeSeconds: 0
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
    const peerRef = React.useRef<any>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [streamToPlay, setStreamToPlay] = useState<MediaStream | null>(null);

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
            toast.success(`Thí sinh ${newSub.username} vừa nộp bài!`, { icon: '🔔' });
        });

        socket.on('monitor_leaderboard_update', () => {
            // Incase backend pushes an event
            fetchLeaderboard(page);
        });

        socket.on('monitor_new_participant', () => {
            setStats(s => ({ ...s, activeParticipantsCount: s.activeParticipantsCount + 1 }));
            toast.success(`Một thí sinh mới vừa tham gia vòng thi!`, { icon: '👋' });
        });

        const handleWebrtcSignal = (data: any) => {
            console.log("[Moderator] Received WebRTC signal from Contestant", data.fromUserId, ":", data.signal.type || "candidate");
            if (peerRef.current && !peerRef.current.destroyed) {
                // Important: Verify the signal is from the person we are CURRENTLY viewing
                if (viewingUserRef.current && data.fromUserId === viewingUserRef.current.userId) {
                    peerRef.current.signal(data.signal);
                } else {
                    console.log("[Moderator] Ignored signal from User", data.fromUserId, "because viewing User is", viewingUserRef.current?.userId);
                }
            } else {
                console.warn("[Moderator] Received signal but peerRef is not active or is destroyed.");
            }
        };

        const handleStopProctoring = () => {
            // If the student closes their stream or hardware disconnects
            stopViewingCamera();
        };

        socket.on('webrtc-signal', handleWebrtcSignal);
        socket.on('stop-proctoring', handleStopProctoring);

        return () => {
            socket.emit('leave_monitor', id);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('monitor_submission_update');
            socket.off('monitor_leaderboard_update');
            socket.off('monitor_new_participant');
            socket.off('webrtc-signal', handleWebrtcSignal);
            socket.off('stop-proctoring', handleStopProctoring);
            stopViewingCamera();
        };
    }, [socket, id]);

    // Timer đếm ngược
    useEffect(() => {
        const timer = setInterval(() => {
            setStats(s => {
                if (s.remainingTimeSeconds > 0) {
                    if (s.remainingTimeSeconds === 1) {
                        toast.success('Cuộc thi đã kết thúc! Tự động quay về danh sách.', { icon: '🏁' });
                        setTimeout(() => navigate('/moderator/contests'), 3000);
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
            setStats({
                activeParticipantsCount: res.activeParticipantsCount,
                totalSubmissionsCount: res.totalSubmissionsCount,
                remainingTimeSeconds: res.remainingTimeSeconds
            });
            setFeed(res.recentSubmissions || []);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu Monitor.');
            navigate('/moderator/contests');
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

    const startViewingCamera = (user: any) => {
        // Enforce single thread: Kill previous connection if any
        if (viewingUserRef.current && viewingUserRef.current.userId !== user.userId) {
            stopViewingCamera();
        }

        viewingUserRef.current = user;
        setViewingUser(user);
        setStreamToPlay(null);
        toast('Đang thiết lập kết nối mã hóa...', { icon: '🔒' });

        // Let React state update phase finish before refs access the modal
        setTimeout(() => {
            try {
                // Removing strict relay policy since free TURN servers often drop video packets
                const peer = new Peer({
                    initiator: true,
                    config: { iceServers }
                });
                peerRef.current = peer;

                peer.on('signal', (signalData: any) => {
                    console.log("[Moderator] Generated WebRTC signal, sending to Contestant", user.userId, ":", signalData.type || "candidate");
                    socket.emit('webrtc-signal', {
                        toUserId: user.userId,
                        signal: signalData
                    });
                });

                peer.on('connect', () => {
                    console.log("[Moderator] WebRTC P2P Connection ESTABLISHED with", user.userId);
                    toast.success('Đã kết nối luồng Live Video trực tiếp!', { icon: '🟢' });
                });

                peer.on('stream', (stream: any) => {
                    console.log("[Moderator] Received MediaStream from Contestant!", stream.id, "Audio Tracks:", stream.getAudioTracks().length, "Video Tracks:", stream.getVideoTracks().length);
                    setStreamToPlay(stream);
                });

                peer.on('close', () => {
                    console.log("[Moderator] WebRTC connection CLOSED with Contestant", user.userId);
                    stopViewingCamera();
                });

                peer.on('error', (err: any) => {
                    console.error('[Moderator] WebRTC Error:', err);
                    toast.error('Lỗi khi thiết lập Camera: Thí sinh từ chối hoặc mạng yếu.');
                    stopViewingCamera();
                });

                // Emit start signal backend router
                socket.emit('request-camera', { toUserId: user.userId });
            } catch (err) {
                console.error("Initiator Peer creation failed", err);
            }
        }, 100);
    };

    const stopViewingCamera = () => {
        if (viewingUserRef.current && socket) {
            socket.emit('stop-proctoring', { toUserId: viewingUserRef.current.userId });
        }
        viewingUserRef.current = null;
        setViewingUser(null);
        setStreamToPlay(null);
        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch (e) { }
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

    return (
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
                <button onClick={() => navigate('/moderator/contests')} className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
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
                            <p className="text-blue-400/80 font-medium text-sm mb-1 uppercase tracking-wider">Thí sinh thi đấu</p>
                            <h3 className="text-4xl font-bold text-white">{stats.activeParticipantsCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <i className="ph-duotone ph-users text-2xl text-blue-400"></i>
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br border rounded-2xl p-6 flex flex-col justify-between ${stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'from-amber-500/10 to-rose-500/5 border-amber-500/30' : 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`font-medium text-sm mb-1 uppercase tracking-wider ${stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'text-amber-400' : 'text-emerald-400/80'}`}>Thời gian còn lại</p>
                            <h3 className="text-4xl font-bold text-white font-mono">{formatTime(stats.remainingTimeSeconds)}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                            <i className={`ph-fill ph-clock text-2xl ${stats.remainingTimeSeconds <= 300 && stats.remainingTimeSeconds > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}></i>
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
                                            <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{user.fullname}</div>
                                            <div className="text-xs text-slate-500">@{user.username}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="text-sm text-emerald-400 font-mono">{user.acRate.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="text-rose-400 font-mono text-sm">{user.totalPenalty}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="font-mono text-blue-400 text-sm">{user.totalScore}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => startViewingCamera(user)}
                                                className={`p-2 rounded-lg transition-colors border ${viewingUser?.userId === user.userId ? 'bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-rose-400 border-rose-500/50' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20'}`}
                                                title="Xem WebRTC Camera (Live)"
                                            >
                                                <i className={`ph-fill ${viewingUser?.userId === user.userId ? 'ph-video-camera-slash' : 'ph-video-camera'} text-xl`}></i>
                                            </button>
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
                                        <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                                            {log.username?.substring(0, 2).toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-white leading-tight">{log.username}</p>
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
        </div>
    );
};
