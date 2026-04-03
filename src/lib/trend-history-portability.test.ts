import { describe, expect, it } from "vitest";
import {
  computeEntriesChecksum,
  computeHmacHex,
  isValidTrendSnapshot,
} from "@/lib/trend-history-portability";

describe("trend history portability", () => {
  it("computes deterministic checksums independent of object key insertion order", () => {
    const a = {
      "devpulse-last-visit:userA": "{\"savedAt\":1}",
      "devpulse-last-visit-history:userA": "[{\"savedAt\":1}]",
    };
    const b = {
      "devpulse-last-visit-history:userA": "[{\"savedAt\":1}]",
      "devpulse-last-visit:userA": "{\"savedAt\":1}",
    };

    expect(computeEntriesChecksum(a)).toBe(computeEntriesChecksum(b));
  });

  it("changes checksum when entry values differ", () => {
    const first = {
      "devpulse-last-visit:userA": "{\"savedAt\":1}",
    };
    const second = {
      "devpulse-last-visit:userA": "{\"savedAt\":2}",
    };

    expect(computeEntriesChecksum(first)).not.toBe(computeEntriesChecksum(second));
  });

  it("validates trend snapshot structure", () => {
    expect(
      isValidTrendSnapshot({
        pushesLast7Days: 1,
        activeReposLast30Days: 2,
        totalStars: 3,
        repoCount: 4,
        topLanguageShare: 5.5,
        topLanguageName: "TypeScript",
        savedAt: Date.now(),
      })
    ).toBe(true);

    expect(
      isValidTrendSnapshot({
        pushesLast7Days: 1,
        activeReposLast30Days: 2,
      })
    ).toBe(false);
  });

  it("computes stable HMAC signatures for the same message/passphrase", async () => {
    const sigA = await computeHmacHex("hello", "secret");
    const sigB = await computeHmacHex("hello", "secret");

    expect(sigA).toBe(sigB);
    expect(sigA).toMatch(/^[0-9a-f]+$/);
    expect(sigA.length).toBe(64);
  });

  it("changes HMAC signature when passphrase changes", async () => {
    const sigA = await computeHmacHex("hello", "secret-a");
    const sigB = await computeHmacHex("hello", "secret-b");

    expect(sigA).not.toBe(sigB);
  });
});
