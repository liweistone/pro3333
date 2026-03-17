
import { LumiAnalysisResult, LumiConfig } from '../types';
import { ApimartProvider } from '@/services/providers/apimartProvider';
import { MultimodalAdapter } from '@/services/adapters/multimodalAdapter';

const provider = new ApimartProvider();
const multimodalAdapter = new MultimodalAdapter();

export class LumiService {
  async analyzeProduct(file: File, instruction: string): Promise<LumiAnalysisResult> {
    const reader = new FileReader();
    const base64: string = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const prompt = `你是一位顶尖商业广告创意总监及光影动力学专家。
任务：深度解析此产品的工业设计逻辑，并设计一套具有【生命感】和【流体感】的流光视觉方案。

剧本设计规则：
1. reasoning: 简述光束如何顺着产品的边缘、内部构造或材质缝隙进行物理运动。
2. imagePrompt: 描述一帧静止但充满动感的高保真画面，包含光束的起始状态及周围环境的反射。
3. videoPrompt: 【核心指令】禁止只描述静态光效。必须描述光随时间变化的轨迹和状态。
   强制包含以下要素：
   - 运动轨迹：(如：由底至顶的线性扫描、环绕机身的螺旋流光、从核心向外扩散的波纹)
   - 物理状态：(如：脉冲式呼吸感、液态金属般的流动质感、高频微颤的电流)
   - 渲染增强词：(liquid light flow:1.8), (dynamic cinematic lighting evolution:1.6), (trailing light particles:1.4)

必须输出以下结构的纯 JSON 格式：
{"reasoning": "...", "imagePrompt": "...", "videoPrompt": "..."}`;
    
    return await multimodalAdapter.generateStructuredContent({
      systemInstruction: prompt,
      prompt: `用户具体需求：${instruction}`,
      images: [base64],
      model: 'gemini-3-pro-preview'
    });
  }

  async generateAnchorImage(userInsight: string, originalFile: File, config: LumiConfig): Promise<string> {
    const reader = new FileReader();
    const base64: string = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(originalFile);
    });

    // 处理 "auto" 比例，如果为 auto 则不传 aspect_ratio 让模型参考原图，或者默认为 1:1
    // 这里如果 config.aspectRatio 是 auto，我们假设已经在 App.tsx 计算出了具体比例，或者传给 Provider '1:1' 作为兜底
    // 但为了保险，如果它是 "auto"，我们在 Service 层不处理，依赖 App 层传入计算好的值
    const ratio = config.aspectRatio === 'auto' ? '1:1' : config.aspectRatio;

    return await provider.generateImage(
      `Commercial photography, high-end lighting, ${userInsight}`,
      { 
        model: 'gemini-3-pro-image-preview', 
        resolution: config.imageResolution,
        aspectRatio: ratio 
      },
      [base64]
    );
  }

  async generateLumiVideo(videoPrompt: string, anchorImageUrl: string, config: LumiConfig): Promise<string> {
    const ratio = config.aspectRatio === 'auto' ? '1:1' : config.aspectRatio;
    
    return await provider.generateVideo(
        videoPrompt,
        { 
          aspectRatio: ratio, 
          duration: config.duration,
          // ApimartProvider 目前接口可能未显式透传 videoResolution，
          // 但我们传递它以防底层网关支持
          resolution: config.videoResolution 
        },
        [anchorImageUrl]
    );
  }

  async pollStatus(taskId: string, type: 'image' | 'video'): Promise<{status: string, url?: string, progress: number}> {
    const res = await provider.getTaskStatus(taskId);
    let url = undefined;
    if (res.status === 'completed') {
      url = type === 'image' ? res.result?.images?.[0]?.url?.[0] : res.result?.videos?.[0]?.url?.[0];
    }
    return { status: res.status, progress: res.progress || 0, url };
  }
}
