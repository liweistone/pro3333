// app7/components/Presets/PresetList.tsx
import React from 'react';
import { PresetItem } from '../../types/presetTypes';

interface PresetListProps {
  presets: PresetItem[];
  loading?: boolean;
  error?: string | null;
  onPresetClick?: (preset: PresetItem) => void;
  onFavoriteToggle?: (preset: PresetItem, token: string) => void;
  token?: string;
}

const PresetList: React.FC<PresetListProps> = ({
  presets,
  loading,
  error,
  onPresetClick,
  onFavoriteToggle,
  token
}) => {
  if (loading) {
    return (
      <div className="preset-list-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preset-list-error">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className="preset-list-container">
      <div className="preset-grid">
        {presets.map(preset => (
          <div 
            key={preset.id} 
            className="preset-card"
            onClick={() => onPresetClick && onPresetClick(preset)}
          >
            {preset.image && (
              <div className="preset-image">
                <img src={preset.image} alt={preset.title} />
              </div>
            )}
            <div className="preset-info">
              <h3 className="preset-title">{preset.title}</h3>
              <p className="preset-description">{preset.description}</p>
              <div className="preset-meta">
                <span className="preset-stats">
                  <span>使用: {preset.use_count}</span>
                  <span>收藏: {preset.favorite_count}</span>
                  <span>查看: {preset.view_count}</span>
                </span>
              </div>
              {onFavoriteToggle && token && (
                <button 
                  className={`favorite-btn ${preset.is_favorited ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(preset, token);
                  }}
                >
                  {preset.is_favorited ? '★' : '☆'} {preset.is_favorited ? '已收藏' : '收藏'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {presets.length === 0 && (
        <div className="empty-state">
          <p>暂无预设数据</p>
        </div>
      )}
    </div>
  );
};

export default PresetList;