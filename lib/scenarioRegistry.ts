import { ScenarioPack } from "@/types/scenario";
import { SHANWU_SCENARIO } from "./scenarios/shanwu";

// To add a generated scenario:
//   1. Run: npx tsx scripts/generateScenario.ts "主題" "keywords"
//   2. Import it here:
//      import { MY_SCENARIO } from "./scenarios/my_scenario";
//   3. Add it to the array below.

export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  // MY_SCENARIO,
];

export function getScenarioById(id: string): ScenarioPack | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}
