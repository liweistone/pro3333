import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";

const multimodalAdapter = new MultimodalAdapter();

/**
 * 使用指定的第三方 AI 引擎优化电商策划方案
 */
export const optimizePlanningScheme = async (
  schemes: string,
  referenceImage?: string
): Promise<string> => {
  try {
    // 将参考图像转换为base64格式（如果有的话）
    let imageBase64: string | undefined;
    if (referenceImage) {
      if (referenceImage.startsWith('data:image')) {
        imageBase64 = referenceImage.split(',')[1]; // 移除data:image部分，只保留base64内容
      } else {
        // 如果是URL，需要先获取图像数据
        const response = await fetch(referenceImage);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        imageBase64 = (reader.result as string).split(',')[1];
      }
    }

    const result = await multimodalAdapter.analyzeProduct(schemes, imageBase64);
    // 根据实际返回的对象结构来获取内容
    if (typeof result === 'object' && result.reasoning) {
      return result.reasoning;
    } else if (typeof result === 'string') {
      return result;
    } else {
      return JSON.stringify(result);
    }
  } catch (error: any) {
    console.error("AI 策划方案优化服务异常:", error);
    throw error;
  }
};