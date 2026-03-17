
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageConfig from './components/ImageConfig';
import PromptInput from './components/PromptInput';
import ImageGallery from './components/ImageGallery';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig } from './types';
import { createGenerationTask, checkTaskStatus } from './grsaiService';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });
  const [batchImages, setBatchImages] = useState<string[]>([]);
  const [fixedImage, setFixedImage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  
  // 恢复轮询引用存储
  const pollIntervals = useRef<{ [key: string]: number }>({});

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;

    setIsGenerating(true);
    
    // 1:N 模式识别：单条指令 ➔ 序列全图应用
    const isOnePromptMode = prompts.length === 1 && batchImages.length > 1;
    const taskCount = isOnePromptMode ? batchImages.length : prompts.length;

    const newItems: GeneratedImage[] = [];
    for (let i = 0; i < taskCount; i++) {
      newItems.push({
        id: `${Date.now()}-${i}`,
        prompt: isOnePromptMode ? prompts[0] : prompts[i],
        url: null,
        refThumbnail: batchImages.length > 0 ? batchImages[i % batchImages.length] : undefined,
        progress: 0,
        status: 'pending'
      });
    }
    
    setResults(prev => [...newItems, ...prev]);

    // 恢复使用第三方接口分发任务
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      try {
        const taskRefs: string[] = [];
        if (batchImages.length > 0) {
          taskRefs.push(batchImages[i % batchImages.length]);
        }
        if (fixedImage) {
          taskRefs.push(fixedImage);
        }

        const taskId = await createGenerationTask(item.prompt, config, taskRefs);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '任务分发失败' });
      }
    }

    setIsGenerating(false);
  };

  const handleRetry = async (item: GeneratedImage) => {
    const idx = results.findIndex(r => r.id === item.id);
    if (idx === -1) return;

    if (pollIntervals.current[item.id]) {
      clearInterval(pollIntervals.current[item.id]);
      delete pollIntervals.current[item.id];
    }

    updateResult(item.id, { status: 'pending', progress: 0, error: undefined, taskId: undefined });

    try {
      const taskRefs: string[] = [];
      if (item.refThumbnail) {
        taskRefs.push(item.refThumbnail);
      }
      if (fixedImage) {
        taskRefs.push(fixedImage);
      }

      const taskId = await createGenerationTask(item.prompt, config, taskRefs);
      updateResult(item.id, { taskId, status: 'running', progress: 5 });
      startPolling(item.id, taskId);
    } catch (error: any) {
      updateResult(item.id, { status: 'error', error: error.message || '重试失败' });
    }
  };

  // 恢复轮询函数
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
            error: data.failure_reason || data.error || '批改中断' 
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
    }, 2000);

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

  const handleBatchDownload = async () => {
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
          const safeBaseName = sanitizeFilename(item.prompt) || '万象批改结果';
          const fileName = `${safeBaseName}-${item.id.slice(-4)}.png`;
          zip.file(fileName, blob);
        } catch (e) {
          console.error(`下载失败 [${item.id}]`, e);
        }
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `万象批改-批量导出-${Date.now()}.zip`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      alert(`打包失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-96">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              批改任务配置
            </h2>
            <ImageConfig 
              config={config} 
              onConfigChange={setConfig} 
              batchImages={batchImages}
              onBatchImagesChange={setBatchImages}
              fixedImage={fixedImage}
              onFixedImageChange={setFixedImage}
            />
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                <span>同步批改指令</span>
                <span className="text-[10px] text-blue-500 font-normal">支持模特换装 / 元素替换</span>
              </h3>
              <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
            </div>
            <button
              onClick={startGeneration}
              disabled={isGenerating || !promptsText.trim()}
              className={`w-full mt-6 py-4 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                isGenerating || !promptsText.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isGenerating ? '万象同步批改中...' : '开始批量执行替换'}
            </button>
          </div>
        </aside>
        <section className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">万象批改 成果画廊</h2>
               <p className="text-sm text-slate-500">
                 {promptsText.split('\n').filter(p => p.trim()).length === 1 && batchImages.length > 1 
                   ? `同频模式：指令已同步映射至 ${batchImages.length} 张原始素材` 
                   : "视觉元素正在进行批量化的精准修正与替换"}
               </p>
            </div>
            <div className="flex items-center gap-3">
              {results.length > 0 && (
                <button 
                  onClick={handleBatchDownload}
                  disabled={isBatchDownloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-blue-600 border border-blue-100 shadow-sm hover:shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  一键导出 ({results.filter(i => i.status === 'succeeded').length})
                </button>
              )}
              {results.length > 0 && (
                <button 
                  onClick={() => setResults([])} 
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 bg-white rounded-lg border border-slate-100"
                >
                  清空列表
                </button>
              )}
            </div>
          </div>
          {results.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl h-[600px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <div className="p-6 bg-slate-50 rounded-full mb-4">
                <svg className="w-16 h-16 opacity-30 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-600">万象批改助手 准备就绪</p>
              <p className="text-sm text-slate-400 mt-1">上传需修正的图像序列，输入替换指令即可同步执行</p>
            </div>
          ) : (
            <ImageGallery items={results} onRetry={handleRetry} />
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
