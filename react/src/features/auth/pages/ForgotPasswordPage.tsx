import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Envelope, LockKey, ArrowRight, Code, Keyhole } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

const emailSchema = z.object({
    email: z.string().email('Email không hợp lệ').min(1, 'Vui lòng nhập email'),
});

const otpSchema = z.object({
    otp: z.string().length(6, 'Mã OTP bao gồm 6 chữ số'),
});

const passwordSchema = z.object({
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});

type Step = 'email' | 'otp' | 'new_password';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentOtp, setCurrentOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) });
    const otpForm = useForm<z.infer<typeof otpSchema>>({ resolver: zodResolver(otpSchema) });
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

    const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
        setIsLoading(true);
        try {
            const res = await authService.forgotPassword(data);
            setCurrentEmail(data.email);
            setStep('otp');
            toast.success((res as any).message || 'Mã OTP đã được gửi đến email của bạn.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
        setIsLoading(true);
        try {
            const res = await authService.verifyOtp({ email: currentEmail, otp: data.otp });
            setCurrentOtp(data.otp);
            setStep('new_password');
            toast.success((res as any).message || 'Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Mã OTP sai hoặc đã hết hạn.');
        } finally {
            setIsLoading(false);
        }
    };

    const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
        setIsLoading(true);
        try {
            const res = await authService.resetPassword({
                email: currentEmail,
                otp: currentOtp,
                newPassword: data.newPassword
            });
            toast.success((res as any).message || 'Mật khẩu đã được thay đổi thành công.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Thay đổi mật khẩu thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="antialiased min-h-screen w-full relative overflow-x-hidden bg-slate-900 text-slate-50 flex flex-col p-4 sm:p-8">
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="m-auto bg-slate-800/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl w-full max-w-md relative z-10 shadow-2xl flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Code weight="fill" className="text-blue-500 text-4xl" />
                    <span className="text-3xl font-bold tracking-tighter text-white">Code<span className="text-blue-500">Arena</span></span>
                </div>

                <h2 className="text-2xl font-bold mb-2">Quên mật khẩu?</h2>
                <p className="text-slate-400 text-center text-sm mb-8">
                    {step === 'email' && 'Nhập email của bạn để nhận mã khôi phục.'}
                    {step === 'otp' && `Chúng tôi đã gửi mã 6 chữ số đến ${currentEmail}`}
                    {step === 'new_password' && 'Vui lòng thiết lập mật khẩu mới và an toàn.'}
                </p>

                {step === 'email' && (
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="w-full space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Gmail của bạn</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Envelope weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...emailForm.register('email')}
                                    type="email"
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                    placeholder="nguyenvana123@gmail.com"
                                />
                            </div>
                            {emailForm.formState.errors.email && <p className="mt-1 text-sm text-red-400">{emailForm.formState.errors.email.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Đang gửi mã...' : <>Nhận mã xác nhận <ArrowRight /></>}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="w-full space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Mã OTP</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Keyhole weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...otpForm.register('otp')}
                                    type="text"
                                    maxLength={6}
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-center tracking-widest text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-colors"
                                    placeholder="• • • • • •"
                                />
                            </div>
                            {otpForm.formState.errors.otp && <p className="mt-1 text-sm text-red-400">{otpForm.formState.errors.otp.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Đang xác minh...' : <>Xác minh mã <ArrowRight /></>}
                        </button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                Đổi email nhận mã
                            </button>
                        </div>
                    </form>
                )}

                {step === 'new_password' && (
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="w-full space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Mật khẩu mới</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockKey weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...passwordForm.register('newPassword')}
                                    type="password"
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                            {passwordForm.formState.errors.newPassword && <p className="mt-1 text-sm text-red-400">{passwordForm.formState.errors.newPassword.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Xác nhận mật khẩu mới</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockKey weight="duotone" className="text-slate-400 text-lg" />
                                </div>
                                <input
                                    {...passwordForm.register('confirmPassword')}
                                    type="password"
                                    className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                            {passwordForm.formState.errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Đang cập nhật...' : <>Cập nhật mật khẩu <ArrowRight /></>}
                        </button>
                    </form>
                )}

                <div className="text-slate-400 text-sm mt-8 border-t border-white/10 pt-6 w-full text-center">
                    Nhớ mật khẩu rồi? <Link to="/login" className="text-blue-500 hover:underline">Quay lại đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};
