"use client";

import { useGameStore } from "@/lib/gameState";
import { motion } from "framer-motion";

export function IntroScreen() {
  const { startGame, selectedScenario, goToScenarioSelect } = useGameStore();

  const name = selectedScenario?.name ?? "山霧旅館";
  const nameEn = selectedScenario?.nameEn;
  const tagline = selectedScenario?.tagline ?? "深夜 · 山中 · 霧";

  return (
    <motion.div
      className="flex flex-col items-center gap-8 text-center max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-2">
        <motion.div
          className="text-xs text-neutral-700 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {tagline}
        </motion.div>
        <motion.h1
          className="text-4xl text-amber-100/60 font-light tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {name}
        </motion.h1>
        {nameEn && (
          <motion.div
            className="text-xs text-neutral-700 tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {nameEn}
          </motion.div>
        )}
      </div>

      {selectedScenario?.description && (
        <motion.p
          className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {selectedScenario.description}
        </motion.p>
      )}

      <motion.button
        onClick={startGame}
        className="mt-4 px-8 py-3 text-sm text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ letterSpacing: "0.15em" }}
      >
        開始
      </motion.button>

      <motion.button
        onClick={goToScenarioSelect}
        className="text-xs text-neutral-800 hover:text-neutral-600 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
      >
        ← 返回劇本選擇
      </motion.button>
    </motion.div>
  );
}
