import { PlayerState, WorldState, Effect } from "./game";

export type DialogueMemory = Record<string, boolean | number | string>;

export type DialogueScene = {
  // NPC speaks first
  npcText:
    | string
    | ((p: PlayerState, w: WorldState, m: DialogueMemory) => string);
  choices: DialogueChoice[];
};

export type DialogueChoice = {
  id: string;
  label: string;
  condition?: (p: PlayerState, w: WorldState, m: DialogueMemory) => boolean;
  effects?: Effect[];
  setMemory?: Partial<DialogueMemory>; // update dialogue memory
  next: string | null; // next scene ID, or null to end dialogue
};

export type Dialogue = {
  id: string;
  npcName: string;
  location?: string;
  scenes: Record<string, DialogueScene>;
  startScene: string;
};
