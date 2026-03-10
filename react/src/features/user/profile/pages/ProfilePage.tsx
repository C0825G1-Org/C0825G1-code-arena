import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from '../../../../app/store';
import ProfileSidebar from '../components/ProfileSidebar';
import ProfileStatsPanel from '../components/ProfileStatsPanel';
import ActivityHeatmap from '../components/ActivityHeatmap';
import SubmissionDoughnutChart from '../components/SubmissionDoughnutChart';
import RecentSubmissionsTable from '../components/RecentSubmissionsTable';
import RecentContestsTable from '../components/RecentContestsTable';
import { profileService, UserStats, RecentSubmission, RecentContest, SubmissionStatusStat, HeatmapData, UserProfileResponse } from '../services/profileService';
import { toast } from 'react-hot-toast';
import { UserLayout } from '../../../../layouts/UserLayout';

export const ProfilePage: React.FC = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const { userId } = useParams<{ userId: string }>();

    const [profile, setProfile] = useState<UserProfileResponse | undefined>();
    const [stats, setStats] = useState<UserStats | undefined>();
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [recentContests, setRecentContests] = useState<RecentContest[]>([]);
    const [statusStats, setStatusStats] = useState<SubmissionStatusStat[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                // If userId exists in URL, fetch for that user; otherwise fetch for currentUser
                const targetId = userId || undefined;

                const [profileData, statsData, submissionsData, contestsData, statusData, heatmapData] = await Promise.all([
                    profileService.getUserProfile(targetId),
                    profileService.getUserStats(targetId),
                    profileService.getRecentSubmissions(5, targetId),
                    profileService.getRecentContests(5, targetId),
                    profileService.getSubmissionStatusStats(targetId),
                    profileService.getActivityHeatmap(35, targetId)
                ]);

                setProfile(profileData);
                setStats(statsData);
                setRecentSubmissions(submissionsData);
                setRecentContests(contestsData);
                setStatusStats(statusData);
                setHeatmap(heatmapData);
            } catch (error) {
                console.error("Failed to load profile data", error);
                toast.error("Lỗi khi tải dữ liệu hồ sơ");
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchProfileData();
        }
    }, [currentUser, userId]);

    if (!currentUser) {
        return <UserLayout><div className="text-white text-center p-8">Vui lòng đăng nhập...</div></UserLayout>;
    }

    if (loading) {
        return (
            <UserLayout>
                <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl w-full flex flex-col md:flex-row gap-8 animate-pulse">
                    {/* Skeleton Sidebar */}
                    <div className="w-full md:w-1/3 xl:w-1/4 space-y-6">
                        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center bg-slate-800/50">
                            <div className="w-28 h-28 rounded-full bg-slate-700/80 mb-4 mt-6"></div>
                            <div className="h-6 w-32 bg-slate-700/80 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-slate-700/80 rounded mb-4"></div>
                            <div className="h-6 w-40 bg-slate-700/80 rounded-full mb-6"></div>
                            <div className="h-4 w-full bg-slate-700/80 rounded mb-4"></div>
                            <div className="h-10 w-full bg-slate-700/80 rounded-lg mb-4"></div>
                            <div className="w-full pt-4 border-t border-slate-700/50 flex flex-col gap-3">
                                <div className="h-4 w-full bg-slate-700/80 rounded"></div>
                                <div className="h-4 w-3/4 bg-slate-700/80 rounded"></div>
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Main Content */}
                    <div className="w-full md:w-2/3 xl:w-3/4 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-28 bg-slate-800/50 rounded-xl"></div>
                            ))}
                        </div>
                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                        </div>
                        {/* Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                        </div>
                    </div>
                </main>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl w-full flex flex-col md:flex-row gap-8">
                <ProfileSidebar
                    profile={profile}
                    stats={stats}
                    isOwnProfile={!userId || Number(userId) === currentUser.id}
                />

                <div className="w-full md:w-2/3 xl:w-3/4 space-y-6">
                    <ProfileStatsPanel stats={stats} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ActivityHeatmap heatmapData={heatmap} />
                        <SubmissionDoughnutChart stats={statusStats} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RecentSubmissionsTable submissions={recentSubmissions} />
                        <RecentContestsTable contests={recentContests} />
                    </div>
                </div>
            </main>
        </UserLayout>
    );
};
