import { Suspense } from "react";
import { Feed } from "@/components/Feed";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-[#6b645b]">Loading posts...</p>}>
      <Feed />
    </Suspense>
  );
}
