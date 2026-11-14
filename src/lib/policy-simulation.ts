import { YEARS, type Row } from "@/lib/fuel-data";

export const TAX_CHANGE_MIN = -50;
export const TAX_CHANGE_MAX = 50;

export function simulatePolicy(row: Pick<Row, "base" | "tax" | "subsidy">, percent: number) {
  const change = Math.min(TAX_CHANGE_MAX, Math.max(TAX_CHANGE_MIN, percent));
  const tax = row.tax * (1 + change / 100);
  return { base: row.base, tax, subsidy: row.subsidy, retail: Math.max(0.05, row.base + tax - row.subsidy) };
}

export function policyTrend(rows: Row[], percent: number) {
  return YEARS.flatMap((year) => {
    const selected = rows.filter((row) => row.year === year);
    if (!selected.length) return [];
    const totals = selected.reduce((sum, row) => {
      const simulated = simulatePolicy(row, percent);
      return { base: sum.base + simulated.base, tax: sum.tax + simulated.tax, subsidy: sum.subsidy + simulated.subsidy, retail: sum.retail + simulated.retail };
    }, { base: 0, tax: 0, subsidy: 0, retail: 0 });
    return [{ year, base: totals.base / selected.length, tax: totals.tax / selected.length, subsidy: -totals.subsidy / selected.length, retail: totals.retail / selected.length }];
  });
}

export function regionalLeaders(rows: Row[], percent: number) {
  const countries = new Map<string, { country: string; region: string; base: number; tax: number; subsidy: number }>();
  for (const row of rows) {
    const current = countries.get(row.country) ?? { country: row.country, region: row.region, base: 0, tax: 0, subsidy: 0 };
    const simulated = simulatePolicy(row, percent);
    current.base += simulated.base;
    current.tax += simulated.tax;
    current.subsidy += simulated.subsidy;
    countries.set(row.country, current);
  }
  const regions = [...new Set(rows.map((row) => row.region))];
  return regions.map((region) => {
    const selected = [...countries.values()].filter((country) => country.region === region);
    const taxLeader = [...selected].sort((a, b) => b.tax / b.base - a.tax / a.base)[0];
    const subsidyLeader = [...selected].sort((a, b) => b.subsidy / b.base - a.subsidy / a.base)[0];
    return { region, taxCountry: taxLeader?.country, subsidyCountry: subsidyLeader?.country,
      taxIntensity: taxLeader ? taxLeader.tax / taxLeader.base * 100 : 0,
      subsidyIntensity: subsidyLeader ? subsidyLeader.subsidy / subsidyLeader.base * 100 : 0 };
  });
}