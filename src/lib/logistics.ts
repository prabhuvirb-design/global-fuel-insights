import { YEARS, type Row } from "@/lib/fuel-data";

export function countryPrices(rows: Row[]) {
  const grouped = new Map<string, { country: string; region: string; price: number; volatility: number; count: number }>();
  for (const row of rows) {
    const item = grouped.get(row.country) ?? { country: row.country, region: row.region, price: 0, volatility: 0, count: 0 };
    item.price += row.net;
    item.volatility += row.volatility;
    item.count++;
    grouped.set(row.country, item);
  }
  return [...grouped.values()].map((item) => ({ country: item.country, region: item.region, price: item.price / item.count, volatility: item.volatility / item.count })).sort((a, b) => a.price - b.price || a.country.localeCompare(b.country));
}

export function cheapestRefueling(rows: Row[], liters: number) {
  if (!Number.isFinite(liters) || liters <= 0) return [];
  return countryPrices(rows).slice(0, 3).map((country) => ({ ...country, total: country.price * liters }));
}

export function volatilityRisk(value: number): "High Volatility" | "Moderate" | "Stable" {
  return value >= 60 ? "High Volatility" : value >= 35 ? "Moderate" : "Stable";
}

export type ForecastPoint = { year: number; historical?: number; forecast?: number; band?: [number, number] };

export function priceForecast(rows: Row[]): ForecastPoint[] {
  const history = YEARS.flatMap((year) => {
    const selected = rows.filter((row) => row.year === year);
    return selected.length ? [{ year, historical: selected.reduce((sum, row) => sum + row.net, 0) / selected.length }] : [];
  });
  const latest = history.at(-1);
  if (!latest || latest.year !== 2026 || history.length < 3) return history;
  const recent = history.slice(-3);
  const meanYear = recent.reduce((sum, point) => sum + point.year, 0) / recent.length;
  const meanPrice = recent.reduce((sum, point) => sum + point.historical, 0) / recent.length;
  const slope = recent.reduce((sum, point) => sum + (point.year - meanYear) * (point.historical - meanPrice), 0) / recent.reduce((sum, point) => sum + (point.year - meanYear) ** 2, 0);
  const forecast = Math.max(0.05, meanPrice + slope * (2027 - meanYear));
  const changes = history.slice(1).map((point, i) => point.historical - (history[i]?.historical ?? point.historical));
  const spread = Math.max(forecast * 0.1, Math.sqrt(changes.reduce((sum, change) => sum + change ** 2, 0) / changes.length));
  return [...history.slice(0, -1), { ...latest, forecast: latest.historical, band: [latest.historical, latest.historical] }, { year: 2027, forecast, band: [Math.max(0.05, forecast - spread), forecast + spread] }];
}