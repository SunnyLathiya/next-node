"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";
import { PostCard } from "@/components/PostCard";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      api<Post>(`/posts/${params.id}`, { signal: controller.signal }, token)
        .then(setPost)
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setPost(null);
          setError(err instanceof ApiError ? err.message : "Could not load post");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    });
    return () => controller.abort();
  }, [params.id, token, authLoading]);

  if (loading || authLoading) {
    return <p className="px-4 py-8 text-[#6b645b]">Loading post...</p>;
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[#9f2d2d]">{error || "Post not found"}</p>
        <Link href="/" className="mt-4 inline-block underline">
          Back to posts
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-[#6b645b] underline">
        Back to posts
      </Link>
      <PostCard
        post={post}
        full
        onUpdated={setPost}
        onDeleted={() => router.push("/")}
      />
    </main>
  );
}
