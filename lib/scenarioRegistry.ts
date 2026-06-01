import { ScenarioPack } from "@/types/scenario";
import { SHANWU_SCENARIO } from "./scenarios/shanwu";
import { SCENARIO_PACK as 廢棄醫院_SCENARIO } from "./scenarios/廢棄醫院";
export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  廢棄醫院_SCENARIO,
];

export function getScenarioById(id: string): ScenarioPack | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}
