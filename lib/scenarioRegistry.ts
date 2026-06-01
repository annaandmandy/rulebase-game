import { ScenarioPack } from "@/types/scenario";
import { SHANWU_SCENARIO } from "./scenarios/shanwu";
import { SCENARIO_PACK as 廢棄醫院_SCENARIO } from "./scenarios/廢棄醫院";
import { SCENARIO_PACK as 寄宿學校_SCENARIO } from "./scenarios/寄宿學校";

export const ALL_SCENARIOS: ScenarioPack[] = [
  SHANWU_SCENARIO,
  廢棄醫院_SCENARIO,
  寄宿學校_SCENARIO,
];

export function getScenarioById(id: string): ScenarioPack | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}
