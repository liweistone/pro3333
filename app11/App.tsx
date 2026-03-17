import React, { useState, useEffect, useRef } from 'react';
import { generatePlan } from './geminiService';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, AppResponse } from './types';
import { createGenerationTask, checkTaskStatus } from './geminiService';
import ImageGallery from './components/ImageGallery';
import { 
  Upload, Send, Image as ImageIcon, Zap,
  ChevronRight, Loader2, Copy, CheckCircle2, Download, 
  ArrowRightLeft, Calendar, Sparkles, Play, PlusCircle, Palette, Box
} from 'lucide-react';

const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (旗舰版)' },
  { id: 'gemini-3-pro-image-preview-vip', name: 'Gemini 3 Pro Image VIP (高优先级)' }
];

const App: React.FC = () => {
  const [specs, setSpecs] = useState('');
  const [analysisImages, setAnalysisImages] = useState<string[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AppResponse | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'analysis' | 'prompts'>('analysis');
  const [activePromptSubTab, setActivePromptSubTab] = useState<'pain' | 'scenario' | 'holiday'>('holiday');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新增：海报风格状态
  const [posterStyle, setPosterStyle] = useState<'scroll' | 'c4d'>('scroll');

  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'generation'>('analysis');
  
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const MAX_DIM = 1200;
          if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
          else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context failed');
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 680000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
      };
    });
  };

  const handleSyncPrompts = (newPrompts: string[], statusId?: string) => {
    if (!newPrompts.length) return;
    if (statusId) {
      setSyncStatus(statusId);
      setTimeout(() => setSyncStatus(null), 2000);
    }
    setPromptsText(prev => {
      const current = prev.trim();
      const added = newPrompts.join('\n');
      return current ? `${current}\n${added}` : added;
    });
    setCurrentStep('generation');
  };

  const handleStartGeneration = async (rawText: string) => {
    const prompts = rawText.split('\n').filter(p => p.trim());
    if (!prompts.length) { alert('待办列表为空'); return; }
    setIsGenerating(true);

    const newItems: GeneratedImage[] = prompts.map((p, i) => ({ 
      id: `${Date.now()}-${i}`, 
      prompt: p, 
      url: null, 
      progress: 0, 
      status: 'pending' as const,
      aspectRatio: config.aspectRatio // 记录当前比例
    }));
    
    setResults(prev => [...newItems, ...prev]);

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, analysisImages.slice(0, 1));
        setResults(prev => prev.map(it => it.id === item.id ? { ...it, taskId, status: 'running', progress: 5 } : it));
        
        const poll = setInterval(async () => {
          try {
            const data = await checkTaskStatus(taskId);
            if (data.status === 'succeeded') {
              setResults(prev => prev.map(it => it.id === item.id ? { ...it, url: data.results![0].url, status: 'succeeded', progress: 100 } : it));
              clearInterval(poll);
            } else if (data.status === 'failed') {
              setResults(prev => prev.map(it => it.id === item.id ? { ...it, status: 'failed', error: data.failure_reason || data.error } : it));
              clearInterval(poll);
            } else {
              setResults(prev => prev.map(it => it.id === item.id ? { ...it, progress: data.progress || 10 } : it));
            }
          } catch (e) {
            clearInterval(poll);
          }
        }, 3000);
      } catch (e) {
        setResults(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error' } : it));
      }
    }
    setIsGenerating(false);
  };

  const handleAnalysisSubmit = async () => {
    if (!specs.trim()) { alert('请提供产品参数或说明书内容'); return; }
    setAnalysisLoading(true);
    try {
      const data = await generatePlan(specs, analysisImages, posterStyle);
      setAnalysisResult(data);
      setActiveAnalysisTab('prompts');
      setActivePromptSubTab('holiday');
    } catch (error: any) {
      alert(error.message || '生成方案失败，请稍后重试');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const syncAllPlan = () => {
    if (!analysisResult) return;
    const allPrompts: string[] = [];
    // 增加可选链保护
    analysisResult.painPointPrompts?.prompts?.forEach(p => allPrompts.push(p.fullPrompt));
    analysisResult.scenarioPrompts?.forEach(s => s.prompts?.forEach(p => allPrompts.push(p.fullPrompt)));
    analysisResult.holidayPrompts?.forEach(h => h.prompts?.forEach(p => allPrompts.push(p.fullPrompt)));
    handleSyncPrompts(allPrompts);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg shadow-red-100 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">
              2026马年·电商视觉-拜年海报生成器
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 animate-pulse uppercase tracking-widest">
              Unified Vision Engine
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-8 flex items-center justify-center gap-4">
          <button 
            onClick={() => setCurrentStep('analysis')}
            className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${currentStep === 'analysis' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-red-200'}`}
          >
            <Calendar className="w-5 h-5" /> 节日营销策划
          </button>
          <div className="w-8 h-px bg-slate-200"></div>
          <button 
            onClick={() => setCurrentStep('generation')}
            className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${currentStep === 'generation' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-red-200'}`}
          >
            <ImageIcon className="w-5 h-5" /> 批量海报生成
          </button>
        </div>

        {currentStep === 'analysis' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
                <h2 className="font-bold flex items-center gap-2 text-slate-800">产品画像输入</h2>
                <div className="space-y-4">
                  <div className="min-h-[140px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-red-300 transition-all overflow-hidden p-2" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" hidden ref={fileInputRef} multiple onChange={async (e) => {
                      if(e.target.files) {
                        const filesArray = Array.from(e.target.files) as File[];
                        const urls = await Promise.all(filesArray.map(f => compressImage(f)));
                        setAnalysisImages(prev => [...prev, ...urls]);
                      }
                    }} />
                    {analysisImages.length === 0 ? <><Upload className="w-8 h-8 text-slate-300 mb-2" /><span className="text-xs text-slate-400 font-medium">点击上传产品细节图</span></> : 
                      <div className="grid grid-cols-4 gap-2 w-full">{analysisImages.map((u, i) => <img key={i} src={u} className="aspect-square object-cover rounded-lg ring-1 ring-slate-100 shadow-sm" />)}</div>
                    }
                  </div>
                  <textarea 
                    value={specs} onChange={(e) => setSpecs(e.target.value)} 
                    placeholder="请输入产品名称、主要卖点或品牌故事..." 
                    className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 text-sm outline-none resize-none leading-relaxed"
                  />
                  
                  {/* 风格选择区域 */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500">海报视觉风格模版</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPosterStyle('scroll')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${posterStyle === 'scroll' ? 'border-red-500 bg-red-50' : 'border-slate-100 hover:border-red-200'}`}
                      >
                         <div className="flex items-center gap-2 mb-1 text-red-600">
                           <Palette className="w-4 h-4" />
                           <span className="text-xs font-bold">金马国潮卷轴</span>
                         </div>
                         <p className="text-[10px] text-slate-500 leading-tight">气势磅礴 · 张旭草书 · 红金山水背景</p>
                      </div>

                      <div 
                        onClick={() => setPosterStyle('c4d')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${posterStyle === 'c4d' ? 'border-red-500 bg-red-50' : 'border-slate-100 hover:border-red-200'}`}
                      >
                         <div className="flex items-center gap-2 mb-1 text-red-600">
                           <Box className="w-4 h-4" />
                           <span className="text-xs font-bold">C4D新春大促</span>
                         </div>
                         <p className="text-[10px] text-slate-500 leading-tight">立体展台 · 节日礼赠 · 电商促销氛围</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleAnalysisSubmit} disabled={analysisLoading} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 group">
                    {analysisLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>立即生成马年海报全案 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              {!analysisResult ? (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 p-12 bg-white/50">
                   <Sparkles className="w-16 h-16 mb-4 opacity-10" />
                   <p className="font-bold">输入产品信息，由旗舰级引擎为您深度策划</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-2">
                    <button onClick={() => setActiveAnalysisTab('prompts')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeAnalysisTab === 'prompts' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>拜年海报库</button>
                    <button onClick={() => setActiveAnalysisTab('analysis')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeAnalysisTab === 'analysis' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>市场深度分析</button>
                  </div>

                  {activeAnalysisTab === 'analysis' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold flex items-center gap-2 text-slate-800"><div className="w-1.5 h-6 bg-red-600 rounded-full" />市场分析报告</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-wider">马年核心卖点 (USP)</p>
                                {/* 增加空值保护 */}
                                <ul className="text-sm space-y-1.5 font-medium text-slate-700">
                                    {(analysisResult.analysis?.differentiation || []).map((d, i) => <li key={i} className="flex gap-2"><span>🏮</span>{d}</li>)}
                                </ul>
                              </div>
                              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                                <p className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-wider">情感价值主张</p>
                                <p className="text-sm font-bold text-red-900 leading-relaxed">{analysisResult.analysis?.emotionalValue}</p>
                              </div>
                           </div>
                           <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl">
                              <p className="text-[10px] font-bold text-amber-400 mb-3 uppercase tracking-wider">新媒体爆破点</p>
                              <p className="text-sm leading-relaxed mb-6 opacity-90">{analysisResult.analysis?.newMediaPlan?.content}</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] bg-white/10 p-2 rounded-lg">
                                  <span className="text-amber-400 font-bold">策略：</span> {analysisResult.analysis?.newMediaPlan?.strategy}
                                </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                       <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                          <button onClick={() => setActivePromptSubTab('holiday')} className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activePromptSubTab === 'holiday' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>🧧 春节日历专项</button>
                          <button onClick={() => setActivePromptSubTab('pain')} className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activePromptSubTab === 'pain' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>痛点突破策划</button>
                          <button onClick={() => setActivePromptSubTab('scenario')} className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activePromptSubTab === 'scenario' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>场景营销方案</button>
                       </div>

                       <div className="grid md:grid-cols-2 gap-4">
                          {/* 核心修复：增加空值合并运算符 || []，防止数组未定义导致渲染崩溃 */}
                          {activePromptSubTab === 'pain' && (analysisResult.painPointPrompts?.prompts || []).map((p, i) => (
                            <PromptCard key={i} item={p} onCopy={() => setCopyStatus(`pain-${i}`)} isCopied={copyStatus === `pain-${i}`} onSync={() => handleSyncPrompts([p.fullPrompt], `pain-${i}`)} isSynced={syncStatus === `pain-${i}`} />
                          ))}
                          
                          {activePromptSubTab === 'scenario' && (analysisResult.scenarioPrompts || []).flatMap(s => s.prompts || []).map((p, i) => (
                            <PromptCard key={i} item={p} onCopy={() => setCopyStatus(`scenario-${i}`)} isCopied={copyStatus === `scenario-${i}`} onSync={() => handleSyncPrompts([p.fullPrompt], `scenario-${i}`)} isSynced={syncStatus === `scenario-${i}`} />
                          ))}
                          
                          {activePromptSubTab === 'holiday' && (analysisResult.holidayPrompts || []).map((h, hIdx) => (
                            <div key={hIdx} className="col-span-full space-y-4 pt-4 first:pt-0">
                               <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-black flex items-center gap-2 text-slate-800"><div className="w-1.5 h-4 bg-red-600 rounded-full" /> {h.dateName} · 拜年视觉策划</h4>
                                  <button 
                                    onClick={() => handleSyncPrompts((h.prompts || []).map(p => p.fullPrompt), `holiday-all-${hIdx}`)}
                                    className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    {syncStatus === `holiday-all-${hIdx}` ? <CheckCircle2 className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                                    同步今日全套 ({h.prompts?.length || 0}张)
                                  </button>
                               </div>
                               <div className="grid md:grid-cols-2 gap-4">
                                  {(h.prompts || []).map((p, i) => <PromptCard key={i} item={p} onCopy={() => setCopyStatus(`holiday-${hIdx}-${i}`)} isCopied={copyStatus === `holiday-${hIdx}-${i}`} onSync={() => handleSyncPrompts([p.fullPrompt], `holiday-${hIdx}-${i}`)} isSynced={syncStatus === `holiday-${hIdx}-${i}`} />)}
                               </div>
                            </div>
                          ))}
                       </div>
                       
                       <div className="pt-12 pb-16 flex justify-center">
                          <button onClick={syncAllPlan} className="px-12 py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl hover:bg-red-600 active:scale-95 transition-all flex items-center gap-3 group">
                             <Play className="w-5 h-5 group-hover:scale-125 transition-transform" /> 一键同步全案海报至生图列表
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-700">
            <aside className="w-full md:w-96 space-y-6">
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4 sticky top-24">
                  <h3 className="font-bold flex items-center gap-2 text-slate-800">生图引擎配置</h3>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">选择旗舰引擎</label>
                    <select value={config.model} onChange={(e) => setConfig({...config, model: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 outline-none text-sm font-bold focus:ring-2 focus:ring-red-500">
                      {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">比例</label>
                      <select value={config.aspectRatio} onChange={(e) => setConfig({...config, aspectRatio: e.target.value as any})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 outline-none text-xs font-bold">
                        {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">最高分辨率</label>
                      <select value={config.imageSize} onChange={(e) => setConfig({...config, imageSize: e.target.value as any})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 outline-none text-xs font-bold">
                        {Object.values(ImageSize).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-800">提示词待办 ({promptsText.split('\n').filter(p=>p.trim()).length})</span>
                      <button onClick={() => setPromptsText('')} className="text-[10px] text-red-500 font-bold hover:underline">清空列表</button>
                    </div>
                    <textarea value={promptsText} onChange={(e) => setPromptsText(e.target.value)} className="w-full h-52 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs leading-relaxed outline-none resize-none focus:ring-2 focus:ring-red-500" placeholder="策划生成的提示词将自动同步到这里..." />
                  </div>
                  <button onClick={() => handleStartGeneration(promptsText)} disabled={isGenerating} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-red-700 disabled:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                    {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 正在排队制作...</> : <><ImageIcon className="w-5 h-5" /> 立即批量生成 4K 海报</>}
                  </button>
               </div>
            </aside>
            <section className="flex-1">
               <div className="flex justify-between items-end mb-6">
                 <div><h2 className="text-2xl font-black text-slate-900">创作画廊</h2><p className="text-xs text-slate-400 font-medium mt-1">旗舰引擎实时反馈 4K 高保真输出成果</p></div>
                 <button onClick={() => setResults([])} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 hover:text-red-600 transition-all">清空画廊</button>
               </div>
               {results.length === 0 ? (
                 <div className="h-[600px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-200 bg-white/30">
                    <Sparkles className="w-20 h-20 mb-4 opacity-5" />
                    <p className="font-black text-lg">同步方案并开启批量生图，定制 2026 马年视觉大片</p>
                 </div>
               ) : <ImageGallery items={results} onRetry={() => {}} />}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

interface PromptCardProps {
  item: any;
  onCopy: () => void;
  isCopied: boolean;
  onSync: () => void;
  isSynced: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ item, onCopy, isCopied, onSync, isSynced }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-red-400 hover:shadow-lg transition-all group relative">
    <div className="flex justify-between items-start mb-3">
       <div className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-red-100">Premium</div>
       <h5 className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg ring-1 ring-slate-100">{item.planTitle}</h5>
    </div>
    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed mb-4 group-hover:line-clamp-none transition-all">{item.fullPrompt}</p>
    <div className="grid grid-cols-2 gap-2">
      <button 
        onClick={() => { navigator.clipboard.writeText(item.fullPrompt); onCopy(); }} 
        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
          isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
        }`}
      >
        {isCopied ? <><CheckCircle2 className="w-3.5 h-3.5" /> 已复制</> : <><Copy className="w-3.5 h-3.5" /> 复制内容</>}
      </button>
      <button 
        onClick={onSync}
        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
          isSynced ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isSynced ? <><CheckCircle2 className="w-3.5 h-3.5" /> 已同步</> : <><Zap className="w-3.5 h-3.5" /> 选定同步</>}
      </button>
    </div>
  </div>
);

export default App;