
import { API_CONFIG } from "@/apiConfig";

const APIMART_BASE = "https://api.apimart.ai/v1";

export async function createGenerationTask(params: {
  prompt: string;
  size: string;
  resolution: string;
  image_urls?: { url: string }[];
}) {
  const key = API_CONFIG.DRAW_KEY;
  const url = `${APIMART_BASE}/images/generations`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "gemini-3-pro-image-preview",
      prompt: params.prompt,
      size: params.size,
      resolution: params.resolution,
      n: 1,
      image_urls: params.image_urls
    })
  });

  const res = await response.json();
  if (res.code === 200 && res.data?.[0]?.task_id) {
    return res.data[0].task_id;
  }
  throw new Error(res.msg || "APIMart 任务提交失败");
}

export async function getTaskStatus(taskId: string): Promise<any> {
  const key = API_CONFIG.DRAW_KEY;
  const url = `${APIMART_BASE}/tasks/${taskId}?language=zh`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${key}`
    }
  });
  return await response.json();
}
