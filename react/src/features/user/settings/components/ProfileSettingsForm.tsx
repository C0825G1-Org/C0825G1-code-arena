import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { settingsService, UpdateProfileRequest, UserProfileResponse } from '../services/settingsService';
import { toast } from 'react-hot-toast';
import { loginSuccess } from '../../../../features/auth/store/authSlice';
import { Avatar } from '../../../../shared/components/Avatar';

export const ProfileSettingsForm: React.FC = () => {
    const dispatch = useDispatch();
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [githubLink, setGithubLink] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await settingsService.getProfile();
                setProfile(data);
                setFullName(data.fullName || '');
                setBio(data.bio || '');
                setGithubLink(data.githubLink || '');
            } catch (error) {
                toast.error('Không thể tải thông tin hồ sơ.');
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const data: UpdateProfileRequest = {
                fullName,
                bio,
                githubLink
            };
            const updatedProfile = await settingsService.updateProfile(data);
            setProfile(updatedProfile);

            // Cập nhật Redux store để navbar/sidemenu tự động render tên mới
            if (user && token) {
                dispatch(loginSuccess({
                    token,
                    user: {
                        ...user,
                        fullName: updatedProfile.fullName || user.fullName
                    }
                }));
            }

            toast.success('Đã lưu thông tin hồ sơ.');
        } catch (error) {
            toast.error('Lỗi khi lưu thông tin.');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        toast.loading('Đang upload ảnh...', { id: 'upload' });
        try {
            const result = await settingsService.uploadAvatar(file);
            setProfile(prev => prev ? { ...prev, avatarUrl: result.avatarUrl } : null);

            // Cập nhật Redux store cho avatar
            if (user && token) {
                dispatch(loginSuccess({
                    token,
                    user: {
                        ...user,
                        avatarUrl: result.avatarUrl
                    }
                }));
            }
            toast.success('Cập nhật Avatar thành công', { id: 'upload' });
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.', { id: 'upload' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!profile) return <div className="text-white text-center py-4">Đang tải...</div>;

    const avatarSource = profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.id || 1}`;

    return (
        <div className="glass p-8 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700/50 pb-4">Thông tin cơ bản</h3>

            <div className="flex flex-col sm:flex-row gap-8 mb-8 items-start">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <Avatar
                            src={profile.avatarUrl}
                            userId={profile.id}
                            size={128}
                            borderColor="border-slate-700"
                            className="group-hover:opacity-50 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="ph-bold ph-camera text-3xl text-white"></i>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={handleAvatarClick}
                        disabled={loading}
                        className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                        Tải ảnh mới
                    </button>
                </div>

                <div className="flex-1 w-full space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tên hiển thị (Tên thật)</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tên đăng nhập (Username)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                <input
                                    type="text"
                                    value={profile.username}
                                    disabled
                                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg pl-8 pr-4 py-2.5 outline-none cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email liên hệ</label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-4 py-2.5 outline-none cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Tiểu sử (Bio)</label>
                        <textarea
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={150}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                        />
                        <p className="text-xs text-slate-500 text-right">{bio.length}/150 ký tự</p>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700/50 pb-4 pt-4">Liên kết Mạng xã hội</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                        <i className="ph-fill ph-github-logo text-xl text-white"></i>
                    </div>
                    <input
                        type="text"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        placeholder="Liên kết Github của bạn"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-10">
                <button
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    onClick={handleSave}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};
