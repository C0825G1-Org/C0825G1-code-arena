import axiosClient from '../../../shared/services/axiosClient';

export interface TestCaseResponseDTO {
    id: number;
    isSample: boolean;
    sampleInput?: string;
    sampleOutput?: string;
    inputFilename?: string;
    outputFilename?: string;
    scoreWeight?: number;
}

export interface TestCaseRequestDTO {
    inputContent: string;
    outputContent: string;
    isSample: boolean;
    scoreWeight?: number;
}export interface ZipUploadResponseDTO {
    successCount: number;
    skipCount: number;
    errors: string[];
}

export const testcaseApi = {
    getTestCasesByProblem: async (problemId: number): Promise<TestCaseResponseDTO[]> => {
        return await axiosClient.get(`/problems/${problemId}/testcases`);
    },

    createTestCase: async (problemId: number, data: TestCaseRequestDTO): Promise<TestCaseResponseDTO> => {
        return await axiosClient.post(`/problems/${problemId}/testcases`, data);
    },

    updateTestCase: async (problemId: number, testCaseId: number, data: TestCaseRequestDTO): Promise<TestCaseResponseDTO> => {
        return await axiosClient.put(`/problems/${problemId}/testcases/${testCaseId}`, data);
    },

    deleteTestCase: async (problemId: number, testCaseId: number): Promise<void> => {
        return await axiosClient.delete(`/problems/${problemId}/testcases/${testCaseId}`);
    },

    uploadTestCasesZip: async (problemId: number, file: File): Promise<ZipUploadResponseDTO> => {
        const formData = new FormData();
        formData.append('file', file);
        return await axiosClient.post(`/problems/${problemId}/testcases/zip`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    }
};
