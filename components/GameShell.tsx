"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameState";
import { CHECKIN_EVENT } from "@/lib/checkinEvent";
import { StatusPanel } from "./StatusPanel";
import { NarrativePanel } from "./NarrativePanel";
import { RuleNotice } from "./RuleNotice";
import { JournalPanel } from "./JournalPanel";
import { IntroScreen } from "./IntroScreen";
import { motion, AnimatePresence } from "framer-motion";

export function GameShell() {
  const { phase, world, resetToIntro } = useGameStore();

  useEffect(() => {
    // Manually rehydrate (skipHydration: true prevents SSR mismatch)
    useGameStore.persist.rehydrate();

    // After rehydration, if we're mid-game but checkin wasn't completed, restore it
    setTimeout(() => {
      const state = useGameStore.getState();
      if (
        state.phase === "playing" &&
        !state.currentEvent &&
        !state.triggeredEventIds.includes("checkin")
      ) {
        useGameStore.setState({ currentEvent: CHECKIN_EVENT });
      }
    }, 0);
  }, []);

  const corruptLevel = Math.max(0, 10 - Math.floor(world.hotelRealityStability / 10));
  const shouldFlicker = corruptLevel >= 7;

  return (
    <div
      className={`h-screen flex flex-col bg-neutral-950 text-neutral-300 overflow-hidden ${
        shouldFlicker ? "animate-flicker" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <IntroScreen />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-neutral-900 px-6 py-2 flex items-center justify-between">
              <span className="text-xs text-neutral-700 tracking-widest font-light">
                山霧旅館
              </span>
              <button
                onClick={resetToIntro}
                className="text-xs text-neutral-800 hover:text-neutral-600 transition-colors"
              >
                重置
              </button>
            </div>

            {/* Main layout — full height minus header */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left: Status */}
              <div className="w-48 shrink-0 border-r border-neutral-900 overflow-y-auto">
                <StatusPanel />
              </div>

              {/* Center: Narrative (top half) + Journal (bottom half) */}
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
