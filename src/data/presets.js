import { v4 as uuid } from 'uuid';
import { FM2000_431, FM2000_431_DEFAULTS } from './fm2000';
import { UL199_544, UL199_544_DEFAULTS } from './ul199';

export const STANDARD_OPTIONS = [
  { value: 'FM 2000 §4.31', label: 'FM 2000 §4.31 — Standard Coverage' },
  { value: 'FM 2000 §4.32', label: 'FM 2000 §4.32 — Extended Coverage HC-1' },
  { value: 'UL 199 §54.4', label: 'UL 199 §54.4 — 16-Pan Distribution' },
  { value: 'UL 199 §54.5', label: 'UL 199 §54.5 — 100-Pan Sidewall' },
  { value: 'Custom', label: 'Custom Test Configuration' },
];

export const K_FACTOR_OPTIONS = ['1.4', '1.9', '2.8', '4.2', '5.6', '8.0', '11.2', '14.0', '16.8'];

export const ORIENTATION_OPTIONS = [
  { value: 'pendent', label: 'Pendent' },
  { value: 'upright', label: 'Upright' },
  { value: 'sidewall', label: 'Sidewall' },
];

export const RESPONSE_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard Response' },
  { value: 'quick-response', label: 'Quick Response' },
];

export function generateTestConditions(standard, kFactor, orientation, testLayoutId) {
  if (standard === 'FM 2000 §4.31') {
    const conditions = FM2000_431[kFactor];
    if (!conditions) return [];
    return conditions.map(c => ({
      id: uuid(),
      testLayoutId,
      label: c.label,
      numSprinklers: c.numSprinklers,
      flowPerHead: c.flowPerHead,
      minAverage: c.minAvg,
      minIndividual: c.minIndividual,
      maxLowPans: FM2000_431_DEFAULTS.maxLowPans,
      noDryPans: FM2000_431_DEFAULTS.noDryPans,
      excludeMiddleRows: orientation === 'upright' && c.numSprinklers === 6,
      notes: '',
    }));
  }

  if (standard === 'UL 199 §54.4') {
    const data = UL199_544[kFactor];
    if (!data) return [];
    const minIndividual = data.minAvg * 0.75;
    return [
      {
        id: uuid(),
        testLayoutId,
        label: 'Test A (Standard Position)',
        numSprinklers: UL199_544_DEFAULTS.numSprinklers,
        flowPerHead: data.flowPerHead,
        minAverage: data.minAvg,
        minIndividual,
        maxLowPans: UL199_544_DEFAULTS.maxLowPans,
        noDryPans: UL199_544_DEFAULTS.noDryPans,
        excludeMiddleRows: false,
        notes: '',
      },
      {
        id: uuid(),
        testLayoutId,
        label: 'Test B (Transposed)',
        numSprinklers: UL199_544_DEFAULTS.numSprinklers,
        flowPerHead: data.flowPerHead,
        minAverage: data.minAvg,
        minIndividual,
        maxLowPans: UL199_544_DEFAULTS.maxLowPans,
        noDryPans: UL199_544_DEFAULTS.noDryPans,
        excludeMiddleRows: false,
        notes: 'Sprinklers transposed from Test A position',
      },
    ];
  }

  return [];
}

export function getDefaultLayoutConfig(standard) {
  if (standard === 'FM 2000 §4.31') {
    return {
      roomGridRows: FM2000_431_DEFAULTS.roomGridRows,
      roomGridCols: FM2000_431_DEFAULTS.roomGridCols,
      evaluatedRegion: { ...FM2000_431_DEFAULTS.evaluatedRegion },
      panSize: FM2000_431_DEFAULTS.panSize,
      deflectorToPanDistance: FM2000_431_DEFAULTS.deflectorToPanDistance,
      collectionTimeMinimum: FM2000_431_DEFAULTS.collectionTimeMinimum,
    };
  }
  if (standard === 'UL 199 §54.4') {
    return {
      roomGridRows: UL199_544_DEFAULTS.roomGridRows,
      roomGridCols: UL199_544_DEFAULTS.roomGridCols,
      evaluatedRegion: { ...UL199_544_DEFAULTS.evaluatedRegion },
      panSize: UL199_544_DEFAULTS.panSize,
      deflectorToPanDistance: UL199_544_DEFAULTS.deflectorToPanDistance,
      collectionTimeMinimum: UL199_544_DEFAULTS.collectionTimeMinimum,
    };
  }
  // Default for custom
  return {
    roomGridRows: 4,
    roomGridCols: 4,
    evaluatedRegion: { startRow: 0, endRow: 3, startCol: 0, endCol: 3 },
    panSize: '1 ft²',
    deflectorToPanDistance: '',
    collectionTimeMinimum: '',
  };
}
