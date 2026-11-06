"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PaginatedPosts, Post } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";
import { inputClass } from "./Field";
import { Pagination } from "./Pagination";
import { PostCard } from "./PostCard";

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "mostLiked", label: "Most liked" },
];

export function Feed() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? "newest";
  const mine = params.get("mine") === "1";
  const page = Number(params.get("page") ?? "1") || 1;
  const [draft, setDraft] = useState(search);
  const [data, setData] = useState<PaginatedPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const draftRef = useRef(search);
  const pushedRef = useRef(search);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      search,
      sort,
      page: String(page),
      limit: "6",
    });
    if (mine && token) query.set("mine", "true");

    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      api<PaginatedPosts>(`/posts?${query.toString()}`, { signal: controller.signal }, token)
        .then(setData)
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof ApiError ? err.message : "Could not load posts");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    });

    return () => controller.abort();
  }, [search, sort, mine, page, token, authLoading]);

  useEffect(() => {
    const typed = draftRef.current.trim();
    if (search === pushedRef.current || search === typed) return;
    Promise.resolve().then(() => {
      draftRef.current = search;
      setDraft(search);
    });
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = draft.trim();
      if (nextSearch === search) return;
      pushedRef.current = nextSearch;
      const query = new URLSearchParams({
        search: nextSearch,
        sort,
        page: "1",
      });
      if (mine) query.set("mine", "1");
      router.push(`/?${query.toString()}`);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [draft, search, sort, mine, router]);

  function push(next: { search?: string; sort?: string; page?: number; mine?: boolean }) {
    const query = new URLSearchParams({
      search: next.search ?? search,
      sort: next.sort ?? sort,
      page: String(next.page ?? 1),
    });
    if (next.mine ?? mine) query.set("mine", "1");
    router.push(`/?${query.toString()}`);
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    push({ search: draft.trim(), page: 1 });
  }

  function replacePost(post: Post) {
    setData((current) =>
      current
        ? {
            ...current,
            posts: current.posts.map((item) => (item.id === post.id ? post : item)),
          }
        : current,
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
        <p className="mt-2 text-[#6b645b]">
          {mine && user
            ? "Showing only posts you wrote, including private ones."
            : user
              ? "Public posts are visible to everyone. Your private posts stay on this list for you."
              : "You are seeing public posts. Log in to write, react, and see your private posts."}
        </p>
      </div>

      <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="search"
          className={inputClass}
          value={draft}
          onChange={(event) => {
            draftRef.current = event.target.value;
            setDraft(event.target.value);
          }}
          placeholder="Search title or content"
          aria-label="Search posts"
        />
        {user ? (
          <select
            className={inputClass}
            value={mine ? "mine" : "all"}
            aria-label="Which posts to show"
            onChange={(event) => push({ mine: event.target.value === "mine", page: 1 })}
          >
            <option value="all">All posts</option>
            <option value="mine">My posts</option>
          </select>
        ) : null}
        <select
          className={inputClass}
          value={sort}
          aria-label="Sort posts"
          onChange={(event) => push({ sort: event.target.value, page: 1 })}
        >
          {sorts.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[#1c1915] px-4 py-2.5 font-medium text-white"
        >
          Search
        </button>
      </form>

      {loading ? <p className="text-[#6b645b]">Loading posts...</p> : null}
      {error ? (
        <p className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#9f2d2d]">{error}</p>
      ) : null}
      {!loading && data && data.posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e4ddd0] bg-white px-4 py-8 text-center text-[#6b645b]">
          {mine && user ? "You have not written any posts yet." : "No posts matched this search."}
        </p>
      ) : null}
      <div className="flex flex-col gap-4">
        {data?.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdated={replacePost}
            onDeleted={() => push({ page })}
          />
        ))}
      </div>
      {data ? (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPage={(nextPage) => push({ page: nextPage })}
        />
      ) : null}
    </div>
  );
}
