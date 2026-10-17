import * as THREE from "three";
import type { Grip } from "../types";

const headMat = new THREE.MeshStandardMaterial({ color: 0xe7e0d2, roughness: 0.48 });
const beakMat = new THREE.MeshStandardMaterial({ color: 0x9a3d38, roughness: 0.5 });
const limbMat = new THREE.MeshStandardMaterial({ color: 0x171c19, roughness: 0.8 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.55 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.86 });

const beakGeo = new THREE.ConeGeometry(0.07, 0.28, 5);
beakGeo.rotateX(Math.PI / 2);
const combGeo = new THREE.ConeGeometry(0.05, 0.22, 4);
const spearGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.7, 5);
spearGeo.rotateX(Math.PI / 2);
spearGeo.translate(0, 0, 0.7);
const swordGeo = new THREE.BoxGeometry(0.06, 0.08, 0.95);
swordGeo.translate(0, 0, 0.4);
const greatGeo = new THREE.BoxGeometry(0.1, 0.14, 1.25);
greatGeo.translate(0, 0, 0.45);
const staffGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.4, 5);
staffGeo.rotateX(Math.PI / 2);
staffGeo.translate(0, 0, 0.4);
const thighGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.38, 6);
const shinGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.36, 6);
const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.32, 6);
const handGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.3, 6);
const torsoGeo = new THREE.BoxGeometry(0.48, 0.46, 0.3);
const shoulderGeo = new THREE.BoxGeometry(0.18, 0.1, 0.2);
const headGeo = new THREE.SphereGeometry(0.16, 10, 8);
const footGeo = new THREE.BoxGeometry(0.1, 0.05, 0.16);

function joint(geometry: THREE.BufferGeometry, material: THREE.Material, length: number) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -length / 2;
  mesh.castShadow = true;
  return mesh;
}

export type Rig = {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  cape: THREE.MeshStandardMaterial;
  hip: THREE.Group;
  spine: THREE.Group;
  thighL: THREE.Group;
  thighR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  spear: THREE.Object3D;
  sword: THREE.Object3D;
  great: THREE.Object3D;
  staff: THREE.Object3D;
  claw: THREE.Object3D;
};

export function createRig(color: number, scale: number): Rig {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.28 });
  const cape = new THREE.MeshStandardMaterial({ color: 0x141a16, roughness: 0.86, side: THREE.DoubleSide });
  const hip = new THREE.Group();
  hip.position.y = 0.86;
  const spine = new THREE.Group();
  spine.position.y = 0.06;

  const torso = new THREE.Mesh(torsoGeo, material);
  torso.position.y = 0.24;
  torso.castShadow = true;
  const shoulderL = new THREE.Mesh(shoulderGeo, material);
  shoulderL.position.set(-0.3, 0.4, 0);
  const shoulderR = new THREE.Mesh(shoulderGeo, material);
  shoulderR.position.set(0.3, 0.4, 0);

  const head = new THREE.Group();
  head.position.y = 0.5;
  const skull = new THREE.Mesh(headGeo, headMat);
  skull.scale.set(0.92, 1.08, 1.2);
  skull.castShadow = true;
  const beak = new THREE.Mesh(beakGeo, headMat);
  beak.position.set(0, -0.02, 0.2);
  const comb = new THREE.Mesh(combGeo, beakMat);
  comb.position.set(0, 0.18, -0.02);
  head.add(skull, beak, comb);

  const capeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.78), cape);
  capeMesh.position.set(0, 0.12, -0.2);
  capeMesh.rotation.x = 0.18;

  const thighL = new THREE.Group();
  thighL.position.set(-0.12, 0, 0);
  thighL.add(joint(thighGeo, material, 0.38));
  const shinL = new THREE.Group();
  shinL.position.y = -0.38;
  shinL.add(joint(shinGeo, limbMat, 0.36));
  const footL = new THREE.Mesh(footGeo, limbMat);
  footL.position.set(0, -0.38, 0.04);
  shinL.add(footL);
  thighL.add(shinL);

  const thighR = new THREE.Group();
  thighR.position.set(0.12, 0, 0);
  thighR.add(joint(thighGeo, material, 0.38));
  const shinR = new THREE.Group();
  shinR.position.y = -0.38;
  shinR.add(joint(shinGeo, limbMat, 0.36));
  const footR = new THREE.Mesh(footGeo, limbMat);
  footR.position.set(0, -0.38, 0.04);
  shinR.add(footR);
  thighR.add(shinR);

  const armL = new THREE.Group();
  armL.position.set(-0.32, 0.38, 0);
  armL.add(joint(armGeo, material, 0.32));
  const forearmL = new THREE.Group();
  forearmL.position.y = -0.32;
  forearmL.rotation.x = 0.35;
  forearmL.add(joint(handGeo, headMat, 0.3));
  armL.add(forearmL);

  const armR = new THREE.Group();
  armR.position.set(0.32, 0.38, 0);
  armR.add(joint(armGeo, material, 0.32));
  const forearmR = new THREE.Group();
  forearmR.position.y = -0.32;
  forearmR.rotation.x = 0.4;
  forearmR.add(joint(handGeo, headMat, 0.3));
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.28, 0.05);
  weapon.rotation.x = -1.15;
  const spear = new THREE.Mesh(spearGeo, limbMat);
  const sword = new THREE.Mesh(swordGeo, headMat);
  const great = new THREE.Mesh(greatGeo, clothMat);
  const staff = new THREE.Mesh(staffGeo, woodMat);
  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), headMat);
  claw.rotation.x = Math.PI / 2;
  claw.position.z = 0.25;
  weapon.add(spear, sword, great, staff, claw);
  forearmR.add(weapon);
  armR.add(forearmR);

  spine.add(torso, shoulderL, shoulderR, head, capeMesh, armL, armR);
  hip.add(spine, thighL, thighR);
  group.add(hip);
  group.scale.setScalar(scale);

  return {
    group,
    material,
    cape,
    hip,
    spine,
    thighL,
    thighR,
    shinL,
    shinR,
    armL,
    armR,
    spear,
    sword,
    great,
    staff,
    claw,
  };
}

export function setGrip(rig: Rig, grip: Grip) {
  rig.spear.visible = grip === "spear";
  rig.sword.visible = grip === "sword";
  rig.great.visible = grip === "great";
  rig.staff.visible = grip === "staff";
  rig.claw.visible = grip === "claw";
}

export function poseRig(rig: Rig, phase: number, moving: boolean, crouch: boolean, swing: number, roll: number) {
  const amp = moving ? 0.72 : 0.05;
  const s = Math.sin(phase);
  rig.thighL.rotation.x = s * amp;
  rig.thighR.rotation.x = -s * amp;
  rig.shinL.rotation.x = Math.max(0, -s) * amp;
  rig.shinR.rotation.x = Math.max(0, s) * amp;
  rig.armL.rotation.x = -s * amp * 0.55 + 0.15;
  rig.armR.rotation.x = (moving ? s * amp * 0.28 : 0.12) + Math.max(0, -swing) * 0.05;
  rig.armR.rotation.y = swing * 0.85;
  rig.spine.rotation.x = (crouch ? 0.42 : 0.04) + Math.sin(phase * 0.5) * 0.03;
  rig.spine.rotation.z = moving ? s * 0.06 : 0;
  rig.hip.position.y = (crouch ? 0.62 : 0.86) + Math.abs(s) * (moving ? 0.04 : 0.008);
  rig.group.rotation.z = roll;
}
