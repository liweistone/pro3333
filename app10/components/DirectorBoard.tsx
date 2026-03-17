
import React, { useRef } from 'react';
import { Upload, Camera, Aperture, Zap, Activity } from 'lucide-react';
import { VisualAnalysis } from '../types';

interface DirectorBoardProps {
  image: string | null;
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
  analysis: VisualAnalysis | null;
}

const DirectorBoard: React.FC<DirectorBoardProps> = ({ image, onUpload, isAnalyzing, analysis }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  return (
    <div className="bg-[#0f172a] border-r border-white/10 p-6 flex flex-col h-full overflow-y-auto w-80 shrink-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight uppercase">Vision Director</h1>
          <p className="text-[10px] text-rose-400 font-bold tracking-widest uppercase">万象视觉导演</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
          image ? 'border-rose-500/50' : 'border-white/20 hover:border-rose-500 hover:bg-white/5'
        }`}
      >
        {image ? (
          <>
            <img src={image} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4" /> 更换参考</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Upload className="w-8 h-8 opacity-50" />
            <span className="text-xs font-bold uppercase tracking-widest">上传参考图</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black text-rose-500 animate-pulse uppercase tracking-widest">正在解构视觉基因...</p>
          </div>
        )}
      </div>

      {/* Analysis Report (HUD Style) */}
      {analysis && (
        <div className="mt-8 space-y-6 animate-in slide-in-from-left duration-500">
          <div className="flex items-center gap-2 text-rose-500 border-b border-rose-500/20 pb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">视觉分析报告</span>
          </div>
          
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Style & Vibe</label>
              <div className="text-xs text-white font-medium bg-white/5 p-2 rounded border-l-2 border-rose-500">{analysis.style}</div>
            </div>
            
            <div className="group">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Lighting Key</label>
              <div className="text-xs text-white font-medium bg-white/5 p-2 rounded border-l-2 border-yellow-500">{analysis.lighting}</div>
            </div>

            <div className="group">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 block">Subject DNA</label>
              <div className="text-[10px] text-slate-300 italic bg-white/5 p-2 rounded leading-relaxed">{analysis.keyElements}</div>
            </div>
          </div>
        </div>
      )}

      {!image && !isAnalyzing && (
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-[10px] text-blue-300 leading-relaxed">
            <strong className="block mb-1 text-blue-200">💡 操作指南</strong>
            上传一张具有特定人物或产品特征的图片。AI 导演将提取其视觉基因，并自动生成 9 组不同运镜和构图的拍摄方案。
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectorBoard;
