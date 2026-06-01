"use client";

import { useGameStore } from "@/lib/gameState";
import { motion } from "framer-motion";

export function EndingScreen() {
  const { activeEnding, resetToIntro } = useGameStore();

  if (!activeEnding) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col gap-8 max-w-xl mx-auto pt-4"
    >
      <div>
        <div className="text-xs text-neutral-700 uppercase tracking-widest mb-2">結局</div>
        <h2 className="text-xl text-amber-200/70 font-light">{activeEnding.title}</h2>
      </div>

      <div className="text-sm text-neutral-400 leading-loose whitespace-pre-line border-l border-neutral-800 pl-4">
        {activeEnding.text}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={resetToIntro}
          className="px-5 py-2 text-xs text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-colors"
        >
          重新入住
        </button>
      </div>

      <div className="text-xs text-neutral-800 mt-4">
        山霧旅館 — 感謝入住
      </div>
    </motion.div>
  );
}
