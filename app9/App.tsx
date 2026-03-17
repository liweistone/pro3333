
import React, { useState, useRef, useEffect } from 'react';
import { Video, Image as ImageIcon, UserCircle2, Accessibility, Sparkles, Plus, Loader2, LayoutGrid, MonitorPlay, Zap, Wand2, ArrowRight, CheckCircle2, Download, Maximize2, X, RefreshCcw, Trash2, Cpu, Lock } from 'lucide-react';
import { ImageAdapter } from '../services/adapters/imageAdapter';
import { VideoAdapter } from '../services/adapters/videoAdapter';

const imageAdapter = new ImageAdapter();
const videoAdapter = new VideoAdapter();

type TabType = 'video' | 'image' | 'human' | 'motion';
type ResolutionType = '1K' | '2K' | '4K';

interface App9LumiereStationProps {
  isModal?: boolean;
  prefillData?: { prompt: string; image: string } | null;
}

const App9LumiereStation: React.FC<App9LumiereStationProps> = ({ isModal, prefillData }) => {
  // 核心整改：默认 Tab 切换为 image
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [prompt, setPrompt] = useState('');
  
  const [imageRefs, setImageRefs] = useState<string[]>([]);
  const [fixedSlots, setFixedSlots] = useState<{ [key: string]: string | null }>({});
  
  const [resolution, setResolution] = useState<ResolutionType>('1K');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const tabs = [
    { id: 'video', label: '视频生成', icon: Video, color: 'text-blue-500' },
    { id: 'image', label: '图片生成', icon: ImageIcon, color: 'text-indigo-500' },
    { id: 'human', label: '数字人', icon: UserCircle2, color: 'text-purple-500' },
    { id: 'motion', label: '动作模仿', icon: Accessibility, color: 'text-cyan-500' },
  ];

  // Prefill Logic
  useEffect(() => {
    if (prefillData) {
      setActiveTab('image');
      setPrompt(prefillData.prompt);
      setImageRefs([prefillData.image]);
      setAspectRatio('1:1'); 
    }
  }, [prefillData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (activeTab === 'image') {
        setImageRefs(prev => [...prev, base64]);
      } else if (activeSlotId) {
        setFixedSlots(prev => ({ ...prev, [activeSlotId]: base64 }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImageRef = (index: number) => {
    setImageRefs(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumiere-output-${Date.now()}.${activeTab === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(resultUrl, '_blank');
    }
  };

  const startCreation = async () => {
    if (!prompt.trim() && (activeTab !== 'image' || imageRefs.length === 0)) return;
    setIsGenerating(true);
    setProgress(0);
    setResultUrl(null);

    try {
      if (activeTab === 'image') {
        const taskId = await imageAdapter.createGenerationTask(prompt, { 
          aspectRatio: aspectRatio,
          imageSize: resolution 
        }, imageRefs);
        monitorTask(taskId, 'image');
      } else {
        const refs = Object.values(fixedSlots).filter(v => !!v) as string[];
        const taskId = await videoAdapter.createVideoTask(prompt, { aspectRatio: aspectRatio }, refs);
        monitorTask(taskId, 'video');
      }
    } catch (e: any) {
      alert(`任务启动失败: ${e.message}`);
      setIsGenerating(false);
    }
  };

  const monitorTask = (taskId: string, type: 'image' | 'video') => {
    let currentProgress = 5;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 5) + 2;
      if (currentProgress >= 95) currentProgress = 95;
      setProgress(currentProgress);

      try {
        const res = type === 'image' 
          ? await imageAdapter.checkTaskStatus(taskId) 
          : await videoAdapter.checkVideoTaskStatus(taskId);

        if (res.status === 'succeeded' && res.results?.[0]?.url) {
          clearInterval(interval);
          setProgress(100);
          setResultUrl(res.results[0].url);
          setIsGenerating(false);
        } else if (res.status === 'failed') {
          clearInterval(interval);
          alert("任务执行失败，请检查提示词或素材");
          setIsGenerating(false);
        }
      } catch (e) { }
    }, 3000);
  };

  const renderImageSlots = () => {
    return (
      <div className="flex gap-4 flex-wrap max-w-[220px]">
        {imageRefs.map((src, idx) => (
          <div key={idx} className="relative w-24 h-24 rounded-2xl border-2 border-indigo-500 overflow-hidden group shadow-lg ring-4 ring-indigo-500/10 shrink-0">
            <img src={src} className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImageRef(idx)}
              className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600 z-10"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center cursor-pointer group shrink-0"
        >
          <Plus className="w-6 h-6 text-slate-400 group-hover:scale-110 group-hover:text-indigo-500 transition-all" />
          <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">添加素材</span>
        </div>
      </div>
    );
  };

  const renderFixedSlots = () => {
    const config: Record<string, { id: string; label: string; isAudio?: boolean }[]> = {
      video: [ { id: 'start', label: '首帧' }, { id: 'end', label: '尾帧' } ],
      human: [ { id: 'character', label: '角色底图' }, { id: 'voice', label: '克隆音频', isAudio: true } ],
      motion: [ { id: 'actor', label: '角色素材' }, { id: 'move', label: '参考动作' } ],
    };

    const currentSlots = config[activeTab] || [];

    return (
      <div className="flex gap-4 flex-col">
        {currentSlots.map(s => (
          <div 
            key={s.id} 
            onClick={() => { setActiveSlotId(s.id); fileInputRef.current?.click(); }}
            className={`w-24 h-24 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shrink-0 ${fixedSlots[s.id] ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}
          >
            {fixedSlots[s.id] ? (
              <div className="w-full h-full">
                {s.isAudio ? <div className="w-full h-full flex items-center justify-center"><Zap className="w-8 h-8 text-indigo-500" /></div> : <img src={fixedSlots[s.id]!} className="w-full h-full object-cover" />}
                <button onClick={(e) => { e.stopPropagation(); setFixedSlots(prev => ({ ...prev, [s.id]: null })); }} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 shadow-sm"><Trash2 className="w-3 h-3" /></button>
              </div>
            ) : (
              <>
                <Plus className="w-6 h-6 text-slate-400 group-hover:scale-110" />
                <span className="text-[10px] font-black text-slate-400 uppercase mt-1">{s.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center justify-center font-sans ${isModal ? 'bg-transparent p-0' : 'min-h-screen bg-slate-50 p-6'}`}>
      <div className="w-full max-w-6xl">
        
        <div className="flex items-end pl-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isLocked = tab.id !== 'image'; // 核心逻辑：非图片生成 Tab 锁死
            
            return (
              <button
                key={tab.id}
                disabled={isLocked || isGenerating}
                onClick={() => { 
                  if(isGenerating || isLocked) return;
                  setActiveTab(tab.id as TabType); 
                  setResultUrl(null); 
                  setProgress(0);
                }}
                className={`relative px-12 py-4 transition-all duration-500 font-black text-sm flex items-center gap-2 group tracking-tight 
                  ${isActive ? 'bg-white text-slate-900 rounded-t-[24px] z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]' : 'bg-slate-200/60 text-slate-400'} 
                  ${isLocked ? 'cursor-not-allowed opacity-40 grayscale' : 'hover:text-slate-600'}`}
                style={{
                  clipPath: isActive ? 'none' : 'polygon(8% 0, 100% 0, 92% 100%, 0% 100%)',
                  marginLeft: isActive ? '-12px' : '-24px',
                  marginRight: isActive ? '-12px' : '0',
                }}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <tab.icon className={`w-4 h-4 transition-colors ${isActive ? tab.color : 'text-slate-300'}`} />}
                {tab.label}
                {isLocked && <span className="absolute top-1 right-3 text-[7px] font-black uppercase text-slate-400 tracking-widest scale-75 opacity-70">Coming Soon</span>}
              </button>
            );
          })}
        </div>

        <div className={`bg-white rounded-[40px] rounded-tl-none ${isModal ? '' : 'shadow-[0_30px_120px_rgba(0,0,0,0.08)]'} p-10 flex flex-col gap-8 relative overflow-hidden border border-white`}>
          <div className="flex gap-10 items-stretch">
            {/* 素材插槽区 */}
            <div className="shrink-0 pt-2 border-r border-slate-50 pr-8">
              {activeTab === 'image' ? renderImageSlots() : renderFixedSlots()}
            </div>

            {/* 提示词输入区：大幅加高至 520px */}
            <div className="flex-1 min-h-[520px] relative flex flex-col">
               <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  placeholder={activeTab === 'image' ? '输入绘图提示词，或留空基于上方素材进行风格一致性重构...' : '当前功能正在内部测试中，敬请期待...'}
                  className="w-full flex-1 text-lg font-bold text-slate-800 placeholder:text-slate-200 outline-none resize-none bg-transparent leading-relaxed"
               />
               
               {/* 徽章改为右下角静态，不再遮挡文字 */}
               <div className="self-end mt-4 flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">智造重构引擎已就绪</span>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex items-center px-4 py-2 gap-2 border-r border-slate-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        {activeTab === 'image' ? 'Gemini 3 Pro Image' : 'Lumiere Station v4.5'}
                      </span>
                    </div>

                    {activeTab === 'image' && (
                      <select value={resolution} onChange={(e) => setResolution(e.target.value as ResolutionType)} className="bg-transparent text-[10px] font-black text-slate-500 px-4 outline-none cursor-pointer hover:text-indigo-600 transition-colors">
                        <option value="1K">1K 分辨率</option>
                        <option value="2K">2K 旗舰画质</option>
                        <option value="4K">4K 极致输出</option>
                      </select>
                    )}

                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-500 px-4 outline-none cursor-pointer hover:text-indigo-600 transition-colors">
                      <option value="16:9">16:9 宽幅</option>
                      <option value="9:16">9:16 竖屏</option>
                      <option value="1:1">1:1 正方</option>
                      <option value="3:4">3:4 标准</option>
                    </select>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button title="灵感增强" className="p-3 bg-slate-50 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-400 transition-all shadow-sm border border-transparent hover:border-slate-100"><Zap className="w-4 h-4" /></button>
                    <button title="智能修图" className="p-3 bg-slate-50 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-400 transition-all shadow-sm border border-transparent hover:border-slate-100"><Wand2 className="w-4 h-4" /></button>
                 </div>
              </div>

              <button 
                onClick={startCreation}
                disabled={isGenerating || (!prompt.trim() && imageRefs.length === 0)}
                className={`px-16 py-5 rounded-[24px] font-black text-sm transition-all shadow-2xl flex items-center gap-3 active:scale-95 group relative overflow-hidden ${isGenerating ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-black text-white hover:shadow-black/20'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>执行中 {progress}%</span>
                  </>
                ) : (
                  <>
                    <span>启动极光智造</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {isGenerating && (
              <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden relative">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {resultUrl && !isGenerating && (
          <div className="mt-10 grid md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 px-2">
            <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-8 flex items-center gap-3">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" /> 智造成品预览 (Rendered)
              </p>
              <div className="bg-white rounded-[48px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-8 border-white aspect-video relative group ring-1 ring-slate-100">
                {activeTab === 'video' ? (
                  <video src={resultUrl} className="w-full h-full object-cover" autoPlay loop muted controls />
                ) : (
                  <img src={resultUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-[3px]">
                  <button 
                    onClick={() => setIsPreviewOpen(true)}
                    className="bg-white p-5 rounded-full hover:scale-110 transition-transform shadow-2xl"
                  >
                    <Maximize2 className="w-7 h-7 text-slate-900" />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="bg-white p-5 rounded-full hover:scale-110 transition-transform shadow-2xl"
                  >
                    <Download className="w-7 h-7 text-slate-900" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center gap-8 p-12 bg-white rounded-[48px] shadow-sm border border-slate-100">
               <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 self-start">
                 <CheckCircle2 className="w-3.5 h-3.5" /> 引擎交付完毕
               </div>
               <h3 className="text-4xl font-black text-slate-900 leading-tight">您的视觉资产<br/>已就绪</h3>
               <p className="text-slate-500 font-medium leading-relaxed text-sm">
                 基于 "{prompt || '提供的视觉素材'}" 的创作任务已由旗舰级引擎完成高精度处理。
               </p>
               
               <div className="pt-4 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => alert("资产已同步至云端工作站 (Simulation)")}
                    className="bg-slate-900 text-white py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                  >
                    <MonitorPlay className="w-5 h-5" /> 导出至资产库
                  </button>
                  <button 
                    onClick={() => {setResultUrl(null); setProgress(0); setImageRefs([]); setFixedSlots({}); setPrompt('');}} 
                    className="px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-slate-400 font-black text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95"
                  >
                    开启新创作
                  </button>
               </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Lightbox Preview */}
      {isPreviewOpen && resultUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-12 animate-in fade-in duration-300" onClick={() => setIsPreviewOpen(false)}>
          <button className="absolute top-10 right-10 text-white/50 hover:text-white p-4 transition-colors">
            <X className="w-10 h-10" />
          </button>
          <div className="relative max-w-full max-h-full shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
            {activeTab === 'video' ? (
              <video src={resultUrl} className="max-w-full max-h-[85vh] object-contain" autoPlay loop muted controls />
            ) : (
              <img src={resultUrl} className="max-w-full max-h-[85vh] object-contain" />
            )}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <button 
                onClick={handleDownload}
                className="px-10 py-4 bg-white text-slate-900 rounded-full font-black text-sm flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl"
              >
                <Download className="w-5 h-5" /> 立即保存作品
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      
      {!isModal && (
        <div className="mt-20 opacity-20 flex items-center gap-4">
           <div className="w-16 h-px bg-slate-400"></div>
           <span className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-600">Lumiere Station Pro V5</span>
           <div className="w-16 h-px bg-slate-400"></div>
        </div>
      )}
    </div>
  );
};

export default App9LumiereStation;
