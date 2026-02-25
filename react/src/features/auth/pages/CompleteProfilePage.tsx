import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Code, UserCircle, ArrowRight } from '@phosphor-icons/react';
import axiosClient from '../../../shared/services/axiosClient';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const completeSchema = z.object({
    fullName: z.string().min(2, 'Vui lòng nhập họ và tên của bạn')
});

type CompleteFormValues = z.infer<typeof completeSchema>;

export const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const { handleLoginSuccess } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<CompleteFormValues>({
        resolver: zodResolver(completeSchema)
    });

    const onSubmit = async (data: CompleteFormValues) => {
        const regToken = sessionStorage.getItem('oauth2_reg_token');
        if (!regToken) {
            toast.error('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
            navigate('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axiosClient.post('/auth/oauth2/complete-profile', {
                regToken: regToken,
                fullName: data.fullName
            });

            // Gắn vào Redux
            const resData: any = response;

            sessionStorage.removeItem('oauth2_reg_token');
            handleLoginSuccess(resData, `Chào mừng ${resData.fullName} gia nhập Code Arena!`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, không thể hoàn tất hồ sơ.');
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
                <h2 className="text-2xl font-bold mb-2">Gần xong rồi!</h2>
                <p className="text-slate-400 text-center text-sm mb-6">
                    Mảnh ghép cuối cùng. Bạn muốn mọi người nhìn thấy mình bằng cái tên nào trên bảng xếp hạng?
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Họ và Tên</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserCircle weight="duotone" className="text-slate-400 text-lg" />
                            </div>
                            <input
                                {...register('fullName')}
                                type="text"
                                className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none"
                                placeholder="Ví dụ: Nguyễn Văn A..."
                            />
                        </div>
                        {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-3 flex justify-center items-center gap-2"
                    >
                        {isLoading ? 'Đang kích hoạt...' : <>Kích hoạt tài khoản <ArrowRight /> </>}
                    </button>
                </form>
            </div>
        </div>
    );
};
