"use client";

import { useGameStore } from "@/lib/gameState";
import { LocationView } from "./LocationView";
import { ChoicePanel } from "./ChoicePanel";
import { EndingScreen } from "./EndingScreen";
import { motion, AnimatePresence } from "framer-motion";

export function NarrativePanel() {
  const { narrativeText, currentEvent, phase, world } = useGameStore();
  const isCorrupted = world.hotelRealityStability < 30;

  if (phase === "ending") {
    return <EndingScreen />;
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Result text from last choice */}
      <AnimatePresence mode="wait">
        {narrativeText && !currentEvent && (
          <motion.div
            key={narrativeText.slice(0, 20)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-neutral-500 leading-loose whitespace-pre-line border-l border-neutral-800 pl-4 italic"
          >
            {narrativeText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active event or location */}
      {currentEvent ? (
        <ChoicePanel />
      ) : (
        <LocationView />
      )}

      {isCorrupted && (
        <div className="text-xs text-red-900/50 font-mono mt-4 animate-pulse">
          ██ 旅館系統異常 ██
        </div>
      )}
    </div>
  );
}
