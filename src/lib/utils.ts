import { GardenPolygon } from "./design/types";

export { cn } from "cn";

export function boundsInFeet(polygons: GardenPolygon[]) {
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
