import * as THREE from "three";
import { ENEMIES } from "../data/enemies";
import { OATHS } from "../data/oaths";
import { SPAWNS } from "../data/spawns";
import { CASKS, CHESTS, CLEARINGS, HEARTHS, NPCS, PIT, SATCHEL, SHOAL, STONES } from "../data/world";
import type { EnemyId } from "../types";
import type { Collider } from "./math";
import { createRig, setGrip, type Rig } from "./rig";
import { nearestPath, reedAt, terrainHeight } from "./terrain";

const stone = new THREE.MeshStandardMaterial({ color: 0x3c433e, roughness: 0.92 });
const wood = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.86 });
const dark = new THREE.MeshStandardMaterial({ color: 0x171c19, roughness: 0.8 });
const cloth = new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.55 });
const gold = new THREE.MeshStandardMaterial({
  color: 0xc9a04a,
  emissive: 0x8a6a22,
  emissiveIntensity: 0.45,
  roughness: 0.4,
});
const reedMat = new THREE.MeshStandardMaterial({ color: 0x3d5a42, roughness: 0.85 });
const bark = new THREE.MeshStandardMaterial({ color: 0x243028, roughness: 0.9 });

export type Actor = {
  id: string;
  arch: EnemyId;
  camp: string;
  side: "peck" | "pale" | "wild";
  title: string;
  x: number;
  z: number;
  yaw: number;
  homeX: number;
  homeZ: number;
  hp: number;
  max: number;
  alert: boolean;
  moving: boolean;
  mode: "idle" | "attack" | "whistle";
  timer: number;
  cd: number;
  did: boolean;
  whistled: boolean;
  stun: number;
  slow: number;
  flash: number;
  dead: boolean;
  phase: number;
  seed: number;
  rig: Rig;
};

export type NpcActor = { id: string; x: number; z: number; name: string; title: string; rig: Rig };

export type World = {
  scene: THREE.Scene;
  colliders: Collider[];
  playerRig: Rig;
  enemies: Actor[];
  npcs: NpcActor[];
  hearthGems: THREE.Object3D[];
  props: Map<string, THREE.Object3D>;
  satchel: THREE.Object3D;
  echoMote: THREE.Mesh;
  objective: THREE.Mesh;
  lockRing: THREE.Mesh;
  shockwave: THREE.Mesh;
  orin: THREE.Mesh;
  orinEyes: THREE.MeshStandardMaterial;
};

