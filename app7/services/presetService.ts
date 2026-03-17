
import { Preset, PresetCategory } from '../types';

/**
 * 预设中心服务类
 */
export class PresetService {
  private productionURL = 'https://aideator.top';

  async fetchPresets(category: PresetCategory = PresetCategory.ALL, search?: string): Promise<Preset[]> {
    const apiPath = '/api/presets';
    const url = new URL(apiPath, window.location.origin);
    url.searchParams.append('category', category);
    if (search) url.searchParams.append('q', search);

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (data.results && Array.isArray(data.results)) return data.results;
        if (data.data && Array.isArray(data.data)) return data.data;
      }
      
      throw new Error(`API Status: ${response.status}`);

    } catch (e) {
      console.warn("本地 D1 代理不可用，尝试同步生产节点数据...");
      try {
        const fallbackUrl = new URL('/api/presets', this.productionURL);
        fallbackUrl.searchParams.append('category', category);
        if (search) fallbackUrl.searchParams.append('q', search);
        fallbackUrl.searchParams.append('limit', '40');

        const fallbackRes = await fetch(fallbackUrl.toString(), { mode: 'cors' });

        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const list = fbData.data || fbData.results || fbData;
          return Array.isArray(list) ? list : [];
        }
      } catch (inner) {
        console.error("数据链路完全中断");
      }
      return [];
    }
  }

  async saveToPrivate(preset: Preset): Promise<boolean> {
    try {
      const res = await fetch('/api/presets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: preset.id })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // 兼容旧接口的方法
  async getCategories(): Promise<{[key: string]: string}> {
    return {
      'product': '产品摄影',
      'portrait': '人像写真',
      'scene': '场景重构',
      'style': '艺术风格'
    };
  }

  async getPresetList(params?: any): Promise<any> {
    const list = await this.fetchPresets(params?.category_id || PresetCategory.ALL, params?.search);
    return { 
      presets: list,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: list.length,
        limit: list.length
      }
    };
  }

  async searchPresets(query: string, params?: any): Promise<any> {
    const list = await this.fetchPresets(params?.category_id || PresetCategory.ALL, query);
    return { 
      presets: list,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: list.length,
        limit: list.length
      }
    };
  }

  async getPresetDetail(id: string): Promise<any> {
    // 优先尝试本地代理
    const url = new URL(`/api/presets/${id}`, window.location.origin);
    try {
      const response = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      if (response.ok) return await response.json();
      
      // 降级到生产环境
      const fallbackUrl = new URL(`/api/presets/${id}`, this.productionURL);
      const fbRes = await fetch(fallbackUrl.toString(), { mode: 'cors' });
      if (fbRes.ok) return await fbRes.json();
      
      throw new Error("Preset not found");
    } catch (e) {
      // 如果没有找到，返回一个 mock 结构防止崩溃，或者抛出错误
      throw e;
    }
  }

  async favoritePreset(id: string, token: string): Promise<boolean> {
    try {
      // 暂时 mock
      return true;
    } catch (e) {
      return false;
    }
  }

  async unfavoritePreset(id: string, token: string): Promise<boolean> {
    try {
      return true;
    } catch (e) {
      return false;
    }
  }

  async recordPresetUse(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/presets/${id}/use`, { method: 'POST' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}

// 单例模式实现
let presetServiceInstance: PresetService | null = null;

export const initializePresetService = (env?: any) => {
  if (!presetServiceInstance) {
    presetServiceInstance = new PresetService();
  }
  return presetServiceInstance;
};

export const getPresetService = () => {
  if (!presetServiceInstance) {
    presetServiceInstance = new PresetService();
  }
  return presetServiceInstance;
};
