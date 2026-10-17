import { describe, expect, it } from "vitest";
import { dialogueFor, applyChoice } from "../data/dialogue";
import { questsFor } from "../data/quests";
import { GREETING_IDS, SPAWNS } from "../data/spawns";
import { resolveCamera, type Collider } from "./math";
import { applyOrinTithe, createSave, dropEchoes, isHostile, keptDead } from "./rules";

describe("factions", () => {
  it("treats Dawn Knights and the Gate Warden as Pale Dawn", () => {
    expect(SPAWNS.find((spawn) => spawn.id === "war")?.side).toBe("pale");
    expect(SPAWNS.filter((spawn) => spawn.arch === "knight").every((spawn) => spawn.side === "pale")).toBe(true);
  });

  it("does not make a soldier fight their own side", () => {
    expect(isHostile("pale", "pale")).toBe(false);
    expect(isHostile("peck", "peck")).toBe(false);
    expect(isHostile("pale", "peck")).toBe(true);
    expect(isHostile("wild", "pale")).toBe(true);
  });
});

describe("pale dialogue", () => {
  it("does not order a Pale Dawn soldier to kill their captain", () => {
    const save = createSave("dawn", "Probe", false);
    const bix = dialogueFor("bix", save);
    expect(bix.text).not.toMatch(/Break him/);
    expect(bix.text.toLowerCase()).toContain("reed line");
    applyChoice("bix", "bix-go", save);
    expect(save.flags.spokeBix).toBe(false);
  });

  it("sends Wet Peck after the vanguard captain", () => {
    const save = createSave("marsh", "Spear", false);
    expect(dialogueFor("bix", save).text).toMatch(/Break him/);
  });
});

describe("quests and rest", () => {
  it("keeps the reed line dead so The Greeting cannot rewind", () => {
    const save = createSave("dawn", "Probe", false);
    save.dead = [...GREETING_IDS, "c1"];
    save.flags.greetingCleared = true;
    const kept = keptDead(save.dead);
    expect(kept).toEqual(expect.arrayContaining([...GREETING_IDS]));
    expect(kept).not.toContain("c1");
    const rested = { ...save, dead: kept };
    expect(questsFor(rested)[0]?.title).toBe("The Throat");
    expect(questsFor(rested)[0]?.body).not.toMatch(/0\/5/);
  });
});

describe("echoes", () => {
  it("replaces a dropped pile instead of stacking it", () => {
    const save = createSave("marsh", "Spear", false);
    save.echoes = 12;
    dropEchoes(save, 1, 2);
    save.echoes = 4;
    dropEchoes(save, 8, 9);
    expect(save.lostEchoes).toBe(4);
    expect(save.lostX).toBe(8);
    expect(save.echoes).toBe(0);
  });

  it("charges a tithe for waking Orin", () => {
    const save = createSave("marsh", "Spear", false);
    save.echoes = 40;
    const tithe = applyOrinTithe(save);
    expect(save.echoes).toBe(5);
    expect(tithe.echoesLost).toBe(35);
    expect(tithe.damage).toBe(0);
    expect(tithe.toast).toMatch(/takes 35 echoes/);
  });

  it("takes the tithe in blood when the purse is empty", () => {
    const save = createSave("marsh", "Spear", false);
    const tithe = applyOrinTithe(save);
    expect(tithe.echoesLost).toBe(0);
    expect(tithe.damage).toBe(35);
  });
});

describe("camera", () => {
  it("stops short of a wall instead of sitting inside it", () => {
    const wall: Collider = { kind: "box", x: 0, z: -4, hx: 3, hz: 0.4, rot: 0, los: true };
    const blocked = resolveCamera(0, 1.6, 0, 0, 3.2, -8, 0.42, [wall]);
    expect(blocked.z).toBeGreaterThan(-3.6);
    const open = resolveCamera(0, 1.6, 0, 0, 3.2, -8, 0.42, []);
    expect(open.z).toBeCloseTo(-8);
  });
});