function box(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

function cyl(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  rt: number,
  rb: number,
  h: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 7), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

export function buildWorld(): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa3ada0);
  scene.fog = new THREE.FogExp2(0xa3ada0, 0.0175);
  scene.add(new THREE.HemisphereLight(0xd7dccf, 0x1b2822, 0.92));
  const sun = new THREE.DirectionalLight(0xf2d7ae, 1.35);
  sun.position.set(-36, 52, 24);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x6d746c, 0.25));

  const colliders: Collider[] = [];
  const addCircle = (x: number, z: number, r: number, los = true) => {
    colliders.push({ kind: "circle", x, z, r, los });
  };
  const addBox = (x: number, z: number, hx: number, hz: number, rot = 0, los = true) => {
    colliders.push({ kind: "box", x, z, hx, hz, rot, los });
  };

  const ground = new THREE.PlaneGeometry(280, 260, 88, 80);
  ground.rotateX(-Math.PI / 2);
  const positions = ground.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const tint = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const h = terrainHeight(x, z);
    positions.setY(i, h);
    const path = nearestPath(x, z);
    let paved = path.d < path.w * 0.95;
    if (!paved) {
      for (const clearing of CLEARINGS) {
        if (Math.hypot(x - clearing.x, z - clearing.z) < clearing.r * 0.9) paved = true;
      }
    }
    if (h < 0.04) tint.setHex(0x16302c);
    else if (paved) tint.setHex(0x6e5c42);
    else if (h > 0.9) tint.setHex(0x3a4a3e);
    else tint.setHex(0x24362c);
    tint.offsetHSL(0, 0, Math.sin(x * 1.7 + z * 0.6) * 0.04);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }
  ground.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  ground.computeVertexNormals();
  scene.add(new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.02 })));

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(270, 250),
    new THREE.MeshStandardMaterial({
      color: 0x14302c,
      transparent: true,
      opacity: 0.72,
      roughness: 0.18,
      metalness: 0.12,
      depthWrite: false,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.04;
  scene.add(water);

  const reedGeo = new THREE.ConeGeometry(0.07, 1.25, 4);
  reedGeo.translate(0, 0.62, 0);
  const reeds: { x: number; z: number; s: number; ry: number }[] = [];
  for (let x = -88; x <= 118 && reeds.length < 850; x += 2.15) {
    for (let z = -104; z <= 64 && reeds.length < 850; z += 2.15) {
      const rx = x + Math.sin(z * 12.2 + x) * 0.55;
      const rz = z + Math.cos(x * 9.4 + z) * 0.55;
      if (reedAt(rx, rz)) {
        reeds.push({ x: rx, z: rz, s: 0.75 + (Math.sin(rx * 3.1) + 1) * 0.35, ry: rx * 0.7 });
      }
    }
  }
  const reedMesh = new THREE.InstancedMesh(reedGeo, reedMat, Math.max(1, reeds.length));
  const dummy = new THREE.Object3D();
  reeds.forEach((reed, index) => {
    dummy.position.set(reed.x, terrainHeight(reed.x, reed.z), reed.z);
    dummy.rotation.set(0, reed.ry, 0);
    dummy.scale.setScalar(reed.s);
    dummy.updateMatrix();
    reedMesh.setMatrixAt(index, dummy.matrix);
  });
  reedMesh.count = reeds.length;
  scene.add(reedMesh);

  const canopy = new THREE.CylinderGeometry(0.1, 0.16, 2.4, 5);
  const trunk = new THREE.ConeGeometry(0.18, 3.4, 5);
  trunk.translate(0, 2.5, 0);
  const canopies = new THREE.InstancedMesh(canopy, bark, 48);
  const trunks = new THREE.InstancedMesh(trunk, bark, 48);
  let planted = 0;
  let seed = 19;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let n = 0; n < 80 && planted < 40; n++) {
    const x = -85 + rand() * 190;
    const z = -100 + rand() * 160;
    const h = terrainHeight(x, z);
    if (h < 0.5 || h > 1.4) continue;
    const path = nearestPath(x, z);
    if (path.d < path.w + 1.8) continue;
    if (Math.hypot(x - 2, z - 46) < 9) continue;
    if (Math.hypot(x - PIT.x, z - PIT.z) < PIT.rim) continue;
    dummy.position.set(x, h, z);
    dummy.rotation.set(0, rand() * 6, (rand() - 0.5) * 0.18);
    dummy.scale.setScalar(0.8 + rand() * 0.7);
    dummy.updateMatrix();
    canopies.setMatrixAt(planted, dummy.matrix);
    trunks.setMatrixAt(planted, dummy.matrix);
    addCircle(x, z, 0.42, true);
    planted++;
  }
  canopies.count = planted;
  trunks.count = planted;
  scene.add(canopies, trunks);

  box(scene, -60, 2.2, 54, 9, 3.2, 6, dark);
  box(scene, -60, 4.2, 54, 10, 0.5, 7, wood);
  for (const [x, z] of [
    [-64, 52],
    [-56, 52],
    [-64, 56],
    [-56, 56],
  ] as const) {
    cyl(scene, x, 0.8, z, 0.18, 0.22, 2.2, wood);
  }
  cyl(scene, -48, 1.5, 62, 1.6, 1.8, 2.6, wood);
  cyl(scene, -70, 1.4, 46, 1.5, 1.7, 2.4, wood);
  addBox(-60, 54, 4.6, 3.2);
  addCircle(-48, 62, 1.7);
  addCircle(-70, 46, 1.6);

  box(scene, -5.4, 1.1, 30, 0.5, 2.2, 14, wood);
  box(scene, 5.6, 1, 26, 0.5, 2, 11, wood);
  addBox(-5.4, 30, 0.45, 7);
  addBox(5.6, 26, 0.45, 5.5);

  box(scene, 62, 2.4, -99, 16, 5, 2.4, stone);
  box(scene, 90, 2.4, -99, 16, 5, 2.4, stone);
  cyl(scene, 54, 3.2, -99, 2.1, 2.3, 6.4, stone);
  cyl(scene, 98, 3.2, -99, 2.1, 2.3, 6.4, stone);
  addBox(62, -99, 8, 1.35);
  addBox(90, -99, 8, 1.35);
  addCircle(54, -99, 2.3);
  addCircle(98, -99, 2.3);
  for (let i = 0; i < 5; i++) {
    const x = 68 + i * 2.1;
    cyl(scene, x, 5.4, -99, 0.06, 0.06, 2.2, dark);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), cloth);
    banner.position.set(x + 0.35, 6.2, -99);
    scene.add(banner);
  }
  for (const [x, z] of [
    [20, -34],
    [33, -36],
    [30, -50],
  ] as const) {
    cyl(scene, x, 1.1, z, 0.1, 2.1, 2.2, cloth);
    addCircle(x, z, 1.3, true);
  }
  addCircle(17, -44, 1.05, true);
  cyl(scene, 17, 0.7, -44, 1.1, 1.2, 1.2, stone);
  cyl(scene, 26, 0.45, -40, 0.35, 0.5, 0.5, gold);
  const campfire = new THREE.PointLight(0xe0a050, 1.1, 9, 2);
  campfire.position.set(26, 1.4, -40);
  scene.add(campfire);

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = PIT.x + Math.cos(a) * 8.4;
    const z = PIT.z + Math.sin(a) * 8.4;
    addCircle(x, z, 0.85, true);
    cyl(scene, x, terrainHeight(x, z) + 0.5, z, 0.7, 0.9, 1.1, stone);
  }

  const orin = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), new THREE.MeshStandardMaterial({ color: 0x1c2a24, roughness: 1 }));
  orin.scale.set(13, 2.3, 10);
  orin.position.set(SHOAL.x, -0.2, SHOAL.z);
  scene.add(orin);
  const orinEyes = new THREE.MeshStandardMaterial({ color: 0xc9a04a, emissive: 0xc9a04a, emissiveIntensity: 0.2 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), orinEyes);
  const eyeR = eyeL.clone();
  eyeL.position.set(SHOAL.x - 1.4, 1.15, SHOAL.z + 6.2);
  eyeR.position.set(SHOAL.x + 1.4, 1.15, SHOAL.z + 6.2);
  scene.add(eyeL, eyeR);

  const shockwave = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.05, 28),
    new THREE.MeshBasicMaterial({ color: 0xc9a04a, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  shockwave.rotation.x = -Math.PI / 2;
  shockwave.position.set(SHOAL.x, 0.15, SHOAL.z);
  scene.add(shockwave);

  const objective = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 14, 6),
    new THREE.MeshBasicMaterial({ color: 0xc9a04a, transparent: true, opacity: 0.35 }),
  );
  scene.add(objective);
  const lockRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 18), new THREE.MeshBasicMaterial({ color: 0xc9a04a }));
  lockRing.visible = false;
  scene.add(lockRing);

  const hearthGems: THREE.Object3D[] = [];
  for (const hearth of HEARTHS) {
    const group = new THREE.Group();
    const y = terrainHeight(hearth.x, hearth.z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8), stone);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), gold);
    gem.position.y = 1.15;
    group.add(base, gem);
    group.position.set(hearth.x, y + 0.2, hearth.z);
    scene.add(group);
    const light = new THREE.PointLight(0xc9a04a, 0.7, 7, 2);
    light.position.set(hearth.x, y + 1.5, hearth.z);
    scene.add(light);
    hearthGems.push(gem);
  }

  const props = new Map<string, THREE.Object3D>();
  const prop = (id: string, x: number, z: number, color: number, height: number) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, height, 0.45),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
    );
    mesh.position.set(x, terrainHeight(x, z) + height / 2, z);
    scene.add(mesh);
    props.set(id, mesh);
    return mesh;
  };
  for (const chest of CHESTS) prop(chest.id, chest.x, chest.z, 0x6a5030, 0.4);
  for (const cask of CASKS) prop(cask.id, cask.x, cask.z, 0x4a3a28, 0.7);
  for (const chord of STONES) {
    const mesh = prop(chord.id, chord.x, chord.z, 0x8a7a58, 1.3);
    mesh.material = gold;
  }
  const satchel = prop("satchel", SATCHEL.x, SATCHEL.z, 0xc9a04a, 0.35);
  const echoMote = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xc9a04a }),
  );
  echoMote.visible = false;
  scene.add(echoMote);

  const playerRig = createRig(OATHS.marsh.color, 1);
  setGrip(playerRig, "spear");
  scene.add(playerRig.group);

  const enemies: Actor[] = SPAWNS.map((spawn, index) => {
    const arch = ENEMIES[spawn.arch];
    const rig = createRig(arch.color, arch.scale);
    setGrip(rig, arch.grip);
    if (spawn.side === "peck") {
      rig.material.color.setHex(0x3a5344);
      rig.cape.color.setHex(0x1a2e24);
    } else if (spawn.side === "pale") {
      rig.material.color.setHex(0xe4dcc8);
      rig.cape.color.setHex(0xf3efe4);
    }
    scene.add(rig.group);
    return {
      id: spawn.id,
      arch: spawn.arch,
      camp: spawn.camp,
      side: spawn.side,
      title: spawn.title ?? arch.name,
      x: spawn.x,
      z: spawn.z,
      yaw: spawn.side === "peck" ? Math.PI : spawn.arch === "scout" ? 0.2 : Math.PI,
      homeX: spawn.x,
      homeZ: spawn.z,
      hp: arch.hp,
      max: arch.hp,
      alert: false,
      moving: false,
      mode: "idle",
      timer: 0,
      cd: 0,
      did: false,
      whistled: false,
      stun: 0,
      slow: 0,
      flash: 0,
      dead: false,
      phase: index,
      seed: index * 1.7,
      rig,
    };
  });

  const npcs: NpcActor[] = NPCS.map((npc) => {
    const rig = createRig(npc.color, npc.scale ?? 1);
    setGrip(rig, npc.grip);
    rig.group.position.set(npc.x, terrainHeight(npc.x, npc.z), npc.z);
    scene.add(rig.group);
    return { id: npc.id, x: npc.x, z: npc.z, name: npc.name, title: npc.title, rig };
  });

  return {
    scene,
    colliders,
    playerRig,
    enemies,
    npcs,
    hearthGems,
    props,
    satchel,
    echoMote,
    objective,
    lockRing,
    shockwave,
    orin,
    orinEyes,
  };
}
