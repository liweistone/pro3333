
import React, { useState, useRef, useEffect } from 'react';
import { LumiService } from './services/lumiService';
import { LumiStep, LumiAnalysisResult, LumiTaskState, LumiConfig } from './types';
import { Upload, Zap, Sparkles, LayoutPanelLeft, Play, Image as ImageIcon, Video, Loader2, ArrowRight, ShieldCheck, Cpu, Download, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

const lumiService = new LumiService();

const App6LumiFluxApp: React.FC = () => {
  const [step, setStep] = useState<LumiStep>(LumiStep.UPLOAD);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('在吸尘器电机位置添加橙色核心流光，底座刷头添加蓝色扫描光效');
  
  const [analysis, setAnalysis] = useState<LumiAnalysisResult | null>(null);
  const [tasks, setTasks] = useState<{ image?: LumiTaskState; video?: LumiTaskState }>({});
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setStep(LumiStep.UPLOAD);
      setAnalysis(null);
      setErrorMsg(null);
      setStatusText("");
      setTasks({});
    }
  };

  // 启动产品 DNA 拓扑分析
  const startAnalysis = async () => {
    if (!originalFile) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusText("视觉导演正在扫描产品 DNA...");
    try {
      const result = await lumiService.analyzeProduct(originalFile, instruction);
      setAnalysis(result);
      setStep(LumiStep.ANALYSIS);
      setStatusText("视觉剧本已生成，您可以手动微调下方剧本文字");
    } catch (e: any) {
      setErrorMsg(`分析失败: ${e.message}`);
      setStatusText("分析过程异常");
    } finally {
      setLoading(false);
    }
  };

  // 启动高保真渲染（读取文本框最新内容）
  const startRendering = async () => {
    if (!analysis || !originalFile) return;
    setLoading(true);
    setErrorMsg(null);
    setStep(LumiStep.RENDERING);
    setStatusText("正在启动高保真智造引擎...");
    
    try {
      // 关键逻辑：将当前文本框中的文字（analysis.reasoning）作为最新的视觉指令发送给绘图引擎
      const imageTaskId = await lumiService.generateAnchorImage(analysis.reasoning, originalFile);
      setTasks(prev => ({
        ...prev,
        image: { id: imageTaskId, type: 'image', status: 'pending', progress: 5 }
      }));

      pollTask(imageTaskId, 'image', async (finalImageUrl) => {
          setStatusText("静态视觉锚点已就绪，正在渲染动态流光视频...");
          try {
            const videoTaskId = await lumiService.generateLumiVideo(analysis.videoPrompt, finalImageUrl, { aspectRatio: "1:1", resolution: "1080p" });
            setTasks(prev => ({
              ...prev,
              video: { id: videoTaskId, type: 'video', status: 'pending', progress: 5 }
            }));
            pollTask(videoTaskId, 'video');
          } catch (vErr: any) {
            setErrorMsg(`视频启动异常: ${vErr.message}`);
            setLoading(false);
          }
      });

    } catch (e: any) {
      setErrorMsg(`渲染启动失败: ${e.message}`);
      setLoading(false);
    }
  };

  // 轮询任务进度
  const pollTask = (id: string, type: 'image' | 'video', onSucceed?: (url: string) => void) => {
    const interval = setInterval(async () => {
      try {
        const res = await lumiService.pollStatus(id, type);
        const currentStatus = res.status?.toLowerCase();
        
        setTasks(prev => ({
          ...prev,
          [type]: { 
            ...prev[type as keyof typeof prev], 
            status: (currentStatus === 'completed' || currentStatus === 'succeeded') ? 'succeeded' : (currentStatus === 'failed' || currentStatus === 'error') ? 'failed' : 'running', 
            progress: res.progress || 10, 
            resultUrl: res.url 
          }
        }));

        if ((currentStatus === 'completed' || currentStatus === 'succeeded') && res.url) {
          clearInterval(interval);
          if (onSucceed) onSucceed(res.url);
          if (type === 'video') {
            setLoading(false);
            setStep(LumiStep.COMPLETE);
            setStatusText("全部智造任务已完成");
          }
        } else if (currentStatus === 'failed' || currentStatus === 'error') {
          clearInterval(interval);
          setLoading(false);
          setErrorMsg(`${type === 'image' ? '静态图' : '视频'}引擎执行中断，请检查 API 状态`);
        }
      } catch (e: any) {
        // 静默重试
      }
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100 font-sans selection:bg-cyan-500/30">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">流光智造 <span className="text-cyan-400">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">企业级视觉智造系统</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/10">
             <div className={`w-1.5 h-1.5 ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} rounded-full`}></div>
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{loading ? '引擎运行中' : '系统就绪'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 lg:p-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 border border-white/10 rounded-[40px] p-10 space-y-10 backdrop-blur-xl relative">
              <div className="space-y-2">
                <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-3">
                  <Cpu className="w-4 h-4" /> 产品素材获取
                </h2>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[4/3] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${originalUrl ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/50 hover:bg-white/5'}`}
              >
                {originalUrl ? (
                  <img src={originalUrl} className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/10">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">点击或拖拽上传产品图</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">视觉引导指令</label>
                <textarea 
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="例如：在底部增加蓝色流光，强化金属质感..."
                  className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-5 text-sm font-medium focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700 leading-relaxed"
                />
              </div>

              <div className="pt-4 space-y-4">
                {step === LumiStep.UPLOAD ? (
                  <button 
                    onClick={startAnalysis}
                    disabled={!originalFile || loading}
                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-[24px] shadow-[0_20px_40px_rgba(6,182,212,0.2)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> 启动拓扑分析</>}
                  </button>
                ) : (
                  <button 
                    onClick={startRendering}
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-[24px] shadow-[0_20px_40px_rgba(37,99,235,0.2)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" fill="white" /> 启动高保真智造</>}
                  </button>
                )}

                {errorMsg && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 animate-in shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">任务执行失败</p>
                      <p className="text-[11px] text-rose-200/70 leading-relaxed">{errorMsg}</p>
                      <button onClick={() => setErrorMsg(null)} className="text-[9px] text-rose-400 underline mt-2">点击关闭并重试</button>
                    </div>
                  </div>
                )}
              </div>

              {analysis && (
                <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl space-y-3 animate-in fade-in">
                  <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> 导演视觉剧本 (可编辑)
                  </h4>
                  <textarea
                    value={analysis.reasoning}
                    onChange={(e) => setAnalysis({ ...analysis, reasoning: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xs text-cyan-100/70 leading-relaxed italic resize-none min-h-[140px] scrollbar-hide border-b border-cyan-500/10 focus:border-cyan-500/30 transition-all"
                    placeholder="在这里修改 AI 的分析见解..."
                  />
                  <p className="text-[9px] text-cyan-500/50 text-right uppercase">渲染将以剧本文字为准</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧展示区域 */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-slate-900/40 border border-white/10 rounded-[40px] p-8 flex-1 flex flex-col min-h-[700px] overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                  <button onClick={() => setActiveTab('image')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'image' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>视觉锚点图</button>
                  <button onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'video' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>动态智造视频</button>
                </div>
                {statusText && !errorMsg && (
                  <span className="text-[10px] font-black text-cyan-400 animate-pulse">{statusText}</span>
                )}
              </div>

              <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">原始参考素材</span>
                  <div className="aspect-square rounded-[32px] bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl relative">
                    {originalUrl ? <img src={originalUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-12 h-12 text-slate-800" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-cyan-500/80 uppercase tracking-widest ml-2">AI 流光智造成品</span>
                  <div className="aspect-square rounded-[32px] bg-black/60 border border-cyan-500/10 flex items-center justify-center overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group">
                    {activeTab === 'image' ? (
                      tasks.image?.resultUrl ? (
                        <img src={tasks.image.resultUrl} className="w-full h-full object-contain animate-in zoom-in" />
                      ) : tasks.image?.status === 'running' || tasks.image?.status === 'pending' ? (
                        <div className="text-center space-y-4">
                           <div className="w-16 h-16 border-[5px] border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
                           <p className="text-2xl font-black tabular-nums text-cyan-400">{tasks.image.progress}%</p>
                           <p className="text-[10px] text-slate-500">正在生成静态锚点图...</p>
                        </div>
                      ) : (
                        <div className="text-center opacity-20"><ImageIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase">等待静态渲染</p></div>
                      )
                    ) : (
                      tasks.video?.resultUrl ? (
                        <video src={tasks.video.resultUrl} className="w-full h-full object-contain" autoPlay loop muted controls />
                      ) : tasks.video?.status === 'running' || tasks.video?.status === 'pending' ? (
                        <div className="text-center space-y-4">
                           <div className="w-16 h-16 border-[5px] border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                           <p className="text-2xl font-black tabular-nums text-blue-400">{tasks.video.progress}%</p>
                           <p className="text-[10px] text-slate-500">正在进行动态流光合成...</p>
                        </div>
                      ) : (
                        <div className="text-center opacity-20"><Video className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase">等待动态模拟</p></div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* 智造步骤可视化 */}
              <div className="mt-auto pt-12 border-t border-white/5">
                <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
                  {[
                    { id: LumiStep.UPLOAD, label: '结构注入', icon: Cpu },
                    { id: LumiStep.ANALYSIS, label: '视觉剧本', icon: ShieldCheck },
                    { id: LumiStep.RENDERING, label: '光影合成', icon: Zap },
                    { id: LumiStep.COMPLETE, label: '交付成品', icon: CheckCircle2 }
                  ].map((s, i) => {
                    const stepOrder = [LumiStep.UPLOAD, LumiStep.ANALYSIS, LumiStep.RENDERING, LumiStep.COMPLETE];
                    const currentIndex = stepOrder.indexOf(step);
                    const itemIndex = stepOrder.indexOf(s.id);
                    
                    const isPassed = currentIndex >= itemIndex;
                    const isActive = step === s.id;
                    
                    return (
                      <React.Fragment key={s.id}>
                        <div className={`flex flex-col items-center gap-3 transition-all duration-500 ${isPassed ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-110' : isPassed ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                            <s.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-px transition-colors duration-1000 ${isPassed ? 'bg-cyan-500/50' : 'bg-white/5'}`} />}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App6LumiFluxApp;
