"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { movePlacedPlant } from "@/lib/design/engine";
import type { GardenLayout, GardenPolygon } from "@/lib/design/types";

interface DesignCanvasProps {
  layout: GardenLayout;
  polygons: GardenPolygon[];
  onLayoutChange: (layout: GardenLayout) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function DesignCanvas({
  layout,
  polygons,
  onLayoutChange,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 900, height: 560 });
  const padding = 36;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(320, entry.contentRect.height),
      });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const geometry = useCallback(() => {
    const plotWidth = Math.max(1, size.width - padding * 2);
    const plotHeight = Math.max(1, size.height - padding * 2);
    const scale = Math.min(
      plotWidth / layout.width,
      plotHeight / layout.height,
    );
    const width = layout.width * scale;
    const height = layout.height * scale;
    return {
      scale,
      left: (size.width - width) / 2,
      top: (size.height - height) / 2,
      width,
      height,
    };
  }, [layout.height, layout.width, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    const { scale, left, top, width, height } = geometry();

    context.fillStyle =
      getComputedStyle(canvas).getPropertyValue("--muted").trim() || "#f4f4f5";
    context.fillRect(left, top, width, height);
    context.strokeStyle = "rgba(113,113,122,.18)";
    context.lineWidth = 1;
    const gridStep = Math.max(1, Math.ceil(18 / scale));
    for (let x = 0; x <= layout.width; x += gridStep) {
      context.beginPath();
      context.moveTo(left + x * scale, top);
      context.lineTo(left + x * scale, top + height);
      context.stroke();
    }
    for (let y = 0; y <= layout.height; y += gridStep) {
      context.beginPath();
      context.moveTo(left, top + y * scale);
      context.lineTo(left + width, top + y * scale);
      context.stroke();
    }

    if (polygons.length > 0) {
      const points = polygons.flatMap((polygon) => polygon.points);
      const minLat = Math.min(...points.map((point) => point.lat));
      const maxLat = Math.max(...points.map((point) => point.lat));
      const minLng = Math.min(...points.map((point) => point.lng));
      const maxLng = Math.max(...points.map((point) => point.lng));
      for (const polygon of polygons) {
        context.beginPath();
        polygon.points.forEach((point, index) => {
          const x =
            left + ((point.lng - minLng) / (maxLng - minLng || 1)) * width;
          const y =
            top + (1 - (point.lat - minLat) / (maxLat - minLat || 1)) * height;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.closePath();
        context.fillStyle = "rgba(16,185,129,.08)";
        context.strokeStyle = "rgba(16,185,129,.55)";
        context.fill();
        context.stroke();
      }
    }

    for (const plant of layout.placed) {
      const x = left + plant.x * scale;
      const y = top + plant.y * scale;
      const radius = Math.max(4, (plant.diameter * scale) / 2);
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = plant.color;
      context.globalAlpha = selection.has(plant.instanceId) ? 1 : 0.82;
      context.fill();
      context.globalAlpha = 1;
      context.lineWidth = selection.has(plant.instanceId) ? 3 : 1;
      context.strokeStyle = selection.has(plant.instanceId)
        ? "#fbbf24"
        : "rgba(255,255,255,.72)";
      context.stroke();
      if (radius >= 9) {
        context.fillStyle = "white";
        context.font = `600 ${Math.min(11, radius)}px Inter, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(initials(plant.name), x, y);
      }
    }

    context.strokeStyle = "rgba(113,113,122,.6)";
    context.lineWidth = 1;
    context.strokeRect(left, top, width, height);
    context.fillStyle = "#71717a";
    context.font = "11px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(
      `${layout.width.toFixed(0)} ft`,
      left + width / 2,
      top + height + 23,
    );
    context.save();
    context.translate(left - 23, top + height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(`${layout.height.toFixed(0)} ft`, 0, 0);
    context.restore();
  }, [geometry, layout, polygons, selection, size]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { scale, left, top } = geometry();
    return {
      x: (event.clientX - rect.left - left) / scale,
      y: (event.clientY - rect.top - top) / scale,
    };
  };

  const hitTest = (point: { x: number; y: number }) =>
    [...layout.placed]
      .reverse()
      .find(
        (plant) =>
          Math.hypot(point.x - plant.x, point.y - plant.y) <=
          plant.diameter / 2,
      );

  return (
    <canvas
      ref={canvasRef}
      className="h-[min(62vh,640px)] min-h-80 w-full touch-none rounded-md bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Editable two-dimensional garden plan. Select a plant and use arrow keys or drag to reposition it."
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const plant = hitTest(pointFromEvent(event));
        if (!plant) {
          setSelection(new Set());
          return;
        }
        setSelection((current) => {
          if (event.shiftKey) {
            const next = new Set(current);
            if (next.has(plant.instanceId)) next.delete(plant.instanceId);
            else next.add(plant.instanceId);
            return next;
          }
          return new Set([plant.instanceId]);
        });
        setDragging(plant.instanceId);
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const point = pointFromEvent(event);
        onLayoutChange(movePlacedPlant(layout, dragging, point.x, point.y));
      }}
      onPointerUp={() => setDragging(null)}
      onPointerCancel={() => setDragging(null)}
      onKeyDown={(event) => {
        const delta = event.shiftKey ? 1 : 0.25;
        const direction =
          event.key === "ArrowLeft"
            ? [-delta, 0]
            : event.key === "ArrowRight"
              ? [delta, 0]
              : event.key === "ArrowUp"
                ? [0, -delta]
                : event.key === "ArrowDown"
                  ? [0, delta]
                  : null;
        if (!direction) return;
        event.preventDefault();
        let next = layout;
        for (const id of selection) {
          const plant = next.placed.find((item) => item.instanceId === id);
          if (plant)
            next = movePlacedPlant(
              next,
              id,
              plant.x + direction[0],
              plant.y + direction[1],
            );
        }
        onLayoutChange(next);
      }}
    />
  );
}
