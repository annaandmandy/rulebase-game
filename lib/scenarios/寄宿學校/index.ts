import type { ScenarioPack } from "@/types/scenario";
import type { PlayerState, WorldState } from "@/types/game";
import { SCENARIO_EVENTS } from "./events";
import { getRules } from "./rules";
import { SCENARIO_RULE_SHEETS } from "./ruleSheets";
import { checkScenarioEnding } from "./endings";
import { SCENARIO_DIALOGUES } from "./dialogues";
import { SCENARIO_LOCATIONS } from "./locationActions";

const START_MINUTES = 1303; // 21:43

const CHECKIN_EVENT = SCENARIO_EVENTS.find((e) => e.once === true)
  ?? SCENARIO_EVENTS[0];

const initialPlayer = {
  currentLocation: "dorm_room",
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
  // Scenario-specific flags
  readNotice: false,
  flashlightOn: false,
  doorLocked: false,
  countedRollCall: false,
  metNightStudent: false,
  knowsExtraPerson: false,
  toldNameToVoice: false,
  openedDoorForVoice: false,
  hidUnderBlanket: false,
  reachedDawn: false,
  discoveredClues: [] as string[],
  endingsUnlocked: [] as string[],
} as unknown as PlayerState;

const initialWorld = {
  fogDensity: 30,
  hotelRealityStability: 100,
  elevatorState: "normal" as const,
  staffMode: "normal" as const,
  room304State: "safe" as const,
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
  // Scenario-specific world state
  dormHeadCount: 0,
  expectedHeadCount: 0,
  corridorLightsOn: true,
  broadcastFinished: false,
  rollCallPassed: false,
} as WorldState;

export const SCENARIO_PACK: ScenarioPack = {
  id: "night_roll_call",
  name: "夜讀生點名簿",
  nameEn: "The Night Roll Call",
  tagline: "熄燈後，宿舍的人數永遠要對得上——多一個，或少一個，都不行。",
  description:
    "你是私立惠光中學的轉學生，今晚是住進北棟宿舍的第一夜。\n床頭擺著一份《夜間住宿須知》。深夜十點，廣播響起熄燈提醒，走廊的腳步聲卻沒有停。",
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
