"use client";

import {
  AiMagicIcon,
  Cancel01Icon,
  Loading03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, useTransition } from "react";
import { createCustomPlant } from "@/actions/create-custom-plant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { selectPlant } from "@/lib/design/engine";
import type { Plant, SelectedPlant } from "@/lib/design/types";

export function CropSelector({
  plants,
  selected,
  onPlantsChange,
  onSelectedChange,
}: {
  plants: Plant[];
  selected: SelectedPlant[];
  onPlantsChange: (plants: Plant[]) => void;
  onSelectedChange: (plants: SelectedPlant[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const selectedIds = new Set(selected.map((plant) => plant.id));
    return plants
      .filter(
        (plant) =>
          !selectedIds.has(plant.id) &&
          `${plant.name} ${plant.type} ${plant.scientificName ?? ""}`
            .toLowerCase()
            .includes(clean),
      )
      .slice(0, 8);
  }, [plants, query, selected]);

  const add = (plant: Plant) => {
    onSelectedChange([...selected, selectPlant(plant)]);
    setQuery("");
    setError("");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="crop-search">Plants</Label>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="crop-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-7"
            placeholder="Search the plant catalog"
            autoComplete="off"
          />
          {query.trim() && (
            <Card className="absolute top-full left-0 z-40 mt-1 w-full p-1 shadow-md">
              {matches.map((plant) => (
                <button
                  type="button"
                  key={plant.id}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs hover:bg-accent"
                  onClick={() => add(plant)}
                >
                  <span>
                    <strong className="block font-medium">{plant.name}</strong>
                    <span className="text-muted-foreground">
                      {plant.scientificName ?? plant.type}
                    </span>
                  </span>
                  <Badge variant="outline">{plant.type}</Badge>
                </button>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const created = await createCustomPlant(query);
                      const next = created as Plant;
                      onPlantsChange([
                        ...plants.filter((plant) => plant.id !== next.id),
                        next,
                      ]);
                      add(next);
                    } catch (cause) {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "Plant research failed.",
                      );
                    }
                  })
                }
              >
                <HugeiconsIcon
                  icon={pending ? Loading03Icon : AiMagicIcon}
                  strokeWidth={2}
                  className={pending ? "animate-spin" : ""}
                />
                {pending
                  ? "Researching botanical data"
                  : `Research “${query.trim()}” with GardenAI`}
              </Button>
            </Card>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      {selected.length > 0 ? (
        <ScrollArea className="max-h-64 pr-2">
          <div className="space-y-2">
            {selected.map((plant) => (
              <div
                key={plant.id}
                className="grid grid-cols-[1fr_72px_28px] items-center gap-2 rounded-lg border p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{plant.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {plant.matureWidth
                      ? `${plant.matureWidth} ft mature spread`
                      : plant.type}
                  </p>
                </div>
                <Input
                  aria-label={`${plant.name} quantity`}
                  type="number"
                  min={1}
                  max={5000}
                  value={plant.quantity}
                  onChange={(event) =>
                    onSelectedChange(
                      selected.map((item) =>
                        item.id === plant.id
                          ? {
                              ...item,
                              quantity: Math.max(
                                1,
                                Number(event.target.value) || 1,
                              ),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${plant.name}`}
                  onClick={() =>
                    onSelectedChange(
                      selected.filter((item) => item.id !== plant.id),
                    )
                  }
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Search for a plant or apply a garden plan.
        </p>
      )}
    </div>
  );
}
