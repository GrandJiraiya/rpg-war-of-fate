import { useSyncExternalStore } from "react";
import type { DialogueBeat, HudState, Screen } from "../types";

export const EMPTY_HUD: HudState = {
  hp: 1,
  hpMax: 1,
  st: 1,
  stMax: 1,
  ec: 1,
  ecMax: 1,
  flasks: 3,
  flaskMax: 3,
  echoes: 0,
  level: 1,
  zone: "Crow Marsh",
  questTitle: "",
  questBody: "",
  prompt: "",
  bossName: "",
  bossRatio: 0,
  stealth: "off",
  crouched: false,
  locked: "",
  toasts: [],
  floaters: [],
  labels: [],
  compass: [],
};

export type GameView = {
  screen: Screen;
  hud: HudState;
  beat: DialogueBeat | null;
  npcId: string | null;
  shrineName: string;
  saveTick: number;
  booted: boolean;
};

const listeners = new Set<() => void>();

let state: GameView = {
  screen: "title",
  hud: EMPTY_HUD,
  beat: null,
  npcId: null,
  shrineName: "",
  saveTick: 0,
  booted: false,
};

function emit() {
  listeners.forEach((listener) => listener());
}

export const gameStore = {
  getState: () => state,
  set(partial: Partial<GameView>) {
    state = { ...state, ...partial };
    emit();
  },
  bump() {
    state = { ...state, saveTick: state.saveTick + 1 };
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useGame<T>(selector: (view: GameView) => T): T {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => selector(gameStore.getState()),
    () => selector(gameStore.getState()),
  );
}
