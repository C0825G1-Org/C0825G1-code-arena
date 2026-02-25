export type Problem = {
    id: number;
    title: string;
    description: string;
    sampleInput: string;
    sampleOutput: string;
};

export async function getProblem(id: number): Promise<Problem> {
    const res = await fetch(`http://localhost:3001/problems/${id}`);
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
    const res = await fetch(`http://localhost:3001/test_cases?problemId=${problemId}&is_sample=true`);
    if (!res.ok) throw new Error("Failed to load sample test cases");
    return res.json();
}