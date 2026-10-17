import { CLEARINGS, MARSH_REGION, PATHS, PIT, REGIONS, SHOAL } from "../data/world";
import type { PathSeg, RegionDef } from "../types";

function distToSeg(x: number, z: number, seg: PathSeg) {
  const dx = seg.bx - seg.ax;
  const dz = seg.bz - seg.az;
  const len = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - seg.ax) * dx + (z - seg.az) * dz) / len));
  return Math.hypot(x - (seg.ax + dx * t), z - (seg.az + dz * t));
}

export function nearestPath(x: number, z: number) {
  let d = 999;
  let w = 4;
  for (const seg of PATHS) {
    const dist = distToSeg(x, z, seg);
    if (dist < d) {
      d = dist;
      w = seg.w;
    }
  }
  return { d, w };
}

function noise(x: number, z: number) {
  return (
    Math.sin(x * 0.085) * Math.cos(z * 0.072) * 0.55 +
    Math.sin(x * 0.031 + z * 0.048) * 0.42 +
    Math.sin((x - z) * 0.17) * 0.2
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export function terrainHeight(x: number, z: number) {
  let h = 0.2 + noise(x, z) * 0.82;
  const shoal = Math.hypot(x - SHOAL.x, z - SHOAL.z);
  if (shoal < 22) h -= (1 - shoal / 22) * 1.5;
  const path = nearestPath(x, z);
  if (path.d < path.w) {
    const t = smooth(path.d / path.w);
    h = 0.48 * (1 - t) + h * t;
  }
  for (const clearing of CLEARINGS) {
    const dist = Math.hypot(x - clearing.x, z - clearing.z);
    if (dist < clearing.r) {
      const t = smooth(dist / clearing.r);
      h = 0.52 * (1 - t) + h * t;
    }
  }
  const pit = Math.hypot(x - PIT.x, z - PIT.z);
  if (pit < PIT.rim) {
    if (pit < PIT.hole) h = -6.4;
    else {
      const t = (pit - PIT.hole) / (PIT.rim - PIT.hole);
      h = -6.4 + (h + 6.4) * t * t;
    }
  }
  return h;
}

export function reedAt(x: number, z: number) {
  const path = nearestPath(x, z);
  if (path.d < path.w + 0.25) return false;
  const h = terrainHeight(x, z);
  if (h < 0.06 || h > 0.98 || Math.hypot(x - PIT.x, z - PIT.z) < PIT.rim + 0.5) return false;
  return Math.sin(x * 0.33) * Math.cos(z * 0.31) + Math.sin(x * 0.07 + z * 0.11) > -0.2;
}

export function regionAt(x: number, z: number): RegionDef {
  let best: RegionDef | null = null;
  let bestDist = Infinity;
  for (const region of REGIONS) {
    const dist = Math.hypot(x - region.x, z - region.z);
    if (dist <= region.r && dist < bestDist) {
      best = region;
      bestDist = dist;
    }
  }
  return best ?? MARSH_REGION;
}
