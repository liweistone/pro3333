
import { ApimartProvider } from '../providers/apimartProvider';
import { API_CONFIG } from '@/apiConfig';

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
    // 基础清理
    repaired = repaired.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return repaired;
  }

  /**
   * 安全的 JSON 解析工具
   */
  private safeParseJson(text: string): any {
    if (!text) throw new Error("模型返回内容为空");

    // 1. 尝试直接解析
    try {
      return JSON.parse(text);
    } catch (e) {
      // 2. 尝试清理后解析
      const cleaned = this.heuristicRepair(text);
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        // 3. 尝试提取 JSON 对象 (寻找第一个 { 和最后一个 })
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
        
        console.error("Failed to parse JSON:", text);
        throw new Error(`模型输出结果格式异常，无法解析 JSON。预览: ${text.substring(0, 100)}...`);
      }
    }
  }

  /**
   * 通用的结构化内容生成方法
   */
  async generateStructuredContent(params: {
    systemInstruction: string;
    prompt: string;
    schema: any;
    images?: string[];
    model?: string;
    generationConfig?: any;
  }) {
    try {
      const { systemInstruction, prompt, schema, images, model = 'gemini-3-pro-preview', generationConfig } = params;
      const MASTER_KEY = API_CONFIG.MASTER_KEY;

      if (!MASTER_KEY) {
        throw new Error("请在大厅配置 API 密钥");
      }

      const parts: any[] = [{ text: prompt }];
      if (images?.length) {
        images.forEach(base64 => {
          // 处理带前缀的 base64
          const data = base64.includes(',') ? base64.split(',')[1] : base64;
          parts.push({ inlineData: { mimeType: 'image/jpeg', data } });
        });
      }

      // 构建配置
      const configPayload: any = {
        responseMimeType: "application/json",
        ...generationConfig
      };

      // 只有当 schema 存在时才添加
      if (schema) {
        configPayload.responseSchema = schema;
      }

      const payload = {
        contents: [{ role: "user", parts }],
        generationConfig: configPayload,
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };

      const response = await fetch(`https://api.apimart.ai/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MASTER_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || result.msg || `结构化生成请求失败: ${response.status}`);
      }

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
         // 某些情况下可能因为安全拦截导致无内容
         if (result.promptFeedback?.blockReason) {
             throw new Error(`请求被拦截: ${result.promptFeedback.blockReason}`);
         }
         throw new Error("引擎未返回有效数据");
      }

      return this.safeParseJson(text);
    } catch (error: any) {
      throw new Error(`结构化生成失败: ${error.message}`);
    }
  }
  
  /**
   * 分析产品并生成视觉剧本（适配原有接口）
   */
  async analyzeProduct(text: string, imageBase64?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(
        text, 
        imageBase64, 
        'gemini-3-pro-preview'
      );
      const data = result.data || result;
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        reasoning: textContent,
        imagePrompt: '',
        videoPrompt: '',
      };
    } catch (error: any) {
      throw new Error(`多模态分析失败: ${error.message}`);
    }
  }
  
  /**
   * 执行通用多模态分析
   */
  async analyzeContent(content: string, image?: string, model?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(
        content, 
        image, 
        model || 'gemini-3-pro-preview'
      );
      const data = result.data || result;
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        choices: [{ message: { content: textContent } }],
        content: textContent
      };
    } catch (error: any) {
      throw new Error(`内容分析失败: ${error.message}`);
    }
  }
  
  /**
   * 生成电商策划方案
   */
  async generatePlan(productSpecs: string, imageBase64?: string) {
    // 这是一个旧接口，现在 app4/geminiService.ts 直接调用 generateStructuredContent
    // 保留此方法仅为了兼容旧代码，实际逻辑已上移
    return {}; 
  }
}
