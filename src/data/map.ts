import type { MapPin, MapYou } from "../types";

export const MAP_SIZE = { w: 1600, h: 1067 };

export const MAP_PINS: MapPin[] = [
  { name: "Crowmaina", x: 401.6, y: 194.4 },
  { name: "Cock Castle", x: 338, y: 237.6 },
  { name: "Cock Lake", x: 440.4, y: 294.8 },
  { name: "Cock Harbor", x: 237.6, y: 448.4 },
  { name: "Crow Marsh", x: 479.2, y: 450.4 },
  { name: "Wet Peck", x: 592, y: 561.2 },
  { name: "Cock Fortress", x: 606.4, y: 452.8 },
  { name: "Pilgrim's Gate", x: 794.8, y: 522.4 },
  { name: "Scratch Forest", x: 716.8, y: 250.8 },
  { name: "Tree Hatch", x: 599.2, y: 647.2 },
  { name: "Kockenflocker", x: 994.4, y: 274.4 },
  { name: "DeepWell", x: 1304.4, y: 329.6 },
  { name: "Stone Hills", x: 1085.6, y: 120.8 },
  { name: "Zilla", x: 1320.8, y: 655.2 },
  { name: "Echo Dome", x: 1108, y: 729.2 },
  { name: "Wall of Unknown", x: 993.2, y: 985.2 },
  { name: "Peckstein", x: 94.4, y: 489.6 },
];

export const MAP_YOU: Record<string, MapYou> = {
  causeway: { x: 530, y: 505, name: "Reed Causeway" },
  marsh: { x: 479.2, y: 450.4, name: "Crow Marsh" },
  shoal: { x: 545, y: 480, name: "Orin's Shoal" },
  wetpeck: { x: 592, y: 561.2, name: "Wet Peck" },
  road: { x: 575, y: 470, name: "Crow Road" },
  fortress: { x: 606.4, y: 452.8, name: "Cock Fortress" },
  deepwell: { x: 1304.4, y: 329.6, name: "DeepWell" },
};
