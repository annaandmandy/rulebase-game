import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlayerState, WorldState, GameEvent, Choice, Effect, LocationId, GamePhase } from "@/types/game";
import { GameEnding } from "@/types/game";
import { getTriggeredEvent } from "./events";
import { checkEnding } from "./endings";
import { CHECKIN_EVENT } from "./checkinEvent";
import { LOCATIONS } from "./locations";

export type GameStore = {
  player: PlayerState;
  world: WorldState;
  phase: GamePhase;
  currentEvent: GameEvent | null;
  activeEnding: GameEnding | null;
  triggeredEventIds: string[];
  narrativeText: string;
  forcedEndingId: string | null;

  resetToIntro: () => void;
  startGame: () => void;
  navigateTo: (location: LocationId) => void;
  applyChoice: (choice: Choice) => void;
  checkForEvents: () => void;
  formatTime: (minutes?: number) => string;
};

const INITIAL_PLAYER: PlayerState = {
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
  discoveredClues: [],
  endingsUnlocked: [],
  logs: [{ time: "21:43", text: "你抵達山霧旅館。" }],
};

const INITIAL_WORLD: WorldState = {
  fogDensity: 80,
  hotelRealityStability: 100,
  elevatorState: "normal",
  staffMode: "normal",
  room304State: "safe",
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
};

