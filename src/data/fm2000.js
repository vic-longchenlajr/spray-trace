// FM 2000 Section 4.31 — Standard Coverage (Upright & Pendent)
export const FM2000_431 = {
  "2.8": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 6.4,  minAvg: 0.064, minIndividual: 0.050 },
    { label: "4-Head Mid",  numSprinklers: 4, flowPerHead: 8.3,  minAvg: 0.083, minIndividual: 0.060 },
    { label: "4-Head High", numSprinklers: 4, flowPerHead: 12.0, minAvg: 0.120, minIndividual: 0.090 },
    { label: "6-Head",      numSprinklers: 6, flowPerHead: 8.3,  minAvg: 0.083, minIndividual: 0.060 },
  ],
  "5.6": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 12.8, minAvg: 0.128, minIndividual: 0.095 },
    { label: "4-Head Mid",  numSprinklers: 4, flowPerHead: 16.6, minAvg: 0.166, minIndividual: 0.125 },
    { label: "4-Head High", numSprinklers: 4, flowPerHead: 24.0, minAvg: 0.240, minIndividual: 0.180 },
    { label: "6-Head",      numSprinklers: 6, flowPerHead: 16.6, minAvg: 0.166, minIndividual: 0.125 },
  ],
  "8.0": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 17.9, minAvg: 0.179, minIndividual: 0.135 },
    { label: "4-Head Mid",  numSprinklers: 4, flowPerHead: 23.2, minAvg: 0.232, minIndividual: 0.175 },
    { label: "4-Head High", numSprinklers: 4, flowPerHead: 33.6, minAvg: 0.336, minIndividual: 0.250 },
    { label: "6-Head",      numSprinklers: 6, flowPerHead: 23.2, minAvg: 0.232, minIndividual: 0.175 },
  ],
  "11.2": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 35.5, minAvg: 0.355, minIndividual: 0.265 },
    { label: "4-Head Mid",  numSprinklers: 4, flowPerHead: 50.0, minAvg: 0.500, minIndividual: 0.375 },
    { label: "6-Head Low",  numSprinklers: 6, flowPerHead: 36.0, minAvg: 0.360, minIndividual: 0.270 },
    { label: "6-Head High", numSprinklers: 6, flowPerHead: 50.0, minAvg: 0.500, minIndividual: 0.375 },
  ],
  "14.0": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 37.5, minAvg: 0.375, minIndividual: 0.280 },
    { label: "4-Head High", numSprinklers: 4, flowPerHead: 60.3, minAvg: 0.603, minIndividual: 0.450 },
    { label: "6-Head Low",  numSprinklers: 6, flowPerHead: 37.5, minAvg: 0.375, minIndividual: 0.280 },
    { label: "6-Head High", numSprinklers: 6, flowPerHead: 60.3, minAvg: 0.603, minIndividual: 0.450 },
  ],
  "16.8": [
    { label: "4-Head Low",  numSprinklers: 4, flowPerHead: 44.4, minAvg: 0.444, minIndividual: 0.330 },
    { label: "4-Head High", numSprinklers: 4, flowPerHead: 73.2, minAvg: 0.732, minIndividual: 0.550 },
    { label: "6-Head Low",  numSprinklers: 6, flowPerHead: 44.5, minAvg: 0.445, minIndividual: 0.335 },
    { label: "6-Head High", numSprinklers: 6, flowPerHead: 73.3, minAvg: 0.733, minIndividual: 0.550 },
  ],
};

// FM 2000 Section 4.31 — Standard Coverage (Sidewall)
export const FM2000_431_SIDEWALL = {
  gridRows: 10,
  gridCols: 10,
  panSize: "12x12 in",
  minIndividual: 0.030,
  minAvg: 0.050,
  maxLowPans: 2,
  nonAdjacentCheck: true,
  noDryPans: true,
  kFactorFlows: {
    "5.6": { flowPerHead: 15 },
    "8.0": { flowPerHead: 21 },
  },
  backWallWetting: true, // boolean pass/fail
};

// FM 2000 Section 4.32 — Extended Coverage HC-1
export const FM2000_432 = {
  "5.6": [
    { label: "16x16 ft", flowPerHead: 26, pressure: 22, deflectorToCeiling: "4 in" },
    { label: "18x18 ft", flowPerHead: 33, pressure: 35, deflectorToCeiling: "4 in" },
    { label: "20x20 ft", flowPerHead: 40, pressure: 51, deflectorToCeiling: "4 in" },
  ],
  "8.0": [
    { label: "16x16 ft", flowPerHead: 26, pressure: 11, deflectorToCeiling: "4 in" },
    { label: "18x18 ft", flowPerHead: 33, pressure: 17, deflectorToCeiling: "4 in" },
    { label: "20x20 ft", flowPerHead: 40, pressure: 25, deflectorToCeiling: "4 in" },
  ],
  "11.2": [
    { label: "16x16 ft", flowPerHead: 30, pressure: 7, deflectorToCeiling: "4 in" },
    { label: "18x18 ft", flowPerHead: 33, pressure: 9, deflectorToCeiling: "4 in" },
    { label: "20x20 ft", flowPerHead: 40, pressure: 13, deflectorToCeiling: "4 in" },
  ],
  "14.0": [
    { label: "16x16 ft", flowPerHead: 37, pressure: 7, deflectorToCeiling: "4 in" },
    { label: "18x18 ft", flowPerHead: 37, pressure: 7, deflectorToCeiling: "4 in" },
    { label: "20x20 ft", flowPerHead: 40, pressure: 8, deflectorToCeiling: "4 in" },
  ],
};

export const FM2000_432_DEFAULTS = {
  minAvg: 0.040,
  minIndividual: 0.015,
  maxLowPans: 1,
  noDryPans: true,
  panSize: "0.5m x 0.5m",
  collectionTimeMinimum: "6 min",
  wallWetting: true, // boolean pass/fail
};

// All standard 4.31 conditions share these defaults
export const FM2000_431_DEFAULTS = {
  maxLowPans: 1,
  noDryPans: true,
  panSize: "1 ft²",
  roomGridRows: 8,
  roomGridCols: 8,
  evaluatedRegion: { startRow: 2, endRow: 5, startCol: 2, endCol: 5 },
  deflectorToPanDistance: "7.5 ft",
  collectionTimeMinimum: "3 min",
};
