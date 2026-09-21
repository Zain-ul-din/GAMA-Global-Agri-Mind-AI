"use server";

import type { TranscriptItem } from "@/lib/agents";
import { analyzeWithSpecialist, synthesizeDiagnosis } from "@/lib/agents";

export interface CreateDiagnosisInput {
  query: string;
  activeAgents: string[];
  soil: string;
  sun: string;
  zone: string;
  crops: string[];
}

export async function createDiagnosis(input: CreateDiagnosisInput) {
  if (!input.query.trim()) throw new Error("Query string cannot be empty.");
  if (input.activeAgents.length === 0)
    throw new Error("At least one specialist agent must be selected.");

  const transcript: TranscriptItem[] = [];
  const specialistsData: Record<string, string> = {};

  for (const key of input.activeAgents) {
    const item = await analyzeWithSpecialist(
      key,
      input.query,
      input.soil,
      input.sun,
      input.zone,
      input.crops,
    );
    if (item) {
      transcript.push(item);
      specialistsData[item.agentKey] = item.message;
    }
  }

  let synthesis: { confidence: string; summary: string };
  try {
    synthesis = await synthesizeDiagnosis(
      input.query,
      input.activeAgents,
      specialistsData,
      input.soil,
      input.sun,
      input.zone,
    );
  } catch (err) {
    console.error(`Error in Coordinator synthesis: ${err}`);
    synthesis = {
      confidence: "Medium",
      summary:
        "### Consensus Report\nFailed to synthesize expert recommendations. Please review individual statements.",
    };
  }

  return {
    transcript,
    confidence: synthesis.confidence,
    summary: synthesis.summary,
  };
}
