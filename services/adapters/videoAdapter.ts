import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 视频生成适配器
 * 适配原有视频生成功能到Apimart服务，保持原有应用兼容性
 */
export class VideoAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }
  
  /**
   * 创建视频生成任务
   */
  async createVideoTask(
    prompt: string,
    config: any = {},
    imageUrls: string[] = []
  ): Promise<string> {
    try {
      // 转换配置参数以匹配Apimart API格式
      const videoConfig = {
        model: config.model || 'sora-2',
        aspectRatio: config.aspectRatio || '16:9',
        duration: config.duration || 10
      };
      
      // 调用Apimart服务生成视频
      const taskId = await this.provider.generateVideo(
        prompt,
        videoConfig,
        imageUrls
      );
      
      return taskId;
    } catch (error: any) {
      throw new Error(`视频生成任务创建失败: ${error.message}`);
    }
  }
  
  /**
   * 检查视频任务状态
   */
  async checkVideoTaskStatus(taskId: string): Promise<any> {
    try {
      // 从Apimart获取任务状态
      const status = await this.provider.getTaskStatus(taskId);
      
      // 将Apimart状态格式转换为原有应用期望的格式
      return this.transformVideoStatusFormat(status);
    } catch (error: any) {
      throw new Error(`视频任务状态查询失败: ${error.message}`);
    }
  }
  
  /**
   * 将Apimart视频任务状态转换为原有应用格式
   */
  private transformVideoStatusFormat(apimartStatus: any) {
    // 转换为原有应用期望的格式
    return {
      id: apimartStatus.id,
      status: apimartStatus.status === 'completed' ? 'succeeded' : 
              apimartStatus.status === 'failed' ? 'failed' : 'running',
      progress: apimartStatus.progress,
      results: apimartStatus.result?.videos && apimartStatus.result.videos[0]?.url ? 
        [{ url: apimartStatus.result.videos[0].url[0] }] : undefined,
      failure_reason: apimartStatus.error?.message,
      error: apimartStatus.error?.message
    };
  }
  
  /**
   * 生成带特效的视频（适配app6的视频生成功能）
   */
  async generateSpecialEffectVideo(
    videoPrompt: string,
    anchorImageUrl: string,
    config: any = {}
  ) {
    // 创建视频生成任务
    return this.createVideoTask(
      videoPrompt,
      config,
      [anchorImageUrl]
    );
  }
}