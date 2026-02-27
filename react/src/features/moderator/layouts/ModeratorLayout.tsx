import { ReactNode } from 'react';
import { ModeratorSidebar } from '../components/ModeratorSidebar';

export const ModeratorLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="fixed inset-0 flex bg-[#070b19] font-sans text-slate-50 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

            <ModeratorSidebar />

            <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 p-8">
                {children}
            </main>
        </div>
    );
};
