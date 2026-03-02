import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Code, User, LockKey, SignIn, GoogleLogo, GithubLogo } from '@phosphor-icons/react';

const loginSchema = z.object({
    username: z.string().min(3, 'Tên đăng nhập / Username ít nhất 3 ký tự'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const { login, isLoading } = useAuth();

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
        <div className="antialiased min-h-screen w-full relative overflow-x-hidden bg-slate-900 text-slate-50 flex flex-col p-4 sm:p-8">
            {/* Background Glow */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="m-auto bg-slate-800/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-full max-w-md relative z-10 shadow-2xl shadow-blue-900/20">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold tracking-tighter mb-2">
                        <Code weight="fill" className="text-blue-500 text-4xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <p className="text-slate-400">Đăng nhập vào hệ thống</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tên đăng nhập / Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('username')}
                                type="text"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-colors"
                                placeholder="username"
                            />
                        </div>
                        {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mật khẩu / Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockKey weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('password')}
                                type="password"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
                        <div className="mt-2 text-right">
                            <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Quên mật khẩu?</Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 text-center transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang Đăng Nhập...' : (
                            <>Đăng Nhập <SignIn weight="bold" /></>
                        )}
                    </button>

                    {/* Social Login */}
                    <div className="relative flex items-center gap-4 py-2 mt-2">
                        <div className="flex-1 border-t border-slate-700"></div>
                        <div className="text-xs text-slate-400 font-medium whitespace-nowrap">HOẶC ĐĂNG NHẬP VỚI</div>
                        <div className="flex-1 border-t border-slate-700"></div>
                    </div>

                    <div className="flex justify-center mt-2">
                        <a href="/oauth2/authorization/google" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-colors">
                            <GoogleLogo weight="fill" className="text-xl text-red-500" /> Google
                        </a>
                    </div>

                    <div className="mt-6 text-center text-sm font-medium text-slate-300">
                        Chưa có tài khoản Code Arena?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors hover:underline">Đăng ký ngay</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
