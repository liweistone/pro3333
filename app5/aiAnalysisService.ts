
import { VisualStyle } from './types';

/**
 * 使用指定的第三方 AI 引擎优化电商策划方案
 * 接口地址: /api/v1/chat/completions
 */

const API_URL = "/api/v1/chat/completions";

/**
 * 根据初步策划内容和参考图，利用 AI 生成专业的绘图提示词
 */
export const optimizePlanningScheme = async (
  schemes: string,
  visualStyle: VisualStyle,
  referenceImage?: string
): Promise<string> => {
  const systemInstruction = `你是一位顶尖的电商主图视觉策划专家。你的任务是将用户提供的【简单策划方案】细化为符合【预制主图设计模版】的专业绘图提示词。

【当前视觉风格】：${visualStyle}

【必须遵循的规则】：
1. 原方案中的【主标题】和【副标题】必须完全保留，不得改动。
2. 产品必须占画面高度的70%以上，处于绝对主导地位，突出属性和名称。
3. 每个方案输出为一段【不换行】的提示词，单行提示词。
4. 输出格式：直接输出所有方案对应的提示词，每行一个，不要包含序号、引导词、Markdown 代码块符号或任何解释说明。
5. 风格：写实、8K、构图饱满、无分割线。
6. 产品图写入主图设计方案时，对产品不要有太多细节的描述，描述太多容易造成产品一致变差。

【程序预制的主图设计策划模板】：
${visualStyle === VisualStyle.MODEL ? 
`这是一张写实风格的电商主图。画面主体是参考图中的模特展示产品的场景，有较强的时尚摄影风格。[具体场景描述，必须出现模特和产品，且模特和产品占主导地位，突出产品属性和名称，描述产品时可描述为如“参考图中的xxxx”]。【文案设计】：1.侧边文案：在画面侧边空白处使用[字体及字体设计][原方案主标题]，下方紧跟稍小的[副标题字体及字体设计][原方案副标题]。2. 在画面中靠近底部有一个设计感很强的[按钮内的文案]按钮。raw，写实，8k，构图饱满，无分割线。` :
`这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面，有较强的平面设计风格。[具体场景描述，必须出现产品包装，且产品包装占主导地位，突出产品属性和名称，描述产品时可描述为如“参考图中的xxxx”]。【文案设计】：1.左上角文案：在左上角空白处使用[字体及字体设计][原方案主标题]，[当主标题文案字数大于9个汉字可换行，小于8个汉字时不换行，描述排版逻辑]，下方紧跟稍小的[副标题字体及字体设计][原方案副标题]。3.底部文案：画面最下方设计一条贯穿左右的[色块的颜色设计]波浪形色块(Banner)，色块内左侧是一个圆形图标，图标内用[图标内的文字内容及字体设计]，右侧用[促销或信任背书文字及字体设计]。4. 在画面中靠近底部波浪色切块附近有一个设计感很强的[按钮内的文案]按钮。raw，写实，8k，构图饱满，无分割线。`}
`;

  // 构建多模态请求数组
  const contentArray: any[] = [
    { type: "text", text: `这是我的初步方案：\n${schemes}\n\n当前选择的视觉风格是：${visualStyle}\n\n请结合我上传的参考素材图，生成细化后的绘图提示词。` }
  ];

  // 处理参考图 Base64 数据
  if (referenceImage) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: referenceImage 
      }
    });
  }

  const payload = {
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: contentArray }
    ],
    stream: false,
    temperature: 0.7
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `AI 接口异常: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || "";
    
    // 清理回复中可能存在的 Markdown 装饰符
    return resultText.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
  } catch (error: any) {
    console.error("AI 策划方案优化服务异常:", error);
    throw error;
  }
};
