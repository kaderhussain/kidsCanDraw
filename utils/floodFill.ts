/**
 * Performs a flood fill on the canvas context.
 * This is a CPU-intensive operation, so we use an iterative stack-based approach
 * to avoid recursion depth limits.
 */
export const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number
) => {
  // 1. Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 2. Parse fill color
  const hex = fillColorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = 255;

  // 3. Get target color at start position
  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Optimization: If clicking on the same color, do nothing
  if (startR === r && startG === g && startB === b && startA === a) {
    return;
  }

  // Tolerance helper (for anti-aliased lines)
  // We use a much higher tolerance (roughly 20% visual difference) to eat into
  // the anti-aliased edges of black lines, preventing the "white halo" artifact.
  const matchColor = (pos: number) => {
    const dr = data[pos] - startR;
    const dg = data[pos + 1] - startG;
    const db = data[pos + 2] - startB;
    const da = data[pos + 3] - startA;
    // Squared distance. 
    // Old value: 2000. 
    // New value: 12000 (allows filling into darker grays if starting from white, but not black).
    return (dr * dr + dg * dg + db * db + da * da) < 12000; 
  };

  const colorPixel = (pos: number) => {
    data[pos] = r;
    data[pos + 1] = g;
    data[pos + 2] = b;
    data[pos + 3] = a;
  };

  // 4. Stack based fill
  const stack: [number, number][] = [[startX, startY]];
  const seen = new Uint8Array(width * height); // keep track of visited pixels to prevent loops

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pixelIndex = y * width + x;
    const pos = pixelIndex * 4;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (seen[pixelIndex]) continue;
    
    if (matchColor(pos)) {
      colorPixel(pos);
      seen[pixelIndex] = 1;

      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }

  // 5. Put image data back
  ctx.putImageData(imageData, 0, 0);
};