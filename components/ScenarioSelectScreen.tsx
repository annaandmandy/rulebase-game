"use client";

import { useGameStore } from "@/lib/gameState";
import { ALL_SCENARIOS } from "@/lib/scenarioRegistry";
import { ScenarioPack } from "@/types/scenario";
import { motion } from "framer-motion";
import Link from "next/link";

export function ScenarioSelectScreen() {
  const { selectScenario, generationJob } = useGameStore();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-3xl flex flex-col gap-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-xs text-neutral-700 uppercase tracking-widest mb-3">
            規則怪談 互動敘事
          </div>
          <h1 className="text-2xl text-neutral-400 font-light tracking-widest">
            選擇劇本
          </h1>
        </div>

        {/* Scenario list */}
        <div className="flex flex-col gap-4">
          {ALL_SCENARIOS.map((scenario, i) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              index={i}
              onSelect={() => selectScenario(scenario)}
            />
          ))}
        </div>

        <div className="text-center text-xs text-neutral-800">
          每個劇本約需 20-30 分鐘 · 建議在安靜的環境中遊玩
        </div>

        <div className="text-center">
          <Link
            href="/generate"
            className={`text-xs transition-colors border px-4 py-2 inline-block ${
              generationJob?.running
                ? "text-amber-700/80 border-amber-900/50 animate-pulse"
                : generationJob?.done && generationJob.success
                ? "text-green-700 border-green-900/50"
                : "text-neutral-800 hover:text-neutral-600 border-neutral-900"
            }`}
          >
            {generationJob?.running
              ? `生成中：${generationJob.theme}…`
              : generationJob?.done && generationJob.success
              ? `✓ ${generationJob.theme} 完成`
              : "+ 生成新劇本"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  index,
  onSelect,
}: {
  scenario: ScenarioPack;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      whileHover={{ x: 6 }}
      onClick={onSelect}
      className="group text-left border border-neutral-800 hover:border-neutral-600 bg-neutral-950 hover:bg-neutral-900/60 transition-all duration-300 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Name */}
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg text-neutral-300 group-hover:text-neutral-100 transition-colors font-light tracking-wide">
              {scenario.name}
            </h2>
            {scenario.nameEn && (
              <span className="text-xs text-neutral-700 tracking-wider">
                {scenario.nameEn}
              </span>
            )}
          </div>

          {/* Tagline */}
          <div className="text-xs text-neutral-600 tracking-widest">
            {scenario.tagline}
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-500 leading-relaxed mt-1 whitespace-pre-line">
            {scenario.description}
          </p>
        </div>

        {/* Arrow */}
        <div className="text-neutral-700 group-hover:text-neutral-400 transition-colors text-lg shrink-0 mt-1">
          ›
        </div>
      </div>
    </motion.button>
  );
}
