"use client";
import { HarnessChat } from "@/components/harness/harness-chat";
import {
  HarnessLayout,
  HarnessSidebar,
  HarnessBody,
} from "@/components/harness/harness-layout";
import { HarnessProvider } from "@/components/harness/harness-provider";
import { HarnessViewport } from "@/components/harness/harness-viewport";

export default function Home() {
  return (
    <HarnessProvider>
      <HarnessLayout>
        <HarnessBody className="grid h-full">
          <HarnessViewport />
        </HarnessBody>
        <HarnessSidebar>
          <HarnessChat />
        </HarnessSidebar>
      </HarnessLayout>
    </HarnessProvider>
  );
}
