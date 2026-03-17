
import { AspectRatio, ImageSize, GrsaiApiResponse, AppResponse, MarketAnalysis } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";

const imageAdapter = new ImageAdapter();
const multimodalAdapter = new MultimodalAdapter();

// 定义两种风格的模板
const TEMPLATE_SCROLL = `这是一张产品拜年宣传海报。主题： 2026马年{{industry}}新春高端海报。场景： 电影级红金配色的群山背景。画面中心一匹半透明金色发光的骏马腾空跃过一张巨大的漂浮卷轴，气势磅礴。产品： 卷轴中心优雅摆放着{{product}}，与3D质感的金色数字“2026”交相辉映。产品质感写实，完美融入场景光影。装饰： 卷轴周围灵动地漂浮着{{element1}}和{{element2}}，象征{{meaning}}。书法排版： 画面顶部为张旭草书风格的鎏金大字“{{title}}”，笔触灵动狂放，具有极强的节奏感。下方配合整齐的金色小字“{{具体日期时间}} {{subtitle}} n/{{product}}祝您新年快乐”。技术规格： 传统中国节日美学，极简而华丽，8K超清，电影级体积光处理，暖金色高光，超写实纹理。`;

const TEMPLATE_C4D = `这是一张产品拜年宣传海报。[场景氛围]： 高端中国新春大促视觉方案，喜庆大红色调，电影级光影处理。背景带有{{bg_element1}}和{{bg_element2}}。[构图中心]： 画面中心为一处{{stand_desc}}，呈现C4D立体构图，光影聚焦于此。[产品描述]： 展台上错落有致地摆放着一组{{product}}礼盒套装，包含{{product_count}}件单品，分别呈现出{{material1}}、{{material2}}的细腻质感，体现高端礼赠氛围。[装饰元素]： 展台周围点缀{{decorations}}，强化节日促销感。[排版布局]： 画面上方为{{font_style}}的标题文字“{{title}}”；画面下方设有{{banner_style}}展示“{{具体日期时间}} {{subtitle}} n/{{product}}祝您新年快乐”。[技术参数]： 8K分辨率，超写实纹理，大师级布光，极度细腻，顶级视觉表现。`;

/**
 * 图像生成任务创建 - 对接统一 ImageAdapter
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; model: string },
  referenceImages: string[] = []
): Promise<string> => {
  try {
    return await imageAdapter.createGenerationTask(
      prompt,
      {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
        model: 'gemini-3-pro-image-preview'
      },
      referenceImages
    );
  } catch (error: any) {
    console.error("CNY Station Image Gen Error:", error);
    throw new Error(error.message || "生成任务分发失败");
  }
};

/**
 * 状态轮询 - 对接统一 ImageAdapter
 */
export const checkTaskStatus = async (taskId: string): Promise<GrsaiApiResponse['data']> => {
  try {
    return await imageAdapter.checkTaskStatus(taskId);
  } catch (error: any) {
    console.error("CNY Station Status Error:", error);
    throw error;
  }
};

/**
 * 数据标准化函数 (Sanitizer)
 * 无论模型返回什么残缺数据，强制补全字段，防止前端白屏
 */
const normalizeResponse = (data: any): AppResponse => {
  const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];
  const safeString = (str: any) => typeof str === 'string' ? str : "暂无分析";

  // 构建默认的 Analysis 对象 (处理扁平化后的 SWOT)
  const defaultAnalysis: MarketAnalysis = {
    userPersona: safeString(data?.analysis?.userPersona),
    userNeeds: safeArray(data?.analysis?.userNeeds),
    painPoints: safeArray(data?.analysis?.painPoints),
    usageScenarios: safeArray(data?.analysis?.usageScenarios),
    differentiation: safeArray(data?.analysis?.differentiation),
    emotionalValue: safeString(data?.analysis?.emotionalValue),
    swot: {
      // 兼容原有的嵌套格式和新的扁平格式
      strengths: safeArray(data?.analysis?.swot?.strengths || data?.analysis?.swot_strengths),
      weaknesses: safeArray(data?.analysis?.swot?.weaknesses || data?.analysis?.swot_weaknesses),
      opportunities: safeArray(data?.analysis?.swot?.opportunities || data?.analysis?.swot_opportunities),
      threats: safeArray(data?.analysis?.swot?.threats || data?.analysis?.swot_threats),
    },
    competitorWeakness: safeString(data?.analysis?.competitorWeakness),
    marketingCopy: safeArray(data?.analysis?.marketingCopy),
    salesChannels: safeArray(data?.analysis?.salesChannels),
    promotionStrategy: safeString(data?.analysis?.promotionStrategy),
    newMediaPlan: {
      content: safeString(data?.analysis?.newMediaPlan?.content),
      strategy: safeString(data?.analysis?.newMediaPlan?.strategy),
      tactic: safeString(data?.analysis?.newMediaPlan?.tactic),
    }
  };

  return {
    analysis: defaultAnalysis,
    painPointPrompts: {
      category: data?.painPointPrompts?.category || "痛点视觉",
      prompts: safeArray(data?.painPointPrompts?.prompts)
    },
    scenarioPrompts: safeArray(data?.scenarioPrompts),
    holidayPrompts: safeArray(data?.holidayPrompts)
  };
};

