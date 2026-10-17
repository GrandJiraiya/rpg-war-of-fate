export type StatKey = "vigor" | "endurance" | "echo" | "steel" | "plume";

export type Stats = Record<StatKey, number>;

export type Side = "peck" | "pale" | "wild";

export type OathId = "marsh" | "shard" | "dawn" | "frost" | "choir" | "wind";

export type Grip = "spear" | "sword" | "great" | "staff" | "claw";

export type SkillKind = "ring" | "blink" | "arc" | "bolt" | "dash";

export type SkillDef = {
  name: string;
  blurb: string;
  echoCost: number;
  kind: SkillKind;
  /** Radius of a ring, or reach of an arc. */
  radius: number;
  /** Multiplier on the oath's base skill damage. */
  damageScale: number;
  /** Extra stagger, in seconds. */
  stun: number;
  /** Arc half-angle in radians for `arc` skills. */
  arc?: number;
  blink?: number;
  dashSpeed?: number;
  slow?: boolean;
  /** Wakes Orin when cast within this distance of the shoal. */
  wakesWithin?: number;
};

export type OathDef = {
  id: OathId;
  name: string;
  epithet: string;
  blurb: string;
  house: string;
  side: "peck" | "pale";
  skill: SkillDef;
  stats: Stats;
  weapon: string;
  /** Body colour for a causeway soldier of this oath. */
  color: number;
};

export type WeaponDef = {
  id: string;
  name: string;
  blurb: string;
  style: "melee" | "bolt";
  grip: Grip;
  light: number;
  heavyMul: number;
  range: number;
  arc: number;
  windup: number;
  active: number;
  recover: number;
  stam: number;
  speed: number;
};

export type CloakDef = {
  id: string;
  name: string;
  blurb: string;
  def: number;
  speed: number;
  stealth: number;
  hp: number;
};

export type EnemyId =
  | "infantry"
  | "scout"
  | "priest"
  | "caster"
  | "knight"
  | "lurker"
  | "captain"
  | "warden"
  | "cantor";

export type EnemyDef = {
  id: EnemyId;
  name: string;
  hp: number;
  dmg: number;
  sight: number;
  range: number;
  speed: number;
  windup: number;
  recover: number;
  leash: number;
  echoes: number;
  radius: number;
  scale: number;
  color: number;
  bolt: boolean;
  boss: boolean;
  grip: Grip;
};

export type SpawnDef = {
  id: string;
  arch: EnemyId;
  x: number;
  z: number;
  camp: string;
  side: Side;
  title?: string;
  /** Stays dead when the player rests. Bosses and the reed line. */
  persistOnRest?: boolean;
  /** Counts toward the Pale Dawn quest The Greeting. */
  greeting?: boolean;
};

export type HearthDef = { id: string; name: string; x: number; z: number };

export type NpcDef = {
  id: string;
  name: string;
  title: string;
  x: number;
  z: number;
  color: number;
  grip: Grip;
  scale?: number;
};

export type ChestDef = {
  id: string;
  x: number;
  z: number;
  item: string;
  /** When set, the other side cannot take it. */
  faction?: "peck" | "pale";
};

export type PointDef = { id: string; x: number; z: number };

export type StatInfo = { key: StatKey; name: string; hint: string };

export type Flags = {
  spokeBix: boolean;
  spokeKarl: boolean;
  returnedMap: boolean;
  spokeGoss: boolean;
  caskAsked: boolean;
  casks: number;
  chordAsked: boolean;
  stones: number;
  metNezz: boolean;
  orinWoke: boolean;
  orinSlept: boolean;
  tutorial: boolean;
  captainDead: boolean;
  wardenDead: boolean;
  cantorDead: boolean;
  mapReward: boolean;
  caskReward: boolean;
  chordReward: boolean;
  greetingCleared: boolean;
  throatReached: boolean;
};

export type SaveSettings = { shake: boolean; volume: number };

export type Save = {
  version: 1;
  oath: OathId;
  name: string;
  level: number;
  stats: Stats;
  echoes: number;
  lostEchoes: number;
  lostX: number;
  lostZ: number;
  flasks: number;
  flaskMax: number;
  weaponId: string;
  cloakId: string;
  items: string[];
  opened: string[];
  dead: string[];
  x: number;
  z: number;
  yaw: number;
  shrine: string;
  discovered: string[];
  regions: string[];
  hasSatchel: boolean;
  smashed: string[];
  silenced: string[];
  flags: Flags;
  settings: SaveSettings;
};

export type DialogueOption = { id: string; label: string };

export type DialogueBeat = {
  speaker: string;
  text: string;
  options: DialogueOption[];
};

export type QuestView = {
  id: string;
  title: string;
  body: string;
  done: boolean;
  main: boolean;
};

export type Objective = { x: number; z: number; label: string } | null;

export type Screen = "title" | "play" | "pause" | "rest" | "talk" | "dead";

export type FloaterKind = "hurt" | "hit" | "echo";

export type HudFloater = { id: number; x: number; y: number; text: string; kind: FloaterKind };

export type HudLabel = { id: string; x: number; y: number; name: string; sub: string };

export type HudCompass = { id: string; u: number; hot: boolean };

export type HudState = {
  hp: number;
  hpMax: number;
  st: number;
  stMax: number;
  ec: number;
  ecMax: number;
  flasks: number;
  flaskMax: number;
  echoes: number;
  level: number;
  zone: string;
  questTitle: string;
  questBody: string;
  prompt: string;
  bossName: string;
  bossRatio: number;
  stealth: "off" | "hidden" | "seen";
  crouched: boolean;
  locked: string;
  toasts: { id: number; text: string }[];
  floaters: HudFloater[];
  labels: HudLabel[];
  compass: HudCompass[];
};

export type PathSeg = { ax: number; az: number; bx: number; bz: number; w: number };
export type Circle = { x: number; z: number; r: number };
export type RegionDef = { id: string; name: string; x: number; z: number; r: number };
export type PitDef = { x: number; z: number; hole: number; rim: number };

export type CardPlate = { src: string; name: string; role: string };

export type MapPin = { name: string; x: number; y: number };
export type MapYou = { x: number; y: number; name: string };
