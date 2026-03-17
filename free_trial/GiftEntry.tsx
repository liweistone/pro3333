
import React from 'react';
import { Gift } from 'lucide-react';

interface GiftEntryProps {
  onClick: () => void;
}

export const GiftEntry: React.FC<GiftEntryProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-8 left-8 z-50 group">
      <button
        onClick={onClick}
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-110 transition-transform duration-300 animate-bounce active:scale-95"
      >
        <Gift className="w-7 h-7 text-white" />
        {/* Notification Dot */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] animate-pulse"></div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-amber-400 opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500"></div>
      </button>
      
      {/* Tooltip Label */}
      <span className="absolute left-16 top-1/2 -translate-y-1/2 ml-4 px-4 py-2 bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap backdrop-blur-md shadow-2xl">
        <span className="text-white mr-1">New!</span> 领取体验福利
      </span>
    </div>
  );
};
