
/**
 * 预设分类枚举
 */
export enum PresetCategory {
  ALL = "全部",
  PRODUCT = "产品摄影",
  PERSON = "人像写真",
  SCENE = "场景重构",
  STYLE = "艺术风格"
}

/**
 * 预设条目接口 - 严格对应 D1 数据库真实字段 (根据截图)
 */
export interface Preset {
  id: string;
  title: string;
  category_id: string;
  description: string | null;
  positive: string;        // 核心：正向提示词
  negative: string | null; // 负向提示词
  image: string | null;    // 核心：预览图路径
  visibility: string;
  preset_type: string;
  view_count: number;
  favorite_count: number;
  use_count: number;
  created_at: number;
}

/**
 * 预设中心任务状态
 */
export interface PresetTaskStatus {
  loading: boolean;
  error: string | null;
}
