
import React from 'react';
import { AspectRatio, ImageSize, GenerationConfig } from '../types';

interface ImageConfigProps {
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
  batchImages: string[];
  onBatchImagesChange: (urls: string[]) => void;
  fixedImage: string | null;
  onFixedImageChange: (url: string | null) => void;
}

const ImageConfig: React.FC<ImageConfigProps> = ({ 
  config, 
  onConfigChange, 
  batchImages, 
  onBatchImagesChange,
  fixedImage,
  onFixedImageChange
}) => {
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Added explicit File type to map to avoid 'unknown' assignment error
      const readers = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        onBatchImagesChange([...batchImages, ...results]);
      });
    }
    e.target.value = '';
  };

  const handleFixedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fix: Added explicit Blob type cast
      const reader = new FileReader();
      reader.onloadend = () => onFixedImageChange(reader.result as string);
      reader.readAsDataURL(file as Blob);
    }
    e.target.value = '';
  };

  const removeBatchImage = (index: number) => {
    const newImages = [...batchImages];
    newImages.splice(index, 1);
    onBatchImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Batch Sequence Images */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-bold text-slate-700">序列参考素材 (1:1 匹配)</label>
          {batchImages.length > 0 && (
            <button 
              onClick={() => onBatchImagesChange([])}
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              清空序列
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-lg">
          {batchImages.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] px-1 font-bold rounded-br">
                #{idx + 1}
              </div>
              <button 
                onClick={() => removeBatchImage(idx)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleBatchFileChange} />
          </label>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          批量生成的每行提示词将顺序使用此处的一张图。
        </p>
      </div>

      {/* Fixed Global Image */}
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">固定参考图 (全局应用)</label>
        <div className="w-24 aspect-square">
          {fixedImage ? (
            <div className="relative group w-full h-full rounded-lg overflow-hidden border-2 border-indigo-200 shadow-sm">
              <img src={fixedImage} alt="Fixed" className="w-full h-full object-cover" />
              <button 
                onClick={() => onFixedImageChange(null)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleFixedFileChange} />
            </label>
          )}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          此图会作为“第二参考图”附加到所有批量任务中。
        </p>
      </div>

      {/* Aspect Ratio */}
      <div className="pt-4 border-t border-slate-100">
        <label className="text-sm font-medium text-slate-700 block mb-2">画布比例</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(AspectRatio).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onConfigChange({ ...config, aspectRatio: ratio })}
              className={`py-1.5 px-2 text-[10px] rounded-lg border transition-all ${
                config.aspectRatio === ratio
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Image Size / Resolution */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">生成分辨率 (Pro)</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ImageSize).map((size) => (
            <button
              key={size}
              onClick={() => onConfigChange({ ...config, imageSize: size })}
              className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                config.imageSize === size
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageConfig;
