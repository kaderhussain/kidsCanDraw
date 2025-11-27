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
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  
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
      // Always fill with white first to ensure no transparency issues
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Try to load saved canvas
      const savedCanvas = localStorage.getItem('little-picasso-canvas');
      
      if (savedCanvas) {
         const img = new Image();
         img.src = savedCanvas;
         img.onload = () => {
             // Draw saved image
             ctx.drawImage(img, 0, 0);
             // Save to history
             const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
             setHistory([currentData]);
         };
      } else {
        // Save initial blank state
        const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialData]);
      }
      
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
    
    if (canvas && ctx && history.length > 1) {
        const newHistory = [...history];
        newHistory.pop(); 
        const previousState = newHistory[newHistory.length - 1];
        
        if (previousState) {
            ctx.putImageData(previousState, 0, 0);
            setHistory(newHistory);
            saveToLocalStorage();
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

  const saveToLocalStorage = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          try {
            const dataUrl = canvas.toDataURL();
            localStorage.setItem('little-picasso-canvas', dataUrl);
          } catch (e) {
              console.error("Failed to save canvas to localStorage", e);
          }
      }
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => {
            const newHist = [...prev, currentData];
            if (newHist.length > 20) newHist.shift();
            return newHist;
        });
        saveToLocalStorage();
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

  // Generate dynamic SVG cursor based on tool and size
  const getCursorStyle = (): React.CSSProperties => {
    if (tool === ToolType.BUCKET) {
        // SVG for paint bucket
        const bucketSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11L11 19"/><path d="M22 2l-7 7L3 21l8-8 7 7 4-11z"/></svg>`;
        return { cursor: `url('data:image/svg+xml;utf8,${encodeURIComponent(bucketSvg)}') 0 22, auto` };
    }

    // Minimum visual size for the cursor so it doesn't disappear
    const size = Math.max(brushSize, 4);
    const svgSize = size + 8; // Add padding to avoid clipping the stroke
    const center = svgSize / 2;
    const radius = size / 2;

    let svg = '';
    if (tool === ToolType.ERASER) {
        // White circle with black border for eraser
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><circle cx="${center}" cy="${center}" r="${radius}" fill="white" stroke="#333" stroke-width="1"/></svg>`;
    } else {
        // Colored circle with white border + thin black outline for visibility on all backgrounds
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="2"/><circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="black" stroke-width="1" stroke-opacity="0.3"/></svg>`;
    }

    return { cursor: `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${center} ${center}, crosshair` };
  };

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner bg-white border-2 border-dashed border-gray-300"
    >
      <canvas
        ref={canvasRef}
        className="touch-none w-full h-full"
        style={getCursorStyle()}
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