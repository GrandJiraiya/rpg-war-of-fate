import type { StatInfo } from "../types";

export const STATS: StatInfo[] = [
  { key: "vigor", name: "Vigor", hint: "Blood. How much the marsh can take." },
  { key: "endurance", name: "Endurance", hint: "Wind. Dodges, swings, the long road." },
  { key: "echo", name: "Echo", hint: "The oath's voice. Skills hit harder." },
  { key: "steel", name: "Steel", hint: "The ordinary violence of a blade." },
  { key: "plume", name: "Plume", hint: "Speed, and how quietly feathers lie." },
];

/** Echoes the turtle takes if you stay beside him while he is awake. */
export const ORIN_TITHE = 35;

export const LEVEL_COST_BASE = 26;
export const LEVEL_COST_PER = 16;

export const SAVE_KEY = "wof-oath-save-v1";
