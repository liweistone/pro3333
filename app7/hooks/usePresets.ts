// app7/hooks/usePresets.ts
import { useState, useEffect, useCallback } from 'react';
import { getPresetService, initializePresetService } from '../services/presetService';
import { 
  PresetCategory, 
  PresetItem, 
  PresetDetail, 
  PresetListResponse, 
  PresetSearchParams 
} from '../types/presetTypes';

interface UsePresetsOptions {
  autoLoad?: boolean;
  initialPage?: number;
  initialLimit?: number;
}

export const usePresets = (options: UsePresetsOptions = {}) => {
  const { autoLoad = true, initialPage = 1, initialLimit = 20 } = options;
  
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [currentPreset, setCurrentPreset] = useState<PresetDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    total: 0,
    limit: initialLimit
  });

  // 初始化服务
  useEffect(() => {
    try {
      initializePresetService();
    } catch (err) {
      console.error('初始化预设服务失败:', err);
    }
  }, []);

  // 加载分类
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const service = getPresetService();
      const categoriesData = await service.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载分类失败';
      setError(errorMessage);
      console.error('加载预设分类失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载预设列表
  const loadPresets = useCallback(async (params?: PresetSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const service = getPresetService();
      const response = await service.getPresetList({
        ...params,
        page: params?.page || pagination.currentPage,
        limit: params?.limit || pagination.limit
      });
      
      setPresets(response.presets);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
        limit: response.pagination.limit
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载预设失败';
      setError(errorMessage);
      console.error('加载预设列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  // 搜索预设
  const searchPresets = useCallback(async (searchTerm: string, params?: Omit<PresetSearchParams, 'search'>) => {
    try {
      setLoading(true);
      setError(null);
      const service = getPresetService();
      const response = await service.searchPresets(searchTerm, params);
      
      setPresets(response.presets);
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
        limit: response.pagination.limit
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索预设失败';
      setError(errorMessage);
      console.error('搜索预设失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载预设详情
  const loadPresetDetail = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const service = getPresetService();
      const detail = await service.getPresetDetail(id);
      setCurrentPreset(detail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载预设详情失败';
      setError(errorMessage);
      console.error('加载预设详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取分类下的预设
  const loadPresetsByCategory = useCallback(async (categoryId: string, page?: number, limit?: number) => {
    await loadPresets({ category_id: categoryId, page, limit });
  }, [loadPresets]);

  // 切换分页
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    loadPresets({ page: newPage, limit: pagination.limit });
  }, [loadPresets, pagination.limit]);

  // 切换每页数量
  const changeLimit = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
    loadPresets({ page: 1, limit: newLimit });
  }, [loadPresets]);

  // 收藏预设
  const favoritePreset = useCallback(async (id: string, token: string) => {
    try {
      const service = getPresetService();
      await service.favoritePreset(id, token);
      
      // 更新本地状态
      setPresets(prev => prev.map(p => 
        p.id === id ? { ...p, favorite_count: p.favorite_count + 1, is_favorited: true } : p
      ));
      
      if (currentPreset && currentPreset.id === id) {
        setCurrentPreset({ ...currentPreset, favorite_count: currentPreset.favorite_count + 1, is_favorited: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '收藏失败';
      setError(errorMessage);
      console.error('收藏预设失败:', err);
    }
  }, [currentPreset]);

  // 取消收藏预设
  const unfavoritePreset = useCallback(async (id: string, token: string) => {
    try {
      const service = getPresetService();
      await service.unfavoritePreset(id, token);
      
      // 更新本地状态
      setPresets(prev => prev.map(p => 
        p.id === id ? { ...p, favorite_count: Math.max(0, p.favorite_count - 1), is_favorited: false } : p
      ));
      
      if (currentPreset && currentPreset.id === id) {
        setCurrentPreset({ ...currentPreset, favorite_count: Math.max(0, currentPreset.favorite_count - 1), is_favorited: false });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消收藏失败';
      setError(errorMessage);
      console.error('取消收藏预设失败:', err);
    }
  }, [currentPreset]);

  // 记录预设使用
  const recordPresetUse = useCallback(async (id: string) => {
    try {
      const service = getPresetService();
      await service.recordPresetUse(id);
    } catch (err) {
      console.error('记录预设使用失败:', err);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    if (autoLoad) {
      loadCategories();
      loadPresets();
    }
  }, [autoLoad, loadCategories, loadPresets]);

  return {
    categories,
    presets,
    currentPreset,
    loading,
    error,
    pagination,
    loadCategories,
    loadPresets,
    searchPresets,
    loadPresetDetail,
    loadPresetsByCategory,
    changePage,
    changeLimit,
    favoritePreset,
    unfavoritePreset,
    recordPresetUse
  };
};