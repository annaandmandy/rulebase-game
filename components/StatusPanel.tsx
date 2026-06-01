"use client";

import { useGameStore } from "@/lib/gameState";
import { getLocationName } from "@/lib/locations";
import { CorruptedText } from "./CorruptedText";

export function StatusPanel() {
  const { player, world, formatTime } = useGameStore();
  const timeDisplay = formatTime();
  const corruptLevel = Math.max(0, 10 - Math.floor(world.hotelRealityStability / 10));
  const locationName = getLocationName(player.currentLocation, world);

  const sanityColor =
    player.sanity > 60
      ? "text-green-400"
      : player.sanity > 30
      ? "text-yellow-400"
      : "text-red-500";

  const stabilityColor =
    world.hotelRealityStability > 60
      ? "text-slate-300"
      : world.hotelRealityStability > 30
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="flex flex-col gap-4 p-4 border border-neutral-800 bg-neutral-950 h-full">
      <div className="border-b border-neutral-800 pb-3">
        <div className="text-xs text-neutral-600 uppercase tracking-widest mb-1">時間</div>
        <div className="text-2xl font-mono text-amber-200/80">
          <CorruptedText
            text={timeDisplay}
            corruptLevel={world.anomalyAttention > 5 ? 3 : 0}
          />
        </div>
      </div>

      <div className="border-b border-neutral-800 pb-3">
        <div className="text-xs text-neutral-600 uppercase tracking-widest mb-1">當前位置</div>
        <div className="text-sm text-neutral-300 font-medium">
          <CorruptedText text={locationName} corruptLevel={corruptLevel > 7 ? 2 : 0} />
        </div>
      </div>

      <div className="border-b border-neutral-800 pb-3">
        <div className="text-xs text-neutral-600 uppercase tracking-widest mb-1">理智值</div>
        <div className={`text-lg font-mono ${sanityColor}`}>
          {player.sanity}
        </div>
        <div className="mt-1 h-1 bg-neutral-800 rounded">
          <div
            className={`h-1 rounded transition-all duration-500 ${
              player.sanity > 60
                ? "bg-green-600"
                : player.sanity > 30
                ? "bg-yellow-600"
                : "bg-red-700"
            }`}
            style={{ width: `${player.sanity}%` }}
          />
        </div>
      </div>

      <div className="border-b border-neutral-800 pb-3">
        <div className="text-xs text-neutral-600 uppercase tracking-widest mb-1">旅館穩定度</div>
        <div className={`text-lg font-mono ${stabilityColor}`}>
          {world.hotelRealityStability}
        </div>
        <div className="mt-1 h-1 bg-neutral-800 rounded">
          <div
            className={`h-1 rounded transition-all duration-700 ${
              world.hotelRealityStability > 60
                ? "bg-slate-500"
                : world.hotelRealityStability > 30
                ? "bg-yellow-700"
                : "bg-red-800"
            }`}
            style={{ width: `${world.hotelRealityStability}%` }}
          />
        </div>
      </div>

      {player.discoveredClues.length > 0 && (
        <div>
          <div className="text-xs text-neutral-600 uppercase tracking-widest mb-2">發現的線索</div>
          <ul className="flex flex-col gap-1">
            {player.discoveredClues.map((clue, i) => (
              <li key={i} className="text-xs text-neutral-500 border-l border-neutral-800 pl-2">
                {clue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
