import { defineWorkflowTool } from "eve/tools";
import { z } from "zod";

export default defineWorkflowTool({
  description: "Returns Map polygons and bounds in feet",
  inputSchema: z.object({}),
  async execute(_, ctx) {
    "use workflow";
    const answer = await ctx.ask({
      prompt: "Access Map State",
      display: "text",
      allowFreeform: true,
    });
    return answer.status === "answered" ? answer.text : "Tool call failed";
  },
});
