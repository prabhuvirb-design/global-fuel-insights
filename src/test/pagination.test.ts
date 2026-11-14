import { describe, expect, it } from "vitest";
import { paginate } from "@/lib/pagination";
describe("Table pagination", () => {
  it("renders only the selected page of a large dataset", () => {
    const rows = Array.from({ length: 84 }, (_, index) => index + 1);
    expect(paginate(rows, 2, 10).items).toEqual([11,12,13,14,15,16,17,18,19,20]);
    expect(paginate(rows, 9, 10).items).toEqual([81,82,83,84]);
  });
  it("clamps a page after filtering down the dataset", () => {
    expect(paginate([1,2,3], 9, 10).current).toBe(1);
    expect(paginate([], 2, 10).items).toEqual([]);
  });
});