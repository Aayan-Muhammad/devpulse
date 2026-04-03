import type { Metadata } from "next";
import CompareClient from "./compare-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ user1: string; user2: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const user1 = decodeURIComponent(resolved.user1);
  const user2 = decodeURIComponent(resolved.user2);
  const title = `${user1} vs ${user2} - GitHub Comparison | DevPulse`;
  const description = `Compare ${user1} and ${user2} across followers, repositories, stars, activity, and language overlap.`;
  const compareUrl = `/compare/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`;
  const imageUrl = `${compareUrl}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: compareUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `DevPulse compare snapshot for ${user1} and ${user2}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ user1: string; user2: string }>;
}) {
  const resolved = await params;

  return <CompareClient user1={resolved.user1} user2={resolved.user2} />;
}
