import {
  LAST_VISIT_HISTORY_PREFIX,
  LAST_VISIT_PREFIX,
} from "@/lib/preferences";
import {
  computeEntriesChecksum,
  computeHmacHex,
  isValidTrendSnapshot,
} from "@/lib/trend-history-portability";

export type TrendImportEnvelope = {
  version?: number;
  checksum?: string;
  signature?: string;
  signatureAlgorithm?: string;
  entries?: Record<string, unknown>;
};

export type ValidatedImportEnvelope = {
  sourceVersion: number;
  checksumVerified: boolean;
  signatureRequired: boolean;
  signatureVerified: boolean;
};

export type ExtractedTrendEntries = {
  acceptedEntries: Record<string, string>;
  usernames: string[];
  skippedCount: number;
};

export function isTrendKey(key: string): boolean {
  return key.startsWith(`${LAST_VISIT_PREFIX}:`) || key.startsWith(`${LAST_VISIT_HISTORY_PREFIX}:`);
}

export async function validateTrendImportEnvelope(
  envelope: TrendImportEnvelope,
  importPassphrase: string
): Promise<ValidatedImportEnvelope> {
  if (!envelope.entries || typeof envelope.entries !== "object") {
    throw new Error("Invalid trend history file format.");
  }

  const sourceVersion = envelope.version ?? 1;
  if (sourceVersion !== 1 && sourceVersion !== 2 && sourceVersion !== 3) {
    throw new Error(`Unsupported trend history version: ${sourceVersion}.`);
  }

  if (sourceVersion === 2 || sourceVersion === 3) {
    if (typeof envelope.checksum !== "string") {
      throw new Error("Missing checksum in trend history file.");
    }

    const checksumInput: Record<string, string> = {};
    for (const [key, value] of Object.entries(envelope.entries)) {
      if (typeof value === "string") {
        checksumInput[key] = value;
      }
    }

    const calculated = computeEntriesChecksum(checksumInput);
    if (calculated !== envelope.checksum) {
      throw new Error("Trend history checksum mismatch. File may be corrupted or modified.");
    }

    if (sourceVersion === 3) {
      if (envelope.signatureAlgorithm !== "HMAC-SHA-256" || typeof envelope.signature !== "string") {
        throw new Error("Invalid signature metadata in trend history file.");
      }

      if (!importPassphrase.trim()) {
        throw new Error("This file is signed. Enter import passphrase to verify.");
      }

      const expectedSignature = await computeHmacHex(`3:${envelope.checksum}`, importPassphrase);
      if (expectedSignature !== envelope.signature) {
        throw new Error("Signature verification failed. Check import passphrase.");
      }
    }
  }

  return {
    sourceVersion,
    checksumVerified: sourceVersion === 2 || sourceVersion === 3,
    signatureRequired: sourceVersion === 3,
    signatureVerified: sourceVersion === 3,
  };
}

export function extractAndNormalizeTrendEntries(rawEntries: Record<string, unknown>): ExtractedTrendEntries {
  const acceptedEntries: Record<string, string> = {};
  const usernames = new Set<string>();
  let skippedCount = 0;

  for (const [key, value] of Object.entries(rawEntries)) {
    if (!isTrendKey(key) || typeof value !== "string") {
      skippedCount += 1;
      continue;
    }

    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (key.startsWith(`${LAST_VISIT_PREFIX}:`)) {
        if (!isValidTrendSnapshot(parsedValue)) {
          skippedCount += 1;
          continue;
        }
        acceptedEntries[key] = JSON.stringify(parsedValue);
      } else if (key.startsWith(`${LAST_VISIT_HISTORY_PREFIX}:`)) {
        if (!Array.isArray(parsedValue)) {
          skippedCount += 1;
          continue;
        }

        const validArray = parsedValue.filter(isValidTrendSnapshot);
        if (validArray.length === 0) {
          skippedCount += 1;
          continue;
        }

        acceptedEntries[key] = JSON.stringify(validArray);
      }
    } catch {
      skippedCount += 1;
      continue;
    }

    const userPart = key.split(":")[1];
    if (userPart) {
      usernames.add(userPart);
    }
  }

  return {
    acceptedEntries,
    usernames: Array.from(usernames).sort((a, b) => a.localeCompare(b)),
    skippedCount,
  };
}

export function computeDryRunCounts(
  acceptedEntries: Record<string, string>,
  existingKeys: Set<string>,
  mode: "merge" | "replace"
): { newCount: number; overwriteCount: number } {
  if (mode === "replace") {
    return {
      newCount: Object.keys(acceptedEntries).length,
      overwriteCount: 0,
    };
  }

  let newCount = 0;
  let overwriteCount = 0;

  for (const key of Object.keys(acceptedEntries)) {
    if (existingKeys.has(key)) {
      overwriteCount += 1;
    } else {
      newCount += 1;
    }
  }

  return { newCount, overwriteCount };
}

export function computeTrendResetBackup(existingEntries: Record<string, string>): {
  keysToRemove: string[];
  backup: Record<string, string>;
} {
  const keysToRemove: string[] = [];
  const backup: Record<string, string> = {};

  for (const [key, value] of Object.entries(existingEntries)) {
    if (isTrendKey(key)) {
      keysToRemove.push(key);
      backup[key] = value;
    }
  }

  return { keysToRemove, backup };
}

export function restoreTrendBackup(
  existingEntries: Record<string, string>,
  backup: Record<string, string>
): Record<string, string> {
  return {
    ...existingEntries,
    ...backup,
  };
}
