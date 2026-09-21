"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Garden data could not be loaded</CardTitle>
          <CardDescription>
            Check the database connection and try loading the designer again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
