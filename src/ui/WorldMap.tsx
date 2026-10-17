import { useState } from "react";
import { asset } from "../asset";
import { MAP_PINS, MAP_SIZE, MAP_YOU } from "../data/map";
import { regionAt } from "../game/terrain";
import type { Save } from "../types";

export function WorldMap({ save }: { save: Save }) {
  const region = regionAt(save.x, save.z);
  const you = MAP_YOU[region.id] ?? MAP_YOU.causeway;
  const [label, setLabel] = useState(you?.name ?? "Reed Causeway");
  return (
    <div>
      <p className="mb-2 text-sm text-bone/85">
        Talon&apos;s map of Squack&apos;Ka&apos;Saar. You are at {you?.name}. The fight is still the causeway.
      </p>
      <div className="relative overflow-hidden rounded-md border border-bone/15">
        <img src={asset("chronicle/map-v15-1600.webp")} alt="Talon's map of Squack'Ka'Saar" className="block w-full" />
        {MAP_PINS.map((pin) => (
          <button
            key={pin.name}
            type="button"
            aria-label={pin.name}
            onClick={() => setLabel(pin.name)}
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink bg-gold"
            style={{ left: `${(pin.x / MAP_SIZE.w) * 100}%`, top: `${(pin.y / MAP_SIZE.h) * 100}%` }}
          />
        ))}
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bone bg-blood"
          style={{ left: `${((you?.x ?? 530) / MAP_SIZE.w) * 100}%`, top: `${((you?.y ?? 505) / MAP_SIZE.h) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-base text-gold">{label}</p>
    </div>
  );
}
