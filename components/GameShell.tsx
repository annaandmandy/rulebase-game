"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/gameState";
import { StatusPanel } from "./StatusPanel";
import { NarrativePanel } from "./NarrativePanel";
import { RuleNotice } from "./RuleNotice";
import { JournalPanel } from "./JournalPanel";
import { IntroScreen } from "./IntroScreen";
import { ScenarioSelectScreen } from "./ScenarioSelectScreen";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Drag handle — fires onDelta(px) as the user drags
function VDivider({ onDelta }: { onDelta: (dx: number) => void }) {
  const ref = useRef<number | null>(null);
  const down = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current = e.clientX;
    const onMove = (ev: MouseEvent) => {
      if (ref.current === null) return;
      onDelta(ev.clientX - ref.current);
      ref.current = ev.clientX;
    };
    const onUp = () => {
      ref.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [onDelta]);

  return (
    <div
      onMouseDown={down}
      className="w-1 shrink-0 cursor-col-resize bg-neutral-900 hover:bg-neutral-600 active:bg-neutral-500 transition-colors"
    />
  );
}

function HDivider({ onDelta }: { onDelta: (dy: number) => void }) {
  const ref = useRef<number | null>(null);
  const down = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current = e.clientY;
    const onMove = (ev: MouseEvent) => {
      if (ref.current === null) return;
      onDelta(ev.clientY - ref.current);
      ref.current = ev.clientY;
    };
    const onUp = () => {
      ref.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [onDelta]);

  return (
    <div
      onMouseDown={down}
      className="h-1 shrink-0 cursor-row-resize bg-neutral-900 hover:bg-neutral-600 active:bg-neutral-500 transition-colors"
    />
  );
}

export function GameShell() {
  const { phase, world, goToScenarioSelect, generationJob } = useGameStore();

  // Panel widths in px; center takes the rest
  const [leftW, setLeftW] = useState(192);
  const [rightW, setRightW] = useState(240);
  // Center vertical split: top height in px; bottom takes the rest
  const centerRef = useRef<HTMLDivElement>(null);
  const [topH, setTopH] = useState<number | null>(null); // null = use flex default

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

  const dragLeft = useCallback((dx: number) => {
    setLeftW((w) => Math.max(120, Math.min(360, w + dx)));
  }, []);

  const dragRight = useCallback((dx: number) => {
    setRightW((w) => Math.max(120, Math.min(480, w - dx)));
  }, []);

  const dragTop = useCallback((dy: number) => {
    if (!centerRef.current) return;
    const total = centerRef.current.clientHeight;
    setTopH((h) => {
      const cur = h ?? total * 0.55;
      return Math.max(80, Math.min(total - 80, cur + dy));
    });
  }, []);

  return (
    <div
      className={`h-screen flex flex-col bg-neutral-950 text-neutral-300 overflow-hidden ${
        corruptLevel >= 7 ? "animate-flicker" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === "scenario_select" && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
            <ScenarioSelectScreen />
          </motion.div>
        )}

        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center">
            <IntroScreen />
          </motion.div>
        )}

        {(phase === "playing" || phase === "ending") && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 border-b border-neutral-900 px-4 py-2 flex items-center justify-between">
              <button onClick={goToScenarioSelect} className="text-xs text-neutral-700 hover:text-neutral-500 transition-colors">
                ← 劇本
              </button>
              <span className="text-xs text-neutral-700 tracking-widest font-light">
                {useGameStore.getState().selectedScenario?.name ?? ""}
              </span>
              <div className="flex items-center gap-3">
                {generationJob?.running && (
                  <Link href="/generate" className="text-xs text-amber-800/70 hover:text-amber-700 animate-pulse">生成中</Link>
                )}
                {generationJob?.done && generationJob.success && (
                  <Link href="/generate" className="text-xs text-green-800/70 hover:text-green-700">新劇本完成</Link>
                )}
              </div>
            </div>

            {/* 3-column resizable layout */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left */}
              <div style={{ width: leftW, minWidth: 120 }} className="shrink-0 overflow-y-auto">
                <StatusPanel />
              </div>

              <VDivider onDelta={dragLeft} />

              {/* Center: vertical split */}
              <div ref={centerRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
                <div
                  style={topH !== null ? { height: topH, flexShrink: 0 } : { flex: "0 0 55%" }}
                  className="overflow-y-auto p-5"
                >
                  <NarrativePanel />
                </div>

                <HDivider onDelta={dragTop} />

                <div className="flex-1 overflow-y-auto min-h-0">
                  <JournalPanel />
                </div>
              </div>

              <VDivider onDelta={dragRight} />

              {/* Right */}
              <div style={{ width: rightW, minWidth: 120 }} className="shrink-0 overflow-y-auto">
                <RuleNotice />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
