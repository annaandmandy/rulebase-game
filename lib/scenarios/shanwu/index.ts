import { ScenarioPack } from "@/types/scenario";
import { LOCATIONS } from "@/lib/locations";
import { GAME_EVENTS } from "@/lib/events";
import { CHECKIN_EVENT } from "@/lib/checkinEvent";
import { getRules } from "@/lib/rules";
import { RULE_SHEETS } from "@/lib/ruleSheets";
import { FRONT_DESK_DIALOGUE } from "@/lib/dialogues/frontDesk";
import { checkEnding } from "@/lib/endings";

const INITIAL_PLAYER = {
  currentLocation: "front_desk",
  timeMinutes: 21 * 60 + 43,
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
};

const INITIAL_WORLD = {
  fogDensity: 80,
  hotelRealityStability: 100,
  elevatorState: "normal" as const,
  staffMode: "normal" as const,
  room304State: "safe" as const,
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
};

export const SHANWU_SCENARIO: ScenarioPack = {
  id: "shanwu",
  name: "山霧旅館",
  nameEn: "The Mist Hotel",
  tagline: "深夜‧山中‧霧",
  description: "你在深夜抵達這間旅館。手機沒有訊號。規則說這裡很安全。\n\n但規則到底是在保護你，還是在引導你走向某個地方？",
  ruleNoticeTitle: "住客安全須知",

  initialPlayer: INITIAL_PLAYER,
  initialWorld: INITIAL_WORLD,

  locations: LOCATIONS,
  checkinEvent: CHECKIN_EVENT,
  events: GAME_EVENTS,
  getRules,
  ruleSheets: RULE_SHEETS,
  dialogues: { front_desk: FRONT_DESK_DIALOGUE },
  checkEnding,
};
