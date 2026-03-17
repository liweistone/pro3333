
import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 图像生成适配器
 * 适配原有图像生成功能到Apimart服务，强制统一模型名称
 */
export class ImageAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }
  
  /**
   * 创建图像生成任务
   * 核心修复：强制使用 gemini-2.5-flash-image-preview (Flash模型) 以节省成本
   */
  async createGenerationTask(
    prompt: string,
    config: any = {},
    referenceImages: string[] = []
  ): Promise<string> {
    try {
      // 转换配置参数以匹配Apimart API格式
      // 这里的 model 优先级被锁定，确保全站输出一致
      const imageConfig = {
        size: config.aspectRatio || config.size || '1:1',
        resolution: config.imageSize || config.resolution || '1K',
        model: 'gemini-3-pro-image-preview' 
      };
      
      // 调用Apimart服务生成图像
      const taskId = await this.provider.generateImage(
        prompt,
        imageConfig,
        referenceImages
      );
      
      return taskId;
    } catch (error: any) {
      throw new Error(`图像生成任务创建失败: ${error.message}`);
    }
  }
  
  /**
   * 检查任务状态
   */
  async checkTaskStatus(taskId: string): Promise<any> {
    try {
      // 从Apimart获取任务状态
      const status = await this.provider.getTaskStatus(taskId);
      
      // 将Apimart状态格式转换为原有应用期望的格式
      return this.transformStatusFormat(status);
    } catch (error: any) {
      throw new Error(`任务状态查询失败: ${error.message}`);
    }
  }
  
  /**
   * 将Apimart任务状态转换为原有应用格式
   */
  private transformStatusFormat(apimartStatus: any) {
    // 转换为原有应用期望的格式
    return {
      id: apimartStatus.id,
      status: apimartStatus.status === 'completed' ? 'succeeded' : 
              apimartStatus.status === 'failed' ? 'failed' : 'running',
      progress: apimartStatus.progress,
      results: apimartStatus.result?.images && apimartStatus.result.images[0]?.url ? 
        [{ url: apimartStatus.result.images[0].url[0] }] : undefined,
      failure_reason: apimartStatus.error?.message,
      error: apimartStatus.error?.message
    };
  }
  
  /**
   * 生成增强型提示词
   */
  async generateEnhancedImage(
    basePrompt: string,
    enhancements: {
      pose?: string;
      camera?: string;
      lighting?: string;
      expression?: string;
      body?: string;
    },
    config: any = {},
    referenceImages: string[] = []
  ) {
    // 构建增强后的提示词
    let enhancedPrompt = basePrompt;
    
    if (enhancements.pose) enhancedPrompt += `, ${enhancements.pose}`;
    if (enhancements.camera) enhancedPrompt += `, ${enhancements.camera}`;
    if (enhancements.lighting) enhancedPrompt += `, ${enhancements.lighting}`;
    if (enhancements.expression) enhancedPrompt += `, ${enhancements.expression}`;
    if (enhancements.body) enhancedPrompt += `, ${enhancements.body}`;
    
    // 创建生成任务
    return this.createGenerationTask(enhancedPrompt, config, referenceImages);
  }
}
