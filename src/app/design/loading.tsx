import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid min-h-svh gap-4 p-4 lg:grid-cols-[310px_1fr]">
      <Skeleton className="h-[calc(100svh-2rem)]" />
      <Skeleton className="h-[calc(100svh-2rem)]" />
    </div>
  );
}
