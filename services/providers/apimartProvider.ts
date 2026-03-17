
import { API_CONFIG } from '@/apiConfig';

interface ApimartConfig {
  baseUrl: string;
}

interface GenerationConfig {
  size?: string;
  resolution?: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
}

/**
 * Apimart 统一服务提供者
 */
export class ApimartProvider {
  private config: ApimartConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://api.apimart.ai'
    };
  }

  /**
   * 图像生成 (异步模式)
   */
  async generateImage(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/images/generations`;
    const targetRatio = config.aspectRatio || config.size || '1:1';
    
    const payload = {
      model: config.model || 'gemini-3-pro-image-preview',
      prompt,
      size: targetRatio,
      aspect_ratio: targetRatio,
      resolution: config.resolution || '1K',
      n: 1,
      image_urls: imageUrls.length > 0 ? imageUrls.map(url => ({ url })) : undefined
    };

    const response = await this.makeRequest(url, payload);
    const data = response.data || response;
    if (Array.isArray(data) && data[0]?.task_id) {
      return data[0].task_id;
    }
    throw new Error(response.error?.message || response.msg || '图像生成任务创建失败');
  }

  async generateVideo(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/videos/generations`;
    const payload = {
      model: config.model || 'sora-2',
      prompt,
      aspect_ratio: config.aspectRatio || '16:9',
      duration: config.duration || 10,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined
    };

    const response = await this.makeRequest(url, payload);
    const data = response.data || response;
    if (Array.isArray(data) && data[0]?.task_id) {
      return data[0].task_id;
    }
    throw new Error(response.error?.message || response.msg || '视频生成任务创建失败');
  }

  /**
   * 增强型多模态分析：支持单图或多图数组
   */
  async analyzeWithMultimodal(
    text: string,
    images?: string | string[],
    model: string = 'gemini-3-pro-preview',
    generationConfig?: any
  ): Promise<any> {
    const url = `${this.config.baseUrl}/v1beta/models/${model}:generateContent`;
    const parts: any[] = [{ text }];
    
    const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
    
    imageArray.forEach(imageBase64 => {
      const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.includes(';') ? imageBase64.match(/:(.*?);/)?.[1] || 'image/jpeg' : 'image/jpeg';
      parts.push({ inlineData: { mimeType, data } });
    });

    const payload = { 
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        ...generationConfig
      },
      systemInstruction: generationConfig?.systemInstruction ? {
        parts: [{ text: generationConfig.systemInstruction }]
      } : undefined
    };
    
    return await this.makeRequest(url, payload);
  }

  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${this.config.baseUrl}/v1/tasks/${taskId}?language=zh`;
    const response = await this.makeRequest(url, {}, 'GET');
    if (response.code === 200 && response.data) return response.data;
    return response;
  }

  private async makeRequest(url: string, payload: any, method: string = 'POST'): Promise<any> {
    const token = API_CONFIG.MASTER_KEY;
    if (!token) throw new Error("请在大厅配置 API 密钥后再启动任务");

    if (/[^\x00-\x7F]/.test(token)) {
       throw new Error("API 密钥格式错误：检测到非法字符。请在设置中重新输入纯英文 Key。");
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    const options: RequestInit = {
      method,
      headers,
      ...(method !== 'GET' && { body: JSON.stringify(payload) })
    };
    
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        // 先尝试读取文本，因为 413/504 等可能不是 JSON
        const errorText = await response.text();
        let errorMsg = `API 请求异常 (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.msg || errorMsg;
        } catch {
          errorMsg = errorText.substring(0, 100) || errorMsg;
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error: any) {
       if (error.message === 'Failed to fetch') {
         throw new Error("网络请求失败 (Failed to fetch)，可能是图片数据过大导致，请减少上传图片数量或压缩图片。");
       }
       if (error.message.includes('ISO-8859-1')) {
         throw new Error("API 密钥包含非法字符，请检查是否误复制了中文。");
       }
       throw error;
    }
  }
}
