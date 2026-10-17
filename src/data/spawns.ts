import type { SpawnDef } from "../types";

/**
 * Dawn Knights and the Gate Warden march with Pale Dawn.
 * They are hostile to the causeway and leave a Pale soldier alone.
 * Reed-line soldiers (p1–p5) stay dead after a rest so The Greeting cannot rewind.
 */
export const SPAWNS: SpawnDef[] = [
  { id: "c1", arch: "infantry", x: -3.2, z: -6, camp: "van", side: "pale" },
  { id: "c2", arch: "infantry", x: 3.6, z: -8, camp: "van", side: "pale" },
  { id: "c3", arch: "infantry", x: -2.2, z: -13, camp: "van", side: "pale" },
  { id: "c4", arch: "infantry", x: 4.2, z: -15, camp: "van", side: "pale" },
  { id: "c5", arch: "scout", x: 6.4, z: -4.5, camp: "van", side: "pale" },
  { id: "cap", arch: "captain", x: 0.4, z: -18, camp: "van", side: "pale", persistOnRest: true },
  { id: "s1", arch: "scout", x: 19, z: -36, camp: "camp", side: "pale" },
  { id: "s2", arch: "scout", x: 29, z: -34, camp: "camp", side: "pale" },
  { id: "s3", arch: "scout", x: 23, z: -48, camp: "camp", side: "pale" },
  { id: "s4", arch: "infantry", x: 33, z: -43, camp: "camp", side: "pale" },
  { id: "pr", arch: "priest", x: 26.5, z: -41, camp: "camp", side: "pale" },
  { id: "k1", arch: "knight", x: 66, z: -84, camp: "gate", side: "pale" },
  { id: "k2", arch: "knight", x: 82, z: -86, camp: "gate", side: "pale" },
  { id: "k3", arch: "knight", x: 74, z: -80, camp: "gate", side: "pale" },
  { id: "war", arch: "warden", x: 74, z: -93, camp: "gate", side: "pale", persistOnRest: true },
  { id: "v1", arch: "caster", x: 72, z: 24, camp: "pit", side: "wild" },
  { id: "v2", arch: "caster", x: 90, z: 16, camp: "pit", side: "wild" },
  { id: "can", arch: "cantor", x: 90, z: 28, camp: "pit", side: "wild", persistOnRest: true },
  { id: "l1", arch: "lurker", x: -28, z: 16, camp: "wild", side: "wild" },
  { id: "l2", arch: "lurker", x: 12, z: 26, camp: "wild", side: "wild" },
  { id: "l3", arch: "lurker", x: -40, z: 30, camp: "wild", side: "wild" },
  { id: "l4", arch: "lurker", x: 46, z: -16, camp: "wild", side: "wild" },
  {
    id: "p1",
    arch: "infantry",
    x: -4.2,
    z: 18,
    camp: "line",
    side: "peck",
    title: "Reed Spearman",
    persistOnRest: true,
    greeting: true,
  },
  {
    id: "p2",
    arch: "infantry",
    x: -1,
    z: 20,
    camp: "line",
    side: "peck",
    title: "Reed Spearman",
    persistOnRest: true,
    greeting: true,
  },
  {
    id: "p3",
    arch: "infantry",
    x: 2.4,
    z: 19,
    camp: "line",
    side: "peck",
    title: "Reed Spearman",
    persistOnRest: true,
    greeting: true,
  },
  {
    id: "p4",
    arch: "infantry",
    x: 5.6,
    z: 22,
    camp: "line",
    side: "peck",
    title: "Reed Spearman",
    persistOnRest: true,
    greeting: true,
  },
  {
    id: "p5",
    arch: "scout",
    x: -6.5,
    z: 24,
    camp: "line",
    side: "peck",
    title: "Reed Scout",
    persistOnRest: true,
    greeting: true,
  },
];

export const GREETING_IDS = SPAWNS.filter((spawn) => spawn.greeting).map((spawn) => spawn.id);

export const PERSIST_IDS = new Set(SPAWNS.filter((spawn) => spawn.persistOnRest).map((spawn) => spawn.id));
