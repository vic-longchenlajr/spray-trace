import { useState } from 'react';
import { parseGridFromClipboard } from '../../utils/gridParser';

export default function PasteGrid({ rows, cols, value, onChange, evaluatedRegion, testCondition }) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parseErrors, setParseErrors] = useState(null);
  const [parseWarnings, setParseWarnings] = useState(null);

  // Initialize grid if empty
  const grid = value && value.length > 0 ? value : Array.from({ length: rows }, () => Array(cols).fill(null));

  function handleCellChange(r, c, val) {
    const newGrid = grid.map(row => [...row]);
    const parsed = val === '' ? null : parseFloat(val);
    newGrid[r][c] = isNaN(parsed) ? null : parsed;
    onChange(newGrid);
  }

  function handlePaste() {
    const result = parseGridFromClipboard(pasteText);
    setParseErrors(result.errors);
    setParseWarnings(result.warnings);

    if (result.data.length > 0 && !result.errors) {
      // If pasted data matches room grid, use directly
      // If pasted data is smaller (e.g., 4x4 for a 4-head test), place into grid
      const newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
      const offsetR = result.rows === rows ? 0 : Math.max(0, Math.floor((rows - result.rows) / 2));
      const offsetC = result.cols === cols ? 0 : Math.max(0, Math.floor((cols - result.cols) / 2));

      for (let r = 0; r < result.rows && r + offsetR < rows; r++) {
        for (let c = 0; c < result.cols && c + offsetC < cols; c++) {
          newGrid[r + offsetR][c + offsetC] = result.data[r][c];
        }
      }
      onChange(newGrid);
      setShowPaste(false);
      setPasteText('');
    }
  }

  function isEvaluated(r, c) {
    if (!evaluatedRegion) return true;
    return r >= evaluatedRegion.startRow && r <= evaluatedRegion.endRow &&
           c >= evaluatedRegion.startCol && c <= evaluatedRegion.endCol;
  }

  function isExcludedMiddle(r) {
    if (!testCondition?.excludeMiddleRows || !evaluatedRegion) return false;
    const totalEvalRows = evaluatedRegion.endRow - evaluatedRegion.startRow + 1;
    const midRow1 = evaluatedRegion.startRow + Math.floor(totalEvalRows / 2) - 1;
    const midRow2 = evaluatedRegion.startRow + Math.floor(totalEvalRows / 2);
    return r === midRow1 || r === midRow2;
  }

  function getCellColor(r, c, val) {
    if (val === null || val === undefined) return '';
    if (!isEvaluated(r, c)) return 'opacity-40';
    if (isExcludedMiddle(r)) return 'opacity-40';
    if (val === 0) return 'bg-black text-fail';
    if (!testCondition) return '';
    if (val < testCondition.minIndividual) return 'bg-fail/20 text-fail';
    if (val < testCondition.minAverage) return 'bg-warn/20 text-warn';
    return 'bg-pass/20 text-pass';
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded text-sm hover:bg-accent/25 transition-colors cursor-pointer"
        >
          Paste Data
        </button>
        <span className="text-xs text-text-muted">{rows} x {cols} grid — values in gpm/ft²</span>
      </div>

      {showPaste && (
        <div className="mb-3 p-3 bg-surface-light rounded border border-border">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste tab-separated values from spreadsheet..."
            className="w-full h-32 font-mono text-xs resize-y"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handlePaste}
              className="px-3 py-1.5 bg-accent text-white rounded text-sm hover:bg-accent/80 transition-colors cursor-pointer"
            >
              Parse & Fill
            </button>
            <button
              onClick={() => { setShowPaste(false); setPasteText(''); setParseErrors(null); setParseWarnings(null); }}
              className="px-3 py-1.5 text-text-muted text-sm hover:text-text cursor-pointer"
            >
              Cancel
            </button>
          </div>
          {parseErrors && (
            <div className="mt-2 text-xs text-fail">
              {parseErrors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          {parseWarnings && (
            <div className="mt-2 text-xs text-warn">
              {parseWarnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}
        </div>
      )}

      <div className="overflow-auto">
        <table className="border-collapse">
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  const evaluated = isEvaluated(r, c);
                  const excluded = isExcludedMiddle(r);
                  return (
                    <td
                      key={c}
                      className={`p-0 ${evaluated && !excluded ? 'border-2 border-border-light' : 'border border-border border-dashed'}`}
                    >
                      <input
                        type="text"
                        value={cell !== null && cell !== undefined ? cell : ''}
                        onChange={e => handleCellChange(r, c, e.target.value)}
                        className={`w-16 h-9 text-center font-mono text-xs border-0 rounded-none ${getCellColor(r, c, cell)} ${
                          excluded ? 'bg-surface-light' : ''
                        }`}
                        placeholder={evaluated ? '—' : ''}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
