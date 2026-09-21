"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { GardenLayout, GardenPolygon } from "@/lib/design/types";

export default function ThreeGarden({
  layout,
  sunPath,
  polygons,
}: {
  layout: GardenLayout;
  sunPath: boolean;
  polygons: GardenPolygon[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setSupported(false);
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101513);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    const target = new THREE.Vector3(0, 0, 0);
    const extent = Math.max(layout.width, layout.height);
    let azimuth = Math.PI / 4;
    let elevation = Math.PI / 3.5;
    let distance = Math.max(24, extent * 1.25);

    const positionCamera = () => {
      camera.position.set(
        Math.cos(azimuth) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance,
        Math.sin(azimuth) * Math.cos(elevation) * distance,
      );
      camera.lookAt(target);
    };
    positionCamera();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.replaceChildren(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x1d2a24, 1.3);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff2cf, 2.4);
    sun.position.set(-extent, extent, -extent * 0.5);
    sun.castShadow = true;
    scene.add(sun);

    const groundGeometry = new THREE.BoxGeometry(
      layout.width,
      0.35,
      layout.height,
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x26352b,
      roughness: 0.92,
    });
    const geoPoints = polygons.flatMap((polygon) => polygon.points);
    if (geoPoints.length >= 3) {
      const minLng = Math.min(...geoPoints.map((point) => point.lng));
      const minLat = Math.min(...geoPoints.map((point) => point.lat));
      const maxLng = Math.max(...geoPoints.map((point) => point.lng));
      const maxLat = Math.max(...geoPoints.map((point) => point.lat));
      const texture = new THREE.TextureLoader().load(
        `/api/map/static?bbox=${minLng},${minLat},${maxLng},${maxLat}&width=1024&height=1024`,
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      groundMaterial.map = texture;
      groundMaterial.color.set(0xffffff);
    }
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = -0.2;
    scene.add(ground);

    const grid = new THREE.GridHelper(
      Math.max(layout.width, layout.height),
      Math.min(100, Math.ceil(extent)),
      0x6b7d70,
      0x3a4b40,
    );
    grid.position.y = 0.01;
    grid.scale.set(layout.width / extent, 1, layout.height / extent);
    scene.add(grid);

    for (const plant of layout.placed) {
      const group = new THREE.Group();
      group.userData = { plant };
      const trunkHeight = Math.max(0.3, Math.min(plant.height * 0.35, 3));
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
          Math.max(0.04, plant.diameter * 0.025),
          Math.max(0.06, plant.diameter * 0.04),
          trunkHeight,
          7,
        ),
        new THREE.MeshStandardMaterial({ color: 0x6b4b35, roughness: 0.95 }),
      );
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      group.add(trunk);
      const canopyHeight = Math.max(0.4, Math.min(plant.height * 0.45, 4));
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(
          Math.max(0.12, plant.diameter * 0.18),
          Math.max(0.2, plant.diameter * 0.48),
          canopyHeight,
          9,
        ),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(plant.color),
          roughness: 0.78,
        }),
      );
      canopy.position.y = trunkHeight + canopyHeight / 2 - 0.1;
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      group.add(canopy);
      group.position.set(
        plant.x - layout.width / 2,
        0,
        plant.y - layout.height / 2,
      );
      scene.add(group);
    }

    let dragging = false;
    let previous = { x: 0, y: 0 };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previous = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      azimuth -= (event.clientX - previous.x) * 0.008;
      elevation = Math.max(
        0.18,
        Math.min(1.42, elevation + (event.clientY - previous.y) * 0.006),
      );
      previous = { x: event.clientX, y: event.clientY };
      positionCamera();
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      distance = Math.max(
        8,
        Math.min(extent * 4, distance + event.deltaY * 0.03),
      );
      positionCamera();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let start = performance.now();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const render = (time: number) => {
      if (sunPath && !reducedMotion) {
        const progress = ((time - start) / 18000) % 1;
        const angle = progress * Math.PI;
        sun.position.set(
          Math.cos(angle) * extent,
          Math.max(2, Math.sin(angle) * extent),
          -extent * 0.35,
        );
      } else {
        start = time;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [layout, polygons, sunPath]);

  if (!supported) {
    return (
      <Alert className="m-4">
        <AlertTitle>3D preview unavailable</AlertTitle>
        <AlertDescription>
          This browser does not provide WebGL. Continue editing in the 2D plan.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="relative h-[min(62vh,640px)] min-h-80 w-full overflow-hidden rounded-md">
      <div
        ref={hostRef}
        className="h-full w-full"
        role="img"
        aria-label="Three-dimensional garden preview"
      />
      <div className="pointer-events-none absolute top-3 right-3 grid size-9 place-items-center rounded-full border bg-background/85 text-xs font-medium shadow-sm">
        N
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-md border bg-background/85 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
        Drag to orbit · Scroll to zoom
      </p>
    </div>
  );
}
