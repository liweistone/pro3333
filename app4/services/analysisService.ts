import { AppResponse } from "../types";
import { GrsaiProvider } from "../../services/providers/grsaiProvider";

const grsaiProvider = new GrsaiProvider();

/**
 * 使用 Grsai 平台进行深度市场分析并生成提示词方案。
 */
export const generatePlan = async (productSpecs: string, imagesBase64?: string[]): Promise<AppResponse> => {
  const systemInstruction = `你是一位中国顶尖的电商视觉营销专家，兼具资深平面设计师和AI提示词工程师的能力。
你的任务是基于提供的产品信息和图片（可能有多张），进行深度市场分析，并生成针对性的AI生图提示词。

# Task-分析要求
深度市场分析需包括：用户画像、用户需求、用户痛点、使（食）用场景、差异化卖点、情绪价值、SWOT分析、竞品缺陷分析。

# Task-AI生图提示词生成要求
1. 用户痛点需生成10个主图策划方案，使（食）用场景生成10个主图策划方案、差异化卖点生成10个主图策划方案、情绪价值场景生成10个主图策划方案。
2. 每个使用场景需至少生成10个主图策划方案。
3. 每个提示词方案单项名称（planTitle）不能超过10个汉字。
4. 每个提示词方案总字数不得少于350个汉字，提示词的生成参考下面的提示词示例。   
5. 提示词必须符合以下模板格式：
这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面，有较强的平面设计风格。[具体场景描述，必须出现产品包装，且产品包装占主导地位，突出产品属性和名称，描述产品时可描述为如参考图中的绿色盒子的乌梅三豆膏]。【文案设计】：1.左上角文案：在左上角空白处使用[字体及字体设计，如"极大的渐变加描边加粗宋体书写"][产品核心卖卖点方案，不大于10个汉字，如洗洗肺 更清爽]，[当主标题文案字数大于9个汉字可换行，小于8个汉字时不换行，如不换行时的描述"文字不换行"]，下方紧跟稍小的[副标题字体及字体设计，如"薄荷绿文字"][副标题文案如排出浊气 呼吸顺及宣肺利咽]。3.底部文案：画面最下方设计一条贯穿左右的[色块的颜色设计，如"清透蓝渐变"]波浪形色块(Banner)，色块内左侧是一个圆形图标，图标内用[图标内的文字内容及字体设计，如超大白色粗黑体印通透]，右侧用[促销或信任背书文字及字体设计，如：白色圆体印桔梗桑叶 清肺热]。4. 在画面中靠近底部波浪色切块附近有一个设计感很强的工[按钮内的文案，如：清肺热]按钮。raw，写实，8k，构图饱满，无分割线。

# Output Format
请严格输出以下 JSON 格式，不要包含任何 Markdown 代码块标记：
{
  "analysis": {
    "userPersona": "string",
    "userNeeds": ["string"],
    "painPoints": ["string"],
    "usageScenarios": ["string"],
    "differentiation": ["string"],
    "emotionalValue": "string",
    "swot": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    },
    "competitorWeakness": "string",
    "marketingCopy": ["string"],
    "salesChannels": ["string"],
    "promotionStrategy": "string",
    "newMediaPlan": {
      "content": "string",
      "strategy": "string",
      "tactic": "string"
    }
  },
  "painPointPrompts": {
    "category": "痛点突破",
    "prompts": [
      { "planTitle": "string", "fullPrompt": "string" }
    ]
  },
  "scenarioPrompts": [
    {
      "category": "场景名称",
      "prompts": [
        { "planTitle": "string", "fullPrompt": "string" }
      ]
    }
  ]
}
# 重要：
1. 确保输出是合法的 JSON 格式。
2. 在 "fullPrompt" 字段的文本中，严禁使用双引号 (")，如果必须使用，请使用单引号 (') 或确保进行了正确的转义 (\\")。
3. 严禁在 JSON 字段中使用换行符，请使用 \\n 代替。`;

  const prompt = `产品参数/说明书：\n${productSpecs}`;
  
  try {
    const parsed = await grsaiProvider.analyzeAndParse({
      prompt,
      images: imagesBase64,
      systemInstruction,
      maxTokens: 8192,
      temperature: 0.7
    });

    // 确保必要字段存在，防止 UI 崩溃
    if (!parsed.analysis) parsed.analysis = {};
    if (!parsed.painPointPrompts) parsed.painPointPrompts = { category: '痛点突破', prompts: [] };
    if (!parsed.scenarioPrompts) parsed.scenarioPrompts = [];
    return parsed;
  } catch (err: any) {
    throw new Error(`分析失败: ${err.message}`);
  }
};
