"use client";

import { useGameStore } from "@/lib/gameState";
import { getRules } from "@/lib/rules";
import { RULE_SHEETS } from "@/lib/ruleSheets";
import { CorruptedText } from "./CorruptedText";

const SOURCE_LABELS: Record<string, string> = {
  hotel: "山霧旅館",
  previous_guest: "（不明來源）",
  staff: "內部文件",
  unknown: "（不明）",
};

const SOURCE_COLORS: Record<string, string> = {
  hotel: "text-amber-100/70",
  previous_guest: "text-green-200/60",
  staff: "text-blue-200/50",
  unknown: "text-red-200/50",
};

export function RuleNotice() {
  const { player, world, selectedScenario } = useGameStore();
  const rules = selectedScenario?.getRules(player, world) ?? getRules(player, world);
  const corruptLevel = Math.max(0, 10 - Math.floor(world.hotelRealityStability / 10));
  const isCorrupted = world.hotelRealityStability < 50;
  const sheetSource = selectedScenario?.ruleSheets ?? RULE_SHEETS;
  const foundSheets = player.foundSheets
    .map((id) => sheetSource[id])
    .filter(Boolean);

  // Dynamic source label — "hotel" shows the scenario's own name
  const sourceLabels: Record<string, string> = {
    ...SOURCE_LABELS,
    hotel: selectedScenario?.name ?? "山霧旅館",
    official: selectedScenario?.name ?? "山霧旅館",
  };

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Main safety notice */}
      <div
        className={`flex-shrink-0 font-mono text-xs leading-relaxed ${
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
          {selectedScenario?.name ?? "山霧旅館"}
          <br />
          {selectedScenario?.ruleNoticeTitle ?? "住客安全須知"}
        </div>
        <ol className="flex flex-col gap-2.5 list-none">
          {rules.map((rule, i) => {
            const isSpecial = rule.number >= 9;
            const isNew = rule.number >= 10;
            return (
              <li
                key={`${rule.number}-${i}`}
                className={`flex gap-2 ${
                  isSpecial ? "border-t border-amber-200/20 pt-2.5" : ""
                } ${isNew ? "text-amber-300/70" : ""}`}
              >
                <span className="text-amber-200/30 shrink-0">{rule.number}.</span>
                <CorruptedText
                  text={rule.text}
                  corruptLevel={
                    isSpecial ? 0 : isCorrupted ? corruptLevel * 0.5 : 0
                  }
                />
              </li>
            );
          })}
        </ol>
        {world.ruleNoticeVersion >= 2 && (
          <div className="mt-3 pt-2 border-t border-amber-200/10 text-amber-200/25 text-xs italic">
            本須知如有修改，不另行通知。
          </div>
        )}
      </div>

      {/* Found documents */}
      {foundSheets.map((sheet) => (
        <div
          key={sheet.id}
          className={`shrink-0 font-mono text-xs leading-relaxed ${SOURCE_COLORS[sheet.source]}`}
          style={{
            background: "rgba(5,10,20,0.8)",
            border: "1px solid rgba(80,100,120,0.15)",
            padding: "0.75rem",
            borderRadius: "2px",
          }}
        >
          <div className="text-center mb-2 pb-2 border-b border-current/10 opacity-60">
            {sourceLabels[sheet.source] ?? sheet.source}
            <br />
            {sheet.title}
            {sheet.subtitle && (
              <>
                <br />
                <span className="opacity-60 text-xs">{sheet.subtitle}</span>
              </>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {sheet.lines.map((line, i) => (
              <div key={i} className={line === "" ? "h-1" : ""}>
                {line !== "" && (
                  <CorruptedText
                    text={line}
                    corruptLevel={
                      sheet.source === "previous_guest" && isCorrupted ? 1 : 0
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
