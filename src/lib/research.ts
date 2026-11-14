import { type Row } from "@/lib/fuel-data";

export function researchCountries(rows: Row[]) {
  const groups = new Map<string, { country: string; income: string; gdp: number; tax: number; subsidy: number; base: number; count: number }>();
  for (const row of rows) {
    const group = groups.get(row.country) ?? { country: row.country, income: row.income, gdp: 0, tax: 0, subsidy: 0, base: 0, count: 0 };
    group.gdp += row.gdp; group.tax += row.tax; group.subsidy += row.subsidy; group.base += row.base; group.count++;
    groups.set(row.country, group);
  }
  return [...groups.values()].map((group) => ({ country: group.country, income: group.income, gdp: group.gdp / group.count,
    tax: group.tax / group.count, subsidy: group.subsidy / group.count,
    taxRate: group.base > 0 ? group.tax / group.base * 100 : 0,
    subsidyRate: group.base > 0 ? group.subsidy / group.base * 100 : 0 }));
}

export type ResearchCountry = ReturnType<typeof researchCountries>[number];
export function researchInsight(countries: ResearchCountry[]) {
  const high = countries.filter((country) => country.income === "High");
  const developing = countries.filter((country) => ["Upper-Middle", "Lower-Middle", "Low"].includes(country.income));
  return { highCount: high.length, developingCount: developing.length,
    highTax: high.length ? high.reduce((sum, country) => sum + country.tax, 0) / high.length : null,
    developingSubsidy: developing.length ? developing.reduce((sum, country) => sum + country.subsidy, 0) / developing.length : null };
}

export function regressionTrend(countries: ResearchCountry[], key: "taxRate" | "subsidyRate") {
  if (countries.length < 2) return [];
  const meanX = countries.reduce((sum, country) => sum + country.gdp, 0) / countries.length;
  const meanY = countries.reduce((sum, country) => sum + country[key], 0) / countries.length;
  const variance = countries.reduce((sum, country) => sum + (country.gdp - meanX) ** 2, 0);
  if (variance === 0) return [];
  const slope = countries.reduce((sum, country) => sum + (country.gdp - meanX) * (country[key] - meanY), 0) / variance;
  return [Math.min(...countries.map((country) => country.gdp)), Math.max(...countries.map((country) => country.gdp))].map((gdp) => ({ gdp, [key]: meanY + slope * (gdp - meanX) }));
}