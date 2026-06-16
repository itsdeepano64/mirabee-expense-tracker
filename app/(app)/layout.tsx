import { EntryGate } from "@/components/layout/entry-gate";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EntryGate>
      <AppShell>{children}</AppShell>
    </EntryGate>
  );
}