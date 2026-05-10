"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const returnPathKey = "morningkaki:return-path";

export default function DashboardPage() {
  const router = useRouter();
  const [checkedCache, setCheckedCache] = useState(false);

  useEffect(() => {
    const returnPath = window.localStorage.getItem(returnPathKey);
    if (returnPath?.startsWith("/dashboard/") && returnPath !== "/dashboard/demo") {
      router.replace(returnPath);
      return;
    }

    setCheckedCache(true);
  }, [router]);

  if (!checkedCache) {
    return <main className="min-h-screen bg-[#f7f4ee]" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] p-6 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-extrabold">No live dashboard yet</h1>
        <p className="mt-3 text-slate-600">
          Complete setup first so MorningKaki can create a real caregiver dashboard.
        </p>
        <Link href="/setup">
          <Button className="mt-6 h-12 rounded-2xl bg-amber-500 px-6 font-bold text-white hover:bg-amber-600">
            Start setup
          </Button>
        </Link>
      </section>
    </main>
  );
}
