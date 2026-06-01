import { SCENARIO_EVENTS } from "./events";
import { getRules } from "./rules";
import { SCENARIO_RULE_SHEETS } from "./ruleSheets";
import { checkScenarioEnding } from "./endings";
import { SCENARIO_DIALOGUES } from "./dialogues";
import { SCENARIO_LOCATIONS } from "./locationActions";
import type { PlayerState, WorldState, GameEvent, GameEnding } from "@/types/game";
import type { LocationData } from "@/types/scenario";
import type { Dialogue } from "@/types/dialogue";
import type { RuleSheet } from "@/lib/ruleSheets";

// 遊戲開始時間：深夜 23:07 = 1387 分鐘
const START_MINUTES = 1387;

export type ScenarioPack = {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  description: string;
  startMinutes: number;
  initialPlayer: PlayerState;
  initialWorld: WorldState;
  locations: Record<string, LocationData>;
  events: GameEvent[];
  dialogues: Record<string, Dialogue>;
  ruleSheets: Record<string, RuleSheet>;
  getRules: (player: PlayerState, world: WorldState) => import("@/lib/rules").RuleEntry[];
  checkEnding: (player: PlayerState, world: WorldState) => GameEnding | null;
};

const initialPlayer = {
  currentLocation: "triage_desk",
  timeMinutes: START_MINUTES,
  sanity: 100,
  suspicion: 0,
  hasRoomKey: false,
  openedWindow: false,
  answeredKnock: false,
  enteredBasement: false,
  ateEggs: false,
  sawDuplicateGuest: false,
  hasReadExtraRule: false,
  foundSheets: [] as string[],
  phoneAnswered: false,
  heardName: false,
  wardrobeOpened: false,
  foundPreviousNote: false,
  talkedToChild: false,
  eggVerificationDone: false,
  knewTooMuch: false,
  discoveredClues: [] as string[],
  endingsUnlocked: [] as string[],
} as PlayerState;

const initialWorld = {
  fogDensity: 80,
  hotelRealityStability: 100,
  elevatorState: "normal" as const,
  staffMode: "normal" as const,
  room304State: "safe" as const,
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
} as WorldState;

export const SCENARIO_PACK: ScenarioPack = {
  id: "night_observation_protocol",
  name: "夜間留觀須知",
  nameEn: "Night Observation Protocol",
  tagline: "你只是來夜間留觀，天亮就能出院——如果你還算是病患的話。",
  description:
    "你在深夜因不明原因被轉送到這間早該廢棄的市立醫院附設留觀區。日光燈仍亮著，掛號單上有你的名字，值班護理站還有人。一切都太乾淨、太安靜，像是有人剛剛才把灰塵全部擦掉。",
  startMinutes: START_MINUTES,
  initialPlayer,
  initialWorld,
  locations: SCENARIO_LOCATIONS,
  events: SCENARIO_EVENTS,
  dialogues: SCENARIO_DIALOGUES,
  ruleSheets: SCENARIO_RULE_SHEETS,
  getRules,
  checkEnding: checkScenarioEnding,
};

export default SCENARIO_PACK;
