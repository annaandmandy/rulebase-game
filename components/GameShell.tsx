"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameState";
import { StatusPanel } from "./StatusPanel";
import { NarrativePanel } from "./NarrativePanel";
import { RuleNotice } from "./RuleNotice";
import { JournalPanel } from "./JournalPanel";
import { IntroScreen } from "./IntroScreen";
import { ScenarioSelectScreen } from "./ScenarioSelectScreen";
import { motion, AnimatePresence } from "framer-motion";

export function GameShell() {
  const { phase, world, goToScenarioSelect } = useGameStore();

  useEffect(() => {
    useGameStore.persist.rehydrate();

    setTimeout(() => {
      const state = useGameStore.getState();
      if (
        state.phase === "playing" &&
        !state.currentEvent &&
        !state.triggeredEventIds.includes("checkin") &&
        state.selectedScenario
      ) {
        useGameStore.setState({ currentEvent: state.selectedScenario.checkinEvent });
      }
    }, 0);
  }, []);

  const corruptLevel = Math.max(0, 10 - Math.floor((world.hotelRealityStability as number) / 10));
  const shouldFlicker = corruptLevel >= 7;

  return (
    <div
      className={`h-screen flex flex-col bg-neutral-950 text-neutral-300 overflow-hidden ${
        shouldFlicker ? "animate-flicker" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === "scenario_select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <ScenarioSelectScreen />
          </motion.div>
        )}

        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <IntroScreen />
          </motion.div>
        )}

        {(phase === "playing" || phase === "ending") && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-neutral-900 px-6 py-2 flex items-center justify-between">
              <button
                onClick={goToScenarioSelect}
                className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors"
              >
                ← 劇本
              </button>
              <span className="text-xs text-neutral-700 tracking-widest font-light">
                {useGameStore.getState().selectedScenario?.name ?? ""}
              </span>
              <div className="w-10" />
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left: Status */}
              <div className="w-48 shrink-0 border-r border-neutral-900 overflow-y-auto">
                <StatusPanel />
              </div>

              {/* Center: Narrative + Journal */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-neutral-900 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 min-h-0">
                  <NarrativePanel />
                </div>
                <div className="h-px bg-neutral-900 shrink-0" />
                <div className="flex-1 overflow-y-auto min-h-0">
                  <JournalPanel />
                </div>
              </div>

              {/* Right: Rules */}
              <div className="w-60 shrink-0 overflow-y-auto">
                <RuleNotice />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
