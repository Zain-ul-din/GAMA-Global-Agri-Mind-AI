"use client";

import {
  BalanceScaleIcon,
  Leaf01Icon,
  RulerIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CropSelector } from "@/components/design/crop-selector";
import { useDesign } from "@/components/design/design-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { fromFeet, normalizeAllocations, toFeet } from "@/lib/design/engine";
import { GARDEN_PRESETS, METHODOLOGIES } from "@/lib/design/presets";
import type { Plant, SelectedPlant } from "@/lib/design/types";

const SOILS = [
  "Loam",
  "Clay",
  "Sand",
  "Silt",
  "Peat",
  "Chalky",
  "Rocky",
  "Saline",
  "Unknown",
];

export function SetupPanel({
  plants,
  onPlantsChange,
  onApplyPresets,
  onGenerate,
  generating,
  idPrefix = "desktop",
}: {
  plants: Plant[];
  onPlantsChange: (plants: Plant[]) => void;
  onApplyPresets: () => void;
  onGenerate: () => void;
  generating: boolean;
  idPrefix?: string;
}) {
  const { draft, dispatch } = useDesign();
  const patch = (value: Partial<typeof draft>) =>
    dispatch({ type: "patch", value });
  const area = draft.width * draft.height;
  const unit = draft.dimensionUnit;
  const perimeter = 2 * (draft.width + draft.height);

  const updateDimensionUnit = (next: "ft" | "m") => {
    if (next === unit) return;
    patch({
      dimensionUnit: next,
      width: Number(fromFeet(toFeet(draft.width, unit), next).toFixed(1)),
      height: Number(fromFeet(toFeet(draft.height, unit), next).toFixed(1)),
    });
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={RulerIcon} strokeWidth={2} />
            Garden setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-width`}>Width ({unit})</Label>
              <Input
                id={`${idPrefix}-width`}
                type="number"
                min={5}
                max={1000}
                value={draft.width}
                onChange={(event) =>
                  patch({
                    width: Math.max(5, Number(event.target.value) || 5),
                    layout: null,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-height`}>Length ({unit})</Label>
              <Input
                id={`${idPrefix}-height`}
                type="number"
                min={5}
                max={1000}
                value={draft.height}
                onChange={(event) =>
                  patch({
                    height: Math.max(5, Number(event.target.value) || 5),
                    layout: null,
                  })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Fencing perimeter: {perimeter.toFixed(1)} {unit}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Soil</Label>
              <Select
                value={draft.soil}
                onValueChange={(value) => patch({ soil: value ?? "Loam" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOILS.map((soil) => (
                    <SelectItem key={soil} value={soil}>
                      {soil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sun</Label>
              <Select
                value={draft.sun}
                onValueChange={(value) => patch({ sun: value ?? "Full" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full">Full sun</SelectItem>
                  <SelectItem value="Partial">Partial shade</SelectItem>
                  <SelectItem value="Shade">Full shade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Dimensions</Label>
              <Select
                value={unit}
                onValueChange={(value) =>
                  updateDimensionUnit((value ?? "ft") as "ft" | "m")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ft">Feet</SelectItem>
                  <SelectItem value="m">Meters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Yield</Label>
              <Select
                value={draft.weightUnit}
                onValueChange={(value) =>
                  patch({ weightUnit: (value ?? "lbs") as "lbs" | "kg" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">Pounds</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Checkbox
              id={`${idPrefix}-distribute`}
              checked={draft.distributeEvenly}
              onCheckedChange={(checked) =>
                patch({ distributeEvenly: checked })
              }
            />
            <Label htmlFor={`${idPrefix}-distribute`}>
              Distribute plants evenly
            </Label>
          </div>
          <div className="space-y-1.5">
            <Label>Over-capacity</Label>
            <Select
              value={draft.capacityMode}
              onValueChange={(value) =>
                patch({
                  capacityMode: (value ??
                    "expand") as typeof draft.capacityMode,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warn">Show warning</SelectItem>
                <SelectItem value="scale-down">
                  Scale quantities down
                </SelectItem>
                <SelectItem value="expand">Expand garden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Leaf01Icon} strokeWidth={2} />
            Plant palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CropSelector
            plants={plants}
            selected={draft.selectedPlants}
            onPlantsChange={onPlantsChange}
            onSelectedChange={(selectedPlants: SelectedPlant[]) =>
              patch({ selectedPlants, layout: null })
            }
          />
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger
                render={<Button type="button" variant="outline" />}
              >
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                Garden plans
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <PopoverHeader>
                  <PopoverTitle>Premade garden plans</PopoverTitle>
                  <PopoverDescription>
                    Allocate portions of the plantable area. Totals below 100%
                    leave open space.
                  </PopoverDescription>
                </PopoverHeader>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {GARDEN_PRESETS.map((preset) => {
                    const active =
                      (draft.presetAllocations[preset.key] ?? 0) > 0;
                    return (
                      <div key={preset.key} className="rounded-lg border p-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={active}
                            onCheckedChange={(checked) =>
                              patch({
                                presetAllocations: {
                                  ...draft.presetAllocations,
                                  [preset.key]: checked ? 50 : 0,
                                },
                              })
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">{preset.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {preset.description}
                            </p>
                          </div>
                          {active && (
                            <Input
                              aria-label={`${preset.name} percentage`}
                              className="w-16"
                              type="number"
                              min={5}
                              max={100}
                              value={draft.presetAllocations[preset.key]}
                              onChange={(event) =>
                                patch({
                                  presetAllocations: {
                                    ...draft.presetAllocations,
                                    [preset.key]: Math.min(
                                      100,
                                      Math.max(
                                        5,
                                        Number(event.target.value) || 5,
                                      ),
                                    ),
                                  },
                                })
                              }
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      patch({
                        presetAllocations: normalizeAllocations(
                          draft.presetAllocations,
                        ),
                      })
                    }
                  >
                    <HugeiconsIcon icon={BalanceScaleIcon} strokeWidth={2} />
                    Balance
                  </Button>
                  <Button type="button" onClick={onApplyPresets}>
                    Apply plans
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger
                render={<Button type="button" variant="outline" />}
              >
                Methods
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <PopoverHeader>
                  <PopoverTitle>Planting methods</PopoverTitle>
                  <PopoverDescription>
                    Keep the intended field method with the saved design.
                  </PopoverDescription>
                </PopoverHeader>
                <div className="space-y-2">
                  {METHODOLOGIES.map((method) => (
                    <div
                      key={method.key}
                      className="flex items-start gap-2 rounded-lg border p-2"
                    >
                      <Checkbox
                        id={`${idPrefix}-method-${method.key}`}
                        checked={draft.methodologies.includes(method.key)}
                        onCheckedChange={(checked) =>
                          patch({
                            methodologies: checked
                              ? [...draft.methodologies, method.key]
                              : draft.methodologies.filter(
                                  (key) => key !== method.key,
                                ),
                          })
                        }
                      />
                      <Label
                        htmlFor={`${idPrefix}-method-${method.key}`}
                        className="block font-normal"
                      >
                        <span className="block text-xs font-medium">
                          {method.key}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {method.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(draft.presetAllocations)
              .filter(([, value]) => value > 0)
              .map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {GARDEN_PRESETS.find((preset) => preset.key === key)?.name}:{" "}
                  {value}%
                </Badge>
              ))}
            {draft.methodologies.map((method) => (
              <Badge key={method} variant="outline">
                {method}
              </Badge>
            ))}
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={generating || draft.selectedPlants.length === 0}
            onClick={onGenerate}
          >
            {generating ? "Designing garden…" : "Design my garden"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live measurements</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <Metric label="Total area" value={`${area.toFixed(0)} sq ${unit}`} />
          <Metric
            label="Planting area"
            value={`${(area * 0.8).toFixed(0)} sq ${unit}`}
          />
          <Metric
            label="Plants requested"
            value={String(
              draft.selectedPlants.reduce(
                (sum, plant) => sum + plant.quantity,
                0,
              ),
            )}
          />
          <Metric
            label="Plants placed"
            value={String(draft.metrics?.placedPlants ?? 0)}
          />
          <Metric
            label="Estimated yield"
            value={`${draft.metrics?.estimatedYield.toFixed(0) ?? 0} ${draft.weightUnit}`}
          />
          <Metric label="Water need" value={draft.metrics?.waterNeed ?? "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
