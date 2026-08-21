import type { InstagramPost } from "@/models";
import type { InstagramProvider } from "../interfaces";

async function fetchPosts(): Promise<InstagramPost[]> {
  const response = await fetch("/api/instagram");
  if (!response.ok) return [];
  const { posts } = (await response.json()) as { posts: InstagramPost[] };
  return posts;
}

export const liveInstagramProvider: InstagramProvider = {
  getPosts: fetchPosts,
  async getLatestPosts(limit = 4) {
    const posts = await fetchPosts();
    return posts.slice(0, limit);
  },
};
