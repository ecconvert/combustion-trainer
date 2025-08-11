export interface SavedReading {
  timestamp: number;
  fuel: string;
  fireRate: number;
  O2: number;
  CO2: number;
  CO: number;
  NOx: number;
  stackTemp: number;
  excessAir: number;
  efficiency: number;
  ambientT: number;
  ambientP: number;
  ambientRH: number;
}

const KEY = 'ct_saved_readings';

export function loadSaved(): SavedReading[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as SavedReading[]) : [];
}

export function saveReading(r: SavedReading) {
  if (typeof localStorage === 'undefined') return;
  const arr = loadSaved();
  arr.push(r);
  localStorage.setItem(KEY, JSON.stringify(arr));
}

export function clearSaved() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function exportCSV(readings: SavedReading[]): string {
  const header =
    'timestamp,fuel,fireRate,O2,CO2,CO,NOx,stackTemp,excessAir,efficiency,ambientT,ambientP,ambientRH';
  const rows = readings.map((r) =>
    [
      r.timestamp,
      r.fuel,
      r.fireRate,
      r.O2,
      r.CO2,
      r.CO,
      r.NOx,
      r.stackTemp,
      r.excessAir,
      r.efficiency,
      r.ambientT,
      r.ambientP,
      r.ambientRH
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
