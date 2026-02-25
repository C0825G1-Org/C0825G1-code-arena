import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../../../../app/store';
import { logout } from '../../../auth/store/authSlice';

export const UserHomePage = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white p-10">
            <div className="max-w-4xl mx-auto glass p-8 rounded-2xl border border-white/10 shadow-lg">
                <h1 className="text-3xl font-bold text-blue-400 mb-4">Chào mừng: {user?.fullName}</h1>
                <p className="text-slate-300 mb-6">Đây là trang chủ dành cho thí sinh. Bạn có thể xem danh sách bài thi và bảng xếp hạng ở đây.</p>

                <button
                    onClick={() => {
                        navigate('/');
                        dispatch(logout());
                    }}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};
