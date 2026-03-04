import { useState, useRef, useEffect, useCallback } from 'react';
import axiosClient from '../../../../shared/services/axiosClient';
import { toast } from 'react-toastify';

interface UseCameraSnapshotProps {
    contestId: number;
    enabled: boolean;
    interval?: number; // Interval between snapshots in ms
    onCameraRefused?: () => void; // Bug #5: callback khi camera bị từ chối
}

export const useCameraSnapshot = ({
    contestId,
    enabled,
    interval = 60000, // 1 minute
    onCameraRefused,
}: UseCameraSnapshotProps) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const timerRef = useRef<any>(null);
    const onCameraRefusedRef = useRef(onCameraRefused);

    // Luôn giữ callback mới nhất mà không kích hoạt re-render của useEffect
    useEffect(() => {
        onCameraRefusedRef.current = onCameraRefused;
    }, [onCameraRefused]);

    const takeSnapshot = useCallback(async () => {
        if (!streamRef.current) return;

        try {
            setIsCapturing(true);

            // Tạo video element ẩn để capture
            if (!videoRef.current) {
                const video = document.createElement('video');
                video.srcObject = streamRef.current;
                video.play();
                videoRef.current = video;
                // Đợi video thực sự render frame đầu tiên + 300ms delay để chống ảnh đen
                await new Promise(resolve => {
                    video.onloadeddata = () => setTimeout(resolve, 300);
                });
            }

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoRef.current, 0, 0);

            // Chuyển sang Blob (JPEG 0.7 cho nhẹ)
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const formData = new FormData();
                formData.append('image', blob, 'snapshot.jpg');
                formData.append('contestId', contestId.toString());

                try {
                    await axiosClient.post('/snapshots/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (err) {
                    console.error("Failed to upload snapshot:", err);
                } finally {
                    setIsCapturing(false);
                }
            }, 'image/jpeg', 0.7);

        } catch (err) {
            console.error("Error taking snapshot:", err);
            setIsCapturing(false);
        }
    }, [contestId]);

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current = null;
            }
            return;
        }

        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = stream;
                setHasPermission(true);

                // Chụp lần đầu ngay lập tức
                takeSnapshot();

                // Lặp lại theo chu kỳ
                timerRef.current = setInterval(() => {
                    takeSnapshot();
                }, interval);

            } catch (err) {
                // Bug #5 fix: Camera bị từ chối → ghi vi phạm qua callback
                console.error("Camera permission denied:", err);
                setHasPermission(false);
                toast.error(
                    "⚠️ Camera bị từ chối! Hệ thống yêu cầu camera để giám sát bài thi. Từ chối camera bị tính là vi phạm.",
                    { autoClose: 8000, position: 'top-center' }
                );
                // Báo vi phạm về component cha (tương tự rời tab) thông qua Ref
                if (onCameraRefusedRef.current) {
                    onCameraRefusedRef.current();
                }
            }
        };

        initCamera();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [enabled, interval, takeSnapshot]); // Loại bỏ onCameraRefused khỏi dependency để chặn loop vô tận

    return { isCapturing, hasPermission };
};
