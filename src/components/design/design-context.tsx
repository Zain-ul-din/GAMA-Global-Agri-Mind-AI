"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  createEmptyDraft,
  DESIGN_DRAFT_KEY,
  restoreDraft,
} from "@/lib/design/persistence";
import type { DesignDraft } from "@/lib/design/types";

type DraftAction =
  | { type: "hydrate"; value: DesignDraft }
  | { type: "patch"; value: Partial<DesignDraft> }
  | { type: "reset" }
  | { type: "replace"; value: DesignDraft };

function reducer(state: DesignDraft, action: DraftAction): DesignDraft {
  if (action.type === "hydrate" || action.type === "replace")
    return action.value;
  if (action.type === "reset") return createEmptyDraft();
  return { ...state, ...action.value };
}

const DesignContext = createContext<{
  draft: DesignDraft;
  dispatch: Dispatch<DraftAction>;
  hydrated: boolean;
} | null>(null);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, createEmptyDraft);
  const hydrated = useRef(false);

  useEffect(() => {
    const restored = restoreDraft(
      window.localStorage.getItem(DESIGN_DRAFT_KEY),
    );
    if (restored) dispatch({ type: "hydrate", value: restored });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DESIGN_DRAFT_KEY, JSON.stringify(draft));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft]);

  return (
    <DesignContext.Provider
      value={{ draft, dispatch, hydrated: hydrated.current }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const value = useContext(DesignContext);
  if (!value) throw new Error("useDesign must be used inside DesignProvider");
  return value;
}
