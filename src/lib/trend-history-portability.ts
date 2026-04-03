export type TrendSnapshot = {
  pushesLast7Days: number;
  activeReposLast30Days: number;
  totalStars: number;
  repoCount: number;
  topLanguageShare: number;
  topLanguageName: string;
  savedAt: number;
};

export function isValidTrendSnapshot(value: unknown): value is TrendSnapshot {
  const parsed = value as TrendSnapshot;
  return (
    typeof parsed?.pushesLast7Days === "number" &&
    typeof parsed?.activeReposLast30Days === "number" &&
    typeof parsed?.totalStars === "number" &&
    typeof parsed?.repoCount === "number" &&
    typeof parsed?.topLanguageShare === "number" &&
    typeof parsed?.topLanguageName === "string" &&
    typeof parsed?.savedAt === "number"
  );
}

export function computeEntriesChecksum(entries: Record<string, string>): string {
  const canonical = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  // Simple deterministic checksum for tamper/corruption detection.
  let hash = 5381;
  for (let index = 0; index < canonical.length; index += 1) {
    hash = ((hash << 5) + hash) ^ canonical.charCodeAt(index);
    hash >>>= 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export async function computeHmacHex(message: string, passphrase: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is unavailable.");
  }

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const bytes = new Uint8Array(signature);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
