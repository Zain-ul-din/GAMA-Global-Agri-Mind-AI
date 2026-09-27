import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "../ui/badge";
import { ToolCaseIcon } from "@hugeicons/core-free-icons";

export function ToolCallBadge({ toolName }: { toolName: string }) {
  return (
    <Badge variant={"outline"}>
      <HugeiconsIcon icon={ToolCaseIcon} />
      {toolName}
    </Badge>
  );
}
