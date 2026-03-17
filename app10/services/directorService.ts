
import { MultimodalAdapter } from '../../services/adapters/multimodalAdapter';
import { ImageAdapter } from '../../services/adapters/imageAdapter';
import { TaskAdapter } from '../../services/adapters/taskAdapter';
import { DirectorOutput, VisualAnalysis, ShotScript } from '../types';

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

// 1. 定义硬编码的 9 大分镜模板 (System Anchors)
// 即使 AI 罢工，这些模板结合提取的视觉 DNA 也能生成完美图像
const SCENE_TEMPLATES = [
  { id: 1, type: "Establishing Shot", title: "环境定调", cnDescription: "广角交代人物与环境关系，确立影片基调", basePrompt: "wide angle full body shot, cinematic environmental portrait, establishing shot" },
  { id: 2, type: "Candid Portrait", title: "生动抓拍", cnDescription: "捕捉不经意间的自然神态，打破摆拍感", basePrompt: "medium shot, candid moment, natural expression, looking away from camera, dynamic pose" },
  { id: 3, type: "Texture Detail", title: "材质特写", cnDescription: "聚焦服装或面部的高清细节，展现质感", basePrompt: "extreme close-up, macro photography, focus on details, skin texture, fabric texture, shallow depth of field" },
  { id: 4, type: "Dynamic Motion", title: "动态瞬间", cnDescription: "展现运动中的张力与发丝飞舞的瞬间", basePrompt: "dynamic motion blur, hair floating in wind, action shot, energetic pose, freezing time" },
  { id: 5, type: "Cinematic Light", title: "光影叙事", cnDescription: "利用强烈的明暗对比营造电影氛围", basePrompt: "dramatic cinematic lighting, chiaroscuro, volumetrics, moody atmosphere, rembrandt lighting" },
  { id: 6, type: "Dutch Angle", title: "非常规视角", cnDescription: "打破平衡的创意构图，增加视觉冲击力", basePrompt: "dutch angle, tilted camera, dynamic perspective, from below or above, artistic composition" },
  { id: 7, type: "Interactive", title: "互动情节", cnDescription: "与道具或环境产生深度交互", basePrompt: "interacting with object, holding prop, engaging with environment, storytelling moment" },
  { id: 8, type: "Emotional", title: "情绪特写", cnDescription: "直击灵魂的眼神交流，虚化背景", basePrompt: "intimate portrait, direct eye contact, emotional expression, soft lighting, bokeh background" },
  { id: 9, type: "Atmosphere", title: "氛围留白", cnDescription: "极简构图与意境营造，突出主体轮廓", basePrompt: "minimalist composition, negative space, silhouette, atmospheric haze, artistic mood" }
];

const SYSTEM_PROMPT = `
# Role: 顶级视觉艺术总监 (Vision Director)

## 任务
用户将上传一张参考图像。你的任务是提取其**视觉基因**，并基于提供的 9 个标准分镜逻辑，生成具体的拍摄 Prompt。

## 输出要求 (CRITICAL)
1. **Visual Analysis**: 提取 [Style], [Mood], [Lighting], [KeyElements (详细且客观的物理特征描述)]。
2. **Scripts**: 针对 9 个分镜，分别生成一段 Prompt。
   - Prompt 必须包含 [KeyElements] 以保持角色一致性。
   - Prompt 必须包含该分镜特有的镜头语言。

## 严格 JSON 格式
请直接输出 JSON，不要包含 Markdown 标记：
{
  "analysis": {
    "style": "...", "mood": "...", "lighting": "...", "keyElements": "..."
  },
  "scripts": [
    { "id": 1, "prompt": "..." },
    { "id": 2, "prompt": "..." },
    ... (直到 id: 9)
  ]
}`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    analysis: {
      type: "OBJECT",
      properties: {
        style: { type: "STRING" },
        mood: { type: "STRING" },
        lighting: { type: "STRING" },
        keyElements: { type: "STRING" }
      },
      required: ["style", "mood", "lighting", "keyElements"]
    },
    scripts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "INTEGER" },
          prompt: { type: "STRING" }
        },
        required: ["id", "prompt"]
      }
    }
  },
  required: ["analysis", "scripts"]
};

/**
 * 混合清洗策略 (Hybrid Sanitizer)
 * 核心逻辑：Template + AI Data = Guaranteed Output
 */
