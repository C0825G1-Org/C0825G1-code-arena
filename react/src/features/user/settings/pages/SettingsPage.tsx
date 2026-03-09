import React, { useState } from 'react';
import { ProfileSettingsForm } from '../components/ProfileSettingsForm';
import { SecuritySettingsForm } from '../components/SecuritySettingsForm';
import { UserLayout } from '../../../../layouts/UserLayout';

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    return (
        <UserLayout>
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl w-full flex flex-col md:flex-row gap-8">
                {/* Sidebar menu */}
                <aside className="w-full md:w-1/4 space-y-2">
                    <h2 className="text-lg font-bold text-white mb-6 pl-2">Cài Đặt Tài Khoản</h2>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile'
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                            : 'text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                    >
                        <i className="ph-fill ph-user-circle text-xl"></i> Hồ sơ cá nhân
                    </button>

                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'security'
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                            : 'text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                    >
                        <i className="ph-fill ph-lock-key text-xl"></i> Mật khẩu & Bảo mật
                    </button>
                </aside>

                {/* Main content */}
                <div className="w-full md:w-3/4 space-y-6">
                    {activeTab === 'profile' && <ProfileSettingsForm />}
                    {activeTab === 'security' && <SecuritySettingsForm />}
                </div>

                {/* Background Decorative Elements */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[20%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[100px]"></div>
                </div>
            </main>
        </UserLayout>
    );
};
