"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    const returnPath = window.localStorage.getItem(returnPathKey);
    if (returnPath && isSafeReturnPath(returnPath) && returnPath !== window.location.pathname) {
      router.replace(returnPath);
    }
  }, [router]);

  return <SetupWizard />;
}
