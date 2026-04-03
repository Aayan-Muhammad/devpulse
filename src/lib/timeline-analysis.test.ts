import { describe, expect, it } from "vitest";
import {
  classifyTimelineConfidence,
  formatTimelineDelta,
} from "@/lib/timeline-analysis";

describe("timeline analysis", () => {
  it("formats absolute deltas with explicit sign", () => {
    expect(formatTimelineDelta(3, 10, "absolute")).toBe("+3");
    expect(formatTimelineDelta(0, 10, "absolute")).toBe("0");
    expect(formatTimelineDelta(-2, 10, "absolute")).toBe("-2");
  });

  it("formats percent deltas including zero baseline cases", () => {
    expect(formatTimelineDelta(5, 0, "percent")).toBe("+inf%");
    expect(formatTimelineDelta(-5, 0, "percent")).toBe("-inf%");
    expect(formatTimelineDelta(0, 0, "percent")).toBe("0%");
  });

  it("caps extreme percent deltas for readability", () => {
    expect(formatTimelineDelta(100, 1, "percent")).toBe("+999%+");
    expect(formatTimelineDelta(-100, 1, "percent")).toBe("-999%+");
  });

  it("classifies confidence thresholds", () => {
    expect(classifyTimelineConfidence(0)).toBe("low");
    expect(classifyTimelineConfidence(2)).toBe("low");
    expect(classifyTimelineConfidence(3)).toBe("medium");
    expect(classifyTimelineConfidence(4)).toBe("medium");
    expect(classifyTimelineConfidence(5)).toBe("high");
  });
});
