export const REGIONS = ["North America","Latin America","Europe","Middle East & North Africa","Sub-Saharan Africa","South Asia","East Asia & Pacific"] as const;
export const FUELS = ["Petrol","Diesel","LPG"] as const;
export const INCOMES = ["High","Upper-Middle","Lower-Middle","Low"] as const;
export const YEARS = [2020,2021,2022,2023,2024,2025,2026] as const;

const COUNTRIES: Record<(typeof REGIONS)[number], string[]> = {
  "North America": ["United States","Canada","Mexico","Bahamas","Jamaica","Trinidad & Tobago","Costa Rica","Panama","Guatemala","Honduras","Dominican Rep.","Cuba"],
  "Latin America": ["Brazil","Argentina","Chile","Colombia","Peru","Venezuela","Ecuador","Bolivia","Uruguay","Paraguay","Guyana","Suriname"],
  "Europe": ["Germany","France","United Kingdom","Italy","Spain","Netherlands","Norway","Poland","Sweden","Greece","Ukraine","Romania"],
  "Middle East & North Africa": ["Saudi Arabia","UAE","Qatar","Kuwait","Iran","Iraq","Egypt","Morocco","Algeria","Jordan","Oman","Tunisia"],
  "Sub-Saharan Africa": ["Nigeria","South Africa","Kenya","Ethiopia","Ghana","Angola","Tanzania","Uganda","Senegal","Zambia","Mozambique","Côte d'Ivoire"],
  "South Asia": ["India","Pakistan","Bangladesh","Sri Lanka","Nepal","Bhutan","Maldives","Afghanistan","Myanmar","Kazakhstan","Uzbekistan","Turkmenistan"],
  "East Asia & Pacific": ["China","Japan","South Korea","Australia","Indonesia","Vietnam","Thailand","Philippines","Malaysia","Singapore","New Zealand","Mongolia"],
};

const HIGH = new Set(["United States","Canada","Bahamas","Trinidad & Tobago","Panama","Chile","Uruguay","Germany","France","United Kingdom","Italy","Spain","Netherlands","Norway","Poland","Sweden","Greece","Romania","Saudi Arabia","UAE","Qatar","Kuwait","Oman","Japan","South Korea","Australia","Singapore","New Zealand","Guyana"]);
const LOW = new Set(["Ethiopia","Uganda","Mozambique","Afghanistan","Senegal","Zambia"]);
const LOWER = new Set(["Honduras","Bolivia","Venezuela","Ukraine","Iran","Egypt","Morocco","Algeria","Jordan","Tunisia","Nigeria","Kenya","Ghana","Angola","Tanzania","Côte d'Ivoire","India","Pakistan","Bangladesh","Sri Lanka","Nepal","Bhutan","Myanmar","Uzbekistan","Vietnam","Philippines","Mongolia","Cuba"]);

export type Row = { country: string; region: string; income: string; gdp: number; fuel: string; year: number; date: string; base: number; tax: number; subsidy: number; net: number; volatility: number };

// 109 shared observation dates × 84 countries × 3 fuels = 27,468 records.
// Evenly spaced within each year, including January 1 and December 31.
export const OBSERVATION_DATES = YEARS.flatMap((year) => {
  const count = year <= 2023 ? 16 : 15;
  const start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year, 11, 31) - start) / 86400000;
  return Array.from({ length: count }, (_, index) => ({
    year,
    date: new Date(start + Math.round(index * days / (count - 1)) * 86400000).toISOString().slice(0, 10),
    phase: index / (count - 1),
  }));
});

function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const yearShock: Record<(typeof YEARS)[number], number> = { 2020: 0.78, 2021: 0.95, 2022: 1.32, 2023: 1.12, 2024: 1.05, 2025: 1.0, 2026: 1.03 };
const yearVol: Record<(typeof YEARS)[number], number> = { 2020: 1.4, 2021: 1.0, 2022: 1.6, 2023: 1.1, 2024: 0.9, 2025: 0.85, 2026: 0.95 };
const fuelMult: Record<(typeof FUELS)[number], number> = { Petrol: 1, Diesel: 1.06, LPG: 0.55 };

export const DATA: Row[] = (() => {
  const r = rng(20261114); const out: Row[] = [];
  for (const region of REGIONS) for (const country of COUNTRIES[region]) {
    const p = r(); const rich = region === "Europe" || region === "North America" || region === "East Asia & Pacific";
    const income = INCOMES[rich ? (p < 0.6 ? 0 : p < 0.9 ? 1 : 2) : Math.floor(p * 4)] as (typeof INCOMES)[number];
    const gdpBase = { High: 45000, "Upper-Middle": 11000, "Lower-Middle": 3800, Low: 1100 }[income];
    const gdp0 = gdpBase * (0.6 + r() * 0.9);
    const taxRate = { High: 0.55, "Upper-Middle": 0.3, "Lower-Middle": 0.18, Low: 0.12 }[income] * (0.6 + r() * 0.8);
    const subRate = region === "Middle East & North Africa" ? 0.35 + r() * 0.4 : r() * 0.25;
    const vol0 = 20 + r() * 40 + (income === "Low" ? 15 : 0);
    OBSERVATION_DATES.forEach(({ year, date, phase }) => FUELS.forEach((fuel) => {
      const seasonal = 1 + 0.06 * Math.sin(phase * Math.PI * 2);
      const base = +(0.55 * yearShock[year] * fuelMult[fuel] * seasonal * (0.96 + r() * 0.08)).toFixed(3);
      const tax = +(base * taxRate).toFixed(3);
      const subsidy = +(base * subRate * (0.95 + r() * 0.1)).toFixed(3);
      out.push({ country, region, income, gdp: Math.round(gdp0 * (1 + 0.025 * (year - 2020 + phase)) * (year === 2020 ? 0.95 : 1)), fuel, year, date,
        base, tax, subsidy, net: +(base + tax - subsidy).toFixed(3),
        volatility: +Math.min(100, vol0 * yearVol[year] * seasonal * (0.9 + r() * 0.2)).toFixed(1) });
    }));
  }
  return out;
})();

export function toCSV(rows: Row[]) {
  const h = ["Country","Region","Income Level","Year","Observation Date","GDP per Capita (USD)","Fuel Type","Base Price (USD/L)","Tax Amount (USD/L)","Subsidy Amount (USD/L)","Net Retail Price (USD/L)","Volatility Index"];
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return [h.join(","), ...rows.map((x) => [x.country,x.region,x.income,x.year,x.date,x.gdp,x.fuel,x.base,x.tax,x.subsidy,x.net,x.volatility].map(esc).join(","))].join("\n");
}
