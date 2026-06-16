"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ExpenseSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) {
        params.set("q", term.trim());
      } else {
        params.delete("q");
      }
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (value !== current) updateSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, searchParams, updateSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search expenses..."
        className="h-12 pl-11 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}