"use client";

import {
  Calendar03Icon,
  CubeIcon,
  Delete02Icon,
  Globe02Icon,
  GridIcon,
  Leaf01Icon,
  Menu01Icon,
  SatelliteIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { createDesign } from "@/actions/create-design";
import { recordAndGetVisitorNetwork } from "@/actions/get-visitor-network";
import { DesignCanvas } from "@/components/design/design-canvas";
import { DesignProvider, useDesign } from "@/components/design/design-context";
import { LocationSearch } from "@/components/design/location-search";
import { MapSettingsDialog } from "@/components/design/map-settings-dialog";
import { SetupPanel } from "@/components/design/setup-panel";
import { ThemeToggle } from "@/components/design/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  analyzeLayout,
  applyPresetAllocations,
  buildCalendar,
  calculateMetrics,
  generateLayout,
  resolveCapacity,
  toFeet,
} from "@/lib/design/engine";
import type { MapSettings, Plant, VisitorCountry } from "@/lib/design/types";

const ThreeGarden = dynamic(() => import("@/components/design/three-garden"), {
  ssr: false,
  loading: () => <Skeleton className="h-[min(62vh,640px)] min-h-80 w-full" />,
});
const SatelliteMap = dynamic(
  () => import("@/components/design/satellite-map"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[min(62vh,640px)] min-h-80 w-full" />,
  },
);

interface DesignStudioProps {
  initialPlants: Plant[];
  initialSettings: MapSettings;
  initialVisitors: VisitorCountry[];
}

export function DesignStudio(props: DesignStudioProps) {
  return (
    <DesignProvider>
      <DesignerWorkspace {...props} />
    </DesignProvider>
  );
}

