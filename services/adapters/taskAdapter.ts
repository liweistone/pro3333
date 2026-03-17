import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 任务管理适配器
 * 统一处理任务状态查询功能，保持原有应用兼容性
 */
export class TaskAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }
  
  /**
   * 获取任务状态（适配原有checkTaskStatus接口）
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      // 从Apimart获取任务状态
      const status = await this.provider.getTaskStatus(taskId);
      
      // 返回标准化的格式
      return this.standardizeTaskStatus(status);
    } catch (error: any) {
      throw new Error(`任务状态查询失败: ${error.message}`);
    }
  }
  
  /**
   * 批量获取任务状态
   */
  async getMultipleTaskStatus(taskIds: string[]): Promise<any[]> {
    const results = await Promise.allSettled(
      taskIds.map(id => this.getTaskStatus(id))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: taskIds[index],
          status: 'error',
          error: result.reason.message
        };
      }
    });
  }
  
  /**
   * 等待任务完成
   */
  async waitForCompletion(
    taskId: string, 
    pollInterval: number = 2000, 
    maxAttempts: number = 150
  ): Promise<any> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getTaskStatus(taskId);
      
      if (status.status === 'succeeded' || status.status === 'failed') {
        return status;
      }
      
      // 更新进度信息
      if (status.progress) {
        console.log(`任务 ${taskId} 进度: ${status.progress}%`);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`任务 ${taskId} 超时未完成`);
  }
  
  /**
   * 标准化任务状态格式
   */
  private standardizeTaskStatus(apimartStatus: any) {
    // 将Apimart状态转换为标准化格式
    return {
      id: apimartStatus.id,
      status: this.convertStatus(apimartStatus.status),
      progress: apimartStatus.progress || 0,
      results: apimartStatus.result,
      failure_reason: apimartStatus.error?.message,
      error: apimartStatus.error?.message,
      created: apimartStatus.created,
      completed: apimartStatus.completed,
      estimated_time: apimartStatus.estimated_time,
      actual_time: apimartStatus.actual_time
    };
  }
  
  /**
   * 转换状态值为标准格式
   */
  private convertStatus(apimartStatus: string): string {
    switch (apimartStatus) {
      case 'completed':
        return 'succeeded';
      case 'processing':
      case 'running':
        return 'running';
      case 'failed':
      case 'error':
        return 'failed';
      case 'pending':
        return 'pending';
      default:
        return apimartStatus;
    }
  }
  
  /**
   * 检查任务是否完成
   */
  isTaskCompleted(status: any): boolean {
    return status.status === 'succeeded' || status.status === 'failed';
  }
  
  /**
   * 检查任务是否成功
   */
  isTaskSuccessful(status: any): boolean {
    return status.status === 'succeeded' && !!status.results;
  }
}