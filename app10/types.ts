
export interface VisualAnalysis {
  style: string;
  mood: string;
  lighting: string;
  keyElements: string;
}

export interface ShotScript {
  id: number;
  title: string;
  type: string;
  prompt: string;
  cnDescription: string;
}

export interface DirectorOutput {
  analysis: VisualAnalysis;
  scripts: ShotScript[];
}

export interface ShotTask extends ShotScript {
  status: 'idle' | 'running' | 'success' | 'failed';
  imageUrl?: string;
  taskId?: string;
  progress: number;
}
