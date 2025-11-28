import { AnalysisResult, ChatMessage } from "../types";

const API_URL = "http://localhost:5000/api";

export const analyzeContractAPI = async (
    fileBase64: string,
    mimeType: string,
    clientMessage: string
): Promise<AnalysisResult> => {
    const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileBase64, mimeType, clientMessage }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze contract");
    }

    return response.json();
};

export const askDocumentQuestionAPI = async (
    question: string,
    fileBase64: string,
    mimeType: string,
    history: ChatMessage[],
    analysisContext?: AnalysisResult
): Promise<string> => {
    const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question,
            fileBase64,
            mimeType,
            history,
            analysisContext,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get answer");
    }

    const data = await response.json();
    return data.response;
};

export const fetchCasesAPI = async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/cases`);
    if (!response.ok) throw new Error("Failed to fetch cases");
    return response.json();
};

export const createCaseAPI = async (newCase: any): Promise<any> => {
    const response = await fetch(`${API_URL}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCase),
    });
    if (!response.ok) throw new Error("Failed to create case");
    return response.json();
};

export const updateCaseAPI = async (updatedCase: any): Promise<any> => {
    const response = await fetch(`${API_URL}/cases/${updatedCase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCase),
    });
    if (!response.ok) throw new Error("Failed to update case");
    return response.json();
};
