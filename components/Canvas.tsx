import React, { useRef, useEffect, useState } from 'react';
import { ToolType } from '../types';
import { floodFill } from '../utils/floodFill';

interface CanvasProps {
  tool: ToolType;
  color: string;
  brushSize: number;
  triggerClear: number;
  triggerUndo: number;
  importedImageSrc: string | null;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  tool,
  color,
  brushSize,
  triggerClear,
  triggerUndo,
  importedImageSrc,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs for mutable state that doesn't need to trigger re-renders
  // This is critical for performance and avoiding state sync issues during rapid drawing
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
  // History state needs to be stateful to trigger re-renders if we were showing undo availability,
  // but for internal logic we can trust the state updates.
  const [history, setHistory] = useState<ImageData[]>([]);
  
  // Track the last processed undo trigger to prevent loops
  const prevTriggerUndo = useRef(triggerUndo);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set initial size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Save initial blank state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      
      onCanvasReady(canvas);
    }

    const handleResize = () => {
      // In a production app, we would handle resize by debouncing and restoring image data
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Clear
  useEffect(() => {
    if (triggerClear === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory();
    }
  }, [triggerClear]);

  // Handle Undo
  useEffect(() => {
    // Check if we already processed this undo trigger to prevent infinite loops
    if (triggerUndo === 0 || triggerUndo === prevTriggerUndo.current) return;
    
    prevTriggerUndo.current = triggerUndo;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // We need at least 2 states: [empty, state1] -> undo -> [empty]
    if (canvas && ctx && history.length > 1) {
        // Create a copy of history
        const newHistory = [...history];
        
        // Remove the current state (the top of the stack)
        newHistory.pop(); 
        
        // Get the state before that
        const previousState = newHistory[newHistory.length - 1];
        
        if (previousState) {
            ctx.putImageData(previousState, 0, 0);
            setHistory(newHistory);
        }
    }
  }, [triggerUndo, history]);

  // Handle Imported Image
  useEffect(() => {
    if (!importedImageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const img = new Image();
      img.src = importedImageSrc;
      img.onload = () => {
        // Clear canvas first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale to fit while maintaining aspect ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        saveHistory();
      };
    }
  }, [importedImageSrc]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            // Keep max 20 steps to save memory
            const newHist = [...prev, currentData];
            if (newHist.length > 20) newHist.shift();
            return newHist;
        });
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return;
    const pos = getCoordinates(e);
    
    // Handle Bucket Tool immediately on click
    if (tool === ToolType.BUCKET) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), color, canvas.width, canvas.height);
            saveHistory();
        }
        return;
    }

    isDrawing.current = true;
    lastPos.current = pos;

    // Draw a single dot if it's just a click
    draw(pos, pos);
  };

  const draw = (start: {x: number, y: number}, end: {x: number, y: number}) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    ctx.strokeStyle = tool === ToolType.ERASER ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPos.current || tool === ToolType.BUCKET) return;
    
    const newPos = getCoordinates(e);
    draw(lastPos.current, newPos);
    lastPos.current = newPos;
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      saveHistory();
    }
  };

  const getCursorClass = () => {
    switch(tool) {
        case ToolType.PENCIL: return 'cursor-pencil';
        case ToolType.BRUSH: return 'cursor-pencil';
        case ToolType.ERASER: return 'cursor-eraser';
        case ToolType.BUCKET: return 'cursor-bucket';
        default: return 'cursor-default';
    }
  };

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner bg-white border-2 border-dashed border-gray-300"
    >
      <canvas
        ref={canvasRef}
        className={`touch-none w-full h-full ${getCursorClass()}`}
        onMouseDown={startDrawing}
        onMouseMove={handleMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={handleMove}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};