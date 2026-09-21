"use client";

import { Loading03Icon, MapsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/actions/update-settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MapSettings } from "@/lib/design/types";

export function MapSettingsDialog({
  initialSettings,
}: {
  initialSettings: MapSettings;
}) {
  const [provider, setProvider] = useState(initialSettings.map_provider);
  const [mapboxToken, setMapboxToken] = useState(initialSettings.mapbox_token);
  const [googleKey, setGoogleKey] = useState(initialSettings.google_key);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Map settings" />
        }
      >
        <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map provider</DialogTitle>
          <DialogDescription>
            Credentials stay on the server and are returned to this browser only
            as masked placeholders.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value ?? "osm")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="osm">
                  Esri / OpenStreetMap fallback
                </SelectItem>
                <SelectItem value="mapbox">Mapbox satellite</SelectItem>
                <SelectItem value="google">Google geocoding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {provider === "mapbox" && (
            <div className="space-y-1.5">
              <Label htmlFor="mapbox-token">Mapbox access token</Label>
              <Input
                id="mapbox-token"
                type="password"
                value={mapboxToken}
                onChange={(event) => setMapboxToken(event.target.value)}
                placeholder="pk…"
              />
            </div>
          )}
          {provider === "google" && (
            <div className="space-y-1.5">
              <Label htmlFor="google-key">Google API key</Label>
              <Input
                id="google-key"
                type="password"
                value={googleKey}
                onChange={(event) => setGoogleKey(event.target.value)}
                placeholder="AIza…"
              />
            </div>
          )}
        </div>
        <DialogFooter showCloseButton>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await updateSettings({
                    map_provider: provider,
                    mapbox_token: mapboxToken,
                    google_key: googleKey,
                  });
                  toast.success("Map settings saved");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Map settings could not be saved.",
                  );
                }
              })
            }
          >
            {pending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="animate-spin"
              />
            )}
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
