import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlayerState, WorldState, GameEvent, Choice, Effect, LocationId, GamePhase, GameEnding } from "@/types/game";
import { ScenarioPack } from "@/types/scenario";
import { getTriggeredEvent } from "./events";
import { getScenarioById } from "./scenarioRegistry";
import { DialogueMemory } from "@/types/dialogue";
import { Dialogue, DialogueChoice } from "@/types/dialogue";

export type GenerationJob = {
  theme: string;
  slug: string;
  running: boolean;
  done: boolean;
  success?: boolean;
  logs: string[];
};

export type GameStore = {
  // Background scenario generation
  generationJob: GenerationJob | null;
  setGenerationJob: (job: GenerationJob | null | ((prev: GenerationJob | null) => GenerationJob | null)) => void;
  appendGenerationLog: (line: string) => void;

  // Scenario
  selectedScenario: ScenarioPack | null;
  scenarioId: string | null;

  // Game state
  player: PlayerState;
  world: WorldState;
  phase: GamePhase;
  currentEvent: GameEvent | null;
  activeEnding: GameEnding | null;
  triggeredEventIds: string[];
  narrativeText: string;
  forcedEndingId: string | null;

  // Dialogue state
  activeDialogue: Dialogue | null;
  currentDialogueSceneId: string | null;
  dialogueMemory: DialogueMemory;

  // Actions
  goToScenarioSelect: () => void;
  selectScenario: (scenario: ScenarioPack) => void;
  startGame: () => void;
  navigateTo: (location: LocationId) => void;
  applyChoice: (choice: Choice) => void;
  checkForEvents: () => void;
  startDialogue: (dialogue: Dialogue) => void;
  selectDialogueOption: (choice: DialogueChoice) => void;
  formatTime: (minutes?: number) => string;
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
    case "sheet":
      if (!p.foundSheets.includes(effect.value as string)) {
        p.foundSheets = [...p.foundSheets, effect.value as string];
      }
      break;
    case "world":
      if (effect.key) {
        const v = effect.value as number;
        if (effect.key === "hotelRealityStability") {
          w.hotelRealityStability = Math.max(0, Math.min(100, (w.hotelRealityStability as number) + v));
        } else if (effect.key === "anomalyAttention") {
          w.anomalyAttention = Math.max(0, (w.anomalyAttention as number) + v);
        } else {
          (w as Record<string, unknown>)[effect.key] = effect.value;
        }
      }
      break;
    case "ending":
      forcedEnding = effect.value as string;
      break;
    case "anomaly":
      w.anomalyAttention = Math.max(0, (w.anomalyAttention as number) + (effect.value as number));
      if ((w.anomalyAttention as number) > 3) {
        w.hotelRealityStability = Math.max(0, (w.hotelRealityStability as number) - 5);
      }
      break;
  }

  return { player: p, world: w, forcedEnding };
}

function updateWorldBasedOnTime(player: PlayerState, world: WorldState): WorldState {
  const w = { ...world };
  const hour = Math.floor((player.timeMinutes % (24 * 60)) / 60);

  if ((hour >= 0 && hour < 6) && w.elevatorState === "normal" && (w.anomalyAttention as number) >= 2) {
    w.elevatorState = "basement_visible";
  }
  if (player.suspicion > 40 && w.staffMode === "normal") w.staffMode = "watching";
  if (player.suspicion > 70 && w.staffMode === "watching") w.staffMode = "false_helpful";
  if ((w.anomalyAttention as number) >= 4 && (w.ruleNoticeVersion as number) < 2) w.ruleNoticeVersion = 2;
  if ((w.anomalyAttention as number) >= 6 && w.room304State === "safe") w.room304State = "occupied_by_self";

  return w;
}

const BLANK_PLAYER: PlayerState = {
  currentLocation: "lobby",
  timeMinutes: 0,
  sanity: 100,
  suspicion: 0,
  hasRoomKey: false,
  openedWindow: false,
  answeredKnock: false,
  enteredBasement: false,
  ateEggs: false,
  sawDuplicateGuest: false,
  hasReadExtraRule: false,
  foundSheets: [],
  phoneAnswered: false,
  heardName: false,
  wardrobeOpened: false,
  foundPreviousNote: false,
  talkedToChild: false,
  eggVerificationDone: false,
  knewTooMuch: false,
  discoveredClues: [],
  endingsUnlocked: [],
  logs: [],
};

