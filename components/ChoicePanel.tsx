"use client";

import { useGameStore } from "@/lib/gameState";
import { Choice } from "@/types/game";
import { motion, AnimatePresence } from "framer-motion";

export function ChoicePanel() {
  const { currentEvent, player, world, applyChoice, phase } = useGameStore();

  if (!currentEvent || phase !== "playing") return null;

  const availableChoices = currentEvent.choices.filter((c) =>
    c.condition ? c.condition(player, world) : true
  );

  return (
    <AnimatePresence>
      <motion.div
        key={currentEvent.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        <div className="border-l-2 border-amber-900/50 pl-4">
          <div className="text-xs text-neutral-600 uppercase tracking-widest mb-2">
            {currentEvent.title}
          </div>
          <p className="text-sm text-neutral-300 leading-loose whitespace-pre-line">
            {currentEvent.description}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {availableChoices.map((choice) => (
            <ChoiceButton key={choice.id} choice={choice} onSelect={applyChoice} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ChoiceButton({
  choice,
  onSelect,
}: {
  choice: Choice;
  onSelect: (c: Choice) => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => onSelect(choice)}
      className="text-left px-4 py-3 text-sm text-neutral-300 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-100 hover:bg-neutral-900/50 transition-colors leading-relaxed"
    >
      <span className="text-neutral-700 mr-2">›</span>
      {choice.label}
    </motion.button>
  );
}
