import type { DialogueBeat } from "../types";

export function DialogueOverlay({ beat, onChoose }: { beat: DialogueBeat; onChoose: (id: string) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3 safe-b sm:p-6">
      <div className="panel mx-auto max-w-xl rounded-md p-4 sm:p-5">
        <div className="font-display text-xs tracking-[0.22em] text-gold uppercase">{beat.speaker}</div>
        <p className="mt-2 text-base leading-relaxed text-bone">{beat.text}</p>
        <div className="mt-4 flex flex-col gap-2">
          {beat.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="h-11 rounded-md border border-gold/40 px-3 text-left text-sm text-bone"
              onClick={() => onChoose(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
