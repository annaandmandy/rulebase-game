"use client";

import { useGameStore } from "@/lib/gameState";
import { getLocationName } from "@/lib/locations";
import { LocationId, LocationAction } from "@/types/game";
import { LocationData } from "@/types/scenario";
import { CorruptedText } from "./CorruptedText";
import { motion } from "framer-motion";

export function LocationView() {
  const { player, world, navigateTo, applyChoice, startDialogue, phase, selectedScenario } = useGameStore();

  const locations = selectedScenario?.locations ?? {};
  const loc: LocationData | undefined = locations[player.currentLocation];
  const corruptLevel = Math.max(0, 10 - Math.floor((world.hotelRealityStability as number) / 10));

  if (phase !== "playing" || !loc) return null;

  const description = typeof loc.description === "function"
    ? loc.description(player, world)
    : loc.description;

  const availableActions = loc.actions.filter((a) =>
    a.condition ? a.condition(player, world) : true
  );

  // Compute location name with corruption
  const locName = world.hotelRealityStability < 30 && loc.mutatedName
    ? loc.mutatedName
    : loc.name;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xs text-neutral-600 uppercase tracking-widest mb-1">位置</div>
        <h2 className="text-base text-neutral-200 font-medium">
          <CorruptedText
            text={locName}
            corruptLevel={corruptLevel > 7 ? 3 : 0}
          />
        </h2>
      </div>

      <div className="text-sm text-neutral-400 leading-loose whitespace-pre-line">
        <CorruptedText text={description} corruptLevel={corruptLevel > 8 ? 2 : 0} />
      </div>

      {availableActions.length > 0 && (
        <div>
          <div className="text-xs text-neutral-700 uppercase tracking-widest mb-2">你可以</div>
          <div className="flex flex-col gap-2">
            {availableActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onSelect={(action) => {
                  if (action.dialogueId && selectedScenario?.dialogues[action.dialogueId]) {
                    startDialogue(selectedScenario.dialogues[action.dialogueId]);
                    return;
                  }
                  const resultText =
                    typeof action.resultText === "function"
                      ? action.resultText(player, world)
                      : action.resultText;
                  applyChoice({
                    id: action.id,
                    label: action.label,
                    resultText,
                    effects: action.effects,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-neutral-700 uppercase tracking-widest mb-2">前往</div>
        <div className="flex flex-wrap gap-2">
          {loc.adjacentLocations.map((id) => (
            <NavButton
              key={id}
              locationId={id}
              name={locations[id]?.name ?? id}
              onNavigate={navigateTo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  onSelect,
}: {
  action: LocationAction;
  onSelect: (action: LocationAction) => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => onSelect(action)}
      className="text-left px-4 py-2.5 text-sm text-neutral-300 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-100 hover:bg-neutral-900/50 transition-colors leading-relaxed"
    >
      <span className="text-neutral-700 mr-2">›</span>
      {action.label}
    </motion.button>
  );
}

function NavButton({
  locationId,
  name,
  onNavigate,
}: {
  locationId: LocationId;
  name: string;
  onNavigate: (id: LocationId) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(locationId)}
      className="px-3 py-1.5 text-xs text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-colors bg-neutral-950 hover:bg-neutral-900"
    >
      {name}
    </button>
  );
}
