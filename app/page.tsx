"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setEntryFlag } from "@/components/layout/entry-gate";

export default function LandingPage() {
  const router = useRouter();

  function handleEnter() {
    setEntryFlag();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-rose/15 text-4xl">
          💐
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Mirabee Flowers
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Expense Tracker</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Track shop expenses, receipts, and COGS — all in one warm, simple place.
        </p>
        <Button
          size="lg"
          className="mt-10 w-full text-base"
          onClick={handleEnter}
        >
          Jenni 💐
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Tap to enter the app
        </p>
      </div>
    </div>
  );
}