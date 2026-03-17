
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
   * 核心修复：同时发送 size 和 aspect_ratio 确保网关兼容性
   */
  async generateImage(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/images/generations`;
    
    // 兼容逻辑：取两者之中的有效值
    const targetRatio = config.aspectRatio || config.size || '1:1';
    
    const payload = {
      model: config.model || 'gemini-3-pro-image-preview',
      prompt,
      size: targetRatio,         // 部分网关识别此字段
      aspect_ratio: targetRatio, // 旗舰模型标准识别此字段
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

  async analyzeWithMultimodal(
    text: string,
    imageBase64?: string,
    model: string = 'gemini-3-pro-preview',
    generationConfig?: any
  ): Promise<any> {
    const url = `${this.config.baseUrl}/v1beta/models/${model}:generateContent`;
    const parts: any[] = [{ text }];
    if (imageBase64) {
      const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.includes(';') ? imageBase64.match(/:(.*?);/)?.[1] || 'image/jpeg' : 'image/jpeg';
      parts.push({ inlineData: { mimeType, data } });
    }
    const payload = { 
      contents: [{ role: "user", parts }],
      generationConfig: generationConfig 
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

    // 关键修复：检测非法字符（如中文、全角字符），防止 fetch 报错 "String contains non ISO-8859-1 code point"
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(token)) {
       throw new Error("API 密钥格式错误：检测到包含非法字符（如中文或全角符号）。请在设置中重新输入纯英文的 API Key。");
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
      const result = await response.json();
      if (!response.ok) {
        const msg = result.error?.message || result.msg || `API 请求异常 (HTTP ${response.status})`;
        throw new Error(msg);
      }
      return result;
    } catch (error: any) {
       // 捕获网络层面的错误，如 fetch 失败
       if (error.message.includes('ISO-8859-1')) {
         throw new Error("API 密钥包含非法字符，请检查是否误复制了中文文本。");
       }
       throw error;
    }
  }
}
