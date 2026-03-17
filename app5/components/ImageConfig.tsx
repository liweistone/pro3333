
import React, { useState } from 'react';
import { AspectRatio, ImageSize, GenerationConfig, ModelType } from '../types';

interface ImageConfigProps {
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
  referenceImages: string[];
  onReferenceImagesChange: (urls: string[]) => void;
}

const ImageConfig: React.FC<ImageConfigProps> = ({ 
  config, 
  onConfigChange, 
  referenceImages, 
  onReferenceImagesChange 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (referenceImages.length >= 3) {
      alert('最多支持上传 3 张参考图');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onReferenceImagesChange([...referenceImages, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...referenceImages];
    newImages.splice(index, 1);
    onReferenceImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* 模型选择 */}
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">生成引擎版本</label>
        <div className="relative">
          <select
            value={config.model}
            onChange={(e) => onConfigChange({ ...config, model: e.target.value as ModelType })}
            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8 transition-shadow shadow-sm outline-none font-medium"
          >
            {Object.values(ModelType).map((model) => (
              <option key={model} value={model}>
                {model.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {/* 参考图区域 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-bold text-slate-700">参考素材库 ({referenceImages.length}/3)</label>
          {referenceImages.length > 0 && (
            <button 
              onClick={() => onReferenceImagesChange([])}
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              清空全部
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {referenceImages.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
              <img src={img} alt={`参考图 ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                title="移除素材"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          {referenceImages.length < 3 && (
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100' 
                  : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              <svg className={`w-6 h-6 ${isDragging ? 'text-blue-500 scale-110' : 'text-slate-400'} transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              {isDragging && <span className="text-[10px] text-blue-600 font-bold mt-1">松开上传素材</span>}
            </label>
          )}
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          最多上传 3 张图。支持“拖拽文件”快速导入素材。
        </p>
      </div>

      {/* 画布比例 */}
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">画布宽高比</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(AspectRatio).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onConfigChange({ ...config, aspectRatio: ratio })}
              className={`py-1.5 px-2 text-[10px] rounded-lg border transition-all font-medium ${
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

      {/* 生成分辨率 */}
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">输出分辨率 (Pro专属)</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ImageSize).map((size) => (
            <button
              key={size}
              onClick={() => onConfigChange({ ...config, imageSize: size })}
              className={`py-2 px-3 text-xs rounded-lg border transition-all font-bold ${
                config.imageSize === size
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-400 italic">
          注：高分辨率（2K/4K）会显著增加创作时长。
        </p>
      </div>
    </div>
  );
};

export default ImageConfig;
