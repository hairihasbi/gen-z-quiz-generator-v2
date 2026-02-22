export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  username: string;
  role: Role;
  credits: number;
  isActive: boolean;
  apiKeys?: string[]; // New: Optional custom API keys for the user
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 4 or 5 options
  COMPLEX_MULTIPLE_CHOICE = 'COMPLEX_MULTIPLE_CHOICE', // More than one correct answer
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum CognitiveLevel {
  C1 = 'C1', // Mengingat
  C2 = 'C2', // Memahami
  C3 = 'C3', // Menerapkan
  C4 = 'C4', // Menganalisis
  C5 = 'C5', // Mengevaluasi
  C6 = 'C6'  // Mencipta
}

export interface Blueprint {
  questionNumber: number;
  basicCompetency: string;
  indicator: string;
  cognitiveLevel: CognitiveLevel;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MC
  correctAnswer: string | string[]; // Array for Complex MC
  explanation: string;
  imageUrl?: string;
  imagePrompt?: string; // Prompt used to generate image
  hasImage: boolean;
  hasImageInOptions: boolean; // If options are images (not fully implemented in rendering yet, but in data structure)
  difficulty: Difficulty;
  cognitiveLevel: CognitiveLevel;
  latex?: string; // For exact sciences
  stimulus?: string; // For reading passages/wacana
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  subjectCategory: string; // e.g., "Peminatan MIPA"
  level: string; // SMA, etc.
  grade: string; // Kelas 10, 11, etc.
  topic: string;
  subTopic?: string;
  blueprint: Blueprint[]; // Kisi-kisi
  questions: Question[];
  createdBy: string; // User ID
  createdAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
}

export interface ApiKey {
  key: string;
  usageCount: number;
  lastUsed: number;
  isActive: boolean;
}

export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface LogEntry {
  id: string;
  action: string;
  details: string;
  type: LogType;
  userId: string;
  timestamp: number;
}

export interface AppSettings {
  tursoUrl: string;
  tursoToken: string;
  maxQuestionsPerHour: number;
  cronInterval: number;
  siteName: string;
}

export interface AiProviderConfig {
  provider: 'GEMINI' | 'LITELLM';
  litellm: {
    baseUrl: string;
    apiKey: string;
    textModel: string;
    imageModel: string;
  };
}

export interface SystemSettings {
  ai: {
    factCheck: boolean;
    providerConfig?: AiProviderConfig;
  };
  cron: {
    enabled: boolean;
  };
}

export interface QuizGenerationParams {
  subject: string;
  subjectCategory: string;
  level: string;
  grade: string;
  topic: string;
  subTopic?: string;
  materialText?: string; // Content of uploaded .txt
  refImageBase64?: string; // Optional reference image
  
  // Counts
  questionCount: number;
  mcOptionCount: 4 | 5;
  imageQuestionCount: number; // How many questions should have images
  
  // Configuration
  types: QuestionType[];
  difficulty: Difficulty;
  cognitiveLevels: CognitiveLevel[]; // Selected range e.g. [C1, C2, C3]
  
  // Languages
  languageContext: 'ID' | 'AR' | 'JP' | 'KR' | 'CN' | 'EN' | 'DE' | 'FR';
  enableReadingPassages?: boolean;
  readingMode?: 'none' | 'simple' | 'grouped';
  
  // User Keys
  userApiKeys?: string[];
}

export interface PricingPackage {
  name: string;
  price: number;
  credits: number; // Acts as quantity for Keys as well
  color: string;
  type: 'CREDIT' | 'API_KEY';
}