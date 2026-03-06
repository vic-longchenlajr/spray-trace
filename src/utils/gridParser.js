export function parseGridFromClipboard(text) {
  if (!text || !text.trim()) {
    return { data: [], rows: 0, cols: 0, errors: ['No data provided'] };
  }

  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  const errors = [];
  const data = [];

  for (let i = 0; i < lines.length; i++) {
    // Split by tabs first, then by 2+ spaces
    let cells = lines[i].split('\t');
    if (cells.length <= 1) {
      cells = lines[i].trim().split(/\s{2,}/);
    }
    // Final fallback: split by any whitespace if we still have a single cell with spaces
    if (cells.length <= 1 && lines[i].trim().includes(' ')) {
      cells = lines[i].trim().split(/\s+/);
    }

    const row = [];
    for (let j = 0; j < cells.length; j++) {
      const trimmed = cells[j].trim();
      if (trimmed === '') continue;
      const val = parseFloat(trimmed);
      if (isNaN(val)) {
        errors.push(`Row ${i + 1}, Col ${j + 1}: "${trimmed}" is not a number`);
        row.push(null);
      } else {
        row.push(val);
      }
    }
    if (row.length > 0) {
      data.push(row);
    }
  }

  // Validate uniform column count
  const cols = data.length > 0 ? Math.max(...data.map(r => r.length)) : 0;
  for (let i = 0; i < data.length; i++) {
    while (data[i].length < cols) {
      data[i].push(0);
    }
  }

  // Check for dry pans
  const dryWarnings = [];
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      if (data[r][c] === 0) {
        dryWarnings.push(`Row ${r + 1}, Col ${c + 1}: DRY PAN (zero value)`);
      }
    }
  }

  return {
    data,
    rows: data.length,
    cols,
    errors: errors.length > 0 ? errors : null,
    warnings: dryWarnings.length > 0 ? dryWarnings : null,
  };
}

export function gridToString(gridData) {
  return gridData.map(row => row.map(v => v.toFixed(3)).join('\t')).join('\n');
}
