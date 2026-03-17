
import React from 'react';
import { ShotTask } from '../types';
import { Clapperboard, CheckCircle2, Circle } from 'lucide-react';

interface ScriptMonitorProps {
  scripts: ShotTask[];
  onStartAll: () => void;
  isProcessing: boolean;
}

const ScriptMonitor: React.FC<ScriptMonitorProps> = ({ scripts, onStartAll, isProcessing }) => {
  if (scripts.length === 0) return null;

  return (
    <div className="w-80 bg-[#020617] border-r border-white/10 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-indigo-500" />
          分镜脚本板
        </h2>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{scripts.length} Shots</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {scripts.map((shot) => (
          <div 
            key={shot.id} 
            className={`p-3 rounded-lg border transition-all ${
              shot.status === 'success' ? 'bg-emerald-950/30 border-emerald-500/30' : 
              shot.status === 'running' ? 'bg-indigo-950/30 border-indigo-500/50' : 
              'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">#{shot.id} {shot.type}</span>
              {shot.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {shot.status === 'running' && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
              {shot.status === 'idle' && <Circle className="w-3 h-3 text-slate-600" />}
            </div>
            <h3 className="text-xs font-bold text-white mb-1">{shot.title}</h3>
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{shot.cnDescription}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-[#0f172a]/50">
        <button
          onClick={onStartAll}
          disabled={isProcessing || scripts.some(s => s.status === 'running')}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            isProcessing 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
          }`}
        >
          {isProcessing ? '拍摄进行中...' : 'Action! 开始全组拍摄'}
        </button>
      </div>
    </div>
  );
};

export default ScriptMonitor;
