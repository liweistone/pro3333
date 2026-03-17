
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

export type LumiAspectRatio = "auto" | "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type LumiResolution = "1K" | "2K" | "4K";
export type LumiVideoRes = "720p" | "1080p";
export type LumiDuration = 5 | 10;

export interface LumiConfig {
  aspectRatio: LumiAspectRatio;
  imageResolution: LumiResolution;
  videoResolution: LumiVideoRes;
  duration: LumiDuration;
}
