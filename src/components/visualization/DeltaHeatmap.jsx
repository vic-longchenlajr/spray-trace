import { useRef, useEffect } from 'react';

const CELL_SIZE = 56;
const FONT_SIZE = 11;

function getDeltaColor(delta, maxAbsDelta) {
  if (delta === 0) return { bg: '#1a1d29', text: '#64748b' };
  const norm = Math.min(1, Math.abs(delta) / (maxAbsDelta || 0.1));
  if (delta > 0) {
    return {
      bg: `rgba(34, 197, 94, ${0.1 + norm * 0.5})`,
      text: '#86efac',
    };
  }
  return {
    bg: `rgba(239, 68, 68, ${0.1 + norm * 0.5})`,
    text: '#fca5a5',
  };
}

export default function DeltaHeatmap({ deltaGrid, width }) {
  const canvasRef = useRef(null);
  const rows = deltaGrid?.length || 0;
  const cols = deltaGrid?.[0]?.length || 0;
  if (rows === 0) return <div className="text-text-muted text-sm">No data</div>;

  const cellSize = width ? Math.floor((width - 2) / cols) : CELL_SIZE;
  const canvasW = cols * cellSize + 2;
  const canvasH = rows * cellSize + 2;

  // Find max absolute delta for normalization
  let maxAbsDelta = 0;
  for (const row of deltaGrid) {
    for (const v of row) {
      if (Math.abs(v) > maxAbsDelta) maxAbsDelta = Math.abs(v);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const fontSize = Math.min(FONT_SIZE, cellSize * 0.22);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize + 1;
        const y = r * cellSize + 1;
        const val = deltaGrid[r][c];
        const color = getDeltaColor(val, maxAbsDelta);

        ctx.fillStyle = color.bg;
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = '#2a2d3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

        ctx.fillStyle = color.text;
        ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3);
        ctx.fillText(label, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }, [deltaGrid, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: canvasW, height: canvasH }}
      className="rounded"
    />
  );
}
