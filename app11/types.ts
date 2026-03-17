export enum AspectRatio {
  AUTO = "auto",
  SQUARE = "1:1",
  PORTRAIT_4_3 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_16_9 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  R_3_2 = "3:2",
  R_2_3 = "2:3",
  R_5_4 = "5:4",
  R_4_5 = "4:5",
  R_10_9 = "10:9",
  R_9_10 = "9:10",
  R_21_9 = "21:9",
  R_9_21 = "9:21"
}

export enum ImageSize {
  K1 = "1K",
  K2 = "2K",
  K4 = "4K"
}

export interface GeneratedImage {
  id: string;
  taskId?: string; 
  prompt: string;
  url: string | null;
  progress: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
  error?: string;
  aspectRatio?: AspectRatio;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: string;
}

export interface GrsaiApiResponse {
  code: number;
  msg: string;
  data: {
    id: string;
    results?: Array<{
      url: string;
      content: string;
    }>;
    progress?: number;
    status?: 'running' | 'succeeded' | 'failed';
    failure_reason?: string;
    error?: string;
  };
}

export interface MarketAnalysis {
  userPersona: string;
  userNeeds: string[];
  painPoints: string[];
  usageScenarios: string[];
  differentiation: string[];
  emotionalValue: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitorWeakness: string;
  marketingCopy: string[];
  salesChannels: string[];
  promotionStrategy: string;
  newMediaPlan: {
    content: string;
    strategy: string;
    tactic: string;
  };
}

export interface PromptItem {
  planTitle: string;
  fullPrompt: string;
}

export interface PromptSet {
  category: string;
  prompts: PromptItem[];
}

export interface HolidayPromptSet {
  dateName: string; // 如：腊月二十三, 除夕, 初一...
  prompts: PromptItem[];
}

export interface AppResponse {
  analysis: MarketAnalysis;
  painPointPrompts: PromptSet;
  scenarioPrompts: PromptSet[];
  holidayPrompts: HolidayPromptSet[]; // 新增：节日专项策划
}

export type OptimizationGoal = 'performance' | 'readability' | 'maintainability' | 'modernization';

export interface OptimizationResult {
  optimizedCode: string;
  explanation: string;
  changes: string[];
}