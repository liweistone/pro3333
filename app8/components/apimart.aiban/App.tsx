
import React, { useState } from 'react';
import { Layers, Play, Loader2, Download, Package } from 'lucide-react';
import { createGenerationTask, getTaskStatus } from './services/apiService';
import { GenerationTask, GenerationConfig } from './types';
import { saveAs } from 'file-saver';

const RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const RESOLUTIONS: Array<'1K' | '2K' | '4K'> = ['1K', '2K', '4K'];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [prompts, setPrompts] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({ ratio: '1:1', resolution: '1K', references: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startPolling = async (taskId: string) => {
    let attempts = 0;
    while (attempts < 100) {
      try {
        const res = await getTaskStatus(taskId);
        if (res.code === 200) {
          const d = res.data;
          setTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            status: d.status === 'completed' ? 'completed' : d.status === 'failed' ? 'failed' : 'processing',
            progress: d.progress || 0,
            imageUrl: d.result?.images?.[0]?.url?.[0]
          } : t));
          if (d.status === 'completed' || d.status === 'failed') break;
        }
        await new Promise(r => setTimeout(r, 3000));
        attempts++;
      } catch (e) { break; }
    }
  };

  const handleStartBatch = async () => {
    const list = prompts.split('\n').filter(p => p.trim());
    setIsSubmitting(true);
    for (const p of list) {
      try {
        const tid = await createGenerationTask({
          prompt: p, size: config.ratio, resolution: config.resolution,
          image_urls: config.references.map(u => ({ url: u }))
        });
        setTasks(prev => [{ id: tid, prompt: p, status: 'processing', progress: 0, createdAt: Date.now() }, ...prev]);
        startPolling(tid);
      } catch (err) {}
    }
    setIsSubmitting(false);
    setPrompts('');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-80 bg-white border-r p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2"><Layers className="text-indigo-600" /><h1 className="font-bold">批量大师 APIMart</h1></div>
        <textarea className="flex-1 p-3 border rounded-xl text-xs" value={prompts} onChange={e => setPrompts(e.target.value)} placeholder="每行一个提示词..." />
        <button onClick={handleStartBatch} disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">
           {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : '开始批量执行'}
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto grid grid-cols-3 gap-6">
        {tasks.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-2xl border">
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-3">
              {t.imageUrl ? <img src={t.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center font-bold text-slate-300">{t.progress}%</div>}
            </div>
            <p className="text-[10px] truncate opacity-60">{t.prompt}</p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default App;
