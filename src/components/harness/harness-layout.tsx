import { cn } from "cn";
import type { ReactNode } from "react";

export function HarnessLayout({
  children,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("w-dvw h-dvh flex bg-background")}>{children}</main>
  );
}

export function HarnessBody({
  children,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("flex-1 h-full")}>{children}</section>;
}

export function HarnessSidebar({
  children,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("w-lg h-full border-l bg-sidebar")}>{children}</aside>
  );
}
