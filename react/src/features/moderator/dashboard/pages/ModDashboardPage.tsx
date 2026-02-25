import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';

export const ModDashboardPage = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white p-10">
            <div className="max-w-4xl mx-auto bg-purple-900/30 p-8 rounded-2xl border border-purple-500/30 shadow-lg">
                <h1 className="text-3xl font-bold text-purple-400 mb-4">Moderator Dashboard</h1>
                <p className="text-slate-300 mb-6">Xin chào quản trị viên cấp 1: {user?.username}. Tại đây bạn có thể quản lý các Contest và Problem.</p>

                <button
                    onClick={() => {
                        navigate('/');
                        setTimeout(() => {
                            dispatch(logout());
                        }, 10);
                    }}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};
