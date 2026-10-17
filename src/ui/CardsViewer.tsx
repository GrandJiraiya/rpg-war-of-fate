import { useRef, useState } from "react";
import { asset } from "../asset";
import { CARDS, INTRO } from "../data/cards";
import type { CardPlate } from "../types";

export function CardsViewer({ kind, onClose }: { kind: "cards" | "intro"; onClose: () => void }) {
  const plates: CardPlate[] = kind === "intro" ? INTRO : CARDS;
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const plate = plates[index]!;

  function step(dir: number) {
    setIndex((current) => (current + dir + plates.length) % plates.length);
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-ink">
      <div className="flex items-center justify-between gap-3 px-3 pt-3">
        <div className="min-w-0">
          <div className="truncate font-display text-xs tracking-[0.22em] text-gold uppercase">{plate.role}</div>
          <div className="font-display text-2xl text-bone">{plate.name}</div>
          <div className="text-sm text-bone/80">
            {index + 1} / {plates.length}
          </div>
        </div>
        <button
          type="button"
          className="h-12 shrink-0 rounded-md border border-gold/40 px-4 text-xs tracking-widest text-gold uppercase"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = drag.current;
          drag.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
          step(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <img
          src={asset(plate.src)}
          alt={plate.name}
          draggable={false}
          className={kind === "intro" ? "mx-auto w-full" : "mx-auto w-full max-w-md"}
        />
      </div>
      <div className="safe-b grid grid-cols-2 gap-2 px-3 pb-3">
        <button type="button" className="h-12 rounded-md border border-bone/30 text-bone" onClick={() => step(-1)}>
          Previous
        </button>
        <button type="button" className="h-12 rounded-md bg-gold font-medium text-ink" onClick={() => step(1)}>
          Next
        </button>
      </div>
    </div>
  );
}
