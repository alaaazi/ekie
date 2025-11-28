export enum CaseStatus {
  NEW = 'Nouveau',
  ANALYZING = 'Analyse en cours',
  PROCESSED = 'Traité',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ClientRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  message: string;
  fileName: string;
  fileType: string;
  fileBase64: string;
  submittedAt: Date;
  status: CaseStatus;
  analysis?: AnalysisResult;
  chatHistory: ChatMessage[];
}

export interface Risk {
  severity: 'Faible' | 'Moyen' | 'Élevé';
  description: string;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  risks: Risk[];
  actions: string[];
  draftResponse: string;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  LAWYER = 'LAWYER',
}