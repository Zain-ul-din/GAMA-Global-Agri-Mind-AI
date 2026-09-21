"use client";

import { useEffect, useRef } from "react";
import type { GardenPolygon, LocationSelection } from "@/lib/design/types";

interface SatelliteMapProps {
  location: LocationSelection | null;
  polygons: GardenPolygon[];
  onPolygonsChange: (polygons: GardenPolygon[]) => void;
  onBoundsChange: (widthFeet: number, heightFeet: number) => void;
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

export default function SatelliteMap({
  location,
  polygons,
  onPolygonsChange,
  onBoundsChange,
}: SatelliteMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const initialPolygonsRef = useRef(polygons);
  const callbacksRef = useRef({ onPolygonsChange, onBoundsChange });
  callbacksRef.current = { onPolygonsChange, onBoundsChange };

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
      L.tileLayer("/api/map/tile/{z}/{x}/{y}", {
        maxZoom: 20,
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
      map?.remove();
    };
  }, [location]);

  return (
    <div className="relative h-[min(62vh,640px)] min-h-80 overflow-hidden rounded-md border">
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