function formatMinutes(timeMinutes: number): string {
  const mod = timeMinutes % (24 * 60);
  const h = Math.floor(mod / 60);
  const m = mod % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function makeLog(timeMinutes: number, text: string) {
  return { time: formatMinutes(timeMinutes), text };
}

function applyEffect(
  player: PlayerState,
  world: WorldState,
  effect: Effect
): { player: PlayerState; world: WorldState; forcedEnding?: string } {
  let p = { ...player };
  let w = { ...world };
  let forcedEnding: string | undefined;

  switch (effect.type) {
    case "sanity":
      p.sanity = Math.max(0, Math.min(100, p.sanity + (effect.value as number)));
      break;
    case "suspicion":
      p.suspicion = Math.max(0, Math.min(100, p.suspicion + (effect.value as number)));
      break;
    case "time":
      p.timeMinutes = p.timeMinutes + (effect.value as number);
      break;
    case "location":
      p.currentLocation = effect.value as LocationId;
      break;
    case "flag":
      (p as Record<string, unknown>)[effect.key!] = effect.value;
      break;
    case "clue":
      if (!p.discoveredClues.includes(effect.value as string)) {
        p.discoveredClues = [...p.discoveredClues, effect.value as string];
      }
      break;
    case "world":
      if (effect.key === "hotelRealityStability") {
        w.hotelRealityStability = Math.max(
          0,
          Math.min(100, w.hotelRealityStability + (effect.value as number))
        );
      } else if (effect.key === "anomalyAttention") {
        w.anomalyAttention = Math.max(0, w.anomalyAttention + (effect.value as number));
      } else if (effect.key === "ruleNoticeVersion") {
        w.ruleNoticeVersion = effect.value as number;
      } else if (effect.key === "elevatorState") {
        w.elevatorState = effect.value as WorldState["elevatorState"];
      } else if (effect.key === "staffMode") {
        w.staffMode = effect.value as WorldState["staffMode"];
      } else if (effect.key === "room304State") {
        w.room304State = effect.value as WorldState["room304State"];
      }
      break;
    case "ending":
      forcedEnding = effect.value as string;
      break;
    case "anomaly":
      w.anomalyAttention = Math.max(0, w.anomalyAttention + (effect.value as number));
      if (w.anomalyAttention > 3) {
        w.hotelRealityStability = Math.max(0, w.hotelRealityStability - 5);
      }
      break;
  }

  return { player: p, world: w, forcedEnding };
}

function updateWorldBasedOnTime(player: PlayerState, world: WorldState): WorldState {
  const w = { ...world };
  const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);

  if ((hour >= 0 && hour < 6) && w.elevatorState === "normal" && w.anomalyAttention >= 2) {
    w.elevatorState = "basement_visible";
  }

  if (player.suspicion > 40 && w.staffMode === "normal") {
    w.staffMode = "watching";
  }
  if (player.suspicion > 70 && w.staffMode === "watching") {
    w.staffMode = "false_helpful";
  }

  if (w.anomalyAttention >= 4 && w.ruleNoticeVersion < 2) {
    w.ruleNoticeVersion = 2;
  }

  if (w.anomalyAttention >= 6 && w.room304State === "safe") {
    w.room304State = "occupied_by_self";
  }

  return w;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: INITIAL_PLAYER,
      world: INITIAL_WORLD,
      phase: "intro" as GamePhase,
      currentEvent: null,
      activeEnding: null,
      triggeredEventIds: [],
      narrativeText: "",
      forcedEndingId: null,

      formatTime: (minutes?: number) => {
        const t = minutes !== undefined ? minutes : get().player.timeMinutes;
        return formatMinutes(t);
      },

      resetToIntro: () => {
        set({
          player: INITIAL_PLAYER,
          world: INITIAL_WORLD,
          phase: "intro",
          currentEvent: null,
          activeEnding: null,
          triggeredEventIds: [],
          narrativeText: "",
          forcedEndingId: null,
        });
      },

      startGame: () => {
        set({
          player: INITIAL_PLAYER,
          world: INITIAL_WORLD,
          phase: "playing",
          currentEvent: CHECKIN_EVENT,
          activeEnding: null,
          triggeredEventIds: [],
          narrativeText: "",
          forcedEndingId: null,
        });
      },

      navigateTo: (location: LocationId) => {
        const { player, world, checkForEvents } = get();
        const timeCost = 10 + Math.floor(Math.random() * 10);
        const locName = LOCATIONS[location]?.name ?? location;
        const newTimeMinutes = player.timeMinutes + timeCost;
        const logEntry = makeLog(newTimeMinutes, `你前往${locName}。`);
        const newPlayer: PlayerState = {
          ...player,
          currentLocation: location,
          timeMinutes: newTimeMinutes,
          logs: [logEntry, ...player.logs].slice(0, 30),
        };
        const newWorld = updateWorldBasedOnTime(newPlayer, world);

        set({ player: newPlayer, world: newWorld, currentEvent: null, narrativeText: "" });
        checkForEvents();
      },

      applyChoice: (choice: Choice) => {
        const { player, world, currentEvent, triggeredEventIds } = get();

        let p = { ...player };
        let w = { ...world };
        let forcedEndingId: string | undefined;

        for (const effect of choice.effects) {
          const result = applyEffect(p, w, effect);
          p = result.player;
          w = result.world;
          if (result.forcedEnding) {
            forcedEndingId = result.forcedEnding;
          }
        }

        if (choice.nextLocation) {
          p.currentLocation = choice.nextLocation;
        }

        w = updateWorldBasedOnTime(p, w);

        // Add log entry directly to p so it survives the set() call
        const logEntry = makeLog(p.timeMinutes, choice.resultText.slice(0, 80) + (choice.resultText.length > 80 ? "…" : ""));
        p.logs = [logEntry, ...p.logs].slice(0, 30);

        const newTriggeredIds = currentEvent
          ? [...triggeredEventIds, currentEvent.id]
          : triggeredEventIds;

        // Check for ending
        const ending = forcedEndingId
          ? checkEnding(p, w, forcedEndingId)
          : checkEnding(p, w);

        if (ending) {
          set({
            player: p,
            world: w,
            currentEvent: null,
            triggeredEventIds: newTriggeredIds,
            narrativeText: choice.resultText,
            activeEnding: ending,
            phase: "ending",
            forcedEndingId: forcedEndingId || null,
          });
          return;
        }

        // Check for new events after the choice
        const nextEvent = getTriggeredEvent(p, w, new Set(newTriggeredIds));

        set({
          player: p,
          world: w,
          currentEvent: nextEvent,
          triggeredEventIds: newTriggeredIds,
          narrativeText: choice.resultText,
          forcedEndingId: forcedEndingId || null,
        });
      },

      checkForEvents: () => {
        const { player, world, triggeredEventIds } = get();
        const event = getTriggeredEvent(player, world, new Set(triggeredEventIds));
        if (event) {
          set({ currentEvent: event });
        }
      },
    }),
    {
      name: "shanwu-game-save",
      skipHydration: true,
      partialize: (state) => ({
        player: state.player,
        world: state.world,
        phase: state.phase,
        triggeredEventIds: state.triggeredEventIds,
        narrativeText: state.narrativeText,
        forcedEndingId: state.forcedEndingId,
      }),
    }
  )
);
