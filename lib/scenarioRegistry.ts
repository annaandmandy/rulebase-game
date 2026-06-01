import { ScenarioPack } from "@/types/scenario";
import { SHANWU_SCENARIO } from "./scenarios/shanwu";
import { SCENARIO_PACK as 廢棄醫院_SCENARIO } from "./scenarios/廢棄醫院";

// ─── Scenario registry ────────────────────────────────────────────────────────
// This file is auto-managed by lib/generator/addToRegistry.ts
// DO NOT manually add imports — run the generator and it will add them here.
// Generated scenarios: add import above and entry in ALL_SCENARIOS below.

import { SCENARIO_PACK } from "./scenarios/寄宿學校";
export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  廢棄醫院_SCENARIO,
  SCENARIO_PACK,
];

export function getScenarioById(id: string): ScenarioPack | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}