const BLANK_WORLD: WorldState = {
  fogDensity: 80,
  hotelRealityStability: 100,
  elevatorState: "normal",
  staffMode: "normal",
  room304State: "safe",
  ruleNoticeVersion: 1,
  anomalyAttention: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      generationJob: null,
      setGenerationJob: (job) =>
        set((s) => ({
          generationJob: typeof job === "function" ? job(s.generationJob) : job,
        })),
      appendGenerationLog: (line) =>
        set((s) =>
          s.generationJob
            ? { generationJob: { ...s.generationJob, logs: [...s.generationJob.logs.slice(-50), line] } }
            : {}
        ),

      selectedScenario: null,
      scenarioId: null,
      player: BLANK_PLAYER,
      world: BLANK_WORLD,
      phase: "scenario_select" as GamePhase,
      currentEvent: null,
      activeEnding: null,
      triggeredEventIds: [],
      narrativeText: "",
      forcedEndingId: null,
      activeDialogue: null,
      currentDialogueSceneId: null,
      dialogueMemory: {},

      formatTime: (minutes?: number) => {
        const t = minutes !== undefined ? minutes : get().player.timeMinutes;
        return formatMinutes(t);
      },

      goToScenarioSelect: () => {
        set({
          phase: "scenario_select",
          currentEvent: null,
          activeEnding: null,
          activeDialogue: null,
          currentDialogueSceneId: null,
          dialogueMemory: {},
        });
      },

      selectScenario: (scenario: ScenarioPack) => {
        set({
          selectedScenario: scenario,
          scenarioId: scenario.id,
          phase: "intro",
          player: BLANK_PLAYER,
          world: BLANK_WORLD,
          currentEvent: null,
          activeEnding: null,
          triggeredEventIds: [],
          narrativeText: "",
          forcedEndingId: null,
          activeDialogue: null,
          currentDialogueSceneId: null,
          dialogueMemory: {},
        });
      },

      startGame: () => {
        const { selectedScenario } = get();
        if (!selectedScenario) return;

        const player = {
          ...selectedScenario.initialPlayer,
          logs: [{ time: formatMinutes(selectedScenario.initialPlayer.timeMinutes as number), text: `你抵達${selectedScenario.name}。` }],
        } as PlayerState;

        set({
          player,
          world: { ...selectedScenario.initialWorld },
          phase: "playing",
          currentEvent: selectedScenario.checkinEvent,
          activeEnding: null,
          triggeredEventIds: [],
          narrativeText: "",
          forcedEndingId: null,
          activeDialogue: null,
          currentDialogueSceneId: null,
          dialogueMemory: {},
        });
      },

      navigateTo: (location: LocationId) => {
        const { player, world, selectedScenario, checkForEvents } = get();
        if (!selectedScenario) return;

        const timeCost = 10 + Math.floor(Math.random() * 10);
        const locName = selectedScenario.locations[location]?.name ?? location;
        const newTimeMinutes = player.timeMinutes + timeCost;
        const logEntry = makeLog(newTimeMinutes, `你前往${locName}。`);
        const newPlayer: PlayerState = {
          ...player,
          currentLocation: location,
          timeMinutes: newTimeMinutes,
          logs: [logEntry, ...player.logs].slice(0, 30),
        };
        const newWorld = updateWorldBasedOnTime(newPlayer, world);

        set({ player: newPlayer, world: newWorld, currentEvent: null, narrativeText: "", activeDialogue: null });
        checkForEvents();
      },

      applyChoice: (choice: Choice) => {
        const { player, world, currentEvent, triggeredEventIds, selectedScenario } = get();
        if (!selectedScenario) return;

        let p = { ...player };
        let w = { ...world };
        let forcedEndingId: string | undefined;

        for (const effect of choice.effects) {
          const result = applyEffect(p, w, effect);
          p = result.player;
          w = result.world;
          if (result.forcedEnding) forcedEndingId = result.forcedEnding;
        }

        if (choice.nextLocation) p.currentLocation = choice.nextLocation;
        w = updateWorldBasedOnTime(p, w);

        const logEntry = makeLog(p.timeMinutes, choice.resultText.slice(0, 80) + (choice.resultText.length > 80 ? "…" : ""));
        p.logs = [logEntry, ...p.logs].slice(0, 30);

        const newTriggeredIds = currentEvent
          ? [...triggeredEventIds, currentEvent.id]
          : triggeredEventIds;

        const ending = forcedEndingId
          ? selectedScenario.checkEnding(p, w, forcedEndingId)
          : selectedScenario.checkEnding(p, w);

        if (ending) {
          set({
            player: p, world: w,
            currentEvent: null,
            triggeredEventIds: newTriggeredIds,
            narrativeText: choice.resultText,
            activeEnding: ending,
            phase: "ending",
            forcedEndingId: forcedEndingId || null,
          });
          return;
        }

        const nextEvent = getTriggeredEvent(p, w, new Set(newTriggeredIds), selectedScenario.events);

        set({
          player: p, world: w,
          currentEvent: nextEvent,
          triggeredEventIds: newTriggeredIds,
          narrativeText: choice.resultText,
          forcedEndingId: forcedEndingId || null,
        });
      },

      checkForEvents: () => {
        const { player, world, triggeredEventIds, selectedScenario } = get();
        if (!selectedScenario) return;
        const event = getTriggeredEvent(player, world, new Set(triggeredEventIds), selectedScenario.events);
        if (event) set({ currentEvent: event });
      },

      startDialogue: (dialogue: Dialogue) => {
        set({
          activeDialogue: dialogue,
          currentDialogueSceneId: dialogue.startScene,
          dialogueMemory: {},
        });
      },

      selectDialogueOption: (choice: DialogueChoice) => {
        const { player, world, dialogueMemory, activeDialogue, selectedScenario } = get();
        if (!selectedScenario) return;

        let p = { ...player };
        let w = { ...world };
        let forcedEndingId: string | undefined;

        if (choice.effects) {
          for (const effect of choice.effects) {
            const result = applyEffect(p, w, effect);
            p = result.player;
            w = result.world;
            if (result.forcedEnding) forcedEndingId = result.forcedEnding;
          }
        }

        const newMemory: DialogueMemory = choice.setMemory
          ? { ...dialogueMemory, ...(choice.setMemory as DialogueMemory) }
          : dialogueMemory;

        if (choice.next === null) {
          // End dialogue
          const logEntry = makeLog(p.timeMinutes, `結束了和${activeDialogue?.npcName ?? "NPC"}的對話。`);
          p.logs = [logEntry, ...p.logs].slice(0, 30);
          w = updateWorldBasedOnTime(p, w);

          // Check for ending triggered by dialogue
          const ending = forcedEndingId
            ? selectedScenario.checkEnding(p, w, forcedEndingId)
            : null;

          if (ending) {
            set({ player: p, world: w, activeDialogue: null, currentDialogueSceneId: null, dialogueMemory: {}, activeEnding: ending, phase: "ending" });
          } else {
            set({ player: p, world: w, activeDialogue: null, currentDialogueSceneId: null, dialogueMemory: newMemory });
          }
        } else {
          set({
            player: p, world: w,
            currentDialogueSceneId: choice.next,
            dialogueMemory: newMemory,
          });
        }
      },
    }),
    {
      name: "rulebase-game-save-v2",
      skipHydration: true,
      partialize: (state) => ({
        scenarioId: state.scenarioId,
        player: state.player,
        world: state.world,
        phase: state.phase,
        triggeredEventIds: state.triggeredEventIds,
        narrativeText: state.narrativeText,
        forcedEndingId: state.forcedEndingId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Restore selectedScenario from saved scenarioId
        if (state.scenarioId) {
          const scenario = getScenarioById(state.scenarioId);
          if (scenario) {
            state.selectedScenario = scenario;
          } else {
            state.phase = "scenario_select";
          }
        }
        // Restore checkin event if game started but not completed
        if (state.phase === "playing" && state.selectedScenario && !state.triggeredEventIds.includes("checkin")) {
          state.currentEvent = state.selectedScenario.checkinEvent;
        }
      },
    }
  )
);
