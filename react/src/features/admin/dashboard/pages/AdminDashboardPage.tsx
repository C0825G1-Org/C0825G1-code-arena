import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';

export const AdminDashboardPage = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();

    return (
        <div className="min-h-screen bg-slate-900 text-white p-10">
            <div className="max-w-4xl mx-auto bg-red-900/30 p-8 rounded-2xl border border-red-500/30 shadow-lg">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Admin Dashboard</h1>
                <p className="text-slate-300 mb-6">Chào mừng Admin Tối Cao: {user?.username}. Bạn có quyền truy cập toàn bộ hệ thống Code Arena.</p>

                <button
                    onClick={() => dispatch(logout())}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};
