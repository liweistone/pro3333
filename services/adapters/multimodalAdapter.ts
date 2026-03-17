
import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 多模态适配器
 * 适配 Apimart Native Gemini 格式响应，保持原有应用兼容性
 */
export class MultimodalAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }

  /**
   * 启发式 JSON 修复引擎 (Heuristic Repair Engine)
   */
  private heuristicRepair(text: string): string {
    let repaired = text.trim();
    repaired = repaired.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return repaired;
  }

  /**
   * 安全的 JSON 解析工具
   */
  private safeParseJson(text: string): any {
    if (!text) throw new Error("模型返回内容为空");

    try {
      return JSON.parse(text);
    } catch (e) {
      const cleaned = this.heuristicRepair(text);
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        const firstOpen = cleaned.indexOf('{');
        const lastClose = cleaned.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const jsonSub = cleaned.substring(firstOpen, lastClose + 1);
          try {
            return JSON.parse(jsonSub);
          } catch (e3) {
             console.error("JSON extraction failed:", e3);
          }
        }
        throw new Error(`无法解析 JSON 结果。预览: ${text.substring(0, 100)}...`);
      }
    }
  }

  /**
   * 通用的结构化内容生成方法 (接入统一 Provider)
   */
  async generateStructuredContent(params: {
    systemInstruction: string;
    prompt: string;
    schema?: any;
    images?: string[];
    model?: string;
    generationConfig?: any;
  }) {
    try {
      const { systemInstruction, prompt, schema, images, model = 'gemini-3-pro-preview', generationConfig } = params;
      
      const result = await this.provider.analyzeWithMultimodal(
        prompt,
        images,
        model,
        {
          ...generationConfig,
          systemInstruction,
          responseSchema: schema || undefined
        }
      );

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
         if (result.promptFeedback?.blockReason) {
             throw new Error(`请求被拦截: ${result.promptFeedback.blockReason}`);
         }
         throw new Error("引擎未返回有效数据");
      }

      return this.safeParseJson(text);
    } catch (error: any) {
      throw new Error(`多模态处理失败: ${error.message}`);
    }
  }
  
  /**
   * 分析产品并生成视觉剧本
   */
  async analyzeProduct(text: string, imageBase64?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(text, imageBase64);
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { reasoning: textContent, imagePrompt: '', videoPrompt: '' };
    } catch (error: any) {
      throw new Error(`多模态分析失败: ${error.message}`);
    }
  }
  
  /**
   * 执行通用多模态分析
   */
  async analyzeContent(content: string, image?: string, model?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(content, image, model);
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { choices: [{ message: { content: textContent } }], content: textContent };
    } catch (error: any) {
      throw new Error(`内容分析失败: ${error.message}`);
    }
  }
}
