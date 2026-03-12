import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, House, ArrowRight } from '@phosphor-icons/react';

export const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
    const [message, setMessage] = useState('');
    const [txnRef, setTxnRef] = useState('');

    useEffect(() => {
        const queryStatus = searchParams.get('status');
        const queryMsg = searchParams.get('message');
        const queryTxn = searchParams.get('txnRef');

        if (queryStatus === 'success') {
            setStatus('success');
            setTxnRef(queryTxn || '');
        } else if (queryStatus === 'error') {
            setStatus('error');
            setMessage(queryMsg || 'Thanh toán không thành công hoặc đã bị hủy.');
        } else {
            navigate('/pricing'); // Invalid access
        }
    }, [searchParams, navigate]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-pulse text-white font-medium text-lg">Đang xử lý kết quả thanh toán...</div>
            </div>
        );
    }

    const isSuccess = status === 'success';

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-700/50 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                {isSuccess && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_20px_#10b981]" />
                )}
                {!isSuccess && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-rose-500 shadow-[0_0_20px_#f43f5e]" />
                )}

                <div className="flex justify-center mb-6">
                    {isSuccess ? (
                        <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                            <CheckCircle weight="fill" className="text-6xl text-emerald-400" />
                        </div>
                    ) : (
                        <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/20">
                            <XCircle weight="fill" className="text-6xl text-rose-400" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold mb-2">
                    {isSuccess ? 'Thanh toán THÀNH CÔNG!' : 'Thanh toán THẤT BẠI'}
                </h1>
                
                <p className="text-slate-400 mb-8">
                    {isSuccess 
                        ? 'Cảm ơn bạn đã nâng cấp gói của Code Arena. Quyền lợi tài khoản của bạn đã được kích hoạt ngay lập tức.'
                        : message}
                </p>

                {isSuccess && txnRef && (
                    <div className="bg-slate-800 rounded-xl p-4 mb-8 text-sm border border-slate-700">
                        <span className="text-slate-400">Mã giao dịch: </span>
                        <span className="font-mono text-emerald-400 break-all">{txnRef}</span>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {isSuccess ? (
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
                        >
                            Trải nghiệm Host ngay <ArrowRight weight="bold" />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/pricing')}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-400 transition-colors flex items-center justify-center gap-2"
                        >
                            Thử thanh toán lại
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <House weight="fill" /> Trở về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};
