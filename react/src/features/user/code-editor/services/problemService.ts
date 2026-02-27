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
    const res = await fetch(`http://localhost:8080/api/problems/${id}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    if (!res.ok) throw new Error("Failed to load problem");
    return res.json();
}

export type TestCase = {
    id: number;
    problemId: number;
    input: string;
    output: string;
    is_sample: boolean;
};

export async function getSampleTestCases(problemId: number): Promise<TestCase[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8080/api/problems/${problemId}/test-cases`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    }); // Mock or real endpoint if backend supports
    if (!res.ok) throw new Error("Failed to load sample test cases");
    return res.json();
}