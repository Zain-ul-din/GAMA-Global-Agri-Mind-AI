"use client";

import {
  Gps01Icon,
  Loading03Icon,
  Location01Icon,
  LocationIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { GardenPolygon, LocationSelection } from "@/lib/design/types";

interface SatelliteMapProps {
  location: LocationSelection | null;
  polygons: GardenPolygon[];
  onPolygonsChange: (polygons: GardenPolygon[]) => void;
  onBoundsChange: (widthFeet: number, heightFeet: number) => void;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

function collectPolygons(
  layers: { eachLayer: (callback: (layer: unknown) => void) => void },
  L: typeof import("leaflet"),
) {
  const polygons: GardenPolygon[] = [];
  layers.eachLayer((candidate) => {
    if (!(candidate instanceof L.Polygon)) return;
    const rings = candidate.getLatLngs();
    const first = rings[0];
    if (!Array.isArray(first)) return;
    const points = (first as import("leaflet").LatLng[]).map((point) => ({
      lat: point.lat,
      lng: point.lng,
    }));
    if (points.length >= 3)
      polygons.push({ id: String(L.Util.stamp(candidate)), points });
  });
  return polygons;
}

function boundsInFeet(polygons: GardenPolygon[]) {
  const points = polygons.flatMap((polygon) => polygon.points);
  if (points.length < 3) return null;
  const minLat = Math.min(...points.map((point) => point.lat));
  const maxLat = Math.max(...points.map((point) => point.lat));
  const minLng = Math.min(...points.map((point) => point.lng));
  const maxLng = Math.max(...points.map((point) => point.lng));
  const centerLat = (minLat + maxLat) / 2;
  return {
    height: Math.max(5, (maxLat - minLat) * 364000),
    width: Math.max(
      5,
      (maxLng - minLng) * 364000 * Math.cos((centerLat * Math.PI) / 180),
    ),
  };
}

export function SatelliteMap({
  location,
  polygons,
  onPolygonsChange,
  onBoundsChange,
  onLocationChange,
  className,
}: SatelliteMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const initialPolygonsRef = useRef(polygons);
  const callbacksRef = useRef({ onPolygonsChange, onBoundsChange });
  callbacksRef.current = { onPolygonsChange, onBoundsChange };

  const [showInput, setShowInput] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [focused, setFocused] = useState(false);
  const [source, setSource] = useState<"geoapify" | "osm">("geoapify");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;
    void (async () => {
      const L = await import("leaflet");
      await import("@geoman-io/leaflet-geoman-free");
      if (disposed || !host) return;
      map = L.map(host, {
        zoomControl: true,
        attributionControl: true,
        maxZoom: 20,
      }).setView(
        location ? [location.lat, location.lng] : [39.5, -98.35],
        location ? 19 : 4,
      );
      mapRef.current = map;

      L.tileLayer("/api/map/tile/{z}/{x}/{y}", {
        maxZoom: 21,
        maxNativeZoom: 18,
        attribution: "Imagery via configured map provider",
      }).addTo(map);
      const group = L.featureGroup().addTo(map);
      for (const polygon of initialPolygonsRef.current) {
        L.polygon(
          polygon.points.map(
            (point) => [point.lat, point.lng] as [number, number],
          ),
        ).addTo(group);
      }
      const mapWithPm = map as typeof map & {
        pm: { addControls: (options: Record<string, unknown>) => void };
      };
      mapWithPm.pm.addControls({
        position: "topleft",
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: false,
        drawText: false,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true,
      });
      const sync = () => {
        const next = collectPolygons(group, L);
        callbacksRef.current.onPolygonsChange(next);
        const bounds = boundsInFeet(next);
        if (bounds)
          callbacksRef.current.onBoundsChange(bounds.width, bounds.height);
      };
      map.on("pm:create", ((event: { layer: import("leaflet").Layer }) => {
        group.addLayer(event.layer);
        event.layer.on("pm:edit", sync);
        event.layer.on("pm:dragend", sync);
        sync();
      }) as import("leaflet").LeafletEventHandlerFn);
      map.on("pm:remove", sync);
      group.eachLayer((layer) => {
        layer.on("pm:edit", sync);
        layer.on("pm:dragend", sync);
      });
      if (initialPolygonsRef.current.length > 0)
        map.fitBounds(group.getBounds(), { padding: [24, 24] });
      window.setTimeout(() => map?.invalidateSize(), 0);
    })();
    return () => {
      disposed = true;
      mapRef.current = null;
      map?.remove();
    };
  }, [location]);

  useEffect(() => {
    if (!focused) {
      setResults([]);
      setSearching(false);
      return;
    }
    const clean = query.trim();
    if (clean.length < 3) {
      setResults([]);
      setSearchError("");
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(clean)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          results?: LocationSelection[];
          error?: string;
          source?: string;
        };
        if (!response.ok || data.error)
          throw new Error(data.error ?? "Location search failed.");
        setResults(data.results ?? []);
        setSource(data.source === "geoapify" ? "geoapify" : "osm");
        setSearchError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Location search failed.",
        );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [focused, query]);

  const flyTo = (lat: number, lng: number, zoom: number) => {
    mapRef.current?.setView([lat, lng], zoom);
  };

  const selectLocation = (selected: LocationSelection) => {
    onLocationChange(selected.lat, selected.lng);
    flyTo(selected.lat, selected.lng, 17);
    setQuery(selected.name);
    setResults([]);
    setSearchError("");
    setFocused(false);
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("Location services are unavailable in this browser.");
      return;
    }
    setSearchError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setQuery("");
        setResults([]);
        setFocused(false);
        flyTo(position.coords.latitude, position.coords.longitude, 18);
      },
      (error) => {
        setLocating(false);
        setSearchError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow access to use your current location."
            : "Unable to read your current location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <div
      className={cn(
        "relative h-[min(62vh,640px)] min-h-80 overflow-hidden",
        className,
      )}
    >
      <div className="absolute w-full top-2 right-3 h-8 z-[999] flex gap-2 justify-end">
        <AnimatePresence>
          {showInput && (
            <div className="h-full relative">
              <motion.input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setFocused(false);
                    setShowInput(false);
                  }
                }}
                placeholder="Search Location"
                aria-label="Search location"
                className="bg-white p-0.5 px-2 h-full w-64 text-sm text-foreground/90 border border-neutral-400 outline-none"
                autoFocus
                animate={{
                  opacity: 1,
                  translateX: "0px",
                  scale: 1,
                }}
                initial={{
                  opacity: "0",
                  translateX: "15px",
                  scale: 0.95,
                }}
                exit={{
                  opacity: "0",
                  translateX: "20px",
                  scale: 1.01,
                }}
                transition={{
                  duration: 0.2,
                }}
              />
              <AnimatePresence>
                {focused && (
                  <motion.div
                    role="listbox"
                    aria-label="Location suggestions"
                    onMouseDown={(event) => event.preventDefault()}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-[1000] mt-1 max-h-72 w-72 overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
                  >
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium hover:bg-accent disabled:opacity-60"
                    >
                      <HugeiconsIcon
                        icon={locating ? Loading03Icon : Gps01Icon}
                        strokeWidth={2}
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground",
                          locating && "animate-spin",
                        )}
                      />
                      Use my current location
                    </button>
                    {searching && (
                      <p className="px-2 py-2 text-xs text-muted-foreground">
                        Searching…
                      </p>
                    )}
                    {!searching && searchError && (
                      <p className="px-2 py-2 text-xs text-destructive">
                        {searchError}
                      </p>
                    )}
                    {!searching &&
                      results.map((item) => (
                        <button
                          key={`${item.lat}-${item.lng}-${item.name}`}
                          type="button"
                          className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-accent"
                          onClick={() => selectLocation(item)}
                        >
                          <HugeiconsIcon
                            icon={Location01Icon}
                            strokeWidth={2}
                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          />
                          <span className="line-clamp-2">{item.name}</span>
                        </button>
                      ))}
                    {!searching &&
                      !searchError &&
                      query.trim().length >= 3 &&
                      results.length === 0 && (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          No locations found.
                        </p>
                      )}
                    {!searching && results.length > 0 && (
                      <p className="px-2 pb-1 pt-2 text-[10px] text-muted-foreground">
                        Geocoding by{" "}
                        <a
                          href={
                            source === "geoapify"
                              ? "https://www.geoapify.com/"
                              : "https://www.openstreetmap.org/copyright"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          {source === "geoapify" ? "Geoapify" : "OpenStreetMap"}
                        </a>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
        <motion.button
          className="bg-white text-foreground/70 p-1.5 h-full text-sm font-bold border rounded-xs hover:bg-white/90 cursor-pointer border-neutral-400"
          type="button"
          onClick={() => {
            setShowInput(!showInput);
          }}
        >
          <HugeiconsIcon
            icon={LocationIcon}
            className="size-5 "
            strokeWidth={2.5}
          />
        </motion.button>
      </div>
      <div
        ref={hostRef}
        className="h-full w-full"
        role="application"
        aria-label="Satellite map for tracing garden boundaries"
      />
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
        Draw or edit polygons to define plantable zones.
      </div>
    </div>
  );
}
