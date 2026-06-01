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
  currentLocation: "dormitory_entrance",
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
  fogDensity: 40,
  hotelRealityStability: 100,
  elevatorState: "normal" as const,
  staffMode: "normal" as const,
  room304State: "safe" as const,
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
} as WorldState;

export const SCENARIO_PACK: ScenarioPack = {
  id: "after_evening_study",
  name: "晚自習結束之後",
  nameEn: "After Evening Study",
  tagline: "鐘響了三次，但時刻表上今晚只該響兩次。",
  description:
    "你是私立惠生中學住宿部的轉學生，被安排在學期中入住。\n發給你一份《夜間作息須知》，整層樓似乎只剩你一個學生。",
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
