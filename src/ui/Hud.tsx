import type { HudState } from "../types";
import { Bar } from "./Bars";
import { VirtualControls } from "./VirtualControls";
import type { Action } from "../game/Game";

export function Hud({
  hud,
  touch,
  onPause,
  onMap,
  onStick,
  onTap,
}: {
  hud: HudState;
  touch: boolean;
  onPause: () => void;
  onMap: () => void;
  onStick: (x: number, y: number) => void;
  onTap: (action: Action) => void;
}) {
  return (
    <div className="hud-read pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-3 sm:p-4">
        <div className="min-w-0 max-w-md flex-1 space-y-2">
          <div className="font-display text-sm tracking-[0.22em] text-gold uppercase">{hud.zone}</div>
          <Bar value={hud.hp} max={hud.hpMax} tone="blood" />
          <Bar value={hud.st} max={hud.stMax} tone="bone" />
          <Bar value={hud.ec} max={hud.ecMax} tone="gold" />
          <div className="flex items-center justify-between text-sm text-bone">
            <span>
              Draught {hud.flasks}/{hud.flaskMax}
            </span>
            <span className="text-gold">{hud.echoes} echoes</span>
          </div>
          {hud.questTitle && (
            <div className="pt-1">
              <div className="text-base text-bone">{hud.questTitle}</div>
              <div className="text-sm leading-snug text-bone/90">{hud.questBody}</div>
            </div>
          )}
        </div>
        <div className="flex w-40 flex-col items-end gap-2">
          <div className="relative h-7 w-full overflow-hidden border-b border-gold/70">
            <div className="absolute top-0 left-1/2 h-2.5 w-px bg-gold" />
            {hud.compass.map((mark) => (
              <div
                key={mark.id}
                className={`absolute top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${mark.hot ? "bg-gold" : "bg-bone"}`}
                style={{ left: `${mark.u * 100}%` }}
              />
            ))}
          </div>
          <div className="font-display text-sm text-gold">Lv {hud.level}</div>
          <button
            type="button"
            className="pointer-events-auto h-11 rounded-md border border-gold/50 bg-ink/80 px-3 text-xs tracking-widest text-gold uppercase"
            onClick={onMap}
          >
            Map
          </button>
          <button
            type="button"
            className="pointer-events-auto h-11 rounded-md border border-gold/50 bg-ink/80 px-3 text-xs tracking-widest text-gold uppercase"
            onClick={onPause}
          >
            Menu
          </button>
        </div>
      </div>
      {hud.bossName && (
        <div className="absolute top-32 left-1/2 w-64 -translate-x-1/2 sm:top-20">
          <div className="text-center font-display text-sm tracking-widest text-bone uppercase">{hud.bossName}</div>
          <div className="mt-1 h-2.5 overflow-hidden bg-marsh">
            <div className="h-full bg-blood" style={{ width: `${hud.bossRatio * 100}%` }} />
          </div>
        </div>
      )}
      {hud.labels.map((label) => (
        <div key={label.id} className="absolute -translate-x-1/2 text-center" style={{ left: label.x, top: label.y }}>
          <div className="text-base text-bone">{label.name}</div>
          <div className="text-sm text-gold">{label.sub}</div>
        </div>
      ))}
      {hud.floaters.map((floater) => (
        <div
          key={floater.id}
          className={`absolute -translate-x-1/2 font-display text-base ${floater.kind === "hurt" ? "text-blood" : "text-gold"}`}
          style={{ left: floater.x, top: floater.y }}
        >
          {floater.text}
        </div>
      ))}
      <div className={`absolute inset-x-0 flex flex-col items-center gap-1.5 px-4 ${touch ? "bottom-56" : "bottom-8"}`}>
        {hud.locked && <div className="text-sm tracking-widest text-gold uppercase">{hud.locked}</div>}
        {hud.stealth === "hidden" && (
          <div className="text-sm tracking-widest text-bone uppercase">Hidden in the reeds</div>
        )}
        {hud.stealth === "seen" && <div className="text-sm tracking-widest text-blood uppercase">Seen</div>}
        {hud.prompt && <div className="panel rounded-full px-4 py-2 text-base text-bone">{hud.prompt}</div>}
        <div className="flex flex-col items-center gap-1">
          {hud.toasts.map((toast) => (
            <div key={toast.id} className="panel max-w-sm rounded-md px-3 py-2 text-center text-base text-bone">
              {toast.text}
            </div>
          ))}
        </div>
      </div>
      {touch && <VirtualControls onStick={onStick} onTap={onTap} />}
    </div>
  );
}
