import React, { useState } from 'react';
import { settingsService, ChangePasswordRequest } from '../services/settingsService';
import { toast } from 'react-hot-toast';

export const SecuritySettingsForm: React.FC = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error('Vui lòng điền đầy đủ các trường.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setLoading(true);
        try {
            const data: ChangePasswordRequest = {
                oldPassword,
                newPassword,
                confirmPassword,
            };
            await settingsService.changePassword(data);
            toast.success('Mật khẩu đã được cập nhật thành công.');

            // Xóa form sau khi lưu thành công
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Lỗi khi đổi mật khẩu.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-8 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700/50 pb-4">Đổi Mật Khẩu</h3>

            <div className="space-y-5 max-w-lg">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Mật khẩu hiện tại</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Mật khẩu mới</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Xác nhận mật khẩu mới</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-start mt-8">
                <button
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    onClick={handleSave}
                >
                    {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </button>
            </div>
        </div>
    );
};
