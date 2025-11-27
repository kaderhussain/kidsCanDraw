import React, { useState, useRef, useEffect } from 'react';
import { ToolType, DrawingState } from './types';
import { Toolbar } from './components/Toolbar';
import { ColorPicker } from './components/ColorPicker';
import { Canvas } from './components/Canvas';
import { convertImageToColoringPage } from './services/gemini';
import confetti from 'canvas-confetti';

function App() {
  const [drawingState, setDrawingState] = useState<DrawingState>(() => {
    // Try to load state from localStorage
    const saved = localStorage.getItem('little-picasso-state');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved state");
        }
    }
    return {
        color: '#000000',
        tool: ToolType.PENCIL,
        brushSize: 5,
    };
  });
  
  const [triggerClear, setTriggerClear] = useState(0);
  const [triggerUndo, setTriggerUndo] = useState(0);
  const [importedSvg, setImportedSvg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('little-picasso-state', JSON.stringify(drawingState));
  }, [drawingState]);

  const handleToolChange = (tool: ToolType) => {
    setDrawingState(prev => ({ ...prev, tool }));
  };

  const handleColorChange = (color: string) => {
    setDrawingState(prev => ({ ...prev, color }));
  };

  const handleSizeChange = (size: number) => {
    setDrawingState(prev => ({ ...prev, brushSize: size }));
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to start over?')) {
        setTriggerClear(prev => prev + 1);
    }
  };

  const handleUndo = () => {
    setTriggerUndo(prev => prev + 1);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            // Remove data url prefix for API
            const base64Data = base64String.split(',')[1];
            
            try {
                const svgString = await convertImageToColoringPage(base64Data);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                setImportedSvg(url);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (error) {
                alert("Oops! The magic wand couldn't convert that picture. Try another one!");
            } finally {
                setIsGenerating(false);
            }
        };
        reader.readAsDataURL(file);
    } catch (e) {
        setIsGenerating(false);
        alert("Error reading file");
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    // We need to access the canvas element to download
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'little-picasso-art.png';
        link.href = canvas.toDataURL();
        link.click();
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
        });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-blue-50 relative">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <header className="flex-none p-4 pb-0 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <span className="text-2xl">🎨</span>
            </div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">Little Picasso</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        
        {/* Left: Toolbar & Colors */}
        <div className="flex-none md:w-24 lg:w-32 flex md:flex-col gap-4 justify-between md:justify-start">
             {/* Toolbar is floating on mobile, fixed on desktop sidebar */}
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 relative flex flex-col min-h-0">
            {/* Top Toolbar (Floating) */}
            <div className="flex-none mb-4 flex justify-center z-20">
                <Toolbar 
                    currentTool={drawingState.tool}
                    setTool={handleToolChange}
                    brushSize={drawingState.brushSize}
                    setBrushSize={handleSizeChange}
                    onClear={handleClear}
                    onUpload={handleUploadClick}
                    onDownload={handleDownload}
                    onUndo={handleUndo}
                    isGenerating={isGenerating}
                />
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative min-h-0">
                 {isGenerating && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                        <div className="animate-spin text-5xl mb-4">✨</div>
                        <p className="text-2xl font-bold text-purple-600 animate-pulse">Making Magic...</p>
                    </div>
                )}
                
                <Canvas 
                    tool={drawingState.tool}
                    color={drawingState.color}
                    brushSize={drawingState.brushSize}
                    triggerClear={triggerClear}
                    triggerUndo={triggerUndo}
                    importedImageSrc={importedSvg}
                    onCanvasReady={(c) => console.log("Canvas ready")}
                />
            </div>

             {/* Bottom Color Picker */}
            <div className="flex-none mt-4 z-20">
                <ColorPicker 
                    selectedColor={drawingState.color}
                    onSelectColor={handleColorChange}
                />
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;