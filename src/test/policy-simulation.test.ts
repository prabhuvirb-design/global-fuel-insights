import { describe, expect, it } from "vitest";
import { policyTrend, regionalLeaders, simulatePolicy, TAX_CHANGE_MAX, TAX_CHANGE_MIN } from "@/lib/policy-simulation";
import { type Row } from "@/lib/fuel-data";

const row: Row = { country: "Country A", region: "Europe", income: "High", gdp: 40000, fuel: "Petrol", year: 2026, date: "2026-01-01", base: 1, tax: 0.4, subsidy: 0.1, net: 1.3, volatility: 20 };

describe("Policy simulation", () => {
  it("reduces tax by 50% at the lower limit, holding base and subsidy fixed", () => {
    expect(TAX_CHANGE_MIN).toBe(-50);
    expect(simulatePolicy(row, -50)).toEqual({ base: 1, tax: 0.2, subsidy: 0.1, retail: 1.0999999999999999 });
  });
  it("increases tax by 50% at the upper limit", () => {
    expect(TAX_CHANGE_MAX).toBe(50);
    expect(simulatePolicy(row, 50).tax).toBeCloseTo(0.6);
    expect(simulatePolicy(row, 50).retail).toBeCloseTo(1.5);
  });
  it("clamps changes to the permitted range", () => {
    expect(simulatePolicy(row, -100).tax).toBeCloseTo(0.2);
    expect(simulatePolicy(row, 100).tax).toBeCloseTo(0.6);
  });
  it("stacks subsidy below zero and updates the retail line", () => {
    const points = policyTrend([row], 50);
    expect(points).toHaveLength(1);
    expect(points[0]?.year).toBe(2026);
    expect(points[0]?.subsidy).toBe(-0.1);
    expect(points[0]?.retail).toBeCloseTo(1.5);
  });
  it("finds separate country leaders for tax and subsidy intensity within each region", () => {
    const comparison = regionalLeaders([row, { ...row, country: "Country B", tax: 0.2, subsidy: 0.7 }], 0);
    expect(comparison[0]).toMatchObject({ region: "Europe", taxCountry: "Country A", subsidyCountry: "Country B", taxIntensity: 40, subsidyIntensity: 70 });
  });
});