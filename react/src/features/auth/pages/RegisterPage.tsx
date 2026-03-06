import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User, UserCircle, Mail, ShieldCheck, ShieldAlert, Rocket } from 'lucide-react';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
    username: z.string().min(3, 'Tên đăng nhập ít nhất 3 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Mật khẩu không khớp'),
    terms: z.boolean().refine(val => val === true, "Bạn phải đồng ý với điều khoản")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const { register: authRegister, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            await authRegister({
                fullName: data.fullName,
                username: data.username,
                email: data.email,
                password: data.password
            });
        } catch (error: any) {
            const message = error.response?.data?.message || '';
            if (message.includes('Username') || message.includes('username')) {
                setError('username', { type: 'server', message: 'Tên đăng nhập đã tồn tại' });
            } else if (message.includes('Email') || message.includes('email')) {
                setError('email', { type: 'server', message: 'Email đã tồn tại' });
            } else {
                setError('confirmPassword', { type: 'server', message: 'Đăng ký thất bại. Vui lòng thử lại.' });
            }
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
                            Bắt đầu hành trình chinh phục những thử thách lập trình cùng hàng ngàn tài năng khác.
                        </p>

                        <div className="grid grid-cols-2 gap-6 text-left">
                            {[
                                "Code Editor xịn sò",
                                "Đề bài đa dạng",
                                "Hệ thống chấm điểm",
                                "Vinh danh bảng vàng"
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

            {/* Right Side: Register Form */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:py-10 lg:px-20 relative overflow-y-auto"
            >
                {/* Subtle Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1D61FF]/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10 my-auto">
                    {/* Logo */}
                    <Link to="/" className="flex items-center justify-center mb-3 group cursor-pointer">
                        <div className="bg-[#1D61FF] p-1.5 rounded-lg mr-2 shadow-[0_0_20px_rgba(29,97,255,0.4)] group-hover:scale-110 transition-transform">
                            <div className="flex items-center text-white font-mono font-bold text-lg">
                                <span>&lt;/&gt;</span>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Code<span className="text-[#1D61FF]">Arena</span>
                        </span>
                    </Link>

                    <div className="text-center mb-6">
                        <p className="text-slate-400 font-medium text-sm">Tạo tài khoản mới</p>
                    </div>

                    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 ml-1">Họ và tên</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                        <UserCircle size={16} />
                                    </div>
                                    <input
                                        {...register('fullName')}
                                        type="text"
                                        placeholder="Nguyễn Văn A"
                                        className={`w-full bg-[#161B2C] text-white pl-10 pr-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-xs`}
                                    />
                                </div>
                                {errors.fullName && <p className="text-[9px] text-red-400 ml-1 mt-0.5 font-medium">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 ml-1">Tên đăng nhập</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                        <User size={16} />
                                    </div>
                                    <input
                                        {...register('username')}
                                        type="text"
                                        placeholder="username"
                                        className={`w-full bg-[#161B2C] text-white pl-10 pr-4 py-2.5 rounded-xl border ${errors.username ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-xs`}
                                    />
                                </div>
                                {errors.username && <p className="text-[9px] text-red-400 ml-1 mt-0.5 font-medium">{errors.username.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-slate-400 ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                    <Mail size={16} />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="your@email.com"
                                    className={`w-full bg-[#161B2C] text-white pl-10 pr-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-xs`}
                                />
                            </div>
                            {errors.email && <p className="text-[9px] text-red-400 ml-1 mt-0.5 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`w-full bg-[#161B2C] text-white pl-10 pr-10 py-2.5 rounded-xl border ${errors.password ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-xs`}
                                    />
                                </div>
                                {errors.password && <p className="text-[9px] text-red-400 ml-1 mt-0.5 font-medium">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 ml-1">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#1D61FF] transition-colors">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <input
                                        {...register('confirmPassword')}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`w-full bg-[#161B2C] text-white pl-10 pr-10 py-2.5 rounded-xl border ${errors.confirmPassword ? 'border-red-500/50' : 'border-slate-800'} focus:border-[#1D61FF] focus:ring-4 focus:ring-[#1D61FF]/10 transition-all outline-none placeholder:text-slate-600 text-xs`}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-[9px] text-red-400 ml-1 mt-0.5 font-medium">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-1 pt-0.5">
                            <div className="flex items-center space-x-2">
                                <input
                                    {...register('terms')}
                                    id="terms"
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded bg-[#161B2C] border-slate-800 text-[#1D61FF] focus:ring-[#1D61FF] focus:ring-offset-0 cursor-pointer transition-all"
                                />
                                <label htmlFor="terms" className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                                    Tôi đồng ý với điều khoản & chính sách
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1 font-medium"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                <span>Hiện mật khẩu</span>
                            </button>
                        </div>
                        {errors.terms && <p className="text-[9px] text-red-400 ml-1 font-medium -mt-2">{errors.terms.message}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#1D61FF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            <span className="text-sm">{isLoading ? 'Đang Xử Lý...' : 'Đăng Ký Tài Khoản'}</span>
                            {!isLoading && <Rocket size={18} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                            Đã có tài khoản? <Link to="/login" className="text-[#1D61FF] hover:underline font-bold">Đăng nhập ngay</Link>
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center space-x-4 text-[9px] uppercase tracking-widest text-slate-600 font-bold">
                        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                        <span>•</span>
                        <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
