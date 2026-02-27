import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ModeratorLayout } from '../components/ModeratorLayout';
import { problemApi, ProblemResponseDTO } from '../services/problemApi';
import { testcaseApi, TestCaseResponseDTO } from '../services/testcaseApi';
import { DeleteModal } from './DeleteModal';
import { RootState } from '../../../app/store';

export const CreatePage = () => {
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [selectedProblem, setSelectedProblem] = useState('');
    const [problems, setProblems] = useState<ProblemResponseDTO[]>([]);
    const [loadingProblems, setLoadingProblems] = useState(false);
    
    // TestCase states
    const [testcases, setTestcases] = useState<TestCaseResponseDTO[]>([]);
    const [loadingTestcases, setLoadingTestcases] = useState(false);
    const [activeTestCaseId, setActiveTestCaseId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUploadingZip, setIsUploadingZip] = useState(false);

    // Form states
    const [isSample, setIsSample] = useState(true);
    const [inputContent, setInputContent] = useState('');
    const [outputContent, setOutputContent] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            setLoadingProblems(true);
            try {
                const problemsData = await problemApi.getProblems();
                
                // Lọc bài tập: Admin thấy hết, Moderator chỉ thấy của mình tạo
                const filteredProblems = problemsData.filter(prob => 
                    currentUser?.role === 'admin' || prob.authorId === currentUser?.id
                );
                
                setProblems(filteredProblems);
                if (filteredProblems.length > 0) {
                    setSelectedProblem(String(filteredProblems[0].id));
                }
            } catch (err) {
                console.error("Lỗi khi tải danh sách bài tập:", err);
            } finally {
                setLoadingProblems(false);
            }
        };

        fetchProblems();
    }, [currentUser]);

    // Fetch testcases when a problem is selected
    useEffect(() => {
        if (!selectedProblem) return;

        const fetchTestCases = async () => {
            setLoadingTestcases(true);
            try {
                const data = await testcaseApi.getTestCasesByProblem(Number(selectedProblem));
                setTestcases(data);
                if (data.length > 0) {
                    handleSelectTestCase(data[0]);
                } else {
                    handleAddNewTestCase();
                }
            } catch (err) {
                console.error("Lỗi khi tải testcases:", err);
                toast.error("Không thể tải danh sách testcase.");
            } finally {
                setLoadingTestcases(false);
            }
        };

        fetchTestCases();
    }, [selectedProblem]);

    const handleSelectTestCase = (tc: TestCaseResponseDTO) => {
        setActiveTestCaseId(tc.id);
        setIsSample(tc.isSample);
        setInputContent(tc.sampleInput || '');
        setOutputContent(tc.sampleOutput || '');
    };

    const handleAddNewTestCase = () => {
        setActiveTestCaseId(null);
        setIsSample(false);
        setInputContent('');
        setOutputContent('');
    };

    const handleSaveTest = async () => {
        if (!selectedProblem) return;
        if (!inputContent.trim()) {
            toast.warning("Vui lòng nhập Standard Input!");
            return;
        }
        if (!outputContent.trim()) {
            toast.warning("Vui lòng nhập Expected Output!");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                inputContent: inputContent,
                outputContent: outputContent,
                isSample: isSample,
                scoreWeight: 1
            };

            if (activeTestCaseId) {
                // Update existing
                const updatedTc = await testcaseApi.updateTestCase(Number(selectedProblem), activeTestCaseId, payload);
                setTestcases(testcases.map(tc => tc.id === activeTestCaseId ? updatedTc : tc));
                toast.success("Cập nhật testcase thành công!");
            } else {
                // Create new
                const defaultTcPayload = { ...payload, outputContent: payload.outputContent || '' };
                const newTc = await testcaseApi.createTestCase(Number(selectedProblem), defaultTcPayload);
                setTestcases([...testcases, newTc]);
                setActiveTestCaseId(newTc.id);
                toast.success("Thêm testcase mới thành công!");
            }
        } catch (err: any) {
            console.error("Lỗi khi lưu testcase:", err.response?.data || err);
            
            // Check for Spring Boot validation error format (often an object or array of field errors)
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object' && !errorData.message) {
                // If it's a map of field errors, e.g. { "inputContent": "...", "outputContent": "..." }
                const firstError = Object.values(errorData)[0] as string;
                toast.error(firstError || "Dữ liệu đầu vào không hợp lệ.");
            } else {
                toast.error(errorData?.message || "Lỗi khi lưu testcase. Vui lòng thử lại.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedProblem) return;

        setIsUploadingZip(true);
        try {
            const result = await testcaseApi.uploadTestCasesZip(Number(selectedProblem), file);
            if (result.successCount > 0) {
                toast.success(`Tải lên thành công ${result.successCount} testcase từ file ZIP!`);
                // Refresh testcase list
                const data = await testcaseApi.getTestCasesByProblem(Number(selectedProblem));
                setTestcases(data);
                if (data.length > 0) handleSelectTestCase(data[data.length - 1]);
            }
            if (result.skipCount > 0) {
                toast.warning(`Đã bỏ qua ${result.skipCount} mục không hợp lệ.`);
                console.warn("Upload ZIP Errors:", result.errors);
            }
        } catch (err: any) {
            console.error("Lỗi khi tải file ZIP:", err);
            toast.error(err.response?.data?.message || "Lỗi khi upload ZIP. Vui lòng thử lại.");
        } finally {
            setIsUploadingZip(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeleteTestCase = async () => {
        if (!selectedProblem || !activeTestCaseId) return;

        setIsDeleting(true);
        try {
            await testcaseApi.deleteTestCase(Number(selectedProblem), activeTestCaseId);
            toast.success("Xóa testcase thành công!");
            
            // Xóa khỏi danh sách hiện tại
            const remainingTests = testcases.filter(tc => tc.id !== activeTestCaseId);
            setTestcases(remainingTests);
            
            // Nếu còn testcase, chọn cái đầu tiên, nếu không thì reset form
            if (remainingTests.length > 0) {
                handleSelectTestCase(remainingTests[0]);
            } else {
                handleAddNewTestCase();
            }
        } catch (err: any) {
            console.error("Lỗi khi xóa testcase:", err);
            toast.error(err.response?.data?.message || "Lỗi khi xóa testcase. Vui lòng thử lại.");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <ModeratorLayout headerTitle="Quản Lý Bộ TestCase">
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTestCase}
                title="Xóa TestCase"
                description={`Bạn có chắc chắn muốn xóa Test #${testcases.findIndex(tc => tc.id === activeTestCaseId) + 1} này không? Các tệp tin được liên kết sẽ bị xóa vĩnh viễn khỏi máy chủ.`}
                isDeleting={isDeleting}
            />
            {/* Content */}
            <div className="flex-1 p-8 bg-[#0f172a] flex flex-col lg:flex-row gap-8 min-h-full z-0 relative">

                {/* LIST OF TEST CASES (TRÁI) */}
                <div className="w-full lg:w-1/3 flex flex-col">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Đang thiết lập Test cho bài toán:</label>
                        <select
                            value={selectedProblem}
                            onChange={(e) => setSelectedProblem(e.target.value)}
                            disabled={loadingProblems || problems.length === 0}
                            className="w-full bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none shadow-sm transition-all font-semibold disabled:opacity-50"
                        >
                            {loadingProblems ? (
                                <option value="">Đang tải danh sách bài tập...</option>
                            ) : problems.length === 0 ? (
                                <option value="">Không có bài tập nào khả dụng</option>
                            ) : (
                                problems.map(prob => (
                                    <option key={prob.id} value={prob.id}>
                                        {prob.title}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5 rounded-xl flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#334155] flex justify-between items-center bg-[#1e293b]/50">
                            <h3 className="font-bold text-white">Danh sách {testcases.length} Tests</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {loadingTestcases ? (
                                <div className="p-4 text-center text-slate-400 text-sm">Đang tải testcases...</div>
                            ) : testcases.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                    <i className="ph-duotone ph-flask text-3xl text-slate-600 mb-2"></i>
                                    Chưa có testcase nào.
                                    <br/>Hãy nhập dữ liệu ở form bên phải để tạo testcase đầu tiên!
                                </div>
                            ) : (
                                testcases.map((tc, index) => {
                                    const isActive = tc.id === activeTestCaseId;
                                    return (
                                        <div
                                            key={tc.id}
                                            onClick={() => handleSelectTestCase(tc)}
                                            className={`${
                                                isActive 
                                                    ? 'bg-blue-600/20 border-blue-500/50' 
                                                    : 'hover:bg-[#1e293b] border-transparent hover:border-[#334155]'
                                            } border justify-between items-center rounded-lg p-3 cursor-pointer transition group flex flex-col`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className={`${isActive ? 'text-white font-bold' : 'text-slate-300 font-semibold'} font-mono text-sm`}>
                                                    Test #{index + 1}
                                                </span>
                                                <span className={`${
                                                    tc.isSample 
                                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                                        : 'bg-slate-700 text-slate-400'
                                                } text-[10px] uppercase font-bold px-2 py-0.5 rounded`}>
                                                    {tc.isSample ? 'Mẫu (Sample)' : 'Ẩn (Hidden)'}
                                                </span>
                                            </div>
                                            <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'} mt-2 truncate w-full`}>
                                                Input: `{(tc.sampleInput || '').replace(/\n/g, '\\n')}`
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 border-t border-[#334155] bg-[#1e293b]/50 flex flex-col gap-2">
                            <button
                                onClick={handleAddNewTestCase}
                                className={`w-full border border-dashed rounded-lg py-2 transition text-sm flex items-center justify-center gap-2 ${
                                    activeTestCaseId === null && testcases.length > 0
                                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-medium'
                                        : 'border-slate-500 hover:border-blue-500 text-slate-400 hover:text-white'
                                }`}
                            >
                                <i className="ph-bold ph-plus"></i> Thêm Test Mới
                            </button>
                            <label className={`w-full border border-dashed rounded-lg py-2 transition text-sm flex items-center justify-center gap-2 cursor-pointer ${
                                isUploadingZip 
                                    ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-500/50 cursor-not-allowed'
                                    : 'border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}>
                                {isUploadingZip ? (
                                    <><i className="ph-bold ph-spinner animate-spin"></i> Đang tải lên...</>
                                ) : (
                                    <><i className="ph-bold ph-upload-simple"></i> Upload file ZIP</>
                                )}
                                <input 
                                    type="file" 
                                    accept=".zip" 
                                    className="hidden" 
                                    onChange={handleZipUpload}
                                    disabled={isUploadingZip || !selectedProblem}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* EDITOR TEST CASES (PHẢI) */}
                <div className="w-full lg:w-2/3 flex flex-col bg-[#1e293b]/70 backdrop-blur-md border border-white/5 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {activeTestCaseId ? (
                                    <>Chi tiết Test <span className="text-blue-400 font-mono">#{testcases.findIndex(tc => tc.id === activeTestCaseId) + 1}</span></>
                                ) : (
                                    <span className="text-emerald-400">Tạo Test Mới</span>
                                )}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">Sửa nội dung đầu vào (Input) và đầu ra mong muốn (Expected Output).</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isSample}
                                    onChange={(e) => setIsSample(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-slate-300">Test Mẫu (Public)</span>
                            </label>
                            
                            {activeTestCaseId && (
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={isDeleting || !selectedProblem}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <><i className="ph ph-spinner animate-spin text-lg"></i> Xóa...</>
                                    ) : (
                                        <><i className="ph-bold ph-trash text-lg"></i> Xóa Test</>
                                    )}
                                </button>
                            )}

                            <button 
                                onClick={handleSaveTest}
                                disabled={isSaving || !selectedProblem}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <><i className="ph ph-spinner animate-spin text-lg"></i> Đang lưu...</>
                                ) : (
                                    <><i className="ph-bold ph-floppy-disk text-lg"></i> Lưu Test</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Input area */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-white uppercase tracking-wider">Standard Input (stdin)</label>
                                <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded-sm">Kích thước: {new Blob([inputContent]).size} bytes</span>
                            </div>
                            <textarea
                                value={inputContent}
                                onChange={(e) => setInputContent(e.target.value)}
                                className="flex-1 bg-[#1e293b] border border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-lg p-4 font-mono text-sm text-slate-300 resize-none h-48 custom-scrollbar"
                                placeholder="Nhập data đầu vào..."
                            />
                        </div>

                        <div className="flex items-center justify-center">
                            <i className="ph-bold ph-arrow-down text-2xl text-slate-600"></i>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Expected Output (stdout)</label>
                                <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded-sm">Kích thước: {new Blob([outputContent]).size} bytes</span>
                            </div>
                            <textarea
                                value={outputContent}
                                onChange={(e) => setOutputContent(e.target.value)}
                                className="flex-1 bg-[#1e293b] border border-emerald-500/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-lg p-4 font-mono text-sm text-slate-300 resize-none h-48 custom-scrollbar"
                                placeholder="Chạy Auto-Generate hoặc nhập kết quả mong muốn ở đây..."
                            />
                        </div>
                    </div>
                </div>

            </div>
        </ModeratorLayout>
    );
};
