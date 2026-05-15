"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupWizard } from "./setup/SetupWizard";

const returnPathKey = "morningkaki:return-path";

function isSafeReturnPath(path: string | null) {
  if (!path) return false;
  if (path === "/s/demo" || path === "/dashboard/demo") return false;
  return path.startsWith("/dashboard/") || path.startsWith("/s/");
}

export default function Home() {
  const router = useRouter();
  const [checkedReturnPath, setCheckedReturnPath] = useState(false);

  useEffect(() => {
    const returnPath = window.localStorage.getItem(returnPathKey);
    if (returnPath && isSafeReturnPath(returnPath) && returnPath !== window.location.pathname) {
      router.replace(returnPath);
      return;
    }

    setCheckedReturnPath(true);
  }, [router]);

  if (!checkedReturnPath) {
    return <main className="min-h-screen bg-[#fff8ed]" />;
  }

  return <SetupWizard />;
}
