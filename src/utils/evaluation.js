export function extractEvaluatedValues(gridData, evaluatedRegion, excludeMiddleRows = false) {
  const values = [];
  const { startRow, endRow, startCol, endCol } = evaluatedRegion;
  const totalEvalRows = endRow - startRow + 1;
  const midRow1 = startRow + Math.floor(totalEvalRows / 2) - 1;
  const midRow2 = startRow + Math.floor(totalEvalRows / 2);

  for (let r = startRow; r <= endRow; r++) {
    if (excludeMiddleRows && (r === midRow1 || r === midRow2)) continue;
    for (let c = startCol; c <= endCol; c++) {
      if (gridData[r] && gridData[r][c] !== undefined && gridData[r][c] !== null) {
        values.push({ value: gridData[r][c], row: r, col: c });
      }
    }
  }
  return values;
}

export function evaluateDistribution(gridData, testCondition, evaluatedRegion) {
  const evalEntries = extractEvaluatedValues(gridData, evaluatedRegion, testCondition.excludeMiddleRows);
  const evaluatedValues = evalEntries.map(e => e.value);

  if (evaluatedValues.length === 0) {
    return { average: 0, minValue: 0, maxValue: 0, lowPanCount: 0, dryPanCount: 0, result: 'incomplete', evaluatedCount: 0 };
  }

  const average = evaluatedValues.reduce((a, b) => a + b, 0) / evaluatedValues.length;
  const minValue = Math.min(...evaluatedValues);
  const maxValue = Math.max(...evaluatedValues);
  const lowPanCount = evaluatedValues.filter(v => v < testCondition.minIndividual && v > 0).length;
  const dryPanCount = evaluatedValues.filter(v => v === 0).length;

  const passes =
    average >= testCondition.minAverage &&
    lowPanCount <= testCondition.maxLowPans &&
    (testCondition.noDryPans ? dryPanCount === 0 : true);

  return {
    average: Math.round(average * 10000) / 10000,
    minValue: Math.round(minValue * 10000) / 10000,
    maxValue: Math.round(maxValue * 10000) / 10000,
    lowPanCount,
    dryPanCount,
    result: passes ? 'pass' : 'fail',
    evaluatedCount: evaluatedValues.length,
  };
}

export function computeIterationResult(conditionResults) {
  if (conditionResults.length === 0) return 'incomplete';
  const withData = conditionResults.filter(r => r !== null);
  if (withData.length === 0) return 'incomplete';
  if (withData.some(r => r.result === 'fail')) return 'fail';
  if (withData.length < conditionResults.length) return 'incomplete';
  return 'pass';
}

// Rolling 16 ft² area average for UL 199 §54.7 ECOH
export function computeRollingAreaAverage(gridData, blockRows, blockCols) {
  const rows = gridData.length;
  const cols = gridData[0]?.length || 0;
  let minBlockAvg = Infinity;

  for (let r = 0; r <= rows - blockRows; r++) {
    for (let c = 0; c <= cols - blockCols; c++) {
      let sum = 0;
      let count = 0;
      for (let br = r; br < r + blockRows; br++) {
        for (let bc = c; bc < c + blockCols; bc++) {
          sum += gridData[br][bc];
          count++;
        }
      }
      const avg = sum / count;
      if (avg < minBlockAvg) minBlockAvg = avg;
    }
  }
  return minBlockAvg === Infinity ? 0 : Math.round(minBlockAvg * 10000) / 10000;
}
