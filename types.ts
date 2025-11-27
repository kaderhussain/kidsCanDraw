export enum ToolType {
  PENCIL = 'PENCIL',
  BRUSH = 'BRUSH',
  ERASER = 'ERASER',
  BUCKET = 'BUCKET',
}

export interface DrawingState {
  color: string;
  tool: ToolType;
  brushSize: number;
}

export interface Point {
  x: number;
  y: number;
}