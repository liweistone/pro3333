
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
        placeholder={`请输入批量批改/替换指令：
1. 模特换装：将模特的上衣替换为深蓝色西装，保持背景不变
2. 产品替换：将图中的瓶子替换为新款磨砂质感玻璃瓶
3. 环境同步：将所有模特图的室内背景替换为极简主义的落日海滩场景
4. 元素增减：在图中的桌面上增加一束新鲜的百合花...`}
        disabled={isGenerating}
        className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-300"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
          {value.split('\n').filter(p => p.trim()).length} 条替换指令
        </span>
      </div>
    </div>
  );
};

export default PromptInput;
