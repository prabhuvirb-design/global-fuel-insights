import { describe, expect, it } from "vitest";
import { cheapestRefueling, volatilityRisk, priceForecast } from "@/lib/logistics";
import { type Row } from "@/lib/fuel-data";

const row: Row = { country: "A", region: "Europe", income: "High", gdp: 40000, fuel: "Diesel", year: 2026, date: "2026-01-01", base: 1, tax: 0.3, subsidy: 0.1, net: 1.2, volatility: 20 };
describe("Logistics calculations", () => {
  it("ranks the top three cheapest countries and multiplies price by liters", () => {
    const results = cheapestRefueling([row, { ...row, country: "B", net: 0.5 }, { ...row, country: "C", net: 2 }, { ...row, country: "D", net: 0.8 }], 400);
    expect(results.map((result) => result.country)).toEqual(["B", "D", "A"]);
    expect(results.map((result) => result.total)).toEqual([200, 320, 480]);
  });
  it("does not calculate a full tank for invalid or nonpositive capacity", () => {
    for (const capacity of [0, -1, NaN, Infinity]) expect(cheapestRefueling([row], capacity)).toEqual([]);
  });
  it("averages selected records per country before ranking", () => {
    expect(cheapestRefueling([row, { ...row, fuel: "Petrol", net: 0.8 }], 100)[0]?.total).toBe(100);
  });
  it("classifies high volatility as 60 and above", () => {
    expect(volatilityRisk(60)).toBe("High Volatility");
    expect(volatilityRisk(100)).toBe("High Volatility");
  });
  it("classifies moderate volatility from 35 to below 60", () => {
    expect(volatilityRisk(35)).toBe("Moderate");
    expect(volatilityRisk(59.9)).toBe("Moderate");
  });
  it("classifies volatility below 35 as stable", () => {
    expect(volatilityRisk(34.9)).toBe("Stable");
  });
  it("projects a 2027 price and expanding range from 2020–2026 history", () => {
    const forecast = priceForecast(Array.from({ length: 7 }, (_, index) => ({ ...row, year: 2020 + index, net: 1 + index * 0.1 })));
    expect(forecast.map((point) => point.year)).toEqual([2020,2021,2022,2023,2024,2025,2026,2027]);
    const projected = forecast.at(-1);
    expect(projected?.forecast).toBeCloseTo(1.7);
    expect(projected?.band?.[0]).toBeLessThan(1.7);
    expect(projected?.band?.[1]).toBeGreaterThan(1.7);
    expect(projected?.historical).toBeUndefined();
  });
});