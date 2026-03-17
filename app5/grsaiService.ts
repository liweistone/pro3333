import { GenerationConfig, GrsaiApiResponse } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { TaskAdapter } from "../services/adapters/taskAdapter";

const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

/**
 * 对接大项目标准 Apimart 引擎创建绘图任务
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = []
): Promise<string> => {
  try {
    const taskId = await imageAdapter.createGenerationTask(
      prompt,
      {
        model: "gemini-3-pro-image-preview",
        size: config.aspectRatio === "auto" ? "1:1" : config.aspectRatio,
        resolution: config.imageSize,
        n: 1
      },
      referenceImages
    );

    return taskId;
  } catch (error: any) {
    console.error("Apimart Submit Error:", error);
    throw new Error(error.message || "绘图任务分发失败");
  }
};

/**
 * 轮询任务执行结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  try {
    const status = await taskAdapter.getTaskStatus(taskId);
    
    return {
      id: taskId,
      status: status.status === 'completed' || status.status === 'succeeded' ? 'succeeded' : status.status,
      progress: status.progress,
      results: status.imageUrl ? 
        [{ url: status.imageUrl }] : undefined,
      failure_reason: status.error,
      error: status.error
    };
  } catch (error: any) {
    console.error("Apimart Result Error:", error);
    throw error;
  }
};