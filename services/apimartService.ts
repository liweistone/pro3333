
import { AnalysisResult, TaskResponse, GenerationConfig } from '../types';

const BASE_URL = 'https://api.apimart.ai';
const HARDCODED_KEY = 'sk-FO0wuJD4IxbThtg7nkBkBhBVFDM2LTStEHouSymNTA7H1Oya';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export class APIMartService {
  private apiKey: string = HARDCODED_KEY;

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  // 辅助方法：从 APIMart 多样的响应格式中提取有效的 Task ID 或 Result
  private extractResponseData(res: any) {
    if (!res) return null;
    // 优先取 res.data，如果不存在则取 res 本身
    const core = res.data !== undefined ? res.data : res;
    
    // 如果核心数据是数组，取第一项
    if (Array.isArray(core) && core.length > 0) {
      return core[0];
    }
    return core;
  }

  // 1. 视觉分析：识别结构，构思提示词
  async analyzeImage(file: File, userInstruction: string): Promise<AnalysisResult> {
    const base64Data = await fileToBase64(file);
    const url = `${BASE_URL}/v1beta/models/gemini-2.5-pro:generateContent`;
    
    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: `你是一位顶级工业设计视觉导演。请分析此图并严格输出 JSON 字符串（不要包含任何 Markdown 代码块标签）：{"reasoning":"分析产品结构及光效逻辑","imagePrompt":"用于重绘发光质感图的英文提示词，必须包含 'KEEP ORIGINAL PRODUCT GEOMETRY UNCHANGED'","videoPrompt":"用于 Sora 渲染动态光影流转的英文提示词"}\n用户要求：${userInstruction}` },
          { inlineData: { mimeType: file.type, data: base64Data } }
        ]
      }]
    };

    const response = await fetch(url, { method: 'POST', headers: this.headers, body: JSON.stringify(payload) });
    const res = await response.json();
    
    const data = this.extractResponseData(res);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || res.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("AI 导演解析失败，请检查网络或 API Key。");
    
    const jsonMatch = text.replace(/```json/g, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 导演返回格式解析失败。");
    
    return JSON.parse(jsonMatch[0]);
  }

  // 2. 生成静态发光参考图 (高保真一致性模式)
  async startImageGeneration(prompt: string, originalFile: File): Promise<string> {
    const base64Data = await fileToBase64(originalFile);
    // 使用 generateContent 模式以支持图片参考输入
    const url = `${BASE_URL}/v1beta/models/gemini-3-pro-image-preview:generateContent`;
    
    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: `TASK: RENDER PRODUCT LIGHTING EFFECT. \nCRITICAL RULES: \n1. MAINTAIN EXACT PRODUCT SHAPE, STRUCTURE AND PROPORTIONS. \n2. DO NOT MODIFY THE PRODUCT DESIGN. \n3. APPLY THIS VISUAL EFFECT ON THE PRODUCT: ${prompt}` },
          { inlineData: { mimeType: originalFile.type, data: base64Data } }
        ]
      }]
    };

    const response = await fetch(url, { method: 'POST', headers: this.headers, body: JSON.stringify(payload) });
    const res = await response.json();
    
    const data = this.extractResponseData(res);
    
    // 检查是否同步返回了图片
    const parts = data?.candidates?.[0]?.content?.parts || res.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return `IMAGEDATA:data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    // 否则寻找任务 ID
    const taskId = data?.task_id || data?.id || res.id || res.task_id;
    if (!taskId) {
      console.error("Image Gen Error Response:", res);
      throw new Error("图像生成启动失败，未获得任务 ID。");
    }
    return taskId;
  }

  // 3. 启动视频生成
  async startVideoGeneration(prompt: string, refImageUrl: string, config: GenerationConfig): Promise<string> {
    const url = `${BASE_URL}/v1/videos/generations`;
    const payload = {
      model: "sora-2",
      prompt: `Premium commercial cinematography. ${prompt}`,
      duration: config.duration,
      aspect_ratio: config.aspectRatio,
      image_urls: [refImageUrl]
    };

    const response = await fetch(url, { method: 'POST', headers: this.headers, body: JSON.stringify(payload) });
    const res = await response.json();
    
    const data = this.extractResponseData(res);
    const taskId = data?.task_id || data?.id || res.id;
    if (!taskId) throw new Error("视频生成任务启动失败。");
    return taskId;
  }

  // 4. 轮询逻辑
  async pollTask(taskId: string, onProgress?: (p: number) => void): Promise<string> {
    if (taskId.startsWith('IMAGEDATA:')) {
      if (onProgress) onProgress(100);
      return taskId.replace('IMAGEDATA:', '');
    }

    return new Promise((resolve, reject) => {
      let retryCount = 0;
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${BASE_URL}/v1/tasks/${taskId}?language=zh`, { headers: this.headers });
          const res = await response.json();
          const data = this.extractResponseData(res);
          
          if (onProgress && data.progress !== undefined) onProgress(data.progress);
          
          const status = data.status?.toLowerCase();
          if (status === 'completed' || status === 'succeeded') {
            clearInterval(interval);
            const result = data.result;
            
            // 尝试多种路径提取 URL 或 Base64
            const url = 
              result?.images?.[0]?.url?.[0] || 
              result?.videos?.[0]?.url?.[0] || 
              result?.url || 
              (Array.isArray(result) ? result[0]?.url : null) ||
              data.candidates?.[0]?.content?.parts?.find((p:any) => p.inlineData)?.inlineData?.data;

            if (url) {
               resolve(url.startsWith('http') || url.startsWith('data:') ? url : `data:image/png;base64,${url}`);
            } else {
               reject(new Error("任务已完成，但未找到可用的结果 URL。"));
            }
          } else if (status === 'failed' || status === 'error') {
            clearInterval(interval);
            reject(new Error(data.error?.message || "云端任务执行失败。"));
          }

          if (retryCount++ > 120) {
            clearInterval(interval);
            reject(new Error("任务轮询超时。"));
          }
        } catch (e) {
          console.warn("Polling error:", e);
        }
      }, 5000);
    });
  }
}
