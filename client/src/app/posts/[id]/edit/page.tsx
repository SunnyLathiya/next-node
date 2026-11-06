"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Post, PostInput } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";
import { PostForm } from "@/components/PostForm";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      Promise.resolve().then(() => {
        setLoading(false);
        setError("Log in to edit a post");
      });
      return;
    }
    api<Post>(`/posts/${params.id}`, {}, token)
      .then((result) => {
        if (!result.isOwner) setError("You can only change your own posts");
        else setPost(result);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load post"))
      .finally(() => setLoading(false));
  }, [params.id, token, authLoading]);

  async function onSubmit(values: PostInput) {
    await api<Post>(
      `/posts/${params.id}`,
      { method: "PUT", body: JSON.stringify(values) },
      token,
    );
    router.push(`/posts/${params.id}`);
  }

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
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Edit post</h1>
      <PostForm
        submitLabel="Save changes"
        initial={{
          title: post.title,
          content: post.content,
          isPublic: post.isPublic,
        }}
        onSubmit={onSubmit}
      />
    </main>
  );
}
