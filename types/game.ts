// LocationId is a string so generated scenarios can define custom locations
export type LocationId = string;

export type GameLog = {
  time: string;
  text: string;
};

export type PlayerState = {
  currentLocation: LocationId;
  timeMinutes: number;
  sanity: number;
  suspicion: number;
  hasRoomKey: boolean;
  openedWindow: boolean;
  answeredKnock: boolean;
  enteredBasement: boolean;
  ateEggs: boolean;
  sawDuplicateGuest: boolean;
  hasReadExtraRule: boolean;
  foundSheets: string[];
  phoneAnswered: boolean;
  heardName: boolean;
  wardrobeOpened: boolean;
  foundPreviousNote: boolean;
  talkedToChild: boolean;
  eggVerificationDone: boolean;
  knewTooMuch: boolean;
  discoveredClues: string[];
  endingsUnlocked: string[];
  logs: GameLog[];
  // Extra flags for generated scenarios (keyed by name)
  [key: string]: unknown;
};

export type WorldState = {
  fogDensity: number;
  hotelRealityStability: number;
  elevatorState: "normal" | "wrong_floor" | "basement_visible";
  staffMode: "normal" | "watching" | "hostile" | "false_helpful";
  room304State: "safe" | "duplicated" | "occupied_by_self" | "missing";
  ruleNoticeVersion: number;
  anomalyAttention: number;
  // Extra world state for generated scenarios
  [key: string]: unknown;
};

export type Effect = {
  type:
    | "sanity"
    | "suspicion"
    | "time"
    | "location"
    | "flag"
    | "clue"
    | "world"
    | "ending"
    | "anomaly"
    | "sheet";
  key?: string;
  value?: number | boolean | string;
};

export type Choice = {
  id: string;
  label: string;
  resultText: string;
  effects: Effect[];
  nextLocation?: LocationId;
  condition?: (player: PlayerState, world: WorldState) => boolean;
};

export type GameEvent = {
  id: string;
  title: string;
  trigger: (player: PlayerState, world: WorldState) => boolean;
  description: string;
  choices: Choice[];
  once?: boolean;
};

export type GamePhase = "scenario_select" | "intro" | "playing" | "ending";

export type GameEnding = {
  id: string;
  title: string;
  text: string;
  condition: (player: PlayerState, world: WorldState) => boolean;
};

export type LocationAction = {
  id: string;
  label: string;
  condition?: (player: PlayerState, world: WorldState) => boolean;
  resultText: string | ((player: PlayerState, world: WorldState) => string);
  effects: Effect[];
  dialogueId?: string;
};
