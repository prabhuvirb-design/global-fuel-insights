import { describe, expect, it } from "vitest";
import { researchCountries, researchInsight, regressionTrend } from "@/lib/research";
import { type Row } from "@/lib/fuel-data";
const row: Row = { country: "A", region: "Europe", income: "High", gdp: 10000, fuel: "Diesel", year: 2026, date: "2026-01-01", base: 1, tax: 0.4, subsidy: 0.1, net: 1.3, volatility: 20 };
describe("Macroeconomic research", () => {
  it("compares high-income average taxes with developing-country average subsidies", () => {
    const countries = researchCountries([row, { ...row, country: "B", tax: 0.6 }, { ...row, country: "C", income: "Upper-Middle", subsidy: 0.2 }, { ...row, country: "D", income: "Lower-Middle", subsidy: 0.3 }, { ...row, country: "E", income: "Low", subsidy: 0.4 }]);
    const insight = researchInsight(countries);
    expect(insight.highTax).toBe(0.5);
    expect(insight.developingSubsidy).toBeCloseTo(0.3);
    expect(insight.highCount).toBe(2);
    expect(insight.developingCount).toBe(3);
  });
  it("expresses tax and subsidy rates as percentages of base cost", () => {
    const country = researchCountries([{ ...row, base: 2, tax: 0.5, subsidy: 0.2 }])[0];
    expect(country?.taxRate).toBe(25);
    expect(country?.subsidyRate).toBe(10);
  });
  it("weights each country equally in the insight", () => {
    const insight = researchInsight(researchCountries([row, { ...row, year: 2025 }, { ...row, country: "B", tax: 0.8 }]));
    expect(insight.highTax).toBeCloseTo(0.6);
  });
  it("returns missing comparisons rather than zero for absent groups", () => {
    expect(researchInsight(researchCountries([row])).developingSubsidy).toBeNull();
    expect(researchInsight([]).highTax).toBeNull();
  });
  it("fits a least-squares trend to the country rates", () => {
    const countries = researchCountries([row, { ...row, country: "B", gdp: 20000, tax: 0.8 }, { ...row, country: "C", gdp: 30000, tax: 1.2 }]);
    expect(regressionTrend(countries, "taxRate")).toEqual([{ gdp: 10000, taxRate: 40 }, { gdp: 30000, taxRate: 120 }]);
    expect(regressionTrend([countries[0]].filter((country) => country !== undefined), "taxRate")).toEqual([]);
  });
});