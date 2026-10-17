import { CLOAKS } from "../data/cloaks";
import { OATHS } from "../data/oaths";
import { STATS } from "../data/stats";
import { WEAPONS } from "../data/weapons";
import { questsFor } from "../data/quests";
import { itemKind } from "../game/rules";
import type { Save } from "../types";
import { WorldMap } from "./WorldMap";

export type PauseTab = "oath" | "pack" | "quests" | "map" | "system";

const TABS: { id: PauseTab; label: string }[] = [
  { id: "oath", label: "Oath" },
  { id: "pack", label: "Pack" },
  { id: "quests", label: "Quests" },
  { id: "map", label: "Map" },
  { id: "system", label: "System" },
];

export function PauseMenu({
  save,
  tab,
  onTab,
  onResume,
  onEquip,
  onShake,
  onVolume,
}: {
  save: Save;
  tab: PauseTab;
  onTab: (tab: PauseTab) => void;
  onResume: () => void;
  onEquip: (id: string) => void;
  onShake: (on: boolean) => void;
  onVolume: (volume: number) => void;
}) {
  const oath = OATHS[save.oath];
  const weapon = WEAPONS[save.weaponId]?.name ?? "Bare hands";
  const cloak = CLOAKS[save.cloakId]?.name ?? "Bare Pinions";
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-ink/80 p-3 safe-b sm:p-6">
      <div className="panel mx-auto max-w-3xl rounded-md p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-xs tracking-[0.22em] text-gold uppercase">{oath.house}</div>
            <h2 className="font-display text-3xl text-bone">{save.name}</h2>
          </div>
          <button type="button" className="h-11 rounded-md bg-gold px-4 text-ink" onClick={onResume}>
            Resume
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={`h-10 shrink-0 rounded-md px-3 text-sm ${
                tab === item.id ? "bg-gold text-ink" : "border border-bone/25 text-bone"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {tab === "oath" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-bone/20 p-3">
                <div className="text-sm tracking-widest text-gold uppercase">Level {save.level}</div>
                {STATS.map((stat) => (
                  <div key={stat.key} className="mt-2 flex justify-between text-base">
                    <span>{stat.name}</span>
                    <span className="text-gold">{save.stats[stat.key]}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-bone/20 p-3 text-base leading-relaxed">
                <p>
                  {oath.house}. {oath.side === "pale" ? "You march with the probe." : "You hold against the probe."}
                </p>
                <p>{oath.blurb}</p>
                <p className="mt-2 text-gold">
                  {oath.skill.name} — {oath.skill.blurb}
                </p>
                <p className="mt-3 text-bone/85">Weapon: {weapon}</p>
                <p className="text-bone/85">Cloak: {cloak}</p>
              </div>
            </div>
          )}
          {tab === "pack" && (
            <div className="grid gap-2">
              {save.items.map((id) => {
                const kind = itemKind(id);
                const name = WEAPONS[id]?.name ?? CLOAKS[id]?.name ?? id;
                const blurb = WEAPONS[id]?.blurb ?? CLOAKS[id]?.blurb ?? "";
                const worn = save.weaponId === id || save.cloakId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onEquip(id)}
                    className={`rounded-md border px-3 py-3 text-left ${worn ? "border-gold" : "border-bone/20"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base text-bone">{name}</span>
                      <span className="text-xs tracking-widest text-gold uppercase">
                        {worn ? "Worn" : kind === "weapon" ? "Weapon" : "Cloak"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-bone/80">{blurb}</div>
                  </button>
                );
              })}
            </div>
          )}
          {tab === "quests" && (
            <div className="space-y-3">
              {questsFor(save).map((quest) => (
                <div key={quest.id} className="rounded-md border border-bone/20 p-3">
                  <div className="text-sm tracking-widest text-gold uppercase">
                    {quest.main ? "Main" : "Side"}
                    {quest.done ? " · Done" : ""}
                  </div>
                  <div className="mt-1 text-base text-bone">{quest.title}</div>
                  <p className="mt-1 text-sm text-bone/85">{quest.body}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "map" && <WorldMap save={save} />}
          {tab === "system" && (
            <div className="space-y-4 text-base">
              <label className="flex items-center justify-between gap-3">
                Screen shake
                <input
                  type="checkbox"
                  checked={save.settings.shake}
                  onChange={(event) => onShake(event.target.checked)}
                  className="h-5 w-5"
                />
              </label>
              <label className="block">
                Volume
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={save.settings.volume}
                  onChange={(event) => onVolume(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <p className="text-bone/90">
                WASD or the stick moves. Click, J, or Strike is a light cut. Heavy is F, a long mouse press, or the Heavy
                button — a long press on the touch screen turns the eye, it does not swing. Space or Dodge rolls. Q or Oath
                spends echo on {oath.skill.name}. C or Crouch hides you. Tab or Lock targets. R or Drink heals. E or Use
                acts. Z and X, or a drag, turn the eye. Esc is this menu.
              </p>
              <p className="text-bone/70">This oath is remembered on this device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
