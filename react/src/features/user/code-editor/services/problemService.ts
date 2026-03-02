export type Problem = {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    // Tags etc can be added later
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
    }); // Mock or real endpoint if backend supports
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    return res.json();
}