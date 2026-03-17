
import React, { useState, useEffect, useRef } from 'react';
import Header from '../app2/components/Header';
import ImageConfig from '../app2/components/ImageConfig';
import PromptInput from '../app2/components/PromptInput';
import ImageGallery from '../app2/components/ImageGallery';
import SmartBatchGenerator from '../app2/components/SmartBatchGenerator';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig } from '../app2/types';
import { createGenerationTask, checkTaskStatus } from '../app2/visionService';
import JSZip from 'jszip';
import { Download, Package, Trash2, Loader2, Layers } from 'lucide-react';

const BatchMasterApp: React.FC = () => {
  const [promptsText, setPromptsText] = useState('');
  // 核心修复：修改初始状态中的模型名称，确保 Apimart 识别正确渠道
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'smart'>('smart');
  
  const pollIntervals = useRef<{ [key: string]: number }>({});

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;

    setIsGenerating(true);
    
    const newItems: GeneratedImage[] = prompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      prompt: p,
      url: null,
      progress: 0,
      status: 'pending',
      aspectRatio: config.aspectRatio
    }));
    
    setResults(prev => [...newItems, ...prev]);

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, referenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '任务发起失败' });
      }
    }

    setIsGenerating(false);
  };

  const handleRetry = async (item: GeneratedImage) => {
    if (pollIntervals.current[item.id]) {
      clearInterval(pollIntervals.current[item.id]);
      delete pollIntervals.current[item.id];
    }

    updateResult(item.id, { status: 'pending', progress: 0, error: undefined, taskId: undefined });

    try {
      const taskId = await createGenerationTask(item.prompt, config, referenceImages);
      updateResult(item.id, { taskId, status: 'running', progress: 5 });
      startPolling(item.id, taskId);
    } catch (error: any) {
      updateResult(item.id, { status: 'error', error: error.message || '重新生成失败' });
    }
  };

  const startPolling = (localId: string, taskId: string) => {
    const interval = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        
        if (data.status === 'succeeded' && data.results && data.results.length > 0) {
          updateResult(localId, { 
            url: data.results[0].url, 
            status: 'succeeded', 
            progress: 100 
          });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else if (data.status === 'failed') {
          updateResult(localId, { 
            status: 'failed', 
            error: data.failure_reason || data.error || '生成失败' 
          });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else {
          updateResult(localId, { 
            progress: data.progress || 10,
            status: 'running' 
          });
        }
      } catch (error: any) {
        updateResult(localId, { status: 'error', error: error.message });
        clearInterval(pollIntervals.current[localId]);
        delete pollIntervals.current[localId];
      }
    }, 3000);

    pollIntervals.current[localId] = interval;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const sanitizeFilename = (text: string) => {
    return text.trim()
      .replace(/[\\/:\*\?"<>\|]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 50);
  };

  const handleBatchZipDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;

    setIsBatchDownloading(true);
    try {
      const zip = new JSZip();
      
      const downloadPromises = successfulItems.map(async (item) => {
        try {
          const response = await fetch(item.url!, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
          
          const blob = await response.blob();
          const safeBaseName = sanitizeFilename(item.prompt) || '电商主图';
          const fileName = `${safeBaseName}-${item.id.slice(-4)}.png`;
          zip.file(fileName, blob);
        } catch (e) {
          console.error(`下载图片失败: ${item.url}`, e);
        }
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `裂变大师-批量打包-${new Date().getTime()}.zip`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      alert(`打包失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  const handleBatchSingleDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;

    for (const item of successfulItems) {
      try {
        const response = await fetch(item.url!, { mode: 'cors' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeBaseName = sanitizeFilename(item.prompt) || '电商主图';
        link.download = `${safeBaseName}-${item.id.slice(-4)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        console.error("单张下载失败", e);
      }
    }
  };

  const handleSmartGeneration = (prompts: string[], referenceImage: string) => {
    setPromptsText(prompts.join('\n'));
    if (referenceImages.length === 0) {
      setReferenceImages([referenceImage]);
    } else if (!referenceImages.includes(referenceImage) && referenceImages.length < 3) {
      setReferenceImages(prev => [...prev, referenceImage]);
    }
    setActiveTab('manual');
  };

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  const successfulCount = results.filter(i => i.status === 'succeeded').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-96 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 sticky top-24">
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
              <button
                onClick={() => setActiveTab('smart')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'smart' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                智能分析
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                手动配置
              </button>
            </div>

            <div className={activeTab === 'smart' ? 'block' : 'hidden'}>
               <SmartBatchGenerator onGenerate={handleSmartGeneration} />
            </div>

            <div className={activeTab === 'manual' ? 'block space-y-6 p-4 pt-0' : 'hidden'}>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                生成参数配置
              </h2>
              <ImageConfig 
                config={config} 
                onConfigChange={setConfig} 
                referenceImages={referenceImages}
                onReferenceImagesChange={setReferenceImages}
              />
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">任务提示词 ({promptsText.split('\n').filter(t => t.trim()).length} 组)</h3>
                <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
              </div>
              <button
                onClick={startGeneration}
                disabled={isGenerating || !promptsText.trim()}
                className={`w-full mt-4 py-4 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                  isGenerating || !promptsText.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isGenerating ? '正在发起队列...' : '开始批量生成'}
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">生成画廊</h2>
               <p className="text-sm text-slate-500">所有裂变生成的图像将实时反馈进度</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {successfulCount > 0 && (
                <>
                  <button 
                    onClick={handleBatchSingleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> 批量单张下载
                  </button>
                  <button 
                    onClick={handleBatchZipDownload}
                    disabled={isBatchDownloading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      isBatchDownloading 
                      ? 'bg-slate-100 text-slate-400 cursor-wait' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    }`}
                  >
                    {isBatchDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                    {isBatchDownloading ? '打包中...' : `打包 ZIP 下载 (${successfulCount})`}
                  </button>
                </>
              )}
              {results.length > 0 && (
                <button 
                  onClick={() => setResults([])} 
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-100 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 清空画廊
                </button>
              )}
            </div>
          </div>
          {results.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl h-[600px] flex flex-col items-center justify-center text-slate-400 shadow-sm text-center px-4">
              <Layers className="w-16 h-16 text-slate-100 mb-4" />
              <p className="text-lg font-semibold text-slate-600">欢迎使用裂变大师</p>
              <p className="text-sm text-slate-400 mt-1">上传参考素材并进行特征分析，即可一键裂变多视角主图</p>
            </div>
          ) : (
            <ImageGallery items={results} onRetry={handleRetry} />
          )}
        </section>
      </main>
    </div>
  );
};

export default BatchMasterApp;
