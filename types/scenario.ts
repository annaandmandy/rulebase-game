import { PlayerState, WorldState, GameEvent, GameEnding } from "./game";
import { RuleEntry } from "@/lib/rules";
import { RuleSheet } from "@/lib/ruleSheets";
import { Dialogue } from "./dialogue";

export type LocationData = {
  id: string;
  name: string;
  mutatedName?: string;
  description: (player: PlayerState, world: WorldState) => string;
  adjacentLocations: string[];
  actions: import("./game").LocationAction[];
};

export type ScenarioPack = {
  id: string;
  name: string;
  nameEn?: string;
  tagline: string;
  description: string;

  initialPlayer: Omit<PlayerState, "logs">;
  initialWorld: WorldState;

  locations: Record<string, LocationData>;
  checkinEvent: GameEvent;
  events: GameEvent[];
  getRules: (player: PlayerState, world: WorldState) => RuleEntry[];
  ruleSheets: Record<string, RuleSheet>;
  dialogues: Record<string, Dialogue>;
  checkEnding: (
    player: PlayerState,
    world: WorldState,
    forcedEnding?: string
  ) => GameEnding | null;
};
