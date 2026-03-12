import React from 'react';
import { UserProfileResponse, UserStats } from '../services/profileService';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../../shared/components/Avatar';
import RankProgression from './RankProgression';

interface Props {
    profile?: UserProfileResponse;
    stats?: UserStats;
    isOwnProfile?: boolean;
}

const ProfileSidebar: React.FC<Props> = ({ profile, stats, isOwnProfile }) => {
    const joinDate = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
        : "...";

    return (
        <div className="w-full md:w-1/3 xl:w-1/4 space-y-6">
            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>

                <div className="mt-4 mb-4">
                    <Avatar
                        src={profile?.avatarUrl}
                        userId={profile?.id}
                        size="2xl"
                        borderColor="border-slate-900"
                        showOnlineStatus={true}
                        className="shadow-xl"
                    />
                </div>

                <h2 className="text-xl font-bold text-white">{profile?.fullName || profile?.username || "Người dùng ẩn danh"}</h2>
                <p className="text-blue-400 text-sm font-medium mb-1">@{profile?.username || "username"}</p>

                <div className="text-xs text-slate-400 font-mono mb-4 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                    Thành viên từ: {joinDate}
                </div>

                <p className="text-sm text-slate-400 mb-6 italic">
                    {profile?.bio ? `"${profile.bio}"` : "Chưa cập nhật tiểu sử."}
                </p>

                <div className="w-full mb-6 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hệ Cuộc Thi</p>
                        <RankProgression rating={stats?.eloRanking || 0} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hệ Bài Tập</p>
                        <RankProgression rating={stats?.practiceRating || 0} />
                    </div>
                </div>

                {isOwnProfile && (
                    <Link
                        to="/settings"
                        className="block w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-sm font-medium transition-colors mb-4 tracking-wide">
                        Chỉnh sửa hồ sơ
                    </Link>
                )}

                <div className="w-full pt-4 border-t border-slate-700/50 flex flex-col gap-3 text-sm text-left">
                    <div className="flex items-center gap-3 text-slate-400">
                        <i className="ph ph-envelope-simple text-lg text-slate-500"></i>
                        <span className="truncate">{profile?.email || "Chưa cập nhật"}</span>
                    </div>
                    {profile?.githubLink && (
                        <a href={profile.githubLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                            <i className="ph-fill ph-github-logo text-lg text-slate-500"></i>
                            <span className="truncate">{profile.githubLink.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;
