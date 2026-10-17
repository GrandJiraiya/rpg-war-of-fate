import type {
  ChestDef,
  Circle,
  HearthDef,
  NpcDef,
  PathSeg,
  PitDef,
  PointDef,
  RegionDef,
} from "../types";

export const HEARTHS: HearthDef[] = [
  { id: "reed", name: "Reed Marker", x: -9, z: 48 },
  { id: "hearth", name: "Wet Peck Hearth", x: -50, z: 48 },
  { id: "hollow", name: "Scout Hollow", x: 11, z: -20 },
  { id: "stair", name: "Fortress Stair", x: 56, z: -78 },
  { id: "lip", name: "Deepwell Lip", x: 82, z: 16 },
];

export const NPCS: NpcDef[] = [
  { id: "bix", name: "Bix", title: "First Guard", x: -6.4, z: 34, color: 0x8a3e38, grip: "spear" },
  { id: "karl", name: "King Karl", title: "Wet Peck", x: -52, z: 49, color: 0xc4a15a, grip: "sword", scale: 1.12 },
  { id: "tal", name: "Steward Tal", title: "The Ledger", x: -46, z: 57, color: 0xe7e0d2, grip: "sword" },
  { id: "nezz", name: "Prince Nezz", title: "House of Cock", x: 13, z: -24, color: 0x24302a, grip: "sword" },
  { id: "goss", name: "Captain Goss", title: "Cock Fortress", x: 60, z: -82, color: 0x9a3d38, grip: "spear" },
  { id: "sila", name: "Sila", title: "Deepwell", x: 84, z: 24, color: 0x6e675c, grip: "sword" },
];

export const SATCHEL = { x: 28, z: -39.5 };

export const CASKS: PointDef[] = [
  { id: "cask1", x: 18, z: 10 },
  { id: "cask2", x: 16, z: 18 },
  { id: "cask3", x: 12, z: 1 },
];

export const STONES: PointDef[] = [
  { id: "stone1", x: 70, z: 28 },
  { id: "stone2", x: 90, z: 14 },
];

export const CHESTS: ChestDef[] = [
  { id: "chest-coat", x: -54, z: 44, item: "wetcoat", faction: "peck" },
  { id: "chest-plate", x: -18, z: 20, item: "marshplate" },
  { id: "chest-cowl", x: 28, z: -46, item: "palecowl" },
  { id: "chest-mail", x: 68, z: -84, item: "fortressmail" },
];

export const PATHS: PathSeg[] = [
  { ax: 0, az: 58, bx: 0, bz: 14, w: 5.4 },
  { ax: 0, az: 0, bx: 0, bz: -30, w: 5.2 },
  { ax: -8, az: 16, bx: -8, bz: -6, w: 2.35 },
  { ax: 0, az: 44, bx: -58, bz: 52, w: 3.6 },
  { ax: -2, az: -16, bx: 24, bz: -44, w: 3.6 },
  { ax: 24, az: -44, bx: 74, bz: -98, w: 3.8 },
  { ax: 16, az: -28, bx: 100, bz: 36, w: 3.15 },
  { ax: 8, az: 4, bx: 22, bz: 16, w: 2.4 },
];

export const CLEARINGS: Circle[] = [
  { x: 0, z: 36, r: 10 },
  { x: -54, z: 50, r: 14 },
  { x: 24, z: -40, r: 12 },
  { x: 74, z: -86, r: 18 },
  { x: 86, z: 24, r: 11 },
  { x: 14, z: -22, r: 6 },
];

/** Orin's sleeping place. Loud fighting here wakes him. */
export const SHOAL = { x: 33, z: 15 };

export const PIT: PitDef = { x: 100, z: 36, hole: 7.1, rim: 12.2 };

export const REGIONS: RegionDef[] = [
  { id: "causeway", name: "Reed Causeway", x: 0, z: 22, r: 34 },
  { id: "wetpeck", name: "Wet Peck", x: -54, z: 50, r: 24 },
  { id: "road", name: "Crow Road", x: 20, z: -38, r: 32 },
  { id: "fortress", name: "Cock Fortress", x: 74, z: -90, r: 28 },
  { id: "deepwell", name: "Deepwell Rim", x: 98, z: 32, r: 26 },
  { id: "shoal", name: "Orin's Shoal", x: 32, z: 16, r: 22 },
];

export const MARSH_REGION: RegionDef = { id: "marsh", name: "Crow Marsh", x: 0, z: 0, r: 0 };

/** How close a Pale soldier must come before the Gate Warden counts as reached. */
export const WARDEN_REACH = 12;
