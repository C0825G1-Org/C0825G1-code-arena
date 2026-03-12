import React, { useEffect, useState } from 'react';
import { ShieldCheck, Crosshair, Cpu, CheckCircle, Infinity, Crown, HardDrives } from '@phosphor-icons/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../../shared/services/axiosClient';
import toast from 'react-hot-toast';

interface Plan {
    id: number;
    name: string;
    price: number;
    maxContestsPerMonth: number;
    maxParticipantsPerContest: number;
    snapshotRetentionDays: number;
}

export const PricingPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    
    // Fallback static data if API not ready
    const [plans, setPlans] = useState<Plan[]>([
        {
            id: 1,
            name: 'FREE',
            price: 0,
            maxContestsPerMonth: 2,
            maxParticipantsPerContest: 10,
            snapshotRetentionDays: 2
        },
        {
            id: 2,
            name: 'PRO',
            price: 99000,
            maxContestsPerMonth: 20,
            maxParticipantsPerContest: 100,
            snapshotRetentionDays: 30
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Call API here in the future: const res = await subscriptionApi.getPlans();
                // setPlans(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgrade = async (planId: number) => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        try {
            setIsLoading(true);
            const response: any = await axiosClient.get(`/payments/create-payment-url?planId=${planId}`);
            if (response && response.paymentUrl) {
                // Redirect user to VNPay Payment Page
                window.location.href = response.paymentUrl;
            } else {
                toast.error('Không thể tạo URL thanh toán. Vui lòng thử lại.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        Nâng tầm trải nghiệm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Code Arena</span>
                    </h1>
                    <p className="text-lg text-slate-400">
                        Chọn gói cước phù hợp với nhu cầu tổ chức thi và giảng dạy của bạn. 
                        Không giới hạn tiềm năng, hỗ trợ chống gian lận chuyên sâu.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* FREE Plan */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 flex flex-col hover:border-blue-500/50 transition-all duration-300">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Gói Cơ Bản</h2>
                            <p className="text-slate-400 h-12">Phù hợp cho cá nhân trải nghiệm hệ thống và tự luyện tập.</p>
                            <div className="mt-6 flex items-baseline text-5xl font-extrabold">
                                0₫
                                <span className="ml-2 text-xl font-medium text-slate-500">/tháng</span>
                            </div>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex gap-3 text-slate-300">
                                <CheckCircle weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span>Tối đa <strong className="text-white">2 cuộc thi</strong> / tháng</span>
                            </li>
                            <li className="flex gap-3 text-slate-300">
                                <ShieldCheck weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span>Tối đa <strong className="text-white">10 người tham gia</strong> / cuộc thi</span>
                            </li>
                            <li className="flex gap-3 text-slate-300">
                                <HardDrives weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span>Lưu trữ hình ảnh gian lận <strong className="text-white">2 ngày</strong></span>
                            </li>
                            <li className="flex gap-3 text-slate-300 opacity-50">
                                <Crosshair weight="regular" className="text-slate-600 text-xl shrink-0" />
                                <span>Hỗ trợ hệ thống cơ bản</span>
                            </li>
                        </ul>

                        <button 
                            disabled
                            className="w-full py-4 px-6 rounded-xl bg-slate-800 text-slate-400 font-semibold cursor-not-allowed border border-slate-700"
                        >
                            Đang sử dụng
                        </button>
                    </div>

                    {/* PRO Plan */}
                    <div className="bg-gradient-to-b from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-blue-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                            <Crown weight="fill" /> KHUYÊN DÙNG
                        </div>
                        
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Gói Chuyên Nghiệp (PRO)
                            </h2>
                            <p className="text-blue-200/70 h-12">Giải pháp hoàn hảo cho Giảng viên, Trung tâm đào tạo quy mô nhỏ.</p>
                            <div className="mt-6 flex items-baseline text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                99,000₫
                                <span className="ml-2 text-xl font-medium text-slate-400">/tháng</span>
                            </div>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex gap-3 text-slate-200">
                                <CheckCircle weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span>Tối đa <strong className="text-white">20 cuộc thi</strong> / tháng</span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <ShieldCheck weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span>Lên đến <strong className="text-white text-lg bg-blue-500/20 px-2 py-0.5 rounded">100</strong> người tham gia / cuộc thi</span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <HardDrives weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span>Lưu trữ hình ảnh Camera dài hạn (<strong className="text-white">30 ngày</strong>)</span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <Cpu weight="fill" className="text-purple-400 text-xl shrink-0" />
                                <span>Hệ thống chấm Code ưu tiên (Tránh hàng đợi)</span>
                            </li>
                        </ul>

                        <button 
                            onClick={() => handleUpgrade(2)}
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Đang chuyển hướng...' : <><Crown weight="bold" /> Nâng cấp ngay</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
