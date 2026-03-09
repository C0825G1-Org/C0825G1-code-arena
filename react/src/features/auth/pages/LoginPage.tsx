import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User, LogIn, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
    username: z.string().min(3, 'Tên đăng nhập / Username ít nhất 3 ký tự'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const { login, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await login(data);
        } catch (error: any) {
            setError('password', {
                type: 'server',
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200 bg-[#0B1120]">
            {/* Left Side: Globe Video and Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="hidden md:flex md:w-1/2 bg-[#080C16] relative overflow-hidden flex-col items-center justify-center p-12 lg:p-24 border-r border-slate-800/50"
            >
                {/* Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen scale-110"
                >
                    <source src="/globe-5fdfa9a0f4.mp4" type="video/mp4" />
                </video>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-lg text-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                            Code <span className="text-[#1D61FF]">Arena</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                            Gia nhập cộng đồng lập trình viên chuyên nghiệp, tham gia những trận chiến code đỉnh cao theo thời gian thực.
                        </p>

                        <div className="grid grid-cols-2 gap-6 text-left">
                            {[
                                "Đối đầu trực tiếp",
                                "Xếp hạng toàn cầu",
                                "Cộng đồng năng động",
                                "Phát triển sự nghiệp"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-[#1D61FF] shadow-[0_0_10px_#1D61FF]" />
                                    <span className="text-sm font-medium text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side: Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 lg:p-16 relative"
            >
                {/* Subtle Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1D61FF]/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo */}
                    <Link to="/" className="flex items-center justify-center mb-4 group cursor-pointer">
                        <div className="bg-[#1D61FF] p-2 rounded-lg mr-3 shadow-[0_0_20px_rgba(29,97,255,0.4)] group-hover:scale-110 transition-transform">
                            <div className="flex items-center text-white font-mono font-bold text-xl">
                                <span>&lt;/&gt;</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight">
                            Code<span className="text-[#1D61FF]">Arena</span>
                        </span>
                    </Link>

                    <div className="text-center mb-6">
                        <p className="text-slate-400 font-medium text-sm">Đăng nhập vào hệ thống</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 ml-1">Tên đăng nhập / Username</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    {...register('username')}
                                    type="text"
                                    placeholder="username"
                                    className={`w-full bg-[#161B2C] text-white pl-12 pr-4 py-3 rounded-xl border ${errors.username ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-sm`}
                                />
                            </div>
                            {errors.username && (
                                <p className="text-[10px] text-red-400 ml-1 flex items-center gap-1 mt-0.5">
                                    <ShieldAlert size={12} /> {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 ml-1">Mật khẩu / Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full bg-[#161B2C] text-white pl-12 pr-12 py-3 rounded-xl border ${errors.password ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-sm`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[10px] text-red-400 ml-1 flex items-center gap-1 mt-0.5">
                                    <ShieldAlert size={12} /> {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-0.5">
                            <Link to="/forgot-password" title="Quên mật khẩu?" className="text-xs text-[#1D61FF] hover:text-blue-400 transition-colors font-medium">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#1D61FF] hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-sm">{isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}</span>
                            {!isLoading && <LogIn size={18} />}
                        </button>
                    </form>

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="px-4 bg-[#0B1120] text-slate-500 font-bold">Hoặc đăng nhập với</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <a
                            href="/oauth2/authorization/google"
                            className="w-full flex items-center justify-center space-x-3 bg-[#161B2C] hover:bg-[#1E253A] border border-slate-800 text-white font-semibold py-3 rounded-xl transition-all group text-sm"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                            </svg>
                            <span>Google</span>
                        </a>
                    </div>

                    <div className="mt-7 text-center">
                        <p className="text-sm text-slate-500">
                            Chưa có tài khoản Code Arena? <Link to="/register" className="text-[#1D61FF] hover:underline font-bold">Đăng ký ngay</Link>
                        </p>
                    </div>

                    <div className="mt-10 flex justify-center space-x-4 text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                        <span>•</span>
                        <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
