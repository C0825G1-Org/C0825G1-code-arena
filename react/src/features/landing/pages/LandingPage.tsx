import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/store/authSlice';
import {
    Code,
    ArrowRight,
    RocketLaunch,
    TerminalWindow,
    Rocket,
    Trophy,
    FacebookLogo,
    TwitterLogo,
    GithubLogo
} from '@phosphor-icons/react';

export const LandingPage: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/');
        dispatch(logout());
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        const role = user.role?.replace('ROLE_', '').toUpperCase();
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'MODERATOR') return '/moderator/dashboard';
        return '/home';
    };

    return (
        <div className="antialiased min-h-screen flex flex-col relative overflow-x-hidden bg-[#0f172a] text-slate-50 font-sans">
            {/* Background Glows */}
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none"></div>

            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link to={getDashboardLink()} className="px-5 py-2 font-medium text-slate-300 hover:text-white transition-colors">
                                Vào Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2 bg-red-600/80 hover:bg-red-500 text-white font-medium rounded-lg transition-all shadow-lg flex items-center gap-2"
                            >
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-5 py-2 font-medium text-slate-300 hover:text-white transition-colors">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                                Đăng ký miễn phí <ArrowRight weight="bold" />
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Nền tảng thi đấu lập trình số 1 VN
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-relaxed max-w-4xl mb-6">
                    <span className="block mb-4 pt-4">Khẳng định Bản lĩnh</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 inline-block pb-4">Giải Thuật Đỉnh Cao</span>
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                    Hàng nghìn bài tập thuật toán, hệ thống chấm điểm siêu tốc và các cuộc thi lập trình hàng tuần. Nâng trình code, cày rank và trở thành Master ngay hôm nay.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to={isAuthenticated ? getDashboardLink() : "/register"} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-500/30 text-lg flex items-center justify-center gap-2">
                        Bắt Đầu Ngay <RocketLaunch weight="bold" />
                    </Link>
                    <a href="#features" className="px-8 py-4 bg-slate-800/50 backdrop-blur-md hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-2 border border-slate-700">
                        Tìm Hiểu Thêm
                    </a>
                </div>

                {/* Dashboard Mockup */}
                <div className="mt-20 relative w-full max-w-5xl group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                        <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="p-2 sm:p-0">
                            <img
                                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                alt="Dashboard Preview"
                                className="w-full h-[300px] md:h-[500px] object-cover opacity-80 mix-blend-screen"
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 border-t border-slate-800/50 bg-[#0a0f1d] z-10 relative">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Tại sao chọn Code Arena?</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Hệ sinh thái hoàn hảo cho coder rèn luyện và tỏa sáng.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-800/40 backdrop-blur-lg p-8 rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.2)] transition-all duration-300 border-t-4 border-t-blue-500 border-x border-b border-transparent">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                                <TerminalWindow weight="duotone" className="text-3xl text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Online IDE Hiện Đại</h3>
                            <p className="text-slate-400 leading-relaxed">Môi trường code tích hợp trực tiếp trên web với CodeMirror. Hỗ trợ C++, Java, Python, Auto-complete và Syntax Highlight.</p>
                        </div>

                        <div className="bg-slate-800/40 backdrop-blur-lg p-8 rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(168,85,247,0.2)] transition-all duration-300 border-t-4 border-t-purple-500 border-x border-b border-transparent">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                                <Rocket weight="duotone" className="text-3xl text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Hệ thống Siêu Tốc</h3>
                            <p className="text-slate-400 leading-relaxed">Judger System chấm bài song song, trả kết quả chỉ trong vài mili-giây. Phân tích chi tiết Time &amp; Memory Limit cho từng Test Case.</p>
                        </div>

                        <div className="bg-slate-800/40 backdrop-blur-lg p-8 rounded-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] transition-all duration-300 border-t-4 border-t-emerald-500 border-x border-b border-transparent">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                                <Trophy weight="duotone" className="text-3xl text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Ranking &amp; Contest</h3>
                            <p className="text-slate-400 leading-relaxed">Tham gia các kỳ thi hàng tuần, leo rank Elo quốc tế. Giành huy hiệu đặc biệt và xây dựng Profile ấn tượng cho nhà tuyển dụng.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900/60 backdrop-blur-xl border-t border-slate-800 py-12 px-6 z-10 relative">
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        &copy; 2026 Code Arena Platform. All rights reserved.
                    </div>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                            <FacebookLogo weight="fill" className="text-xl" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-400 transition-colors">
                            <TwitterLogo weight="fill" className="text-xl" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <GithubLogo weight="fill" className="text-xl" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
