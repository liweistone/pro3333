
import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
  items: GeneratedImage[];
  onRetry: (item: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, onRetry }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (item: GeneratedImage) => {
    if (!item.url) return;
    setDownloadingId(item.id);
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = `grsai-${item.prompt.slice(0, 10).replace(/\s+/g, '-')}-${item.id.slice(-4)}.png`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, falling back to direct link:', error);
      window.open(item.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <div 
          key={item.id} 
          className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
        >
          <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
            {(item.status === 'pending' || item.status === 'running') && (
              <div className="relative flex flex-col items-center gap-4 w-full h-full px-8 text-center justify-center">
                {/* 背景显示参考图缩略图 */}
                {item.refThumbnail && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <img src={item.refThumbnail} alt="Ref Background" className="w-full h-full object-cover blur-[2px]" />
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {item.progress}%
                  </div>
                </div>
                
                <div className="w-full z-10">
                   <p className="text-xs font-bold text-slate-700 mb-1">
                     {item.status === 'pending' ? '初始化任务...' : 'AI 深度创作中...'}
                   </p>
                   <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                     <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                   </div>
                   <div className="mt-3 flex items-center justify-center gap-2">
                      {item.refThumbnail && (
                        <div className="w-6 h-6 rounded border border-blue-200 overflow-hidden">
                          <img src={item.refThumbnail} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 italic">ID: {item.taskId?.slice(0, 8) || 'Waiting...'}</p>
                   </div>
                </div>
              </div>
            )}
            
            {(item.status === 'error' || item.status === 'failed') && (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800">生成中断</p>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed px-4 break-words">
                  {item.error || '内容触发安全审查或网络超时'}
                </p>
                <button
                  onClick={() => onRetry(item)}
                  className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新尝试
                </button>
              </div>
            )}
            
            {item.status === 'succeeded' && item.url && (
              <>
                <img 
                  src={item.url} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={item.url} 
                    target="_blank"
                    className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                    title="查看高清原图"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item.id}
                    className={`p-3 bg-white text-slate-900 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                        downloadingId === item.id 
                        ? 'opacity-70 cursor-wait bg-slate-200' 
                        : 'hover:bg-indigo-600 hover:text-white'
                    }`}
                    title="保存到本地"
                  >
                    {downloadingId === item.id ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="p-4 flex-1 flex flex-col bg-white">
            <p className="text-xs text-slate-600 line-clamp-2 font-medium flex-1 italic leading-relaxed">
              "{item.prompt}"
            </p>
            {item.status === 'succeeded' && (
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                    已完成
                  </span>
                  {item.refThumbnail && (
                    <div className="w-4 h-4 rounded-sm overflow-hidden border border-slate-100 grayscale hover:grayscale-0 transition-all">
                      <img src={item.refThumbnail} className="w-full h-full object-cover" title="原始参考图" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">#{idx+1} NANO-PRO</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
