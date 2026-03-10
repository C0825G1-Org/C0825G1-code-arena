import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { ArrowLeft } from '@phosphor-icons/react';

interface ErrorPageLayoutProps {
    errorCode: string;
    title: string;
    description: string;
    icon: ReactNode;
    homeLink?: string;
    homeText?: string;
}

const getHomeByRole = (user: any): string => {
    if (!user) return '/';
    const role = user.role?.replace('ROLE_', '').toUpperCase() || '';
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'MODERATOR') return '/moderator/dashboard';
    return '/home';
};

export const ErrorPageLayout: React.FC<ErrorPageLayoutProps> = ({
    errorCode,
    title,
    description,
    icon,
    homeLink,
    homeText = 'Back To Home'
}) => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const resolvedLink = homeLink ?? getHomeByRole(isAuthenticated ? user : null);
    return (
        <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Glows */}
            <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[30%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center z-10 relative">
                {/* Left Content */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                    <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.2em] font-mono leading-none drop-shadow-lg">
                        {errorCode.split('').join(' ')}-error
                    </h1>

                    <h2 className="text-white text-3xl md:text-4xl font-bold tracking-widest uppercase mt-4">
                        {title}
                    </h2>

                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md">
                        {description}
                    </p>

                    <div className="pt-8">
                        <Link
                            to={resolvedLink}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-blue-500/40 text-blue-100 hover:bg-blue-600/20 transition-all duration-300 backdrop-blur-sm group shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]"
                        >
                            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold tracking-wide uppercase text-sm">{homeText}</span>
                        </Link>
                    </div>
                </div>

                {/* Right Illustration */}
                <div className="relative flex justify-center items-center h-[400px] perspective-1000">
                    <div className="absolute text-blue-500/20 blur-xl scale-150 animate-pulse">
                        {icon}
                    </div>
                    {/* Floating space object animation block */}
                    <div className="relative z-10 text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] float-animation">
                        {icon}
                    </div>

                    {/* Small starry particles */}
                    <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-yellow-300 drop-shadow-[0_0_5px_yellow] animate-ping opacity-70"></div>
                    <div className="absolute bottom-[30%] right-[25%] w-1.5 h-1.5 rounded-full bg-blue-300 drop-shadow-[0_0_5px_cyan] animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-[40%] right-[10%] w-1 h-1 rounded-full bg-white drop-shadow-[0_0_2px_white] animate-pulse"></div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-20px) rotate(3deg); }
                    66% { transform: translateY(10px) rotate(-2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .float-animation {
                    animation: float 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
