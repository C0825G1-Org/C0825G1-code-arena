export type Problem = {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    ioTemplates?: { languageId: number, languageName: string, templateCode: string }[];
};

export async function getProblem(id: number): Promise<Problem> {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/problems/${id}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    return res.json();
}

export type TestCase = {
    id: number;
    problemId: number;
    isSample: boolean;
    sampleInput: string;
    sampleOutput: string;
    inputFilename: string;
    outputFilename: string;
};

export async function getSampleTestCases(problemId: number): Promise<TestCase[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/problems/${problemId}/testcases`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    const all: TestCase[] = await res.json();
    // Chỉ trả về testcase mẫu (isSample=true) để không lộ testcase ẩn
    return all.filter(tc => tc.isSample === true);
}