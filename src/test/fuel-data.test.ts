import { describe, expect, it } from "vitest";
import { DATA, FUELS, INCOMES, REGIONS, YEARS, OBSERVATION_DATES, toCSV } from "@/lib/fuel-data";

describe("Granular fuel dataset", () => {
  it("contains exactly 27,468 records", () => {
    expect(DATA).toHaveLength(27468);
  });

  it("covers all 84 countries, 7 regions and 3 fuel types at every observation date", () => {
    expect(new Set(DATA.map((row) => row.country)).size).toBe(84);
    expect([...new Set(DATA.map((row) => row.region))]).toEqual([...REGIONS]);
    expect([...new Set(DATA.map((row) => row.fuel))]).toEqual([...FUELS]);
    const dates = new Map<string, Set<string>>();
    for (const row of DATA) {
      const combinations = dates.get(row.date) ?? new Set<string>();
      combinations.add(`${row.country}|${row.fuel}`);
      dates.set(row.date, combinations);
    }
    expect(dates.size).toBe(109);
    for (const combinations of dates.values()) expect(combinations.size).toBe(252);
  });

  it("uses unique dated observations with granular intervals in every year from 2020 to 2026", () => {
    expect(new Set(DATA.map((row) => `${row.country}|${row.fuel}|${row.date}`)).size).toBe(27468);
    for (const year of YEARS) {
      const dates = OBSERVATION_DATES.filter((point) => point.year === year);
      expect(dates.length).toBeGreaterThan(12);
      expect(dates[0]?.date).toBe(`${year}-01-01`);
      expect(dates.at(-1)?.date).toBe(`${year}-12-31`);
    }
    const series = DATA.filter((row) => row.country === "India" && row.fuel === "Petrol" && row.year === 2026);
    expect(new Set(series.map((row) => row.net)).size).toBeGreaterThan(1);
  });

  it("has complete valid variables and retail prices equal to base plus tax minus subsidy", () => {
    const invalid = DATA.filter((row) => !row.country ||
      !INCOMES.some((income) => income === row.income) ||
      row.date.slice(0, 4) !== String(row.year) ||
      new Date(row.date).toISOString().slice(0, 10) !== row.date ||
      [row.gdp, row.base, row.tax, row.subsidy, row.net, row.volatility].some((value) => !Number.isFinite(value) || value < 0) ||
      row.gdp <= 0 || row.net <= 0 || row.volatility > 100 ||
      Math.abs(row.net - (row.base + row.tax - row.subsidy)) > 0.000001);
    expect(invalid).toEqual([]);
  });

  it("exports all 27,468 records with their observation dates", () => {
    const lines = toCSV(DATA).split("\n");
    expect(lines).toHaveLength(27469);
    expect(lines[0]?.split(",")).toHaveLength(12);
    expect(lines[0]).toContain("Observation Date");
    expect(lines[1]).toContain(`"${DATA[0]?.date}"`);
  });
});