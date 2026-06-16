"use client";

import { useRouter } from "next/navigation";
import { MirabeeLogo } from "@/components/brand/mirabee-logo";
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
        <div className="mb-8 flex justify-center">
          <MirabeeLogo size="lg" priority />
        </div>
        <p className="text-lg text-muted-foreground">Expense Tracker</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Track shop expenses, receipts, and inventory costs — sleek and simple.
        </p>
        <Button
          size="lg"
          className="mt-10 w-full bg-accent-rose text-base hover:opacity-90"
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