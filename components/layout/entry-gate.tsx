"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  hasEntrySession,
  setEntrySession,
} from "@/lib/client/session";

export function EntryGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasEntrySession()) {
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
  setEntrySession();
}