/**
 * 策划方案生成 - 采用"分治策略" (Divide and Conquer)
 */
export const generatePlan = async (productSpecs: string, imagesBase64?: string[], style: 'scroll' | 'c4d' = 'scroll'): Promise<AppResponse> => {
  const selectedTemplate = style === 'scroll' ? TEMPLATE_SCROLL : TEMPLATE_C4D;

  // 任务1：策略大脑 - 负责纯文本的市场分析
  // 结构优化：扁平化 SWOT 以减少嵌套导致的 JSON 语法错误
  const strategyInstruction = `你是一位享誉业界的中国新春营销策划专家。
请基于提供的产品信息，进行深度的市场与策略分析。

# 核心任务：全案策略输出
请生成非常详细的用户画像、SWOT分析、营销文案及新媒体策略。

# JSON 输出格式 (扁平化结构，严禁深层嵌套)
请严格输出纯 JSON，不要包含 Markdown。格式如下：
{
  "analysis": {
    "userPersona": "详细用户画像",
    "userNeeds": ["需求1", "需求2"],
    "painPoints": ["痛点1", "痛点2"],
    "usageScenarios": ["场景1", "场景2"],
    "differentiation": ["差异化卖点1", "差异化卖点2"],
    "emotionalValue": "情感价值主张",
    "swot_strengths": ["优势1", "优势2"],
    "swot_weaknesses": ["劣势1"],
    "swot_opportunities": ["机会1"],
    "swot_threats": ["威胁1"],
    "competitorWeakness": "竞品弱点分析",
    "marketingCopy": ["爆款文案1", "爆款文案2"],
    "salesChannels": ["渠道1", "渠道2"],
    "promotionStrategy": "整体促销策略",
    "newMediaPlan": { "content": "内容方向", "strategy": "运营策略", "tactic": "执行战术" }
  }
}`;

  // 任务2：视觉大脑 - 负责所有Prompt的生成
  const creativeInstruction = `你是一位顶尖的 AI 视觉艺术总监。
请基于产品信息，为“2026马年”生成全套高质量绘图提示词。

# 视觉风格模板 (Template)
请基于此模板结构来生成 \`fullPrompt\`，智能填充内容：
"${selectedTemplate}"

# 核心任务：3大视觉板块
1. **痛点视觉**：将解决用户痛点的过程可视化。
2. **场景视觉**：产品在高频使用场景下的美学展示。
3. **节日日历 (全量)**：针对春节、情人节、除夕、初一到初八，每天生成2个海报策划方案。

# 关键规则
- \`fullPrompt\` 必须是基于上述模板填充后的中文完整提示词。
- 请直接输出 JSON，不要 Markdown。

# JSON 输出格式
{
  "painPointPrompts": {
    "category": "痛点视觉",
    "prompts": [{ "planTitle": "方案名", "fullPrompt": "完整提示词..." }]
  },
  "scenarioPrompts": [
    { "category": "场景类", "prompts": [{ "planTitle": "方案名", "fullPrompt": "..." }] }
  ],
  "holidayPrompts": [
    { 
      "dateName": "除夕", 
      "prompts": [
        { "planTitle": "除夕方案1", "fullPrompt": "..." }, 
        { "planTitle": "除夕方案2", "fullPrompt": "..." }
      ] 
    },
    { "dateName": "情人节", "prompts": [...] },
    { "dateName": "正月初一", "prompts": [...] },
    { "dateName": "正月初二", "prompts": [...] },
    { "dateName": "正月初三", "prompts": [...] },
    { "dateName": "正月初四", "prompts": [...] },
    { "dateName": "正月初五", "prompts": [...] },
    { "dateName": "正月初六", "prompts": [...] },
    { "dateName": "正月初七", "prompts": [...] },
    { "dateName": "正月初八", "prompts": [...] },    
    { "dateName": "元宵节", "prompts": [...] }
  ]
}`;

  try {
    const [strategyResult, creativeResult] = await Promise.all([
      multimodalAdapter.generateStructuredContent({
        systemInstruction: strategyInstruction,
        prompt: `产品信息：\n${productSpecs}`,
        schema: null,
        images: imagesBase64,
        model: 'gemini-3-pro-preview'
      }),
      multimodalAdapter.generateStructuredContent({
        systemInstruction: creativeInstruction,
        prompt: `产品信息：\n${productSpecs}`,
        schema: null,
        images: imagesBase64,
        model: 'gemini-3-pro-preview'
      })
    ]);

    const mergedResult = {
      ...strategyResult,
      ...creativeResult
    };
    
    return normalizeResponse(mergedResult);
  } catch (error: any) {
    console.error("CNY Station Planner Error:", error);
    throw new Error("策划引擎高负载，请稍后重试。技术信息: " + error.message);
  }
};
