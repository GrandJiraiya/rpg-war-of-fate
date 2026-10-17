import { CLOAKS } from "../data/cloaks";
import { OATHS, START_POSE } from "../data/oaths";
import { GREETING_IDS, PERSIST_IDS } from "../data/spawns";
import { LEVEL_COST_BASE, LEVEL_COST_PER, ORIN_TITHE, SAVE_KEY } from "../data/stats";
import { WEAPONS } from "../data/weapons";
import { CHESTS } from "../data/world";
import type { ChestDef, Flags, OathId, Save, Side, StatKey, Stats } from "../types";

export function defaultFlags(): Flags {
  return {
    spokeBix: false,
    spokeKarl: false,
    returnedMap: false,
    spokeGoss: false,
    caskAsked: false,
    casks: 0,
    chordAsked: false,
    stones: 0,
    metNezz: false,
    orinWoke: false,
    orinSlept: false,
    tutorial: false,
    captainDead: false,
    wardenDead: false,
    cantorDead: false,
    mapReward: false,
    caskReward: false,
    chordReward: false,
    greetingCleared: false,
    throatReached: false,
  };
}

export function sideOf(oath: OathId): "peck" | "pale" {
  return OATHS[oath].side;
}

export function isHostile(enemySide: Side, playerSide: Side) {
  if (enemySide === "wild") return true;
  return enemySide !== playerSide;
}

export function levelCost(level: number) {
  return LEVEL_COST_BASE + level * LEVEL_COST_PER;
}

export function itemKind(id: string): "weapon" | "cloak" | null {
  if (WEAPONS[id]) return "weapon";
  if (CLOAKS[id] && id !== "none") return "cloak";
  return null;
}

export type Derived = {
  weapon: (typeof WEAPONS)[string];
  cloak: (typeof CLOAKS)[string];
  hp: number;
  stam: number;
  echo: number;
  def: number;
  speed: number;
  light: number;
  stealth: number;
};

export function derivedStats(save: Save): Derived {
  const weapon = WEAPONS[save.weaponId] ?? WEAPONS.reedSpear;
  const cloak = CLOAKS[save.cloakId] ?? CLOAKS.none;
  return {
    weapon,
    cloak,
    hp: 72 + save.stats.vigor * 14 + cloak.hp,
    stam: 64 + save.stats.endurance * 9,
    echo: 28 + save.stats.echo * 8,
    def: cloak.def + Math.floor(save.stats.vigor * 0.25),
    speed: 6.15 * weapon.speed * cloak.speed * (1 + save.stats.plume * 0.012),
    light: (weapon.light + save.stats.steel * 1.25) * (1 + Math.max(0, save.level - 1) * 0.015),
    stealth: cloak.stealth + save.stats.plume * 0.012,
  };
}

export function skillPower(stats: Stats) {
  return 18 + stats.echo * 2.1;
}

export function createSave(oath: OathId, name: string, shake: boolean): Save {
  const def = OATHS[oath];
  const pose = START_POSE[def.side];
  return {
    version: 1,
    oath,
    name: (name || "Soldier").slice(0, 18),
    level: 1,
    stats: { ...def.stats },
    echoes: 0,
    lostEchoes: 0,
    lostX: 0,
    lostZ: 0,
    flasks: 3,
    flaskMax: 3,
    weaponId: def.weapon,
    cloakId: "none",
    items: [def.weapon],
    opened: [],
    dead: [],
    x: pose.x,
    z: pose.z,
    yaw: pose.yaw,
    shrine: pose.shrine,
    discovered: [pose.shrine],
    regions: ["causeway"],
    hasSatchel: false,
    smashed: [],
    silenced: [],
    flags: defaultFlags(),
    settings: { shake, volume: 0.75 },
  };
}

export function normalizeSave(save: Save): Save {
  save.flags = { ...defaultFlags(), ...save.flags };
  if (!save.flags.greetingCleared && GREETING_IDS.every((id) => save.dead.includes(id))) {
    save.flags.greetingCleared = true;
  }
  return save;
}

export function serializeSave(save: Save) {
  return JSON.stringify(save);
}

export function parseSave(raw: string | null): Save | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Save;
    if (!parsed || parsed.version !== 1 || !parsed.flags || !parsed.stats) return null;
    if (!OATHS[parsed.oath]) return null;
    return normalizeSave(parsed);
  } catch {
    return null;
  }
}

export function writeSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, serializeSave(save));
  } catch {
    /* private mode and full disks are allowed to forget */
  }
}

export function loadSave(): Save | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/** A second death spends the previous pile. Only the echoes carried now are dropped. */
export function dropEchoes(save: Save, x: number, z: number) {
  save.lostEchoes = save.echoes;
  save.lostX = x;
  save.lostZ = z;
  save.echoes = 0;
}

export function keptDead(dead: string[]) {
  return dead.filter((id) => PERSIST_IDS.has(id));
}

export type OrinTithe = { echoesLost: number; damage: number; toast: string };

/**
 * Staying beside a waking Orin costs echoes. Whatever the pile cannot
 * cover is taken in blood. Leaving before he settles costs nothing extra.
 */
export function applyOrinTithe(save: Save): OrinTithe {
  const echoesLost = Math.min(save.echoes, ORIN_TITHE);
  save.echoes -= echoesLost;
  const damage = ORIN_TITHE - echoesLost;
  if (echoesLost > 0 && damage > 0) {
    return {
      echoesLost,
      damage,
      toast: `Orin takes ${echoesLost} echoes and a bite of blood for the waking.`,
    };
  }
  if (echoesLost > 0) {
    return { echoesLost, damage: 0, toast: `Orin takes ${echoesLost} echoes for the waking.` };
  }
  return { echoesLost: 0, damage, toast: "Orin takes the tithe in blood." };
}

export function chestDenial(save: Save, chest: ChestDef): string | null {
  if (!chest.faction) return null;
  if (sideOf(save.oath) === chest.faction) return null;
  return "The coat belongs to Wet Peck.";
}

export function chestById(id: string) {
  return CHESTS.find((chest) => chest.id === id) ?? null;
}

export function statName(key: StatKey) {
  if (key === "vigor") return "Vigor";
  if (key === "endurance") return "Endurance";
  if (key === "echo") return "Echo";
  if (key === "steel") return "Steel";
  return "Plume";
}
