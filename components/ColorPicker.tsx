import React from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
  '#000000', // Black
  '#ffffff', // White
  '#94a3b8', // Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor }) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-2xl shadow-lg border-2 border-purple-100 justify-center max-w-md mx-auto">
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(color)}
          className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
            selectedColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {selectedColor === color && (
            <Check size={20} className={color === '#ffffff' ? 'text-black' : 'text-white'} />
          )}
        </button>
      ))}
      <div className="w-px h-10 bg-gray-200 mx-2"></div>
       <label className="relative cursor-pointer group">
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-gradient-to-br from-red-400 via-green-400 to-blue-400 flex items-center justify-center transition-transform hover:scale-110">
            <span className="text-white text-xs font-bold drop-shadow-md">+</span>
        </div>
        <input 
            type="color" 
            value={selectedColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="absolute opacity-0 inset-0 cursor-pointer w-full h-full"
        />
       </label>
    </div>
  );
};