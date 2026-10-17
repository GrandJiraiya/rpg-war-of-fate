import { HEARTHS } from "../data/world";
import { STATS } from "../data/stats";
import { levelCost } from "../game/rules";
import type { Save, StatKey } from "../types";

export function RestMenu({
  save,
  shrineName,
  onLevel,
  onRest,
  onTravel,
  onClose,
}: {
  save: Save;
  shrineName: string;
  onLevel: (key: StatKey) => void;
  onRest: () => void;
  onTravel: (id: string) => void;
  onClose: () => void;
}) {
  const cost = levelCost(save.level);
  const canLevel = save.echoes >= cost;
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/55 p-3 sm:items-center">
      <div className="panel safe-b max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-md p-5">
        <div className="font-display text-xs tracking-[0.22em] text-gold uppercase">{shrineName || "Hearth"}</div>
        <h2 className="mt-1 font-display text-2xl text-bone">The fire keeps a ledger.</h2>
        <p className="mt-2 text-base text-bone/90">
          {save.echoes} echoes. Next deepening costs {cost}.
        </p>
        <div className="mt-4 grid gap-2">
          {STATS.map((stat) => (
            <button
              key={stat.key}
              type="button"
              disabled={!canLevel}
              onClick={() => onLevel(stat.key)}
              className="flex items-center justify-between rounded-md border border-bone/20 px-3 py-2 text-left disabled:opacity-40"
            >
              <span>
                <span className="text-base text-bone">{stat.name}</span>
                <span className="mt-0.5 block text-sm text-bone/80">{stat.hint}</span>
              </span>
              <span className="font-display text-gold">{save.stats[stat.key]}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="h-11 rounded-md bg-gold text-ink" onClick={onRest}>
            Rest and mend
          </button>
          <div className="text-sm tracking-widest text-gold uppercase">Travel</div>
          {HEARTHS.filter((hearth) => save.discovered.includes(hearth.id)).map((hearth) => (
            <button
              key={hearth.id}
              type="button"
              className="h-10 rounded-md border border-bone/25 text-sm text-bone"
              onClick={() => onTravel(hearth.id)}
            >
              {hearth.name}
            </button>
          ))}
          <button type="button" className="h-11 rounded-md border border-bone/30 text-bone" onClick={onClose}>
            Return to the marsh
          </button>
        </div>
      </div>
    </div>
  );
}