function DesignerWorkspace({
  initialPlants,
  initialSettings,
  initialVisitors,
}: DesignStudioProps) {
  const { draft, dispatch } = useDesign();
  const [plants, setPlants] = useState(initialPlants);
  const [visitors, setVisitors] = useState(initialVisitors);
  const [progress, setProgress] = useState(0);
  const [sunPath, setSunPath] = useState(false);
  const [generating, startGenerating] = useTransition();
  const patch = (value: Partial<typeof draft>) =>
    dispatch({ type: "patch", value });

  useEffect(() => {
    if (window.sessionStorage.getItem("gama.visitor-recorded")) return;
    window.sessionStorage.setItem("gama.visitor-recorded", "1");
    void recordAndGetVisitorNetwork().then((result) => {
      if (result.ok) setVisitors(result.data);
    });
  }, []);

  const widthFeet = toFeet(draft.width, draft.dimensionUnit);
  const heightFeet = toFeet(draft.height, draft.dimensionUnit);

  const applyPresets = () => {
    const selectedPlants = applyPresetAllocations(
      plants,
      draft.selectedPlants,
      draft.presetAllocations,
      widthFeet,
      heightFeet,
    );
    patch({ selectedPlants, layout: null });
    toast.success("Garden plans applied");
  };

  const generate = () =>
    startGenerating(async () => {
      if (!/^\d{5}$/.test(draft.zip)) {
        toast.error("Enter a five-digit ZIP before designing.");
        return;
      }
      if (draft.selectedPlants.length === 0) {
        toast.error("Add at least one plant.");
        return;
      }
      try {
        setProgress(12);
        const resolved = resolveCapacity(
          draft.selectedPlants,
          widthFeet,
          heightFeet,
          draft.capacityMode,
        );
        if (resolved.overCapacity)
          toast.warning(
            "The requested plants exceed the plantable area; some may remain unplaced.",
          );
        setProgress(28);
        const first = await createDesign({
          zip: draft.zip,
          gardenWidth: resolved.width,
          gardenHeight: resolved.height,
          soil: draft.soil,
          sun: draft.sun,
          plants: resolved.selected.map((plant) => plant.name),
        });
        setProgress(48);
        const layout = generateLayout(
          resolved.selected,
          resolved.width,
          resolved.height,
          draft.polygons,
          first.companions,
          first.antagonists,
          draft.distributeEvenly,
        );
        const { alerts, analysis } = analyzeLayout(
          layout,
          resolved.selected,
          first.companions,
          first.antagonists,
          draft.soil,
          draft.sun,
        );
        setProgress(72);
        const second = await createDesign({
          zip: draft.zip,
          gardenWidth: resolved.width,
          gardenHeight: resolved.height,
          soil: draft.soil,
          sun: draft.sun,
          plants: resolved.selected.map((plant) => plant.name),
          layoutAnalysis: analysis,
        });
        setProgress(94);
        const metrics = calculateMetrics(
          resolved.selected,
          layout,
          draft.soil,
          draft.weightUnit,
        );
        patch({
          width:
            draft.dimensionUnit === "m"
              ? Number((resolved.width * 0.3048).toFixed(1))
              : resolved.width,
          height:
            draft.dimensionUnit === "m"
              ? Number((resolved.height * 0.3048).toFixed(1))
              : resolved.height,
          selectedPlants: resolved.selected,
          layout,
          alerts,
          metrics,
          calendar: buildCalendar(resolved.selected),
          result: {
            companions: second.companions,
            antagonists: second.antagonists,
            suggestedCompanions: second.suggested_companions,
            aiAdvice: second.ai_advice,
          },
          viewMode: "plan",
        });
        setProgress(100);
        toast.success(`Garden designed with ${layout.placed.length} plants`);
        if (Object.keys(layout.unplaced).length > 0)
          toast.warning(
            "Some plants could not be placed. Expand the garden or reduce quantities.",
          );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "The garden could not be generated.",
        );
      } finally {
        window.setTimeout(() => setProgress(0), 800);
      }
    });

  const updateLayout = (layout: NonNullable<typeof draft.layout>) => {
    const companions = draft.result?.companions ?? [];
    const antagonists = draft.result?.antagonists ?? [];
    const { alerts } = analyzeLayout(
      layout,
      draft.selectedPlants,
      companions,
      antagonists,
      draft.soil,
      draft.sun,
    );
    patch({
      layout,
      alerts,
      metrics: calculateMetrics(
        draft.selectedPlants,
        layout,
        draft.soil,
        draft.weightUnit,
      ),
    });
  };

  return (
    <div className="min-h-svh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r bg-sidebar py-3 lg:flex">
        <Image
          src="/gama-transparent-logo.png"
          alt="GAMA"
          width={40}
          height={40}
          className="h-9 w-9 object-contain"
          priority
        />
        <Separator className="my-3 w-8" />
        <Button variant="secondary" size="icon-lg" aria-label="Garden design">
          <HugeiconsIcon icon={Leaf01Icon} strokeWidth={2} />
        </Button>
      </aside>

      <div className="lg:pl-16">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur-sm lg:px-5">
          <MobileSetup
            plants={plants}
            onPlantsChange={setPlants}
            onApplyPresets={applyPresets}
            onGenerate={generate}
            generating={generating}
          />
          <div className="hidden min-w-36 lg:block">
            <p className="text-sm font-medium">Garden designer</p>
            <p className="text-[11px] text-muted-foreground">
              Plan with ecological context
            </p>
          </div>
          <LocationSearch
            value={draft.address}
            onChange={(address) => patch({ address })}
            onSelect={(location) => {
              const zip = location.name.match(/\b\d{5}\b/)?.[0] ?? draft.zip;
              patch({ location, address: location.name, zip });
            }}
          />
          <div className="hidden items-center gap-1 sm:flex">
            <span className="text-xs text-muted-foreground">ZIP</span>
            <input
              className="h-8 w-16 rounded-md border bg-input/20 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="ZIP code"
              value={draft.zip}
              inputMode="numeric"
              maxLength={5}
              onChange={(event) =>
                patch({
                  zip: event.target.value.replace(/\D/g, "").slice(0, 5),
                })
              }
            />
          </div>
          <MapSettingsDialog initialSettings={initialSettings} />
          <ThemeToggle />
        </header>

        <main className="grid gap-3 p-3 lg:grid-cols-[310px_minmax(0,1fr)] lg:p-4">
          <aside className="hidden lg:block">
            <SetupPanel
              plants={plants}
              onPlantsChange={setPlants}
              onApplyPresets={applyPresets}
              onGenerate={generate}
              generating={generating}
            />
          </aside>
          <div className="min-w-0 space-y-3">
            <Card className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-3 border-b">
                <div>
                  <CardTitle>Plot workspace</CardTitle>
                  <CardDescription>
                    {draft.layout
                      ? `${draft.layout.placed.length} plants placed across ${draft.layout.width.toFixed(0)} × ${draft.layout.height.toFixed(0)} ft`
                      : "Trace a site or generate a plan to begin."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <ViewButton
                    active={draft.viewMode === "plan"}
                    icon={GridIcon}
                    label="2D plan"
                    onClick={() => patch({ viewMode: "plan" })}
                  />
                  <ViewButton
                    active={draft.viewMode === "three"}
                    icon={CubeIcon}
                    label="3D view"
                    disabled={!draft.layout}
                    onClick={() => patch({ viewMode: "three" })}
                  />
                  <ViewButton
                    active={draft.viewMode === "satellite"}
                    icon={SatelliteIcon}
                    label="Trace site"
                    onClick={() => patch({ viewMode: "satellite" })}
                  />
                  <Button
                    variant={sunPath ? "secondary" : "outline"}
                    disabled={draft.viewMode !== "three"}
                    onClick={() => setSunPath((value) => !value)}
                  >
                    <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} />
                    Sun path
                  </Button>
                </div>
              </CardHeader>
              {progress > 0 && (
                <div className="border-b px-4 py-2">
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Calculating plant spacing and ecological fit</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
              <CardContent className="p-2">
                {draft.viewMode === "satellite" ? (
                  <SatelliteMap
                    location={draft.location}
                    polygons={draft.polygons}
                    onPolygonsChange={(polygons) =>
                      patch({ polygons, layout: null })
                    }
                    onBoundsChange={(width, height) =>
                      patch({
                        width:
                          draft.dimensionUnit === "m"
                            ? Number((width * 0.3048).toFixed(1))
                            : Math.round(width),
                        height:
                          draft.dimensionUnit === "m"
                            ? Number((height * 0.3048).toFixed(1))
                            : Math.round(height),
                        layout: null,
                      })
                    }
                  />
                ) : draft.layout ? (
                  draft.viewMode === "three" ? (
                    <ThreeGarden
                      layout={draft.layout}
                      polygons={draft.polygons}
                      sunPath={sunPath}
                    />
                  ) : (
                    <DesignCanvas
                      layout={draft.layout}
                      polygons={draft.polygons}
                      onLayoutChange={updateLayout}
                    />
                  )
                ) : (
                  <div className="flex h-[min(62vh,640px)] min-h-80 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-6 text-center">
                    <HugeiconsIcon
                      icon={Leaf01Icon}
                      strokeWidth={1.5}
                      className="mb-3 size-8 text-muted-foreground"
                    />
                    <h2 className="text-sm font-medium">
                      Build a plant palette
                    </h2>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Add plants or apply a garden plan, enter a ZIP, then
                      generate an editable layout.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {draft.alerts.length > 0 && (
              <Alert
                variant={
                  draft.alerts.some((alert) => alert.kind === "antagonist")
                    ? "destructive"
                    : "default"
                }
              >
                <AlertTitle>Layout notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {draft.alerts.slice(0, 6).map((alert) => (
                      <li key={alert.id}>{alert.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ResultsPanel visitors={visitors} />
          </div>
        </main>
      </div>
    </div>
  );
}

function MobileSetup(props: Parameters<typeof SetupPanel>[0]) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            className="lg:hidden"
            variant="outline"
            size="icon"
            aria-label="Open garden setup"
          />
        }
      >
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(92vw,360px)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Garden setup</SheetTitle>
          <SheetDescription>
            Configure the plot and plant palette.
          </SheetDescription>
        </SheetHeader>
        <div className="p-3">
          <SetupPanel {...props} idPrefix="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ViewButton({
  active,
  icon,
  label,
  ...props
}: {
  active: boolean;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  label: string;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button {...props} variant={active ? "secondary" : "outline"}>
      <HugeiconsIcon icon={icon} strokeWidth={2} />
      {label}
    </Button>
  );
}

function ResultsPanel({ visitors }: { visitors: VisitorCountry[] }) {
  const { draft, dispatch } = useDesign();
  if (!draft.result) return null;
  const totalVisits = visitors.reduce(
    (sum, item) => sum + (item.visitCount ?? 0),
    0,
  );
  return (
    <Card>
      <CardContent className="p-3">
        <Tabs defaultValue="recommendations">
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="recommendations">Relationships</TabsTrigger>
            <TabsTrigger value="advice">GardenAI advice</TabsTrigger>
            <TabsTrigger value="calendar">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="network">
              <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
              Network
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recommendations" className="pt-3">
            <div className="grid gap-3 md:grid-cols-3">
              <RelationshipList
                title="Companions"
                empty="No companion pairs found."
                items={draft.result.companions.map(
                  (item) => `${item.plant} + ${item.companion}`,
                )}
              />
              <RelationshipList
                title="Avoid nearby"
                empty="No antagonist pairs found."
                items={draft.result.antagonists.map(
                  (item) => `${item.plant} + ${item.antagonist}`,
                )}
                destructive
              />
              <RelationshipList
                title="Consider adding"
                empty="No additional suggestions."
                items={draft.result.suggestedCompanions}
              />
            </div>
          </TabsContent>
          <TabsContent value="advice" className="pt-3">
            <ScrollArea className="max-h-[520px]">
              <div className="prose prose-sm max-w-none space-y-3 text-xs text-foreground prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground dark:prose-invert">
                <ReactMarkdown>{draft.result.aiAdvice}</ReactMarkdown>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="calendar" className="pt-3">
            <CalendarTable />
          </TabsContent>
          <TabsContent value="network" className="pt-3">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <p className="text-sm font-medium">Global visitor network</p>
                <p className="text-xs text-muted-foreground">
                  Aggregated country-level visits only.
                </p>
              </div>
              <Badge variant="secondary">
                {totalVisits.toLocaleString()} visits
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visitors.slice(0, 12).map((country) => (
                <div
                  key={country.countryCode}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <span className="text-xs">{country.countryName}</span>
                  <span className="text-xs font-medium tabular-nums">
                    {country.visitCount ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <Separator className="my-3" />
        <Button
          variant="ghost"
          className="text-destructive"
          onClick={() => dispatch({ type: "reset" })}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          Clear saved draft
        </Button>
      </CardContent>
    </Card>
  );
}

function RelationshipList({
  title,
  items,
  empty,
  destructive = false,
}: {
  title: string;
  items: string[];
  empty: string;
  destructive?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3">
      <h3 className="mb-2 text-xs font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Badge
              key={item}
              variant={destructive ? "destructive" : "secondary"}
            >
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function CalendarTable() {
  const { draft } = useDesign();
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] rounded-lg border">
        <div className="grid grid-cols-[160px_repeat(12,1fr)] border-b bg-muted/40 text-[10px]">
          <div className="p-2 font-medium">Plant</div>
          {MONTHS.map((month) => (
            <div key={month} className="border-l p-2 text-center">
              {month}
            </div>
          ))}
        </div>
        {draft.calendar.map((entry) => (
          <div
            key={entry.plantId}
            className="grid grid-cols-[160px_repeat(12,1fr)] border-b last:border-0"
          >
            <div className="truncate p-2 text-xs font-medium">{entry.name}</div>
            {MONTHS.map((month, monthIndex) => {
              const segment = entry.segments.find(
                (item) =>
                  monthIndex + 1 >= item.startMonth &&
                  monthIndex + 1 <= item.endMonth,
              );
              return (
                <div
                  key={month}
                  title={segment?.phase}
                  className={`border-l p-2 ${segment ? (segment.phase === "Harvest" ? "bg-chart-4/65" : segment.phase === "Bloom" ? "bg-chart-2/55" : segment.phase === "Sow" ? "bg-chart-1/45" : segment.phase === "Soil care" ? "bg-muted" : "bg-chart-3/55") : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
