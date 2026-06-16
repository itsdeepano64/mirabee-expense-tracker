"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ENTRY_KEY = "mirabee-entry";

export function EntryGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ENTRY_KEY) !== "true") {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function setEntryFlag() {
  localStorage.setItem(ENTRY_KEY, "true");
}