
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageConfig from './components/ImageConfig';
import PromptInput from './components/PromptInput';
import ImageGallery from './components/ImageGallery';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, ModelType } from './types';
import { createGenerationTask, checkTaskStatus } from './grsaiService';
import { optimizePlanningScheme } from './aiAnalysisService';
import { Wand2, Rocket, CloudDownload, Trash2, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [planningText, setPlanningText] = useState('');
  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: ModelType.GEMINI_3_PRO_IMAGE
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  
  const successfulCount = results.filter(item => item.status === 'succeeded').length;
  const pollIntervals = useRef<{ [key: string]: number }>({});

  const handleAiOptimize = async () => {
    if (!planningText.trim()) return;
    setIsOptimizing(true);
    try {
      const refinedPrompts = await optimizePlanningScheme(planningText, referenceImages[0]);
      setPromptsText(refinedPrompts);
    } catch (error: any) {
      alert(`方案精修失败: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;
    setIsGenerating(true);
    const newItems: GeneratedImage[] = prompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`, prompt: p, url: null, progress: 0, status: 'pending'
    }));
    setResults(prev => [...newItems, ...prev]);
    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, referenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message });
      }
    }
    setIsGenerating(false);
  };

  const startPolling = (localId: string, taskId: string) => {
    const interval = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'succeeded' && data.results?.[0]?.url) {
          updateResult(localId, { url: data.results[0].url, status: 'succeeded', progress: 100 });
          clearInterval(pollIntervals.current[localId]);
        } else if (data.status === 'failed') {
          updateResult(localId, { status: 'failed', error: data.error });
          clearInterval(pollIntervals.current[localId]);
        } else {
          updateResult(localId, { progress: data.progress || 10, status: 'running' });
        }
      } catch (error: any) {
        updateResult(localId, { status: 'error', error: error.message });
        clearInterval(pollIntervals.current[localId]);
      }
    }, 3000);
    pollIntervals.current[localId] = interval;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleBatchDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;
    setIsBatchDownloading(true);
    try {
      const zip = new JSZip();
      const downloadPromises = successfulItems.map(async (item) => {
        const response = await fetch(item.url!, { mode: 'cors' });
        const blob = await response.blob();
        zip.file(`StudioPro-Refined-${item.id.slice(-4)}.png`, blob);
      });
      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `StudioPro-精修批量导出-${Date.now()}.zip`;
      link.click();
    } catch (error: any) {
      alert(`打包失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-96 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">精修配置中心</h2>
            </div>
            
            <ImageConfig 
              config={config} 
              onConfigChange={setConfig} 
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
            />

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5" /> 方案精修引擎
                </h3>
              </div>
              <textarea
                value={planningText}
                onChange={(e) => setPlanningText(e.target.value)}
                placeholder="在此输入您的简单创意或方案（如：主标XX，副标YY，画面放产品...）"
                className="w-full h-32 p-4 text-xs font-bold bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none placeholder:font-medium placeholder:text-slate-300 transition-all"
              />
              <button
                onClick={handleAiOptimize}
                disabled={isOptimizing || !planningText.trim()}
                className={`w-full py-4 rounded-2xl text-xs font-black text-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                  isOptimizing || !planningText.trim() 
                  ? 'bg-slate-200 text-slate-400 shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isOptimizing ? 'AI 正在深度重构设计逻辑...' : '启动 AI 方案精修'}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">高精度提示词队列</h3>
              <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
            </div>

            <button
              onClick={startGeneration}
              disabled={isGenerating || !promptsText.trim()}
              className={`w-full py-5 rounded-[2rem] font-black text-white transition-all shadow-2xl active:scale-95 ${
                isGenerating || !promptsText.trim() ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 hover:bg-black shadow-slate-200'
              }`}
            >
              {isGenerating ? '引擎分发中...' : '开始 4K 视觉智造'}
            </button>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">视觉成品库</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Visual Intelligence Factory</p>
            </div>
            {successfulCount > 0 && (
              <button 
                onClick={handleBatchDownload} 
                disabled={isBatchDownloading} 
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {isBatchDownloading ? '打包中...' : <><CloudDownload className="w-4 h-4" /> 批量导出 ({successfulCount})</>}
              </button>
            )}
          </div>
          <ImageGallery items={results} onRetry={(item) => {
            const taskId = createGenerationTask(item.prompt, config, referenceImages);
            taskId.then(id => { updateResult(item.id, { taskId: id, status: 'running', progress: 5 }); startPolling(item.id, id); });
          }} />
        </section>
      </main>
    </div>
  );
};

export default App;
