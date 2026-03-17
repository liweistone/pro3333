
import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, isGenerating }) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`示例：一个高端轻奢手表的电商主图，深色背景...
示例：一份美味多汁的汉堡，自然光影效果...
示例：极简风护肤品包装，微距拍摄...`}
        disabled={isGenerating}
        className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-300 font-medium leading-relaxed"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
          共 {value.split('\n').filter(p => p.trim()).length} 条创作指令
        </span>
      </div>
    </div>
  );
};

export default PromptInput;
