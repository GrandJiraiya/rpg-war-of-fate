export type Collider =
  | { kind: "circle"; x: number; z: number; r: number; los: boolean }
  | { kind: "box"; x: number; z: number; hx: number; hz: number; rot: number; los: boolean };

export function forward(yaw: number) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

export function right(yaw: number) {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

export function yawOf(x: number, z: number) {
  return Math.atan2(-x, -z);
}

export function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function turnToward(current: number, target: number, rate: number, dt: number) {
  return current + angleDelta(current, target) * (1 - Math.exp(-rate * dt));
}

/** Camera-relative stick. `strafe` is right positive, `ahead` is forward positive. */
export function cameraRelative(yaw: number, strafe: number, ahead: number) {
  const f = forward(yaw);
  const r = right(yaw);
  let x = f.x * ahead + r.x * strafe;
  let z = f.z * ahead + r.z * strafe;
  const mag = Math.hypot(x, z);
  if (mag > 1) return { x: x / mag, z: z / mag, mag: 1 };
  return { x, z, mag };
}

export function circleHits(x: number, z: number, radius: number, solid: Collider) {
  if (solid.kind === "circle") {
    return Math.hypot(x - solid.x, z - solid.z) < radius + solid.r;
  }
  const c = Math.cos(solid.rot);
  const s = Math.sin(solid.rot);
  const ox = x - solid.x;
  const oz = z - solid.z;
  const lx = ox * c + oz * s;
  const lz = -ox * s + oz * c;
  const cx = Math.max(-solid.hx, Math.min(solid.hx, lx));
  const cz = Math.max(-solid.hz, Math.min(solid.hz, lz));
  return Math.hypot(lx - cx, lz - cz) < radius;
}

export function resolveCircle(x: number, z: number, radius: number, solids: Collider[]) {
  for (let pass = 0; pass < 2; pass++) {
    for (const solid of solids) {
      if (solid.kind === "circle") {
        const dx = x - solid.x;
        const dz = z - solid.z;
        const dist = Math.hypot(dx, dz);
        const need = radius + solid.r;
        if (dist < need) {
          if (dist < 1e-5) x += need;
          else {
            const push = (need - dist) / dist;
            x += dx * push;
            z += dz * push;
          }
        }
      } else {
        const c = Math.cos(solid.rot);
        const s = Math.sin(solid.rot);
        const ox = x - solid.x;
        const oz = z - solid.z;
        const lx = ox * c + oz * s;
        const lz = -ox * s + oz * c;
        const cx = Math.max(-solid.hx, Math.min(solid.hx, lx));
        const cz = Math.max(-solid.hz, Math.min(solid.hz, lz));
        let fx = lx - cx;
        let fz = lz - cz;
        let mag = Math.hypot(fx, fz);
        if (mag >= radius) continue;
        if (mag < 1e-5) {
          if (solid.hx - Math.abs(lx) < solid.hz - Math.abs(lz)) fx = lx >= 0 ? 1 : -1;
          else fz = lz >= 0 ? 1 : -1;
          mag = 1;
        }
        const depth = radius - Math.hypot(lx - cx, lz - cz);
        const glen = Math.hypot(fx, fz) || 1;
        const nx = lx + (fx / glen) * (mag < 1e-4 ? radius : depth);
        const nz = lz + (fz / glen) * (mag < 1e-4 ? radius : depth);
        x = solid.x + nx * c - nz * s;
        z = solid.z + nx * s + nz * c;
      }
    }
  }
  return { x, z };
}

export function lineOfSight(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  solids: Collider[],
) {
  for (let step = 1; step < 7; step++) {
    const t = step / 7;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    for (const solid of solids) {
      if (!solid.los) continue;
      if (solid.kind === "circle") {
        if (Math.hypot(x - solid.x, z - solid.z) < solid.r * 0.82) return false;
      } else {
        const c = Math.cos(solid.rot);
        const s = Math.sin(solid.rot);
        const lx = (x - solid.x) * c + (z - solid.z) * s;
        const lz = -(x - solid.x) * s + (z - solid.z) * c;
        if (Math.abs(lx) < solid.hx * 0.92 && Math.abs(lz) < solid.hz * 0.92) return false;
      }
    }
  }
  return true;
}

/**
 * Pulls a third-person camera in along the ray from the player's head
 * so it stops short of walls, palisades, and trees.
 */
export function hitsAny(x: number, z: number, radius: number, solids: Collider[]) {
  for (const solid of solids) {
    if (circleHits(x, z, radius, solid)) return true;
  }
  return false;
}

export function resolveCamera(
  px: number,
  py: number,
  pz: number,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  solids: Collider[],
) {
  const dx = cx - px;
  const dy = cy - py;
  const dz = cz - pz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.75) return { x: cx, y: cy, z: cz };
  const steps = Math.max(1, Math.ceil(dist / 0.22));
  let clear = 1;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (hitsAny(px + dx * t, pz + dz * t, radius, solids)) {
      clear = Math.max(0.08, (i - 1) / steps);
      break;
    }
  }
  return { x: px + dx * clear, y: py + dy * clear, z: pz + dz * clear };
}
