"use client";

import { useGameStore } from "@/lib/gameState";

export function JournalPanel() {
  const { player } = useGameStore();

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <div className="text-xs text-neutral-700 uppercase tracking-widest mb-2 shrink-0">記錄</div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
        {player.logs.map((log, i) => (
          <div key={i} className="flex gap-2 text-xs text-neutral-600">
            <span className="font-mono text-neutral-700 shrink-0">{log.time}</span>
            <span className="leading-relaxed">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
