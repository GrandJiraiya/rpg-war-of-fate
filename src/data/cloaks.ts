import type { CloakDef } from "../types";

export const CLOAKS: Record<string, CloakDef> = {
  none: {
    id: "none",
    name: "Bare Pinions",
    blurb: "Feathers and nerve.",
    def: 0,
    speed: 1,
    stealth: 0,
    hp: 0,
  },
  wetcoat: {
    id: "wetcoat",
    name: "Wet Peck Coat",
    blurb: "Oiled against the marsh. Tal calls it a balanced line.",
    def: 6,
    speed: 1.02,
    stealth: 0.04,
    hp: 8,
  },
  marshplate: {
    id: "marshplate",
    name: "Lacquered Marsh-Plate",
    blurb: "Ugly, honest, and opposed to arrows.",
    def: 16,
    speed: 0.94,
    stealth: -0.02,
    hp: 18,
  },
  palecowl: {
    id: "palecowl",
    name: "Scout's Cowl",
    blurb: "Pale cloth. The reeds approve.",
    def: 4,
    speed: 1.04,
    stealth: 0.12,
    hp: 0,
  },
  fortressmail: {
    id: "fortressmail",
    name: "Fortress Mail",
    blurb: "Cock steel, cut down for someone who still has to walk.",
    def: 12,
    speed: 0.98,
    stealth: 0,
    hp: 14,
  },
};
