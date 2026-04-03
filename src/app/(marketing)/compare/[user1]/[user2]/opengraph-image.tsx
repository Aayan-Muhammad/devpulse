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
  params: Promise<{ user1: string; user2: string }>;
}) {
  const resolved = await params;
  const user1 = decodeURIComponent(resolved.user1);
  const user2 = decodeURIComponent(resolved.user2);
  const [snapshot1, snapshot2] = await Promise.all([
    getProfileSnapshot(user1),
    getProfileSnapshot(user2),
  ]);

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
            DevPulse Compare
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1.02 }}>
            @{snapshot1.login} vs @{snapshot2.login}
          </div>
          <div style={{ fontSize: "28px", color: "#d4d4d8" }}>
            Followers, repositories, stars, activity trends, and language overlap in one view.
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px" }}>
          {[snapshot1, snapshot2].map((snapshot) => (
            <div
              key={snapshot.login}
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(161,161,170,0.25)",
                borderRadius: "14px",
                padding: "14px 16px",
                background: "rgba(10,12,15,0.55)",
                width: "50%",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#f4f4f5" }}>@{snapshot.login}</div>
              <div style={{ marginTop: "8px", fontSize: "20px", color: "#d4d4d8" }}>
                Followers: {snapshot.followers}
              </div>
              <div style={{ marginTop: "4px", fontSize: "20px", color: "#d4d4d8" }}>
                Stars: {snapshot.totalStars}
              </div>
              <div style={{ marginTop: "4px", fontSize: "20px", color: "#d4d4d8" }}>
                Top Lang: {snapshot.topLanguage}
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
            Live Compare Snapshot
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
