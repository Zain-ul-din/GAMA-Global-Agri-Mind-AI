"use client";

import { Loading03Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState, useTransition } from "react";
import { searchLocations } from "@/actions/search-locations";
import { Input } from "@/components/ui/input";
import type { LocationSelection } from "@/lib/design/types";

export function LocationSearch({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: LocationSelection) => void;
}) {
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (value.trim().length < 3) {
      setResults([]);
      setError("");
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchLocations(value);
        if (result.ok) {
          setResults(result.data);
          setError("");
        } else {
          setResults([]);
          setError(result.error);
        }
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <HugeiconsIcon
        icon={pending ? Loading03Icon : Location01Icon}
        strokeWidth={2}
        className={`absolute left-2 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground ${pending ? "animate-spin" : ""}`}
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 pl-7"
        placeholder="Search an address or ZIP"
        aria-label="Garden location"
      />
      {(results.length > 0 || error) && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-72 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {error ? (
            <p className="px-2 py-2 text-xs text-destructive">{error}</p>
          ) : (
            results.map((location) => (
              <button
                key={`${location.lat}-${location.lng}-${location.name}`}
                type="button"
                className="block w-full rounded-md px-2 py-2 text-left text-xs hover:bg-accent"
                onClick={() => {
                  onSelect(location);
                  setResults([]);
                }}
              >
                {location.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
