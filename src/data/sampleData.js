import { v4 as uuid } from 'uuid';
import { db } from '../db/database';

export async function seedSampleData() {
  const programId = uuid();
  const layoutId = uuid();
  const cond4Low = uuid();
  const cond4Mid = uuid();
  const cond4High = uuid();
  const cond6Head = uuid();
  const iter1Id = uuid();
  const iter2Id = uuid();

  const now = new Date().toISOString();

  // Program
  await db.programs.put({
    id: programId,
    name: 'In-Rack K5.6',
    modelNumber: 'In-Rack',
    projectNumber: 'R1430.1C',
    kFactor: 5.6,
    orientation: 'pendent',
    responseType: 'standard',
    temperatureRating: '155\u00B0F',
    notes: 'Sample program for demonstration',
    createdAt: now,
    updatedAt: now,
  });

  // Test Layout
  await db.testLayouts.put({
    id: layoutId,
    programId,
    name: 'FM 2000 \u00A74.31 Standard Coverage',
    standard: 'FM 2000 \u00A74.31',
    standardSection: '4.31',
    panSize: '1 ft\u00B2',
    roomGridRows: 8,
    roomGridCols: 8,
    evaluatedRegion: { startRow: 2, endRow: 5, startCol: 2, endCol: 5 },
    deflectorToPanDistance: '7.5 ft',
    collectionTimeMinimum: '3 min',
    seededFromIterationId: null,
    createdAt: now,
  });

  // Test Conditions (K5.6 FM 2000 4.31)
  const conditions = [
    { id: cond4Low, testLayoutId: layoutId, label: '4-Head Low', numSprinklers: 4, flowPerHead: 12.8, minAverage: 0.128, minIndividual: 0.095, maxLowPans: 1, noDryPans: true, excludeMiddleRows: false, notes: '' },
    { id: cond4Mid, testLayoutId: layoutId, label: '4-Head Mid', numSprinklers: 4, flowPerHead: 16.6, minAverage: 0.166, minIndividual: 0.125, maxLowPans: 1, noDryPans: true, excludeMiddleRows: false, notes: '' },
    { id: cond4High, testLayoutId: layoutId, label: '4-Head High', numSprinklers: 4, flowPerHead: 24.0, minAverage: 0.240, minIndividual: 0.180, maxLowPans: 1, noDryPans: true, excludeMiddleRows: false, notes: '' },
    { id: cond6Head, testLayoutId: layoutId, label: '6-Head', numSprinklers: 6, flowPerHead: 16.6, minAverage: 0.166, minIndividual: 0.125, maxLowPans: 1, noDryPans: true, excludeMiddleRows: false, notes: '' },
  ];
  for (const c of conditions) await db.testConditions.put(c);

  // Iteration 2 — 4-Head Mid data (FAIL)
  await db.iterations.put({
    id: iter1Id,
    testLayoutId: layoutId,
    sequenceLabel: '2',
    date: '2026-03-04',
    photoData: null,
    notes: 'Initial tine geometry, narrow slots',
    overallAutoResult: 'fail',
    overrideResult: null,
    overrideReason: null,
    createdAt: '2026-03-04T10:00:00Z',
  });

  // 4-Head Mid result for Iteration 2
  const grid4Mid = [
    [0.11, 0.11, 0.10, 0.10],
    [0.11, 0.12, 0.11, 0.10],
    [0.12, 0.13, 0.12, 0.10],
    [0.14, 0.13, 0.12, 0.10],
  ];
  const avg4Mid = grid4Mid.flat().reduce((a, b) => a + b, 0) / 16;
  await db.distributionResults.put({
    id: uuid(),
    iterationId: iter1Id,
    testConditionId: cond4Mid,
    gridData: grid4Mid,
    average: Math.round(avg4Mid * 10000) / 10000,
    minValue: 0.10,
    maxValue: 0.14,
    lowPanCount: 13,
    dryPanCount: 0,
    autoResult: 'fail',
    overrideResult: null,
    overrideReason: null,
    testedDate: '2026-03-04',
    technician: 'Lab Tech',
    notes: '',
  });

  // Iteration 3.1 — 6-Head data (FAIL)
  await db.iterations.put({
    id: iter2Id,
    testLayoutId: layoutId,
    sequenceLabel: '3.1',
    date: '2026-03-06',
    photoData: null,
    notes: 'Widened outer tine slots by 0.5mm, added 2 degree forward cant',
    overallAutoResult: 'fail',
    overrideResult: null,
    overrideReason: null,
    createdAt: '2026-03-06T10:00:00Z',
  });

  const grid6Head = [
    [0.05, 0.08, 0.15, 0.20, 0.16, 0.19, 0.16, 0.15],
    [0.06, 0.08, 0.11, 0.11, 0.13, 0.32, 0.25, 0.13],
    [0.06, 0.06, 0.07, 0.08, 0.15, 0.30, 0.25, 0.13],
    [0.07, 0.07, 0.06, 0.08, 0.16, 0.19, 0.15, 0.12],
    [0.07, 0.07, 0.07, 0.08, 0.13, 0.20, 0.17, 0.13],
    [0.06, 0.08, 0.09, 0.09, 0.12, 0.28, 0.32, 0.16],
    [0.06, 0.09, 0.14, 0.13, 0.11, 0.28, 0.35, 0.14],
    [0.06, 0.09, 0.19, 0.21, 0.13, 0.15, 0.20, 0.16],
  ];

  // Evaluated region center 4x4 (rows 2-5, cols 2-5)
  const evalVals = [];
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 5; c++) {
      evalVals.push(grid6Head[r][c]);
    }
  }
  const avg6 = evalVals.reduce((a, b) => a + b, 0) / evalVals.length;
  const lowCount = evalVals.filter(v => v < 0.125 && v > 0).length;

  await db.distributionResults.put({
    id: uuid(),
    iterationId: iter2Id,
    testConditionId: cond6Head,
    gridData: grid6Head,
    average: Math.round(avg6 * 10000) / 10000,
    minValue: Math.min(...evalVals),
    maxValue: Math.max(...evalVals),
    lowPanCount: lowCount,
    dryPanCount: 0,
    autoResult: 'fail',
    overrideResult: null,
    overrideReason: null,
    testedDate: '2026-03-06',
    technician: 'Lab Tech',
    notes: '',
  });
}
