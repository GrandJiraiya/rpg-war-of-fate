import { useState } from "react";
import { OATHS, OATH_ORDER } from "../data/oaths";
import type { OathId } from "../types";
import { OathMark } from "./OathMark";

function OathRow({
  side,
  oath,
  onPick,
}: {
  side: "pale" | "peck";
  oath: OathId;
  onPick: (id: OathId) => void;
}) {
  const ids = OATH_ORDER.filter((id) => OATHS[id].side === side);
  return (
    <div className="mt-4">
      <div className="text-sm tracking-widest text-gold uppercase">{side === "pale" ? "Pale Dawn" : "The causeway"}</div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {ids.map((id) => {
          const def = OATHS[id];
          const picked = oath === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className={`w-44 shrink-0 rounded-md border p-3 text-left ${
                picked ? "border-gold bg-reed" : "border-bone/25 bg-ink/40"
              }`}
            >
              <OathMark id={id} className="mb-2 h-5 w-5 text-gold" />
              <div className="font-display text-sm text-bone">{def.name}</div>
              <div className="mt-1 text-sm text-gold">{def.house}</div>
              <div className="mt-1 text-sm leading-snug text-bone/90">{def.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TitleScreen({
  booted,
  hasSave,
  onStart,
  onContinue,
  onCards,
  onIntro,
}: {
  booted: boolean;
  hasSave: boolean;
  onStart: (oath: OathId, name: string) => void;
  onContinue: () => void;
  onCards: () => void;
  onIntro: () => void;
}) {
  const [oath, setOath] = useState<OathId>("marsh");
  const [name, setName] = useState("Soldier");
  const [confirm, setConfirm] = useState(false);
  const chosen = OATHS[oath];

  function requestStart() {
    if (hasSave) setConfirm(true);
    else onStart(oath, name);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center sm:items-stretch sm:justify-start">
      <section className="panel safe-b max-h-dvh w-full overflow-y-auto p-5 sm:h-full sm:w-[26rem] sm:p-8">
        <p className="font-display text-xs tracking-[0.28em] text-gold uppercase">Oath of the Peck</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-bone sm:text-5xl">War of Fate</h1>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCards} className="h-12 rounded-md border border-gold/50 bg-reed text-base text-bone">
            Cards
          </button>
          <button type="button" onClick={onIntro} className="h-12 rounded-md border border-gold/50 bg-reed text-base text-bone">
            Intro
          </button>
        </div>
        <div className="hairline my-4" />
        <p className="text-sm leading-relaxed text-bone/90">
          You are a foot soldier. The oath is the side. Pale Dawn marches with Legless. Everyone else holds the causeway with Wet Peck.
        </p>
        <label className="mt-4 block text-sm tracking-widest text-gold uppercase">
          Name
          <input
            value={name}
            maxLength={18}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 h-11 w-full rounded-md border border-gold/30 bg-marsh px-3 text-base text-bone outline-none"
          />
        </label>
        <OathRow side="pale" oath={oath} onPick={setOath} />
        <OathRow side="peck" oath={oath} onPick={setOath} />
        <p className="mt-2 text-sm text-bone/80">
          {chosen.house} · {chosen.skill.name} — {chosen.skill.blurb}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!booted}
            onClick={requestStart}
            className="h-12 rounded-md bg-gold text-base font-medium text-ink disabled:opacity-50"
          >
            Start
          </button>
          {hasSave && (
            <button
              type="button"
              disabled={!booted}
              onClick={onContinue}
              className="h-12 rounded-md border border-bone/40 text-base text-bone disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-bone/75">
          Move with WASD or the stick. Strike with a click or Strike. Heavy is F, a held mouse click, or the Heavy button.
          Space dodges. Q is your oath. Crouch with C in the reeds. E speaks, takes, and rests. Drag the right mouse, or the
          empty screen, to look.
        </p>
        {!booted && <p className="mt-2 text-sm text-gold">The marsh is waking.</p>}
      </section>
      {confirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/75 p-6">
          <div className="panel max-w-md rounded-md p-6">
            <div className="font-display text-xs tracking-[0.28em] text-gold uppercase">One oath</div>
            <h2 className="mt-2 font-display text-3xl text-bone">Overwrite the marsh&apos;s memory?</h2>
            <p className="mt-3 text-base leading-relaxed text-bone/90">
              This device already keeps an oath. Starting writes over that single slot. The old soldier, the echoes, and the
              place are spent.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="h-12 rounded-md bg-gold text-base font-medium text-ink"
                onClick={() => {
                  setConfirm(false);
                  onStart(oath, name);
                }}
              >
                Overwrite and start
              </button>
              <button
                type="button"
                className="h-12 rounded-md border border-bone/40 text-base text-bone"
                onClick={() => setConfirm(false)}
              >
                Keep the old oath
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
