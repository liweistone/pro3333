
import React, { useState, useEffect } from 'react';
import { initializePresetService, getPresetService } from '../services/presetService';

// Define Fetcher locally to ensure compilation without global types
type Fetcher = {
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

interface CloudflareEnv {
  CLOUDFLARE_WEBSITE: Fetcher;
}

interface PresetMainProps {
  env?: CloudflareEnv;
}

const PresetMain: React.FC<PresetMainProps> = ({ env }) => {
  const [categories, setCategories] = useState<{ [key: string]: string }>({});
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'presets'>('categories');

  useEffect(() => {
    // 初始化预设服务
    initializePresetService(env);
    loadInitialData();
  }, [env]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 加载分类
      const presetService = getPresetService();
      const categoriesData = await presetService.getCategories();
      setCategories(categoriesData);
      
      // 加载预设列表
      const presetsData = await presetService.getPresetList();
      setPresets(presetsData.presets || presetsData.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">错误: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={loadInitialData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">预设管理系统</h1>
      
      {/* Tab 切换 */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'categories' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('categories')}
        >
          预设分类
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'presets' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('presets')}
        >
          预设列表
        </button>
      </div>

      {/* 分类展示 */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([id, name]) => (
            <div 
              key={id} 
              className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-800">{name}</h3>
              <p className="text-sm text-gray-500 mt-1">ID: {id}</p>
            </div>
          ))}
        </div>
      )}

      {/* 预设列表展示 */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <div 
              key={preset.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {preset.image && (
                <img 
                  src={preset.image.startsWith('http') ? preset.image : `https://cloudflare-website.liwei791214.workers.dev${preset.image}`} 
                  alt={preset.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/400x300?text=No+Image';
                  }}
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 truncate">{preset.title}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{preset.description}</p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {categories[preset.category_id] || preset.category_id || '未知分类'}
                  </span>
                  <span className="text-xs text-gray-500">
                    使用: {preset.use_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(categories).length === 0 && activeTab === 'categories' && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无分类数据</p>
        </div>
      )}

      {presets.length === 0 && activeTab === 'presets' && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无预设数据</p>
        </div>
      )}
    </div>
  );
};

export default PresetMain;
