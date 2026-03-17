
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
  R_21_9 = "21:9"
}

export enum ImageSize {
  K1 = "1K",
  K2 = "2K",
  K4 = "4K"
}

export enum ModelType {
  GEMINI_3_PRO_IMAGE = "gemini-3-pro-image-preview",
  GEMINI_3_PRO_IMAGE_VIP = "gemini-3-pro-image-preview"
}

export interface GeneratedImage {
  id: string;
  taskId?: string; 
  prompt: string;
  url: string | null;
  progress: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
  error?: string;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: ModelType;
}

/**
 * Grsai API 响应结构
 */
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
