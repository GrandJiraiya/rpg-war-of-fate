import type { OathId } from "../types";

export function OathMark({ id, className }: { id: OathId; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {id === "marsh" && <path {...common} d="M12 3v18M12 8l-6 4M12 8l6 4" />}
      {id === "shard" && <path {...common} d="M12 3l6 9-6 9-6-9z" />}
      {id === "dawn" && <path {...common} d="M12 3v14M8 17h8M5 21h14M12 3l4 4M12 3L8 7" />}
      {id === "frost" && (
        <path {...common} d="M12 3v18M5 7l14 10M19 7L5 17M7 5l5 4 5-4M7 19l5-4 5 4" />
      )}
      {id === "choir" && <path {...common} d="M8 4h3v10a4 4 0 1 1-3-4V4zM16 8h2a3 3 0 0 1 0 6h-2" />}
      {id === "wind" && <path {...common} d="M4 8h12a3 3 0 1 0-3-3M4 12h16a3 3 0 1 1-3 3M4 16h8" />}
    </svg>
  );
}
