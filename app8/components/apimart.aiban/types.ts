
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImageResult {
  url: string[];
  expires_at: number;
}

export interface TaskResponse {
  code: number;
  data: {
    id: string;
    status: TaskStatus;
    progress: number;
    result?: {
      images: ImageResult[];
    };
    created: number;
    completed?: number;
    error?: {
      code: number;
      message: string;
      type: string;
    };
  };
}

export interface GenerationTask {
  id: string;
  prompt: string;
  status: TaskStatus;
  progress: number;
  imageUrl?: string;
  errorMessage?: string;
  createdAt: number;
}

export interface GenerationConfig {
  ratio: string;
  resolution: '1K' | '2K' | '4K';
  references: string[];
}
