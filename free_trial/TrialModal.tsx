
import React, { useState, useEffect } from 'react';
import { X, Gift, AlertCircle, Copy, ExternalLink, Play, Lock, Sparkles, RotateCw } from 'lucide-react';
import { WheelComponent } from './WheelComponent';
import { PRIZE_SEGMENTS, KEY_POOL, PrizeSegment } from './prizeData';
import { saveUserKeys } from '../apiConfig';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STORAGE_KEY = 'LUCKY_WHEEL_USAGE';
const MAX_DAILY_SPINS = 3;

export const TrialModal: React.FC<TrialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<PrizeSegment | null>(null);
  const [assignedKey, setAssignedKey] = useState<string | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  // 初始化检查今日使用次数
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toDateString();
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (data.date === today) {
          setDailyCount(data.count || 0);
        } else {
          setDailyCount(0); // 新的一天，重置
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        }
      } catch {
        setDailyCount(0);
      }
      
      // 重置界面状态，但不重置旋转角度，保持视觉连续性
      setResult(null);
      setAssignedKey(null);
      setHasSpun(false);
    }
  }, [isOpen]);

  const updateUsage = () => {
    const today = new Date().toDateString();
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
  };

  const spinWheel = () => {
    if (isSpinning || dailyCount >= MAX_DAILY_SPINS) return;

    setIsSpinning(true);
    updateUsage(); // 扣除次数
    
    // 1. 根据权重计算中奖结果
    const totalWeight = PRIZE_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let winningSegment = PRIZE_SEGMENTS[0];
    
    for (const seg of PRIZE_SEGMENTS) {
      if (randomVal < seg.weight) {
        winningSegment = seg;
        break;
      }
      randomVal -= seg.weight;
    }

    // 2. 预分配奖励
    if (winningSegment.type === 'key') {
      const randomKey = KEY_POOL[Math.floor(Math.random() * KEY_POOL.length)];
      setAssignedKey(randomKey);
    } else {
      setAssignedKey(null);
    }

    // 3. 计算旋转角度 (累加式旋转，保证每次都顺时针转动)
    const index = PRIZE_SEGMENTS.findIndex(s => s.id === winningSegment.id);
    const segAngle = 360 / PRIZE_SEGMENTS.length;
    
    // 目标扇区中心偏转角
    // 默认指针在0度，扇区0中心在 segAngle/2
    const segmentCenterAngle = index * segAngle + segAngle / 2;
    
    // 随机偏移 (扇区内 80% 范围)
    const randomOffset = (Math.random() - 0.5) * (segAngle * 0.8);
    
    // 核心算法：当前角度 + 多圈 + (目标绝对位置补偿)
    // 目标绝对位置 = 360 - 扇区中心 (因为顺时针旋转)
    const extraSpins = 5 * 360; 
    
    // 计算基于当前 rotation 的增量
    // 我们需要最终停留在 (360 - segmentCenterAngle + offset) 的“视觉位置”
    // 即 targetRotation % 360 ≈ (360 - segmentCenterAngle)
    
    const currentVisualAngle = rotation % 360;
    const targetVisualAngle = (360 - segmentCenterAngle + randomOffset + 360) % 360; // 归一化正值
    
    let delta = targetVisualAngle - currentVisualAngle;
    if (delta < 0) delta += 360; // 确保向前转
    
    const targetRotation = rotation + extraSpins + delta;

    setRotation(targetRotation);
    setResult(winningSegment);
  };

  const handleSpinEnd = () => {
    setIsSpinning(false);
    setHasSpun(true);
  };

  const handleReset = () => {
      setHasSpun(false);
      setResult(null);
  };

  const handleActivate = () => {
    if (assignedKey) {
      saveUserKeys(assignedKey);
      onSuccess(); 
    }
  };

  if (!isOpen) return null;

  const remainingSpins = MAX_DAILY_SPINS - dailyCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/50 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-white/5 relative z-20">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 uppercase tracking-wider flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Lucky Wheel
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                   今日剩余次数: <span className={remainingSpins > 0 ? "text-emerald-400" : "text-red-400"}>{remainingSpins}</span> / {MAX_DAILY_SPINS}
                </span>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed relative flex flex-col items-center justify-center p-6 min-h-[450px]">
            
            {(!hasSpun || isSpinning) && (
                <>
                    <WheelComponent 
                        segments={PRIZE_SEGMENTS} 
                        rotation={rotation} 
                        onTransitionEnd={handleSpinEnd}
                        isSpinning={isSpinning}
                    />
                    <button 
                        onClick={spinWheel}
                        disabled={isSpinning || remainingSpins <= 0}
                        className={`mt-6 px-12 py-4 rounded-full font-black text-lg shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all transform active:scale-95 border-b-4 relative z-20 ${
                            isSpinning || remainingSpins <= 0
                            ? 'bg-slate-700 text-slate-500 border-slate-800 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-700 hover:brightness-110 hover:-translate-y-1'
                        }`}
                    >
                        {isSpinning ? 'LUCK LOADING...' : remainingSpins > 0 ? 'GO! 立即抽奖' : '今日次数已用完'}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-500 font-mono">100% WIN RATE · DAILY LIMIT {MAX_DAILY_SPINS}</p>
                </>
            )}

            {/* Result Reveal Section */}
            {hasSpun && !isSpinning && result && (
                 <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500 py-4">
                     
                     <div className="relative mb-6">
                        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center shadow-2xl relative z-10 rotate-3">
                            {result.type === 'key' ? <Gift className="w-12 h-12 text-amber-400 drop-shadow-md" /> : <Play className="w-12 h-12 text-blue-400 drop-shadow-md" />}
                        </div>
                     </div>
                     
                     <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{result.label}</h3>
                     <p className="text-xs text-slate-400 font-medium mb-8 text-center px-8 leading-relaxed max-w-xs">{result.description}</p>

                     {result.type === 'key' && assignedKey && (
                         <div className="w-full max-w-[300px] bg-slate-900/50 p-4 rounded-xl border border-dashed border-amber-500/20 mb-6 group hover:border-amber-500/40 transition-colors">
                             <label className="text-[9px] text-slate-500 font-bold uppercase block mb-2 tracking-wider">Your Exclusive Key</label>
                             <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-lg border border-white/5">
                                 <code className="text-xs text-emerald-400 font-mono flex-1 truncate">{assignedKey}</code>
                                 <Copy className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(assignedKey)} />
                             </div>
                         </div>
                     )}

                     <div className="flex flex-col gap-3 w-full max-w-[280px]">
                        {result.type === 'key' ? (
                            <button 
                                onClick={handleActivate}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" /> 立即激活权益
                            </button>
                        ) : (
                            <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" /> 前往领取/观看
                            </a>
                        )}

                        {remainingSpins > 0 ? (
                            <button 
                                onClick={handleReset}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RotateCw className="w-4 h-4" /> 再抽一次 (剩{remainingSpins}次)
                            </button>
                        ) : (
                            <div className="text-center py-2 text-[10px] text-slate-500">
                                今日次数已耗尽，请明日再来
                            </div>
                        )}
                     </div>
                     
                     <button onClick={onClose} className="mt-6 text-[10px] text-slate-600 hover:text-slate-400 underline transition-colors">
                        关闭窗口
                     </button>
                 </div>
            )}

        </div>
      </div>
    </div>
  );
};
