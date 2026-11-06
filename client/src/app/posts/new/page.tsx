"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Post, PostInput } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";
import { PostForm } from "@/components/PostForm";

export default function NewPostPage() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const router = useRouter();

  async function onSubmit(values: PostInput) {
    const post = await api<Post>(
      "/posts",
      { method: "POST", body: JSON.stringify(values) },
      token,
    );
    router.push(`/posts/${post.id}`);
  }

  if (loading) return <p className="px-4 py-8 text-[#6b645b]">Loading...</p>;

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-semibold">Log in to write</h1>
        <p className="mt-3 text-[#6b645b]">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="underline">
            register
          </Link>{" "}
          before creating a post.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">New post</h1>
      <PostForm submitLabel="Publish" onSubmit={onSubmit} />
    </main>
  );
}
