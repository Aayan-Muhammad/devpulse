export type TimelineDeltaMode = "absolute" | "percent";

export type TimelineConfidence = "low" | "medium" | "high";

export function classifyTimelineConfidence(sampleCount: number): TimelineConfidence {
  if (sampleCount >= 5) {
    return "high";
  }

  if (sampleCount >= 3) {
    return "medium";
  }

  return "low";
}

export function formatTimelineDelta(delta: number, previous: number, mode: TimelineDeltaMode): string {
  if (mode === "absolute") {
    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  if (previous === 0) {
    if (delta === 0) return "0%";
    return delta > 0 ? "+inf%" : "-inf%";
  }

  const percent = (delta / previous) * 100;
  if (Math.abs(percent) >= 1000) {
    return `${percent > 0 ? "+" : "-"}999%+`;
  }

  const rounded = Math.round(percent * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
