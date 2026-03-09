import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, CheckCircle, Minus } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../shared/services/axiosClient';
import { Link, useSearchParams } from 'react-router-dom';
import { UserLayout } from '../components/UserLayout';

interface TagDTO {
    id: number;
    name: string;
}

interface ProblemUserDTO {
    id: number;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: TagDTO[];
    userStatus: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED';
}

interface ProblemUserPageWrapperDTO {
    problems: {
        content: ProblemUserDTO[];
        totalPages: number;
        totalElements: number;
        number: number;
    };
    totalProblems: number;
    solvedProblems: number;
}

export const ListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState<ProblemUserPageWrapperDTO | null>(null);
    const [tags, setTags] = useState<TagDTO[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const page = parseInt(searchParams.get('page') || '0');
    const title = searchParams.get('title') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const status = searchParams.get('status') || '';
    const tagId = searchParams.get('tagIds') || '';

    useEffect(() => {
        fetchProblems();
    }, [page, title, difficulty, status, tagId]);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const response = await axiosClient.get('/tags');
            setTags(response as any);
        } catch (error) {
            console.error('Lỗi khi tải danh sách thẻ tag:', error);
        }
    };

    const fetchProblems = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', '5'); // Adjust page size as needed
            if (title) params.append('title', title);
            if (difficulty) params.append('difficulty', difficulty);
            if (status) params.append('status', status);
            if (tagId) params.append('tagIds', tagId);

            const response = await axiosClient.get(`/public/problems?${params.toString()}`);
            setData(response as any); // axiosClient in this project already returns response.data
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài tập:', error);
            toast.error('Không thể tải danh sách bài tập.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '0'); // Reset page when filter changes
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
    };

    const renderDifficulty = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'easy':
                return <span className="text-green-400 font-medium capitalize">{diff}</span>;
            case 'medium':
                return <span className="text-yellow-400 font-medium capitalize">{diff}</span>;
            case 'hard':
                return <span className="text-red-400 font-medium capitalize">{diff}</span>;
            default:
                return <span className="text-slate-400 font-medium capitalize">{diff}</span>;
        }
    };

    const renderStatusIcon = (userStatus: string) => {
        switch (userStatus) {
            case 'SOLVED':
                return <CheckCircle weight="fill" className="text-green-500 text-lg mx-auto" />;
            case 'ATTEMPTED':
                return <Minus weight="bold" className="text-yellow-500 text-lg mx-auto" />;
            default:
                return <Minus weight="bold" className="text-slate-600 text-lg mx-auto" />;
        }
    };

    const renderActionBtn = (problem: ProblemUserDTO) => {
        if (problem.userStatus === 'SOLVED') {
            return (
                <Link to={`/code-editor/${problem.id}`} className="inline-block px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors text-xs font-medium border border-slate-600">
                    Làm lại
                </Link>
            );
        }
        return (
            <Link to={`/code-editor/${problem.id}`} className="inline-block px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-xs font-medium shadow-lg shadow-blue-500/20">
                Giải bài
            </Link>
        );
    };

    return (
<<<<<<< HEAD
        <UserLayout>
            <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in relative z-10">
                {/* Header Info */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Kho Bài Tập</h1>
                        <p className="text-slate-400">Rèn luyện kỹ năng qua hàng trăm thử thách thuật toán.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-slate-400">
                        <div className="bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-lg border border-green-500/30">
                            <span className="text-green-400 font-bold">{data?.solvedProblems || 0}/{data?.totalProblems || 0}</span> đã giải
                        </div>
=======
        <div className="antialiased min-h-screen flex flex-col relative bg-[#0f172a] text-slate-50 font-sans overflow-clip">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <Link to="/home" className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
                        <Code weight="fill" className="text-blue-500 text-3xl" />
                        <span className="text-white">Code<span className="text-blue-500">Arena</span></span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <Link to="/home" className="hover:text-blue-400 transition-colors">Trang chủ</Link>
                        <Link to="/problems" className="text-white hover:text-blue-400 transition-colors">Bài tập</Link>
                        <Link to="/contests" className="hover:text-blue-400 transition-colors">Cuộc thi</Link>
                        <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Bảng xếp hạng</Link>
>>>>>>> origin/nguyen2
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center justify-between border border-slate-700/50">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên bài, ID..."
                                value={title}
                                onChange={(e) => handleFilterChange('title', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={difficulty}
                            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-32"
                        >
                            <option value="">Độ khó</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-32 hidden sm:block"
                        >
                            <option value="">Trạng thái</option>
                            <option value="SOLVED">Đã giải</option>
                            <option value="UNATTEMPTED">Chưa giải</option>
                            <option value="ATTEMPTED">Đang làm</option>
                        </select>
                        <select
                            value={tagId}
                            onChange={(e) => handleFilterChange('tagIds', e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-32 hidden sm:block"
                        >
                            <option value="">Thẻ Tag</option>
                            {tags.map(tag => (
                                <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Problems Table */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-slate-800/50 text-slate-300 border-b border-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-16 text-center">Trạng thái</th>
                                <th scope="col" className="px-6 py-4">Tên bài</th>
                                <th scope="col" className="px-6 py-4 w-32">Độ khó</th>
                                <th scope="col" className="px-6 py-4 hidden md:table-cell">Tags</th>
                                <th scope="col" className="px-6 py-4 text-center w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.problems.content.map((problem) => (
                                <tr key={problem.id} className="hover:bg-blue-500/10 border-b border-slate-800 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        {renderStatusIcon(problem.userStatus)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        <Link to={`/code-editor/${problem.id}`} className="hover:text-blue-400 hover:underline">
                                            {problem.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderDifficulty(problem.difficulty)}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1.5">
                                            {problem.tags && problem.tags.map(tag => (
                                                <span key={tag.id} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-700/50">
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {renderActionBtn(problem)}
                                    </td>
                                </tr>
                            ))}
                            {data?.problems.content.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        Không tìm thấy bài tập nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.problems.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-slate-400">
                            Hiển thị <span className="font-semibold text-white">{data.problems.number * 5 + 1}</span> đến{' '}
                            <span className="font-semibold text-white">
                                {Math.min((data.problems.number + 1) * 5, data.problems.totalElements)}
                            </span>{' '}
                            trên <span className="font-semibold text-white">{data.problems.totalElements}</span> bài
                        </span>
                        <div className="inline-flex gap-1">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={data.problems.number === 0 || loading}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang trước
                            </button>

                            {/* Pagination Logic */}
                            {Array.from({ length: Math.min(5, data.problems.totalPages) }, (_, i) => {
                                let pageNum = i;
                                if (data.problems.totalPages > 5) {
                                    if (data.problems.number >= 3 && data.problems.number < data.problems.totalPages - 2) {
                                        pageNum = data.problems.number - 2 + i;
                                    } else if (data.problems.number >= data.problems.totalPages - 2) {
                                        pageNum = data.problems.totalPages - 5 + i;
                                    }
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded transition-colors ${pageNum === data.problems.number
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                            }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={data.problems.number >= data.problems.totalPages - 1 || loading}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang sau
                            </button>
<<<<<<< HEAD
=======
                        </>
                    )}
                </div>
            </nav>

            <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in relative z-10">
                {/* Header Info */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Kho Bài Tập</h1>
                        <p className="text-slate-400">Rèn luyện kỹ năng qua hàng trăm thử thách thuật toán.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-slate-400">
                        <div className="bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-lg border border-green-500/30">
                            <span className="text-green-400 font-bold">{data?.solvedProblems || 0}/{data?.totalProblems || 0}</span> đã giải
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center justify-between border border-slate-700/50">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên bài, ID..."
                                value={title}
                                onChange={(e) => handleFilterChange('title', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={difficulty}
                            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-32"
                        >
                            <option value="">Độ khó</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <select
                            value={status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none w-32 hidden sm:block"
                        >
                            <option value="">Trạng thái</option>
                            <option value="SOLVED">Đã giải</option>
                            <option value="UNATTEMPTED">Chưa giải</option>
                            <option value="ATTEMPTED">Đang làm</option>
                        </select>
                    </div>
                    {/* 
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">DP</button>
                    <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">Math</button>
                    <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">Graph</button>
                </div> 
                */}
                </div>

                {/* Problems Table */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl overflow-hidden border border-slate-700/50 shadow-xl relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-slate-800/50 text-slate-300 border-b border-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-16 text-center">Trạng thái</th>
                                <th scope="col" className="px-6 py-4">Tên bài</th>
                                <th scope="col" className="px-6 py-4 w-32">Độ khó</th>
                                <th scope="col" className="px-6 py-4 hidden md:table-cell">Tags</th>
                                <th scope="col" className="px-6 py-4 text-center w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.problems.content.map((problem) => (
                                <tr key={problem.id} className="hover:bg-blue-500/10 border-b border-slate-800 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        {renderStatusIcon(problem.userStatus)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        <Link to={`/code-editor/${problem.id}`} className="hover:text-blue-400 hover:underline">
                                            {problem.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderDifficulty(problem.difficulty)}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1.5">
                                            {problem.tags && problem.tags.map(tag => (
                                                <span key={tag.id} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-700/50">
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {renderActionBtn(problem)}
                                    </td>
                                </tr>
                            ))}
                            {data?.problems.content.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        Không tìm thấy bài tập nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.problems.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <span className="text-sm text-slate-400">
                            Hiển thị <span className="font-semibold text-white">{data.problems.number * 5 + 1}</span> đến{' '}
                            <span className="font-semibold text-white">
                                {Math.min((data.problems.number + 1) * 5, data.problems.totalElements)}
                            </span>{' '}
                            trên <span className="font-semibold text-white">{data.problems.totalElements}</span> bài
                        </span>
                        <div className="inline-flex gap-1">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={data.problems.number === 0 || loading}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang trước
                            </button>

                            {/* Simple pagination logic for now */}
                            {Array.from({ length: Math.min(5, data.problems.totalPages) }, (_, i) => {
                                let pageNum = i;
                                // If total pages > 5, center around current page if possible
                                if (data.problems.totalPages > 5) {
                                    if (data.problems.number >= 3 && data.problems.number < data.problems.totalPages - 2) {
                                        pageNum = data.problems.number - 2 + i;
                                    } else if (data.problems.number >= data.problems.totalPages - 2) {
                                        pageNum = data.problems.totalPages - 5 + i;
                                    }
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded transition-colors ${pageNum === data.problems.number
                                                ? 'bg-blue-600 text-white font-medium'
                                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                            }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={data.problems.number >= data.problems.totalPages - 1 || loading}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang sau
                            </button>
>>>>>>> origin/nguyen2
                        </div>
                    </div>
                )}
            </div>
<<<<<<< HEAD
        </UserLayout>
=======
        </div>
>>>>>>> origin/nguyen2
    );
};
