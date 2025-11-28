import { AnalysisResult, ChatMessage } from "../types";
import { analyzeContractAPI, askDocumentQuestionAPI } from "./api";

export const analyzeContract = async (
  fileBase64: string,
  mimeType: string,
  clientMessage: string
): Promise<AnalysisResult> => {
  return analyzeContractAPI(fileBase64, mimeType, clientMessage);
};

export const askDocumentQuestion = async (
  question: string,
  fileBase64: string,
  mimeType: string,
  history: ChatMessage[],
  analysisContext?: AnalysisResult
): Promise<string> => {
  return askDocumentQuestionAPI(question, fileBase64, mimeType, history, analysisContext);
};