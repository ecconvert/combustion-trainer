export const FUELS = {
  "Natural Gas": {
    key: "Natural Gas",
    formula: { C: 1, H: 4, O: 0 },
    HHV: 1000,
    unit: "scfh",
    targets: { O2: [3, 6], stackF: [300, 475], COafMax: 100 },
  },
  Propane: {
    key: "Propane",
    formula: { C: 3, H: 8, O: 0 },
    HHV: 2500,
    unit: "scfh",
    targets: { O2: [3, 6], stackF: [320, 500], COafMax: 100 },
  },
  "Fuel Oil #2": {
    key: "Fuel Oil #2",
    formula: { C: 12, H: 23, O: 0 },
    HHV: 138500,
    unit: "gph",
    targets: { O2: [2, 5], stackF: [350, 550], COafMax: 200 },
  },
  Biodiesel: {
    key: "Biodiesel",
    formula: { C: 19, H: 36, O: 2 },
    HHV: 119000,
    unit: "gph",
    targets: { O2: [2, 5], stackF: [340, 520], COafMax: 200 },
  },
};