const normalizeDirectorOutput = (data: any): DirectorOutput => {
  const safeString = (str: any, defaultVal = "") => (typeof str === 'string' && str.trim().length > 0 ? str : defaultVal);
  
  // 1. 提取或兜底 Analysis
  const rawAnalysis = data?.analysis || {};
  const analysis: VisualAnalysis = {
    style: safeString(rawAnalysis.style, "Cinematic High-Fidelity"),
    mood: safeString(rawAnalysis.mood, "Professional Commercial"),
    lighting: safeString(rawAnalysis.lighting, "Studio Lighting"),
    keyElements: safeString(rawAnalysis.keyElements, "High quality subject, detailed features")
  };

  // 构造视觉基因字符串 (用于合成 Prompt)
  const visualDNA = `(${analysis.keyElements}), ${analysis.style} style, ${analysis.lighting}`;

  // 2. 强制基于 SCENE_TEMPLATES 生成 9 个脚本
  // 即使 AI 返回空数组，这里也会生成 9 个有效的兜底脚本
  const scripts: ShotScript[] = SCENE_TEMPLATES.map((tpl, index) => {
    // 尝试从 AI 结果中找对应脚本 (按索引或 ID)
    const aiScript = Array.isArray(data?.scripts) ? data.scripts.find((s: any) => s.id === tpl.id) || data.scripts[index] : null;

    let finalPrompt = "";
    
    // 策略 A: 使用 AI 生成的 Prompt (如果质量合格)
    if (aiScript && aiScript.prompt && aiScript.prompt.length > 20) {
      finalPrompt = aiScript.prompt;
      // 双重保险：确保 AI 没有忘记把视觉基因带上
      if (!finalPrompt.toLowerCase().includes(analysis.keyElements.substring(0, 10).toLowerCase())) {
         finalPrompt = `${finalPrompt}, ${analysis.keyElements}`;
      }
    } 
    // 策略 B: 规则合成 (兜底) -> 模板镜头词 + 视觉 DNA
    else {
      finalPrompt = `${tpl.basePrompt}, ${visualDNA}, masterpiece, 8k, highly detailed`;
    }

    return {
      id: tpl.id,
      type: tpl.type,              // 强制使用模板类型
      title: tpl.title,            // 强制使用模板标题
      cnDescription: tpl.cnDescription, // 强制使用模板描述
      prompt: finalPrompt
    };
  });
  
  return { analysis, scripts };
};

export class DirectorService {
  /**
   * 分析图像并生成剧本
   */
  async analyzeAndScript(imageBase64: string): Promise<DirectorOutput> {
    try {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      
      // 尝试调用 AI 进行深度创作
      let result = {};
      try {
        result = await multimodalAdapter.generateStructuredContent({
          systemInstruction: SYSTEM_PROMPT,
          prompt: "Analyze this image and generate 9 shot scripts based on the templates.",
          schema: RESPONSE_SCHEMA,
          images: [base64Data],
          model: 'gemini-3-pro-preview'
        });
      } catch (aiError) {
        console.warn("AI Generation partial fail, falling back to rule-based synthesis:", aiError);
        // 如果 AI 完全失败，result 为空对象，normalizeDirectorOutput 会自动处理兜底
      }

      // 应用混合清洗策略，确保 100% 返回可用数据
      return normalizeDirectorOutput(result);

    } catch (error: any) {
      console.error("Director Service Fatal Error:", error);
      return normalizeDirectorOutput({});
    }
  }

  /**
   * 执行拍摄
   */
  async shootScene(prompt: string, referenceImage: string): Promise<string> {
    try {
      // 强化一致性 Prompt
      const anchorPrompt = `(consistent character and details:1.5), ${prompt}, professional photography`;

      return await imageAdapter.createGenerationTask(
        anchorPrompt, 
        { 
          model: 'gemini-3-pro-image-preview',
          aspectRatio: '1:1',
          imageSize: '1K' 
        },
        [referenceImage]
      );
    } catch (error: any) {
      console.error("Shooting Error:", error);
      throw error;
    }
  }

  /**
   * 检查进度
   */
  async checkStatus(taskId: string) {
    return await imageAdapter.checkTaskStatus(taskId);
  }
}
