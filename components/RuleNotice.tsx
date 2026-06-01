"use client";

import { useGameStore } from "@/lib/gameState";
import { getRules } from "@/lib/rules";
import { CorruptedText } from "./CorruptedText";

export function RuleNotice() {
  const { player, world } = useGameStore();
  const rules = getRules(world.ruleNoticeVersion, player.hasReadExtraRule);
  const corruptLevel = Math.max(0, 10 - Math.floor(world.hotelRealityStability / 10));
  const isCorrupted = world.hotelRealityStability < 50;

  return (
    <div className="flex flex-col h-full p-4 border border-neutral-800 bg-neutral-950">
      <div className="text-xs text-neutral-600 uppercase tracking-widest mb-3">住客安全須知</div>
      <div
        className={`flex-1 overflow-y-auto font-mono text-xs leading-relaxed ${
          isCorrupted ? "text-amber-200/60" : "text-amber-100/70"
        }`}
        style={{
          background: "rgba(20,15,5,0.8)",
          border: "1px solid rgba(180,140,60,0.15)",
          padding: "0.75rem",
          borderRadius: "2px",
        }}
      >
        <div className="text-center text-amber-200/50 mb-3 text-xs border-b border-amber-200/10 pb-2">
          山霧旅館
          <br />
          住客安全須知
        </div>
        <ol className="flex flex-col gap-3 list-none">
          {rules.map((rule) => (
            <li key={rule.number} className={`flex gap-2 ${rule.number === 9 ? "border-t border-amber-200/20 pt-3 text-amber-300/80" : ""}`}>
              <span className="text-amber-200/30 shrink-0">{rule.number}.</span>
              <CorruptedText
                text={rule.text}
                corruptLevel={
                  rule.number === 9
                    ? 0
                    : isCorrupted
                    ? corruptLevel * 0.5
                    : 0
                }
              />
            </li>
          ))}
        </ol>
        {world.ruleNoticeVersion >= 2 && (
          <div className="mt-4 pt-3 border-t border-amber-200/10 text-amber-200/30 text-xs italic">
            本須知如有修改，不另行通知。
          </div>
        )}
      </div>
    </div>
  );
}
