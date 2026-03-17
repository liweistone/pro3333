import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';

import Header from '../app1/components/Header';
import ImageConfig from '../app1/components/ImageConfig';
import PromptInput from '../app1/components/PromptInput';
import ImageGallery from '../app1/components/ImageGallery';
import AssetManager from '../app1/components/AssetManager';
import MainMaterialUpload from '../app1/components/MainMaterialUpload';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, SubjectType, PoseCategory, ShootingAngle, ExtendedConfigState, LightingType } from '../app1/types';
import { createGenerationTask, checkTaskStatus } from '../app1/aimgService';
import { getCameraDescription } from '../app1/utils/cameraUtils';
import { getPoseDescription } from '../app1/utils/poseUtils';
import { getLightingDescription } from '../app1/utils/lightingUtils';
import { getExpressionDescription } from '../app1/utils/expressionUtils';
import { getBodyDescription } from '../app1/utils/bodyUtils';

const ProStudioApp: React.FC = () => {
  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });

  const [extendedConfig, setExtendedConfig] = useState<ExtendedConfigState>({
    subjectType: SubjectType.PERSON,
    poseCategory: PoseCategory.FULL_BODY,
    selectedPoseId: null,
    shootingAngle: ShootingAngle.EYE_LEVEL,
    use3DControl: true,
    editorMode: 'camera',
    camera: { 
      azimuth: 0, 
      elevation: 0, 
      distance: 1.0
    },
    cameraEnabled: false, 
    skeleton: {
        hips: { rotation: [0, 0, 0] },
        spine: { rotation: [0, 0, 0] },
        chest: { rotation: [0, 0, 0] },
        neck: { rotation: [0, 0, 0] },
        leftShoulder: { rotation: [0, 0, 0] },
        rightShoulder: { rotation: [0, 0, 0] },
        leftHip: { rotation: [0, 0, 0] },
        rightHip: { rotation: [0, 0, 0] }
    },
    poseEnabled: false, 
    lighting: {
        azimuth: 45,
        elevation: 45,
        intensity: 1.0,
        color: "#ffffff",
        type: LightingType.DEFAULT
    },
    lightingEnabled: false, 
    expression: {
        presetId: 'neutral',
        happiness: 0,
        anger: 0,
        surprise: 0,
        mouthOpen: 0,
        gazeX: 0,
        gazeY: 0
    },
    expressionEnabled: false, 
    bodyShape: {
        build: 0,
        shoulderWidth: 0,
        bustSize: 0.2, 
        waistWidth: 0,
        hipWidth: 0,
        legLength: 0
    },
    bodyEnabled: false, 
    assets: { 
        faceImage: null,
        clothingImage: null,
        backgroundImage: null
    }
  });

  const [clothingAnalysis, setClothingAnalysis] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  
  const pollIntervals = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(window.clearInterval);
    };
  }, []);

  const handleExtendedConfigChange = (updates: Partial<ExtendedConfigState>) => {
    setExtendedConfig(prev => {
        const next = { ...prev, ...updates };
        if (updates.cameraEnabled === true || updates.poseEnabled === true || updates.lightingEnabled === true || updates.expressionEnabled === true || updates.bodyEnabled === true) {
            setPromptsText(prevText => {
                let newText = prevText;
                if (updates.poseEnabled === true && !newText.includes("[selected_pose]")) {
                    newText = newText.trim() ? `${newText}, [selected_pose]` : "[selected_pose]";
                }
                if (updates.expressionEnabled === true && !newText.includes("[expression]")) {
                    newText = newText.trim() ? `${newText}, [expression]` : "[expression]";
                }
                if (updates.bodyEnabled === true && !newText.includes("[body_shape]")) {
                    newText = newText.trim() ? `${newText}, [body_shape]` : "[body_shape]";
                }
                if (updates.cameraEnabled === true && !newText.includes("[selected_angle]")) {
                    newText = newText.trim() ? `${newText}, [selected_angle]` : "[selected_angle]";
                }
                if (updates.lightingEnabled === true && !newText.includes("[lighting]")) {
                    newText = newText.trim() ? `${newText}, [lighting]` : "[lighting]";
                }
                return newText;
            });
        }
        return next;
    });
  };

  const constructEnhancedPrompt = (basePrompt: string): string => {
    let enhancedPrompt = basePrompt.trim();
    const poseKeywords = extendedConfig.poseEnabled ? getPoseDescription(extendedConfig.skeleton) : "";
    const angleKeywords = extendedConfig.cameraEnabled ? getCameraDescription(extendedConfig.camera) : "";
    let lightingKeywords = extendedConfig.lightingEnabled ? getLightingDescription(extendedConfig.lighting) : "";
    const expressionKeywords = extendedConfig.expressionEnabled ? getExpressionDescription(extendedConfig.expression) : "";
    const bodyKeywords = extendedConfig.bodyEnabled ? getBodyDescription(extendedConfig.bodyShape) : "";

    if (extendedConfig.assets.faceImage) enhancedPrompt += ", swap face with the provided face reference";
    if (extendedConfig.assets.clothingImage) enhancedPrompt += `, A high-fidelity photograph, ${clothingAnalysis || "wearing provided garment"}`;
    if (extendedConfig.assets.backgroundImage) enhancedPrompt += ", replace background with the provided background reference";

    enhancedPrompt = enhancedPrompt
        .replace(/\[(selected_)?pose\]/g, poseKeywords)
        .replace(/\[(selected_)?angle\]/g, angleKeywords)
        .replace(/\[(selected_)?lighting\]/g, lightingKeywords)
        .replace(/\[(selected_)?expression\]/g, expressionKeywords)
        .replace(/\[(selected_)?body_shape\]/g, bodyKeywords);
    
    return enhancedPrompt.replace(/,+/g, ',').replace(/,\s*,/g, ',').replace(/\s\s+/g, ' ').replace(/,\s*$/g, '').trim();
  };

  const startGeneration = async () => {
    const rawPrompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (rawPrompts.length === 0) return;
    setIsGenerating(true);
    
    const newItems: GeneratedImage[] = rawPrompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      prompt: constructEnhancedPrompt(p),
      url: null,
      progress: 0,
      status: 'pending'
    }));
    
    setResults(prev => [...newItems, ...prev]);

    const finalReferenceImages: string[] = [];
    if (referenceImages.length > 0) finalReferenceImages.push(referenceImages[0]);
    if (extendedConfig.assets.faceImage) finalReferenceImages.push(extendedConfig.assets.faceImage);
    if (extendedConfig.assets.clothingImage) finalReferenceImages.push(extendedConfig.assets.clothingImage);
    if (extendedConfig.assets.backgroundImage) finalReferenceImages.push(extendedConfig.assets.backgroundImage);

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, finalReferenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '提交任务失败' });
      }
    }
    setIsGenerating(false);
  };

  const startPolling = (localId: string, taskId: string) => {
    const intervalId = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'succeeded' && data.results?.[0]?.url) {
          updateResult(localId, { url: data.results[0].url, status: 'succeeded', progress: 100 });
          window.clearInterval(intervalId);
        } else if (data.status === 'failed' || data.status === 'error') {
          updateResult(localId, { status: 'failed', error: data.error || "API 内部处理失败" });
          window.clearInterval(intervalId);
        } else {
          updateResult(localId, { progress: data.progress || 10, status: 'running' });
        }
      } catch (err: any) {
        updateResult(localId, { status: 'error', error: err.message });
        window.clearInterval(intervalId);
      }
    }, 2000);
    pollIntervals.current[localId] = intervalId;
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
      await Promise.all(successfulItems.map(async (item) => {
        const response = await fetch(item.url!, { mode: 'cors' });
        const blob = await response.blob();
        zip.file(`StudioPro-${item.id.slice(-4)}.png`, blob);
      }));
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(content);
      link.download = `智拍大师-批量导出-${Date.now()}.zip`;
      link.click();
    } catch (error: any) {
      alert(`打包失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[420px] space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <MainMaterialUpload referenceImages={referenceImages} onChange={setReferenceImages} />
            <AssetManager 
                assets={extendedConfig.assets} 
                onChange={(a) => handleExtendedConfigChange({ assets: a })} 
                clothingAnalysis={clothingAnalysis}
                onAnalysisChange={setClothingAnalysis}
            />
            <div className="border-t border-slate-100"></div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
               3D 参数与环境配置
            </h2>
            <ImageConfig 
                config={config} 
                onConfigChange={setConfig} 
                extendedConfig={extendedConfig} 
                onExtendedConfigChange={handleExtendedConfigChange} 
                previewImage={referenceImages[0]} 
            />
            <div className="mt-6">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">批量提示词</label>
              <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
            </div>
            <button onClick={startGeneration} disabled={isGenerating || !promptsText.trim()} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50">
              {isGenerating ? '正在提交任务...' : '开始批量出图'}
            </button>
          </div>
        </aside>
        <section className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">生成画廊</h2>
               <p className="text-sm text-slate-500">智拍大师实时反馈生成进度</p>
            </div>
            <div className="flex items-center gap-3">
              {results.filter(i => i.status === 'succeeded').length > 0 && (
                <button onClick={handleBatchDownload} disabled={isBatchDownloading} className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-100 rounded-lg text-sm font-bold shadow-sm">
                  {isBatchDownloading ? '正在打包...' : `批量下载 (${results.filter(i => i.status === 'succeeded').length})`}
                </button>
              )}
            </div>
          </div>
          {results.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl h-[600px] flex flex-col items-center justify-center text-slate-400">
              <p className="text-lg font-semibold text-slate-600">欢迎使用智拍大师 Pro</p>
              <p className="text-sm text-slate-400 mt-1">上传底图并配置 3D 参数即可开始</p>
            </div>
          ) : (
            <ImageGallery items={results} onRetry={startGeneration} />
          )}
        </section>
      </main>
    </div>
  );
};

export default ProStudioApp;