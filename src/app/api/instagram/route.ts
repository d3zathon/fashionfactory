import { NextResponse } from "next/server";
import type { InstagramPost } from "@/models";
import { mockInstagramProvider } from "@/providers/mock";

interface GraphMediaItem {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

async function fetchLivePosts(token: string): Promise<InstagramPost[]> {
  const fields = "id,caption,media_url,permalink,timestamp";
  const response = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&access_token=${token}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error("Instagram Graph API request failed.");
  const { data } = (await response.json()) as { data: GraphMediaItem[] };
  return data.map((item) => ({
    id: item.id,
    image: { id: item.id, src: item.media_url, alt: item.caption ?? "Fashion Factory Instagram post" },
    caption: item.caption,
    permalink: item.permalink,
    publishedAt: item.timestamp,
  }));
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    const posts = await mockInstagramProvider.getPosts();
    return NextResponse.json({ posts });
  }

  try {
    const posts = await fetchLivePosts(token);
    return NextResponse.json({ posts });
  } catch {
    const posts = await mockInstagramProvider.getPosts();
    return NextResponse.json({ posts });
  }
}
