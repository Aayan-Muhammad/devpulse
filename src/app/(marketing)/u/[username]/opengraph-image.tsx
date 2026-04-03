import { ImageResponse } from "next/og";
import { getProfileSnapshot } from "@/lib/github";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolved = await params;
  const username = decodeURIComponent(resolved.username);
  const snapshot = await getProfileSnapshot(username);
  const displayName = snapshot.name || `@${snapshot.login}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0a0c0f 0%, #111318 50%, #1a1f26 100%)",
          color: "#f4f4f5",
          padding: "56px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "9999px",
              background: "#fbbf24",
              boxShadow: "0 0 20px rgba(251,191,36,0.45)",
            }}
          />
          <div style={{ fontSize: "30px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa" }}>
            DevPulse
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "74px", fontWeight: 800, lineHeight: 1.04 }}>{displayName}</div>
          <div style={{ fontSize: "28px", color: "#d4d4d8" }}>
            Public GitHub insights: activity, repositories, language mix, and contribution heatmap.
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { label: "Followers", value: String(snapshot.followers) },
            { label: "Total Stars", value: String(snapshot.totalStars) },
            { label: "Top Language", value: snapshot.topLanguage },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(161,161,170,0.25)",
                borderRadius: "14px",
                padding: "14px 16px",
                background: "rgba(10,12,15,0.55)",
                minWidth: "190px",
              }}
            >
              <div style={{ fontSize: "15px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a1a1aa" }}>
                {item.label}
              </div>
              <div style={{ marginTop: "6px", fontSize: "34px", fontWeight: 700, color: "#f4f4f5" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "22px", color: "#a1a1aa" }}>devpulse.app</div>
          <div
            style={{
              border: "1px solid rgba(251,191,36,0.5)",
              background: "rgba(251,191,36,0.08)",
              color: "#fbbf24",
              borderRadius: "9999px",
              padding: "10px 18px",
              fontSize: "18px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {snapshot.isFallback ? "Snapshot (limited live data)" : "Live Profile Snapshot"}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
