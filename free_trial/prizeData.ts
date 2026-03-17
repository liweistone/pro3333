
export interface PrizeSegment {
  id: string;
  label: string;
  type: 'key' | 'link';
  weight: number;
  color: string;
  textColor: string;
  url?: string;
  description?: string;
}

// 每日由管理员更新的密钥池
export const KEY_POOL: string[] = [
  "sk-9nzLscb3AbCS9ogtMQnX8xIZkkAvodRkzlgqe8cs7Cg6SdJU",
  "sk-463DGL3EyzunFDXZbIkXgJuNpFLeCL32zizz25jyW8MnyMgD",
  "sk-9nzLscb3AbCS9ogtMQnX8xIZkkAvodRkzlgqe8cs7Cg6SdJU",
  "sk-463DGL3EyzunFDXZbIkXgJuNpFLeCL32zizz25jyW8MnyMgD",
  "sk-9nzLscb3AbCS9ogtMQnX8xIZkkAvodRkzlgqe8cs7Cg6SdJU",
  "sk-463DGL3EyzunFDXZbIkXgJuNpFLeCL32zizz25jyW8MnyMgD"
];

// 转盘奖项配置
// weight: 权重值，数值越大中奖概率越高
export const PRIZE_SEGMENTS: PrizeSegment[] = [
  { 
    id: '1_shot', 
    label: '1次 极速生图', 
    type: 'key', 
    weight: 40, 
    color: '#0f172a', 
    textColor: '#94a3b8',
    description: '获得单次标准生成权限 (Studio/Batch)'
  },
  { 
    id: 'video_tut', 
    label: '大师级教程', 
    type: 'link', 
    weight: 35, 
    color: '#1e293b', 
    textColor: '#e2e8f0',
    url: 'https://aideator.top/', 
    description: '解锁进阶商业摄影光影课程'
  },
  { 
    id: '5_shot', 
    label: '5次 2K大图', 
    type: 'key', 
    weight: 5, 
    color: '#b45309', 
    textColor: '#ffffff',
    description: '获得5次高分辨率生成权限 (稀有大奖)'
  },
  { 
    id: 'guide_pdf', 
    label: '提示词手册', 
    type: 'link', 
    weight: 25, 
    color: '#334155', 
    textColor: '#cbd5e1',
    url: 'https://aideator.top/', 
    description: '下载万象智造独家提示词PDF'
  },
  { 
    id: '2_shot', 
    label: '2次 极速生图', 
    type: 'key', 
    weight: 20, 
    color: '#1e293b', 
    textColor: '#94a3b8',
    description: '获得双倍标准生成权限'
  },
  { 
    id: 'vip_day', 
    label: 'VIP 体验卡', 
    type: 'key', 
    weight: 1, 
    color: '#f59e0b', 
    textColor: '#ffffff',
    description: '获得24小时无限生成权限 (传说级)'
  }
];
