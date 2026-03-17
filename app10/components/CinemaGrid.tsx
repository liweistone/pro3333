
import React from 'react';
import { ShotTask } from '../types';
import { Image as ImageIcon, Loader2, Download, Maximize2 } from 'lucide-react';

interface CinemaGridProps {
  tasks: ShotTask[];
}

const CinemaGrid: React.FC<CinemaGridProps> = ({ tasks }) => {
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-slate-600 p-10 text-center">
        <div className="w-20 h-20 border-2 border-dashed border-slate-800 rounded-3xl flex items-center justify-center mb-6">
          <ImageIcon className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-xl font-black text-slate-700 uppercase tracking-widest mb-2">Cinema Monitor</h3>
        <p className="text-xs text-slate-500 max-w-xs">等待视觉总监下达拍摄指令。成片将在此处实时显示。</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black p-8 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
        {tasks.map((task) => (
          <div key={task.id} className="relative group aspect-square bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/5 transition-all hover:ring-indigo-500/50">
            {task.status === 'success' && task.imageUrl ? (
              <>
                <img src={task.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{task.type}</p>
                      <p className="text-xs font-bold text-white mt-0.5">{task.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open(task.imageUrl, '_blank')}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => downloadImage(task.imageUrl!, `VisionDirector-${task.id}.png`)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-md transition-colors shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {task.status === 'running' ? (
                  <>
                    <div className="w-12 h-12 mb-4 relative">
                      <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xs font-black text-indigo-400 animate-pulse uppercase tracking-widest">Rendering...</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">Progress: {task.progress}%</p>
                  </>
                ) : task.status === 'failed' ? (
                  <>
                    <p className="text-xs font-bold text-rose-500 uppercase">拍摄失败</p>
                    <p className="text-[9px] text-rose-500/50 mt-1">Render Failed</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Shot {task.id}</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{task.title}</p>
                  </>
                )}
              </div>
            )}
            
            {/* Corner Tag */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[9px] font-mono text-slate-400 border border-white/5 pointer-events-none">
              SCENE {task.id.toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CinemaGrid;
