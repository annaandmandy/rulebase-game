export type LocationId =
  | "lobby"
  | "elevator"
  | "corridor"
  | "room304"
  | "restaurant"
  | "stairwell"
  | "basement_entrance"
  | "balcony"
  | "front_desk";

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
  // found documents
  foundSheets: string[];
  // new event flags
  phoneAnswered: boolean;
  heardName: boolean;
  wardrobeOpened: boolean;
  foundPreviousNote: boolean;
  talkedToChild: boolean;
  eggVerificationDone: boolean;
  discoveredClues: string[];
  endingsUnlocked: string[];
  logs: GameLog[];
};

export type WorldState = {
  fogDensity: number;
  hotelRealityStability: number;
  elevatorState: "normal" | "wrong_floor" | "basement_visible";
  staffMode: "normal" | "watching" | "hostile" | "false_helpful";
  room304State: "safe" | "duplicated" | "occupied_by_self" | "missing";
  ruleNoticeVersion: number;
  anomalyAttention: number;
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

export type GamePhase = "intro" | "playing" | "ending";

export type EndingId = "A" | "B" | "C" | "D" | "hidden";

export type GameEnding = {
  id: EndingId;
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
};
