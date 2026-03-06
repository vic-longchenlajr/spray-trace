// UL 199 Section 54.4 — 16-Pan Distribution
export const UL199_544 = {
  "1.4": { flowPerHead: 3.75,  minAvg: 0.0375 },
  "1.9": { flowPerHead: 5.25,  minAvg: 0.0525 },
  "2.8": { flowPerHead: 7.50,  minAvg: 0.0750 },
  "4.2": { flowPerHead: 11.25, minAvg: 0.1125 },
  "5.6": { flowPerHead: 15.00, minAvg: 0.1500 },
  "8.0": { flowPerHead: 21.00, minAvg: 0.2100 },
};

export const UL199_544_DEFAULTS = {
  panSize: "1 ft²",
  roomGridRows: 4,
  roomGridCols: 4,
  evaluatedRegion: { startRow: 0, endRow: 3, startCol: 0, endCol: 3 },
  deflectorToPanDistance: "7 ft 6 in",
  collectionTimeMinimum: "10 min",
  maxLowPans: 1,
  noDryPans: true,
  numSprinklers: 4,
  spacing: "10x10 ft",
};

// UL 199 Section 54.5 — 100-Pan Sidewall
export const UL199_545 = {
  "5.6": { minAvg: 0.050, minIndividual: 0.030 },
  "8.0": { minAvg: 0.070, minIndividual: 0.030 },
};

export const UL199_545_DEFAULTS = {
  gridRows: 10,
  gridCols: 10,
  panSize: "1 ft²",
  numSprinklers: 2,
  spacing: "10 ft",
  noDryPans: true,
  maxLowPans: 1,
  wallWetting: true,
};

// UL 199 Section 54.7 — ECOH Distribution
export const UL199_547_DEFAULTS = {
  panSize: "19.7 in x 19.7 in",
  noDryPans: true,
  numSprinklers: 4,
};
