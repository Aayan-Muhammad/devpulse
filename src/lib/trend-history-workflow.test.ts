import { describe, expect, it } from "vitest";
import { computeEntriesChecksum, computeHmacHex } from "@/lib/trend-history-portability";
import {
  computeDryRunCounts,
  computeTrendResetBackup,
  extractAndNormalizeTrendEntries,
  restoreTrendBackup,
  validateTrendImportEnvelope,
} from "@/lib/trend-history-workflow";

const validSnapshot = {
  pushesLast7Days: 1,
  activeReposLast30Days: 2,
  totalStars: 3,
  repoCount: 4,
  topLanguageShare: 12.5,
  topLanguageName: "TypeScript",
  savedAt: 123,
};

describe("trend history workflow", () => {
  it("accepts v1 import envelopes with entries", async () => {
    const result = await validateTrendImportEnvelope(
      {
        version: 1,
        entries: {
          "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
        },
      },
      ""
    );

    expect(result.sourceVersion).toBe(1);
    expect(result.checksumVerified).toBe(false);
  });

  it("rejects v2 envelope when checksum mismatches", async () => {
    await expect(
      validateTrendImportEnvelope(
        {
          version: 2,
          checksum: "deadbeef",
          entries: {
            "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
          },
        },
        ""
      )
    ).rejects.toThrow("checksum mismatch");
  });

  it("accepts v3 envelope when signature is valid", async () => {
    const entries = {
      "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
    };
    const checksum = computeEntriesChecksum(entries);
    const signature = await computeHmacHex(`3:${checksum}`, "passphrase");

    const result = await validateTrendImportEnvelope(
      {
        version: 3,
        checksum,
        signatureAlgorithm: "HMAC-SHA-256",
        signature,
        entries,
      },
      "passphrase"
    );

    expect(result.sourceVersion).toBe(3);
    expect(result.signatureVerified).toBe(true);
  });

  it("rejects v3 envelope when signature is invalid", async () => {
    const entries = {
      "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
    };
    const checksum = computeEntriesChecksum(entries);

    await expect(
      validateTrendImportEnvelope(
        {
          version: 3,
          checksum,
          signatureAlgorithm: "HMAC-SHA-256",
          signature: "00",
          entries,
        },
        "passphrase"
      )
    ).rejects.toThrow("Signature verification failed");
  });

  it("extracts and normalizes valid trend entries", () => {
    const { acceptedEntries, usernames, skippedCount } = extractAndNormalizeTrendEntries({
      "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
      "devpulse-last-visit-history:alice": JSON.stringify([validSnapshot]),
      "bad:key": "123",
      "devpulse-last-visit:bob": "not-json",
    });

    expect(Object.keys(acceptedEntries)).toHaveLength(2);
    expect(usernames).toEqual(["alice"]);
    expect(skippedCount).toBe(2);
  });

  it("computes dry-run counts for merge and replace modes", () => {
    const acceptedEntries = {
      "devpulse-last-visit:alice": JSON.stringify(validSnapshot),
      "devpulse-last-visit:bob": JSON.stringify(validSnapshot),
    };

    const merge = computeDryRunCounts(
      acceptedEntries,
      new Set(["devpulse-last-visit:alice"]),
      "merge"
    );
    expect(merge).toEqual({ newCount: 1, overwriteCount: 1 });

    const replace = computeDryRunCounts(acceptedEntries, new Set(["x"]), "replace");
    expect(replace).toEqual({ newCount: 2, overwriteCount: 0 });
  });

  it("supports reset backup and undo restore", () => {
    const existing = {
      "devpulse-last-visit:alice": "a",
      "devpulse-last-visit-history:alice": "b",
      other: "c",
    };

    const { keysToRemove, backup } = computeTrendResetBackup(existing);
    expect(keysToRemove.sort()).toEqual([
      "devpulse-last-visit-history:alice",
      "devpulse-last-visit:alice",
    ]);
    expect(backup).toEqual({
      "devpulse-last-visit:alice": "a",
      "devpulse-last-visit-history:alice": "b",
    });

    const restored = restoreTrendBackup({ other: "c" }, backup);
    expect(restored).toEqual(existing);
  });
});
