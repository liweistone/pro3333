
import React, { useState } from 'react';
import { Check, X, QrCode, ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import { SubscriptionPlan, CONTACT_INFO } from './planConfig';

interface PlanCardProps {
  plan: SubscriptionPlan;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const themeStyles = {
    blue: {
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white',
      text: 'text-blue-400',
      bg: 'bg-blue-950/40'
    },
    gold: {
      border: 'border-amber-500/50',
      glow: 'shadow-amber-500/40',
      btn: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-900',
      text: 'text-amber-400',
      bg: 'bg-amber-950/40'
    },
    purple: {
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      btn: 'bg-purple-600 hover:bg-purple-500 text-white',
      text: 'text-purple-400',
      bg: 'bg-purple-950/40'
    }
  };

  const style = themeStyles[plan.theme];

  const handleCopyWx = () => {
    navigator.clipboard.writeText(CONTACT_INFO.wechatId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative w-full h-[520px] group perspective`}>
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Face: Details */}
        <div className={`absolute inset-0 backface-hidden bg-[#0f172a] rounded-[32px] border ${style.border} p-8 flex flex-col shadow-2xl ${plan.recommend ? style.glow + ' shadow-xl scale-105 z-10' : ''}`}>
          {plan.recommend && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
               👑 Most Popular
            </div>
          )}

          <h3 className={`text-xl font-black ${style.text} mb-2`}>{plan.title}</h3>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-sm text-slate-400 mb-1 font-bold">¥</span>
            <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
            <span className="text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wide">/ {plan.duration}</span>
          </div>

          <div className="w-full h-px bg-white/5 mb-6"></div>

          <div className="flex-1 space-y-4">
            {plan.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                {feat.included ? (
                  <div className={`p-0.5 rounded-full ${style.bg} shrink-0`}>
                     <Check className={`w-3 h-3 ${style.text}`} />
                  </div>
                ) : (
                  <X className="w-4 h-4 text-slate-700 shrink-0" />
                )}
                <span className={`text-xs font-medium ${feat.included ? 'text-slate-300' : 'text-slate-600 line-through'}`}>{feat.text}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsFlipped(true)}
            className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 ${style.btn}`}
          >
            立即开通 <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* Back Face: Payment (Rotated 180deg) */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] rounded-[32px] border ${style.border} p-8 flex flex-col shadow-2xl overflow-hidden`}>
           <button 
             onClick={() => setIsFlipped(false)}
             className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group"
           >
             <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           </button>

           <div className="flex-1 flex flex-col items-center justify-center text-center pt-4">
              <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest">微信扫码支付 <span className="text-white">¥{plan.price}</span></p>
              
              <div className="p-3 bg-white rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                 <img src={plan.qrCode} alt="Payment QR" className="w-32 h-32 object-contain" />
              </div>

              <div className="w-full bg-slate-900/80 rounded-xl p-4 border border-white/10 text-left mb-4">
                <p className="text-[10px] text-amber-400 font-bold mb-2 flex items-center gap-1 uppercase tracking-wider">
                   ⚠ 支付后核销步骤：
                </p>
                <ol className="text-[10px] text-slate-400 space-y-1.5 list-decimal pl-4 font-medium">
                   <li>完成付款并截图支付凭证</li>
                   <li>添加下方客服微信号</li>
                   <li>发送 <span className="text-white bg-white/10 px-1 rounded">"截图 + 账号ID"</span> 激活</li>
                </ol>
              </div>

              <div className="flex items-center gap-3 w-full bg-black/40 p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                 <div className="w-9 h-9 bg-[#07C160] rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-white font-black text-xs">微</span>
                 </div>
                 <div className="flex-1 text-left min-w-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">客服核销 ID</p>
                    <p className="text-xs font-mono text-white tracking-wider truncate">{CONTACT_INFO.wechatId}</p>
                 </div>
                 <button 
                   onClick={handleCopyWx} 
                   className="p-2 bg-white/5 hover:bg-white/20 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
                 >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Fix: Replaced invalid 'style jsx' with React-compliant dangerouslySetInnerHTML to fix property 'jsx' error */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      ` }} />
    </div>
  );
};
