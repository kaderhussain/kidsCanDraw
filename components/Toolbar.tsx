import React from 'react';
import { Pencil, Brush, Eraser, PaintBucket, Upload, Download, Trash2, Undo } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onClear: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onUndo: () => void;
  isGenerating: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  brushSize,
  setBrushSize,
  onClear,
  onUpload,
  onDownload,
  onUndo,
  isGenerating
}) => {
  
  const tools = [
    { type: ToolType.PENCIL, icon: Pencil, label: 'Pencil' },
    { type: ToolType.BRUSH, icon: Brush, label: 'Brush' },
    { type: ToolType.BUCKET, icon: PaintBucket, label: 'Fill' },
    { type: ToolType.ERASER, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-xl border-4 border-yellow-200">
      
      {/* Tools Group */}
      <div className="flex gap-2">
        {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.type;
            return (
                <button
                    key={tool.type}
                    onClick={() => setTool(tool.type)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center w-16 h-16 transition-all ${
                        isActive 
                        ? 'bg-blue-500 text-white shadow-lg scale-105 rotate-3' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Icon size={24} />
                    <span className="text-xs mt-1 font-semibold">{tool.label}</span>
                </button>
            );
        })}
      </div>

      <div className="w-px h-12 bg-gray-200 hidden md:block mx-2"></div>

      {/* Size Slider */}
      <div className="flex flex-col w-full md:w-32 px-2">
        <label className="text-xs font-bold text-gray-500 mb-1">Size: {brushSize}px</label>
        <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="w-px h-12 bg-gray-200 hidden md:block mx-2"></div>

      {/* Actions */}
      <div className="flex gap-2">
         <button 
            onClick={onUndo}
            className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
            title="Undo"
        >
            <Undo size={20} />
        </button>
         <button 
            onClick={onClear}
            className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
            title="Clear Canvas"
        >
            <Trash2 size={20} />
        </button>
        <button 
            onClick={onUpload}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
                isGenerating 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-lg'
            }`}
        >
            <Upload size={20} />
            {isGenerating ? 'Magic...' : 'Magic Import'}
        </button>
        <button 
            onClick={onDownload}
            className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
            title="Save Art"
        >
            <Download size={20} />
        </button>
      </div>
    </div>
  );
};