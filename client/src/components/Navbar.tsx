"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  return (
    <header className="border-b border-[#e4ddd0] bg-[#fbf9f4]">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Field Notes
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {loading ? (
            <span className="text-[#6b645b]">Checking session...</span>
          ) : user ? (
            <>
              <Link href="/?mine=1" className="rounded-full px-3 py-1.5">
                My posts
              </Link>
              <Link
                href="/posts/new"
                className="rounded-full bg-[#0f6e56] px-3 py-1.5 font-medium text-white"
              >
                New post
              </Link>
              <span className="px-2 text-[#6b645b]">{user.name}</span>
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  router.replace("/login");
                }}
                className="rounded-full border border-[#e4ddd0] px-3 py-1.5"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#1c1915] px-3 py-1.5 text-white"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
