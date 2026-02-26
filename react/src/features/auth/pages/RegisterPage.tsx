import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Code, UserCircle, User, Envelope, LockKey, ShieldCheck, ArrowRight, GoogleLogo, GithubLogo } from '@phosphor-icons/react';

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
        <div className="antialiased min-h-screen w-full relative overflow-x-hidden bg-slate-900 text-slate-50 flex flex-col p-4 sm:p-8">
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="m-auto bg-slate-800/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl shadow-blue-900/20">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold tracking-tighter mb-2 hover:opacity-80 transition-opacity">
                        <Code weight="fill" className="text-blue-500 text-4xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <h2 className="text-xl font-semibold mt-2">Tạo tài khoản mới</h2>
                    <p className="text-slate-400 text-sm mt-1">Tham gia cộng đồng lập trình lớn nhất Việt Nam</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Họ và tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCircle weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...register('fullName')}
                                    type="text"
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Tên đăng nhập</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...register('username')}
                                    type="text"
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                    placeholder="nguyenvana"
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gmail</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Envelope weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                placeholder="nguyenvana123@gmail.com"
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockKey weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('password')}
                                type="password"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nhập lại mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ShieldCheck weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                {...register('terms')}
                                id="terms"
                                type="checkbox"
                                className="w-4 h-4 rounded bg-[#1e293b] border-[#334155] text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="terms" className="ml-2 text-sm font-medium text-slate-300 cursor-pointer">
                            Tôi đồng ý với <a href="#" className="text-blue-400 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-400 hover:underline">Chính sách bảo mật</a>
                        </label>
                    </div>
                    {errors.terms && <p className="text-sm text-red-400">{errors.terms.message}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 text-center transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang Xử Lý...' : (
                            <>Tạo Tài Khoản <ArrowRight weight="bold" /></>
                        )}
                    </button>

                    <div className="mt-6 text-center text-sm font-medium text-slate-300">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors hover:underline">Đăng nhập ngay</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
