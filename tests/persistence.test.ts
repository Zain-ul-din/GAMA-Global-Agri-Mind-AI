import { describe, expect, it } from "vitest";
import { createEmptyDraft, restoreDraft } from "@/lib/design/persistence";

describe("design draft persistence", () => {
  it("restores a versioned draft", () => {
    const draft = { ...createEmptyDraft(), zip: "48133", width: 42 };
    expect(restoreDraft(JSON.stringify(draft))).toMatchObject({
      zip: "48133",
      width: 42,
    });
  });

  it("rejects incompatible and malformed data", () => {
    expect(restoreDraft("not-json")).toBeNull();
    expect(
      restoreDraft(JSON.stringify({ version: 2, selectedPlants: [] })),
    ).toBeNull();
  });
});
