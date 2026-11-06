"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function PostCard({
  post,
  onUpdated,
  onDeleted,
  full = false,
}: {
  post: Post;
  onUpdated: (post: Post) => void;
  onDeleted: (id: string) => void;
  full?: boolean;
}) {
  const token = useAppSelector((state) => state.auth.token);
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  async function react(type: "like" | "dislike") {
    if (!token) {
      router.push("/login");
      return;
    }
    setPending(type);
    setError("");
    try {
      const updated = await api<Post>(
        `/posts/${post.id}/reactions`,
        { method: "POST", body: JSON.stringify({ type }) },
        token,
      );
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save reaction");
    } finally {
      setPending("");
    }
  }

  async function remove() {
    if (!token || !window.confirm("Delete this post?")) return;
    setPending("delete");
    setError("");
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" }, token);
      onDeleted(post.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete post");
      setPending("");
    }
  }

  return (
    <article className="rounded-2xl border border-[#e4ddd0] bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#6b645b]">
        <span>{post.author.name}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.createdAt}>
          {dateFormat.format(new Date(post.createdAt))}
        </time>
        <span className="rounded-full bg-[#f4f1ea] px-2 py-0.5">
          {post.isPublic ? "Public" : "Private"}
        </span>
      </div>
      <h2 className="text-xl font-semibold tracking-tight">
        <Link href={`/posts/${post.id}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p
        className={`mt-2 leading-7 text-[#3f3a34] ${full ? "whitespace-pre-wrap" : "line-clamp-3"}`}
      >
        {post.content}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={post.liked}
          disabled={pending !== ""}
          onClick={() => react("like")}
          className={`rounded-full border px-3 py-1.5 text-sm ${post.liked ? "border-[#0f6e56] bg-[#e7f5f0]" : "border-[#e4ddd0]"}`}
        >
          Like {post.likesCount}
        </button>
        <button
          type="button"
          aria-pressed={post.disliked}
          disabled={pending !== ""}
          onClick={() => react("dislike")}
          className={`rounded-full border px-3 py-1.5 text-sm ${post.disliked ? "border-[#9f2d2d] bg-[#fdecec]" : "border-[#e4ddd0]"}`}
        >
          Dislike {post.dislikesCount}
        </button>
        {post.isOwner ? (
          <>
            <Link
              href={`/posts/${post.id}/edit`}
              className="rounded-full border border-[#e4ddd0] px-3 py-1.5 text-sm"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={remove}
              disabled={pending !== ""}
              className="rounded-full border border-[#e4ddd0] px-3 py-1.5 text-sm text-[#9f2d2d]"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-[#9f2d2d]">{error}</p> : null}
    </article>
  );
}
