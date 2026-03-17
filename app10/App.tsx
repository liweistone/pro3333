
import React, { useState, useRef, useEffect } from 'react';
import DirectorBoard from './components/DirectorBoard';
import ScriptMonitor from './components/ScriptMonitor';
import CinemaGrid from './components/CinemaGrid';
import { DirectorService } from './services/directorService';
import { ShotTask, VisualAnalysis } from './types';

const directorService = new DirectorService();

const App: React.FC = () => {
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VisualAnalysis | null>(null);
  const [scripts, setScripts] = useState<ShotTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 用于存储每个任务的本地模拟进度
  const progressSimulations = useRef<{ [key: number]: number }>({});

  const handleUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setRefImage(base64);
      setScripts([]); // Clear previous
      setAnalysis(null);
      
      setIsAnalyzing(true);
      try {
        const output = await directorService.analyzeAndScript(base64);
        setAnalysis(output.analysis);
        
        // Initialize tasks with idle state
        const initialTasks: ShotTask[] = output.scripts.map(s => ({
          ...s,
          status: 'idle',
          progress: 0
        }));
        setScripts(initialTasks);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startShooting = async () => {
    if (!refImage) return;
    setIsProcessing(true);

    const queue = [...scripts];
    
    for (let i = 0; i < queue.length; i++) {
      const task = queue[i];
      if (task.status === 'success') continue; 

      updateScriptStatus(task.id, { status: 'running', progress: 5 });
      progressSimulations.current[task.id] = 5; // Init simulation

      try {
        const taskId = await directorService.shootScene(task.prompt, refImage);
        updateScriptStatus(task.id, { taskId });
        pollTask(task.id, taskId);
      } catch (e) {
        updateScriptStatus(task.id, { status: 'failed' });
      }
      
      // 稍微错开请求，避免瞬间并发过高
      await new Promise(r => setTimeout(r, 800));
    }
    
    setIsProcessing(false);
  };

  const updateScriptStatus = (id: number, updates: Partial<ShotTask>) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const pollTask = async (localId: number, taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await directorService.checkStatus(taskId);
        const apiStatus = res.status?.toLowerCase();
        
        // 1. 宽松的成功判定：只要有图，就算成功，不管 status 叫什么
        const hasImage = res.result?.images?.[0]?.url?.[0] || res.results?.[0]?.url;
        
        if (hasImage || apiStatus === 'succeeded' || apiStatus === 'completed') {
          if (hasImage) {
            updateScriptStatus(localId, { status: 'success', progress: 100, imageUrl: hasImage });
            clearInterval(interval);
            return;
          }
        } 
        
        if (apiStatus === 'failed' || apiStatus === 'error') {
          updateScriptStatus(localId, { status: 'failed' });
          clearInterval(interval);
          return;
        }

        // 2. 进度条模拟算法 (Running 状态)
        // 如果后端返回了有效进度 > 0，用后端的；否则用本地模拟的
        let currentSim = progressSimulations.current[localId] || 10;
        if (currentSim < 90) {
            // 越接近 90 涨得越慢 (对数趋近)
            const increment = (95 - currentSim) * 0.05; 
            currentSim += increment;
        }
        progressSimulations.current[localId] = currentSim;

        const backendProgress = res.progress || 0;
        const displayProgress = Math.max(Math.floor(currentSim), backendProgress);

        updateScriptStatus(localId, { progress: displayProgress });

      } catch (e) {
        // 网络抖动不报错，继续轮询
      }
    }, 3000);
  };

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden">
      <DirectorBoard 
        image={refImage} 
        onUpload={handleUpload} 
        isAnalyzing={isAnalyzing}
        analysis={analysis}
      />
      <ScriptMonitor 
        scripts={scripts} 
        onStartAll={startShooting}
        isProcessing={isProcessing}
      />
      <CinemaGrid tasks={scripts} />
    </div>
  );
};

export default App;
