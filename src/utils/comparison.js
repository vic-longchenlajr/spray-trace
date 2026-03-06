export function computeDeltaGrid(gridA, gridB) {
  const rows = Math.max(gridA.length, gridB.length);
  const cols = Math.max(
    gridA[0]?.length || 0,
    gridB[0]?.length || 0
  );
  const delta = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const a = gridA[r]?.[c] ?? 0;
      const b = gridB[r]?.[c] ?? 0;
      row.push(Math.round((b - a) * 10000) / 10000);
    }
    delta.push(row);
  }
  return delta;
}

export function computeTrend(iterations, results) {
  // Look at last 3 iterations' average density to determine trend
  if (iterations.length < 2) return 'flat';
  const recent = iterations.slice(-3);
  const avgs = recent.map(iter => {
    const iterResults = results.filter(r => r.iterationId === iter.id);
    if (iterResults.length === 0) return null;
    const avg = iterResults.reduce((sum, r) => sum + (r.average || 0), 0) / iterResults.length;
    return avg;
  }).filter(a => a !== null);

  if (avgs.length < 2) return 'flat';
  const last = avgs[avgs.length - 1];
  const prev = avgs[avgs.length - 2];
  const diff = last - prev;
  if (diff > 0.005) return 'up';
  if (diff < -0.005) return 'down';
  return 'flat';
}
