import { useRef, useEffect } from 'react';

const CELL_SIZE = 56;
const FONT_SIZE = 11;

function getColor(value, minIndividual, minAvg) {
  if (value === 0) return { bg: '#000000', text: '#ef4444', label: 'DRY' };
  if (value < minIndividual) {
    const intensity = Math.max(0.3, value / minIndividual);
    return { bg: `rgba(239, 68, 68, ${0.15 + intensity * 0.35})`, text: '#fca5a5' };
  }
  if (value < minAvg) {
    const intensity = (value - minIndividual) / (minAvg - minIndividual);
    return { bg: `rgba(245, 158, 11, ${0.15 + intensity * 0.3})`, text: '#fcd34d' };
  }
  const intensity = Math.min(1, (value - minAvg) / (minAvg * 0.5));
  return { bg: `rgba(34, 197, 94, ${0.15 + intensity * 0.35})`, text: '#86efac' };
}

export default function Heatmap({ gridData, evaluatedRegion, testCondition, width }) {
  const canvasRef = useRef(null);

  const rows = gridData?.length || 0;
  const cols = gridData?.[0]?.length || 0;
  if (rows === 0 || cols === 0) return <div className="text-text-muted text-sm">No data</div>;

  const cellSize = width ? Math.floor((width - 2) / cols) : CELL_SIZE;
  const canvasW = cols * cellSize + 2;
  const canvasH = rows * cellSize + 2;

  const minIndividual = testCondition?.minIndividual || 0;
  const minAvg = testCondition?.minAverage || 0;

  const isEvaluated = (r, c) => {
    if (!evaluatedRegion) return true;
    return r >= evaluatedRegion.startRow && r <= evaluatedRegion.endRow &&
           c >= evaluatedRegion.startCol && c <= evaluatedRegion.endCol;
  };

  const isExcludedMiddle = (r) => {
    if (!testCondition?.excludeMiddleRows || !evaluatedRegion) return false;
    const totalEvalRows = evaluatedRegion.endRow - evaluatedRegion.startRow + 1;
    const midRow1 = evaluatedRegion.startRow + Math.floor(totalEvalRows / 2) - 1;
    const midRow2 = evaluatedRegion.startRow + Math.floor(totalEvalRows / 2);
    return r === midRow1 || r === midRow2;
  };

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
        const val = gridData[r][c];
        const evaluated = isEvaluated(r, c);
        const excluded = isExcludedMiddle(r);
        const alpha = (!evaluated || excluded) ? 0.4 : 1.0;

        ctx.globalAlpha = alpha;

        // Background
        if (val !== null && val !== undefined) {
          const color = getColor(val, minIndividual, minAvg);
          ctx.fillStyle = color.bg;
          ctx.fillRect(x, y, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#1a1d29';
          ctx.fillRect(x, y, cellSize, cellSize);
        }

        // Border
        ctx.strokeStyle = evaluated && !excluded ? '#3a3d4a' : '#2a2d3a';
        ctx.lineWidth = evaluated && !excluded ? 1.5 : 0.5;
        if (!evaluated || excluded) {
          ctx.setLineDash([3, 3]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
        ctx.setLineDash([]);

        // Value text
        if (val !== null && val !== undefined) {
          const color = getColor(val, minIndividual, minAvg);
          ctx.fillStyle = color.text;
          ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = color.label || val.toFixed(3);
          ctx.fillText(label, x + cellSize / 2, y + cellSize / 2);
        }

        // Pipe shadow hatch
        if (excluded && evaluated) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.lineWidth = 1;
          for (let d = -cellSize; d < cellSize * 2; d += 6) {
            ctx.beginPath();
            ctx.moveTo(x + d, y);
            ctx.lineTo(x + d + cellSize, y + cellSize);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.font = `bold ${fontSize * 0.7}px sans-serif`;
          ctx.fillText('PIPE', x + cellSize / 2, y + cellSize / 2 - fontSize * 0.5);
          ctx.fillText('SHADOW', x + cellSize / 2, y + cellSize / 2 + fontSize * 0.5);
        }

        ctx.globalAlpha = 1.0;
      }
    }
  }, [gridData, evaluatedRegion, testCondition, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: canvasW, height: canvasH }}
      className="rounded"
    />
  );
}
