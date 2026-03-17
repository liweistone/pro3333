
export interface LumiAnalysisResult {
  reasoning: string;
  imagePrompt: string;
  videoPrompt: string;
}

export enum LumiStep {
  UPLOAD = 'upload',
  ANALYSIS = 'analysis',
  RENDERING = 'rendering',
  COMPLETE = 'complete'
}

export interface LumiTaskState {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
}

export interface LumiConfig {
  aspectRatio: "1:1" | "16:9" | "9:16";
  resolution: "1080p" | "4K";
}
