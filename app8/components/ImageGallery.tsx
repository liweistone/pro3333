import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { Download, Maximize2, X, Copy, ExternalLink, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

interface ImageGalleryProps {
  items: GeneratedImage[];
  onRetry: (item: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, onRetry }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
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
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">生成中断</p>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed px-4 break-words">
                    {item.error || '内容触发安全审查或网络超时'}
                  </p>
                  <button
                    onClick={() => onRetry(item)}
                    className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    重新尝试
                  </button>
                </div>
              )}
              
              {item.status === 'succeeded' && item.url && (
                <>
                  <img 
                    src={item.url} 
                    alt={item.prompt} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                    loading="lazy"
                    onClick={() => setPreviewItem(item)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setPreviewItem(item)}
                      className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                      title="查看大图"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
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
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col bg-white">
              <p className="text-xs text-slate-600 line-clamp-2 font-medium flex-1 italic leading-relaxed cursor-pointer hover:text-blue-600" onClick={() => item.status === 'succeeded' && setPreviewItem(item)}>
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

      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setPreviewItem(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewItem(null)} 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md z-50 group"
            >
              <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <img 
              src={previewItem.url!} 
              alt={previewItem.prompt} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />

            <div className="mt-8 flex items-center gap-4 px-6 py-3 bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => handleDownload(previewItem)}
                disabled={downloadingId === previewItem.id}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {downloadingId === previewItem.id ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <Download className="w-4 h-4" />
                )}
                <span>{downloadingId === previewItem.id ? '下载中...' : '下载原图'}</span>
              </button>

              <div className="w-px h-6 bg-white/10 mx-2"></div>

              <button 
                onClick={() => handleCopyPrompt(previewItem.prompt)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white/90 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制' : '复制提示词'}</span>
              </button>

              <button 
                onClick={() => window.open(previewItem.url!, '_blank')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white/90 hover:text-white rounded-xl text-sm font-medium transition-all"
                title="新窗口打开"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;