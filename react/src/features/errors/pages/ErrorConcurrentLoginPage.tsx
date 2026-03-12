import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';

export const ErrorConcurrentLoginPage = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-[#161B22]/50 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 text-center relative z-10 shadow-2xl"
            >
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-rose-500/20 p-5 rounded-full"
                        >
                            <ShieldAlert className="text-rose-500 w-12 h-12" />
                        </motion.div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
                    Tài khoản đang được sử dụng
                </h1>
                
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Tài khoản này hiện đang được đăng nhập ở một thiết bị hoặc trình duyệt khác. Để bảo mật, hệ thống chỉ cho phép một phiên đăng nhập tại một thời điểm.
                    <br /><br />
                    <span className="text-slate-300 font-medium">Vui lòng thoát ở thiết bị kia hoặc sử dụng tài khoản khác.</span>
                </p>

                <div className="space-y-4">
                    <Link 
                        to="/login"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Quay lại Đăng nhập
                    </Link>
                    
                    <Link 
                        to="/"
                        className="w-full bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Trang chủ
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                        Code Arena Security Protocol
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
