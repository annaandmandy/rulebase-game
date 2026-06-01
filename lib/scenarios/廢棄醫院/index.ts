import { SCENARIO_EVENTS } from "./events";
import { getRules } from "./rules";
import { SCENARIO_RULE_SHEETS } from "./ruleSheets";
import { checkScenarioEnding, SCENARIO_ENDINGS } from "./endings";
import { SCENARIO_DIALOGUES } from "./dialogues";
import { SCENARIO_LOCATIONS } from "./locationActions";
import type { ScenarioPack } from "@/types/scenario";
import type { PlayerState, WorldState } from "@/types/game";

const START_MINUTES = 1387; // 深夜 23:07

// Opening check-in event (first event the player sees)
const CHECKIN_EVENT = SCENARIO_EVENTS.find((e) => e.once === true && e.id.includes("admission"))
  ?? SCENARIO_EVENTS[0];

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
  fogDensity: 60,
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
  ruleNoticeTitle: "留觀患者安全說明",
  nameEn: "Night Observation Protocol",
  tagline: "你只是來夜間留觀，天亮就能出院——如果你還算是病患的話。",
  description:
    "你在深夜因不明原因被轉送到這間早該廢棄的市立醫院附設留觀區。\n日光燈仍亮著，掛號單上有你的名字，一切都太乾淨、太安靜。",
  initialPlayer,
  initialWorld,
  locations: SCENARIO_LOCATIONS,
  checkinEvent: CHECKIN_EVENT,
  events: SCENARIO_EVENTS,
  getRules,
  ruleSheets: SCENARIO_RULE_SHEETS,
  dialogues: SCENARIO_DIALOGUES,
  checkEnding: (player, world, forcedId) => checkScenarioEnding(player, world, forcedId),
};

export default SCENARIO_PACK;
