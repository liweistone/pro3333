
import React from 'react';
import { PrizeSegment } from './prizeData';
import { Sparkles } from 'lucide-react';

interface WheelComponentProps {
  segments: PrizeSegment[];
  rotation: number;
  onTransitionEnd: () => void;
  isSpinning: boolean;
}

export const WheelComponent: React.FC<WheelComponentProps> = ({ segments, rotation, onTransitionEnd, isSpinning }) => {
  const numSegments = segments.length;
  const degreesPerSegment = 360 / numSegments;

  // Create conic gradient string for the background sectors
  const gradientParts = segments.map((seg, i) => {
    const start = i * degreesPerSegment;
    const end = (i + 1) * degreesPerSegment;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  const backgroundStyle = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto my-8 scale-110">
      {/* Outer Glow Effect */}
      <div className="absolute inset-[-15px] rounded-full bg-gradient-to-br from-amber-500/10 to-purple-600/10 blur-xl animate-pulse"></div>
      
      {/* Decorative Border Ring */}
      <div className="absolute inset-[-4px] rounded-full border border-amber-500/20"></div>

      {/* Pointer (Fixed at Top) */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center filter drop-shadow-lg">
        <div className="w-6 h-8 bg-gradient-to-b from-amber-400 to-amber-600 [clip-path:polygon(100%_0,0_0,50%_100%)]"></div>
      </div>

      {/* The Rotating Wheel */}
      <div
        className="w-full h-full rounded-full border-[6px] border-slate-800 shadow-2xl relative overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.2, 0.1, 0.1, 1)"
        style={{
          background: backgroundStyle,
          transform: `rotate(${rotation}deg)`
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {/* Segments Text & Lines */}
        {segments.map((seg, i) => {
          // Calculate angle to center text in the segment
          // We add 180 degrees because writing-mode vertical usually reads better when flipped or aligned specifically
          // Actually, simply rotating to the center of the wedge is enough.
          const angle = i * degreesPerSegment + degreesPerSegment / 2;
          
          return (
            <div
              key={seg.id}
              className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom -translate-x-1/2 flex justify-center pt-5 pointer-events-none"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {/* Text Label */}
              <div 
                className="text-[10px] md:text-xs font-black tracking-widest uppercase writing-vertical-rl" 
                style={{ 
                    color: seg.textColor,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    writingMode: 'vertical-rl' 
                }}
              >
                 {seg.label}
              </div>
            </div>
          );
        })}
        
        {/* Center Hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 bg-slate-900 rounded-full border-[3px] border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10">
                <Sparkles className={`w-6 h-6 text-amber-500 ${isSpinning ? 'animate-spin' : ''}`} />
            </div>
        </div>
      </div>
    </div>
  );
};
