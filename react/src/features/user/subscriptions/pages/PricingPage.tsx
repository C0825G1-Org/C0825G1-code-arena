import React, { useEffect, useState } from 'react';
import { ShieldCheck, Crosshair, Cpu, CheckCircle, Infinity, Crown, HardDrives, Info } from '@phosphor-icons/react';
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
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Call API ở đây trong tương lai nếu cần lấy danh sách động
                // const res = await axiosClient.get('/subscriptions/plans');
                // setPlans(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            }
        };

        const fetchCurrentPlan = async () => {
            if (!user) return;
            try {
                const res: any = await axiosClient.get('/subscriptions/my-plan');
                setCurrentPlan(res);
            } catch (err) {
                console.error("Failed to fetch current plan", err);
            }
        };

        fetchPlans();
        fetchCurrentPlan();
    }, [user]);

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
                        Gói cước dành cho <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Người tổ chức</span>
                    </h1>
                    <p className="text-lg text-slate-400 mb-8">
                        Lựa chọn giải pháp phù hợp để thiết lập cuộc thi, quản lý lớp học và kiểm soát gian lận chuyên sâu.
                    </p>

                    {/* Lưu ý cho Thí sinh */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3 max-w-2xl mx-auto text-left">
                        <Info className="text-blue-400 text-2xl shrink-0 mt-0.5" weight="fill" />
                        <div>
                            <h4 className="text-blue-100 font-bold mb-1">Dành cho Thí sinh:</h4>
                            <p className="text-blue-200/70 text-sm leading-relaxed">
                                Bạn <strong className="text-blue-100 italic">không cần mua bất kỳ gói nào</strong> để tham gia các cuộc thi công khai hoặc lớp học trên Code Arena. Toàn bộ quyền lợi thi đấu và luyện tập là hoàn toàn miễn phí.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* FREE Plan */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 flex flex-col hover:border-blue-500/30 transition-all duration-300 shadow-xl">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-3">Gói Cơ Bản</h2>
                            <p className="text-slate-400 text-sm leading-relaxed h-12">Phù hợp cho cá nhân trải nghiệm hệ thống và tự luyện tập.</p>
                            <div className="mt-8 flex items-baseline text-5xl font-extrabold text-white">
                                0₫
                                <span className="ml-2 text-xl font-medium text-slate-500">/tháng</span>
                            </div>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex gap-3 text-slate-300">
                                <CheckCircle weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Tổ chức tối đa <strong className="text-white">2 cuộc thi</strong> / tháng</span>
                                    <span className="text-[10px] text-blue-500/40 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-300">
                                <ShieldCheck weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Tối đa <strong className="text-white">10 người tham gia</strong> / cuộc thi</span>
                                    <span className="text-[10px] text-blue-300/40 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-300">
                                <HardDrives weight="fill" className="text-blue-500 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Lưu trữ ảnh Camera Host <strong className="text-white">2 ngày</strong></span>
                                    <span className="text-[10px] text-blue-300/40 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-300 opacity-50">
                                <Crosshair weight="regular" className="text-slate-600 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Hỗ trợ hệ thống cơ bản</span>
                                    <span className="text-[10px] invisible uppercase tracking-wider font-bold">Spacer</span>
                                </span>
                            </li>
                        </ul>

                        <button
                            disabled={currentPlan?.name === 'FREE' || !user}
                            onClick={() => {/* Hiện tại FREE mặc định, không cần action nâng cấp */ }}
                            className={`w-full py-4 px-6 rounded-xl font-semibold border transition-all ${currentPlan?.name === 'FREE'
                                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-slate-700'
                                    : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'
                                }`}
                        >
                            {currentPlan?.name === 'FREE' ? 'Đang sử dụng' : 'Gói miễn phí'}
                        </button>
                    </div>

                    {/* PRO Plan */}
                    <div className="bg-gradient-to-b from-blue-600/10 to-purple-600/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 flex flex-col relative shadow-2xl shadow-blue-900/20 transition-all duration-300 hover:border-blue-500/50">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-20">
                            <Crown weight="fill" className="text-yellow-300" /> KHUYÊN DÙNG
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                Gói Chuyên Nghiệp (PRO)
                            </h2>
                            <p className="text-blue-200/70 text-sm leading-relaxed h-12">Giải pháp hoàn hảo cho Giảng viên, Trung tâm đào tạo chuyên nghiệp.</p>
                            <div className="mt-8 flex items-baseline text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                99,000₫
                                <span className="ml-2 text-xl font-medium text-slate-500">/tháng</span>
                            </div>
                        </div>

                        <ul className="flex-1 space-y-4 mb-8">
                            <li className="flex gap-3 text-slate-200">
                                <CheckCircle weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Tổ chức tối đa <strong className="text-white">20 cuộc thi</strong> / tháng</span>
                                    <span className="text-[10px] text-blue-300/60 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <ShieldCheck weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Lên đến <strong className="text-white">100</strong> người / cuộc thi</span>
                                    <span className="text-[10px] text-blue-300/60 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <HardDrives weight="fill" className="text-blue-400 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Lưu trữ ảnh Camera Host (<strong className="text-white">30 ngày</strong>)</span>
                                    <span className="text-[10px] text-blue-300/60 uppercase tracking-wider font-bold">Dành cho Host</span>
                                </span>
                            </li>
                            <li className="flex gap-3 text-slate-200">
                                <Cpu weight="fill" className="text-purple-400 text-xl shrink-0" />
                                <span className="flex flex-col">
                                    <span>Hệ thống chấm Code ưu tiên (Tránh hàng đợi)</span>
                                    <span className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold">Dành cho Thí sinh & Host</span>
                                </span>
                            </li>
                        </ul>

                        <button
                            onClick={() => handleUpgrade(2)}
                            disabled={isLoading || currentPlan?.name === 'PRO'}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform flex items-center justify-center gap-2 ${currentPlan?.name === 'PRO'
                                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {isLoading ? 'Đang chuyển hướng...' : (
                                currentPlan?.name === 'PRO'
                                    ? 'Đang sử dụng'
                                    : <><Crown weight="bold" /> Nâng cấp ngay</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
