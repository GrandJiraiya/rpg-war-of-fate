import * as THREE from "three";
import { CLOAKS } from "../data/cloaks";
import { ENEMIES } from "../data/enemies";
import { OATHS } from "../data/oaths";
import { GREETING_IDS, SPAWNS } from "../data/spawns";
import { WEAPONS, BOSS_DROPS } from "../data/weapons";
import { CASKS, CHESTS, HEARTHS, NPCS, PIT, SATCHEL, SHOAL, STONES, WARDEN_REACH } from "../data/world";
import { dialogueFor, applyChoice } from "../data/dialogue";
import { objectiveFor, questsFor } from "../data/quests";
import type { FloaterKind, HudState, OathId, Save, Screen, StatKey } from "../types";
import { createAudio, type AudioBus } from "./audio";
import {
  angleDelta,
  cameraRelative,
  forward,
  lineOfSight,
  resolveCamera,
  resolveCircle,
  right,
  turnToward,
  yawOf,
} from "./math";
import { poseRig, setGrip } from "./rig";
import {
  applyOrinTithe,
  chestDenial,
  createSave,
  derivedStats,
  dropEchoes,
  isHostile,
  itemKind,
  keptDead,
  levelCost,
  loadSave,
  sideOf,
  skillPower,
  statName,
  writeSave,
} from "./rules";
import { gameStore } from "./store";
import { reedAt, regionAt, terrainHeight } from "./terrain";
import { buildWorld, type Actor, type World } from "./world";

export type Action =
  | "attack"
  | "heavy"
  | "dodge"
  | "skill"
  | "interact"
  | "lock"
  | "flask"
  | "crouch"
  | "pause";

type Input = {
  moveX: number;
  moveY: number;
  attack: boolean;
  heavy: boolean;
  dodge: boolean;
  skill: boolean;
  interact: boolean;
  lock: boolean;
  flask: boolean;
  crouch: boolean;
  pause: boolean;
  lookL: boolean;
  lookR: boolean;
  gamepadLook: number;
};

type Bolt = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  dmg: number;
  friendly: boolean;
  slow: boolean;
  mesh: THREE.Mesh;
};

type Floater = { id: number; x: number; y: number; z: number; text: string; life: number; kind: FloaterKind };
type Toast = { id: number; text: string; life: number };

const CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "ShiftLeft",
  "KeyF",
  "KeyQ",
  "KeyR",
  "KeyC",
  "KeyE",
  "Tab",
  "KeyZ",
  "KeyX",
  "Escape",
  "KeyJ",
]);

const WARDEN = SPAWNS.find((spawn) => spawn.id === "war")!;

function isOath(id: string): id is OathId {
  return id in OATHS;
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly world: World;
  private readonly audio: AudioBus;
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly project = new THREE.Vector3();
  private readonly keys = new Set<string>();
  private prevKeys = new Set<string>();
  private readonly taps: Action[] = [];
  private readonly gamepadHeld = new Set<number>();
  private stickX = 0;
  private stickY = 0;
  private pointerDX = 0;
  private dragging = false;
  private holding = false;
  private heldAt = 0;
  private disposed = false;
  private raf = 0;
  private last = performance.now();
  private acc = 0;
  private time = 0;
  private hudTimer = 0;
  private autosave = 0;
  private shakeAmt = 0;
  private winded = 0;
  private floaterId = 1;
  private toastId = 1;
  private readonly floaters: Floater[] = [];
  private readonly toasts: Toast[] = [];
  private readonly bolts: Bolt[] = [];
  private lookYaw = 0;
  private lock: Actor | null = null;
  private orinAwake = false;
  private orinTime = 0;
  private orinPulse = 1.6;
  private pulseT = -1;
  private pulseHit = false;
  private screen: Screen = "title";
  private save: Save | null = null;
  private readonly fine: boolean;
  private readonly reduce: boolean;
  private readonly onResize: ResizeObserver;

  private player = {
    x: 2.2,
    z: 46,
    yaw: 0,
    hp: 100,
    stam: 80,
    ec: 40,
    crouch: false,
    iframe: 0,
    busy: 0,
    vx: 0,
    vz: 0,
    swingT: -1,
    swingDur: 0.5,
    windup: 0.1,
    active: 0.1,
    heavy: false,
    fired: false,
    hit: new Set<string>(),
    dodgeT: -1,
    dvx: 0,
    dvz: 0,
    stamDelay: 0,
    combo: 0,
    comboT: 0,
    empowered: 0,
    dead: false,
    flash: 0,
    phase: 0,
    speed: 0,
    moving: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.fine = window.matchMedia?.("(pointer: fine)").matches ?? true;
    this.reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.audio = createAudio();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.innerWidth >= 900,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.12, 210);
    this.world = buildWorld();
    this.resize();
    this.onResize = new ResizeObserver(() => this.resize());
    this.onResize.observe(canvas);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clearKeys);
    document.addEventListener("visibilitychange", this.onHide);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("contextmenu", this.onContext);
    gameStore.set({ booted: true });
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.onResize.disconnect();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clearKeys);
    document.removeEventListener("visibilitychange", this.onHide);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("contextmenu", this.onContext);
    this.renderer.dispose();
    gameStore.set({ booted: false, screen: "title" });
  }

  snapshot() {
    return this.save;
  }

  startNew(oathId: string, name: string) {
    if (!isOath(oathId)) return;
    this.audio.unlock();
    const save = createSave(oathId, name.trim() || "Oathbound", !this.reduce);
    this.adopt(save, true);
    this.toast(
      OATHS[oathId].side === "pale"
        ? "Day 1. You are the probe. The line is across the gap."
        : "Day 1. You hold the reeds. The probe is on the north road.",
    );
    this.time = 0;
  }

  continue() {
    this.audio.unlock();
    const save = loadSave();
    if (!save) return;
    this.adopt(save, false);
    this.toast("The marsh kept your place.");
  }

  choose(optionId: string) {
    if (!this.save) return;
    const npcId = gameStore.getState().npcId;
    if (!npcId) return;
    const next = applyChoice(npcId, optionId, this.save);
    if (next === "close") {
      gameStore.set({ beat: null, npcId: null, screen: "play" });
      this.screen = "play";
    } else {
      gameStore.set({ beat: next, npcId });
    }
    this.commit();
  }

  resume() {
    this.setScreen("play");
  }

  rest() {
    if (!this.save) return;
    const stats = derivedStats(this.save);
    this.player.hp = stats.hp;
    this.player.stam = stats.stam;
    this.player.ec = stats.echo;
    this.save.flasks = this.save.flaskMax;
    this.save.dead = keptDead(this.save.dead);
    this.syncEnemies();
    this.player.dead = false;
    this.toast("The hearth remembers you.");
    this.audio.shrine();
    this.commit();
    this.pushHud();
  }

  level(key: StatKey) {
    if (!this.save) return;
    const cost = levelCost(this.save.level);
    if (this.save.echoes < cost) return;
    this.save.echoes -= cost;
    this.save.level += 1;
    this.save.stats[key] += 1;
    this.clampResources(false);
    const stats = derivedStats(this.save);
    this.player.hp = Math.max(this.player.hp, Math.min(stats.hp, this.player.hp + 14));
    this.toast(`${statName(key)} deepens.`);
    this.commit();
    this.pushHud();
  }

  travel(id: string) {
    if (!this.save || !this.save.discovered.includes(id)) return;
    const hearth = HEARTHS.find((item) => item.id === id);
    if (!hearth) return;
    this.player.x = hearth.x + 1.6;
    this.player.z = hearth.z + 1.2;
    this.player.yaw = 0;
    this.lookYaw = 0;
    this.save.shrine = id;
    this.setScreen("play");
    this.commit();
  }

  equip(id: string) {
    if (!this.save || !this.save.items.includes(id)) return;
    const kind = itemKind(id);
    if (!kind) return;
    if (kind === "weapon") this.save.weaponId = id;
    else this.save.cloakId = id;
    this.syncGear();
    this.clampResources(false);
    this.commit();
    this.pushHud();
  }

  respawn() {
    if (!this.save) return;
    const hearth = HEARTHS.find((item) => item.id === this.save!.shrine) ?? HEARTHS[0];
    this.player.x = hearth.x + 1.5;
    this.player.z = hearth.z + 1.2;
    this.player.dead = false;
    this.player.yaw = 0;
    this.lookYaw = 0;
    const stats = derivedStats(this.save);
    this.player.hp = stats.hp * 0.7;
    this.player.stam = stats.stam;
    this.setScreen("play");
    this.toast("You rise. The echoes stayed where you fell.");
    this.commit();
  }

  setStick(x: number, y: number) {
    this.stickX = x;
    this.stickY = y;
  }

  tap(action: Action) {
    this.taps.push(action);
    this.audio.unlock();
  }

  setShake(on: boolean) {
    if (!this.save) return;
    this.save.settings.shake = on;
    this.commit();
  }

  setVolume(volume: number) {
    if (!this.save) return;
    this.save.settings.volume = volume;
    this.audio.setVolume(volume);
    this.commit();
  }

  private adopt(save: Save, refill: boolean) {
    this.save = save;
    this.player.x = save.x;
    this.player.z = save.z;
    this.player.yaw = save.yaw;
    this.lookYaw = save.yaw;
    this.player.dead = false;
    this.player.crouch = false;
    this.player.swingT = -1;
    this.player.dodgeT = -1;
    this.player.iframe = 0;
    this.lock = null;
    this.orinAwake = false;
    this.syncEnemies();
    this.syncGear();
    this.clampResources(refill);
    this.audio.setVolume(save.settings.volume);
    this.setScreen("play");
    this.commit();
  }

  private commit() {
    if (!this.save) return;
    this.save.x = this.player.x;
    this.save.z = this.player.z;
    this.save.yaw = this.player.yaw;
    this.save.flasks = Math.max(0, Math.round(this.save.flasks));
    writeSave(this.save);
    gameStore.bump();
  }

  private setScreen(screen: Screen) {
    this.screen = screen;
    gameStore.set({ screen });
  }

  private toast(text: string) {
    this.toasts.unshift({ id: this.toastId++, text, life: 3.4 });
    if (this.toasts.length > 3) this.toasts.pop();
  }

  private floater(x: number, z: number, text: string, kind: FloaterKind) {
    this.floaters.push({ id: this.floaterId++, x, y: terrainHeight(x, z) + 1.8, z, text, life: 0.85, kind });
    if (this.floaters.length > 14) this.floaters.shift();
  }

  private shake(amount: number) {
    if (this.save?.settings.shake) this.shakeAmt = Math.min(1, this.shakeAmt + amount);
  }

  private clampResources(refill: boolean) {
    if (!this.save) return;
    const stats = derivedStats(this.save);
    if (refill) {
      this.player.hp = stats.hp;
      this.player.stam = stats.stam;
      this.player.ec = stats.echo;
    } else {
      this.player.hp = Math.min(this.player.hp, stats.hp);
      this.player.stam = Math.min(this.player.stam, stats.stam);
      this.player.ec = Math.min(this.player.ec, stats.echo);
    }
  }

  private syncEnemies() {
    if (!this.save) return;
    if (this.save.dead.includes("cap")) this.save.flags.captainDead = true;
    if (this.save.dead.includes("war")) this.save.flags.wardenDead = true;
    if (this.save.dead.includes("can")) this.save.flags.cantorDead = true;
    if (GREETING_IDS.every((id) => this.save!.dead.includes(id))) this.save.flags.greetingCleared = true;
    for (const enemy of this.world.enemies) {
      const arch = ENEMIES[enemy.arch];
      enemy.dead = this.save.dead.includes(enemy.id);
      enemy.hp = enemy.dead ? 0 : arch.hp;
      enemy.max = arch.hp;
      enemy.x = enemy.homeX;
      enemy.z = enemy.homeZ;
      enemy.alert = false;
      enemy.mode = "idle";
      enemy.rig.group.visible = !enemy.dead;
    }
  }

  private syncGear() {
    if (!this.save) return;
    const oath = OATHS[this.save.oath];
    const pale = oath.side === "pale";
    this.world.playerRig.material.color.setHex(pale ? 0xe7e0d2 : oath.color);
    this.world.playerRig.cape.color.setHex(pale ? 0xf4efe6 : 0x1c3328);
    setGrip(this.world.playerRig, (WEAPONS[this.save.weaponId] ?? WEAPONS.reedSpear).grip);
  }

  private hostile(enemy: Actor) {
    return !!this.save && isHostile(enemy.side, sideOf(this.save.oath));
  }

  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const input = this.sampleInput();
    if (this.screen === "pause") {
      if (input.pause) this.resume();
      this.prevKeys = new Set(this.keys);
      this.pointerDX = 0;
      this.renderer.render(this.world.scene, this.camera);
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    if (this.screen === "title") {
      this.time += dt;
      this.player.phase += dt * 1.4;
      const orbit = this.time * 0.07;
      this.desired.set(Math.sin(orbit) * 18 + 6, 9.5, 16 + Math.cos(orbit) * 10);
      this.look.set(0, 1.4, -8);
      this.camera.position.lerp(this.desired, 1 - Math.exp(-1.4 * dt));
      this.camera.lookAt(this.look);
      this.renderActors();
      this.renderer.render(this.world.scene, this.camera);
      this.prevKeys = new Set(this.keys);
      this.pointerDX = 0;
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    this.time += dt;
    this.acc += dt;
    let steps = 0;
    let stepInput = input;
    while (this.acc >= 1 / 60 && steps < 4) {
      this.step(1 / 60, stepInput);
      stepInput = {
        ...stepInput,
        attack: false,
        heavy: false,
        dodge: false,
        skill: false,
        interact: false,
        lock: false,
        flask: false,
        crouch: false,
        pause: false,
      };
      this.acc -= 1 / 60;
      steps++;
    }
    if (input.lookL) this.lookYaw += dt * 1.5;
    if (input.lookR) this.lookYaw -= dt * 1.5;
    if (Math.abs(input.gamepadLook) > 0.2) this.lookYaw -= input.gamepadLook * 1.8 * (1 / 60);
    this.lookYaw -= this.pointerDX * 0.0042;
    this.pointerDX = 0;
    this.prevKeys = new Set(this.keys);
    this.updateCamera(dt);
    this.renderActors();
    this.renderer.render(this.world.scene, this.camera);
    this.hudTimer += dt;
    if (this.hudTimer > 0.09) {
      this.hudTimer = 0;
      this.pushHud();
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private sampleInput(): Input {
    const down = (code: string) => this.keys.has(code);
    const edge = (code: string) => down(code) && !this.prevKeys.has(code);
    const take = (action: Action) => {
      const index = this.taps.indexOf(action);
      if (index < 0) return false;
      this.taps.splice(index, 1);
      return true;
    };
    let moveX = 0;
    let moveY = 0;
    if (down("KeyA") || down("ArrowLeft")) moveX -= 1;
    if (down("KeyD") || down("ArrowRight")) moveX += 1;
    if (down("KeyW") || down("ArrowUp")) moveY += 1;
    if (down("KeyS") || down("ArrowDown")) moveY -= 1;
    moveX = Math.max(-1, Math.min(1, moveX + this.stickX));
    moveY = Math.max(-1, Math.min(1, moveY + this.stickY));
    let gamepadLook = 0;
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const dead = 0.18;
      let ax = pad.axes[0] ?? 0;
      let ay = -(pad.axes[1] ?? 0);
      const mag = Math.hypot(ax, ay);
      if (mag < dead) {
        ax = 0;
        ay = 0;
      } else {
        const scale = (mag - dead) / (1 - dead) / mag;
        ax *= scale;
        ay *= scale;
      }
      moveX = Math.max(-1, Math.min(1, moveX + ax));
      moveY = Math.max(-1, Math.min(1, moveY + ay));
      gamepadLook = pad.axes[2] ?? 0;
      const pressed = (index: number) => !!pad.buttons[index]?.pressed && !this.gamepadHeld.has(index);
      if (pressed(0)) this.taps.push("attack");
      if (pressed(1)) this.taps.push("dodge");
      if (pressed(2)) this.taps.push("heavy");
      if (pressed(3)) this.taps.push("skill");
      if (pressed(4) || pressed(10)) this.taps.push("lock");
      if (pressed(5)) this.taps.push("interact");
      if (pressed(7)) this.taps.push("flask");
      if (pressed(9)) this.taps.push("pause");
      this.gamepadHeld.clear();
      pad.buttons.forEach((button, index) => {
        if (button.pressed) this.gamepadHeld.add(index);
      });
    }
    const playing = this.screen === "play";
    return {
      moveX: playing ? moveX : 0,
      moveY: playing ? moveY : 0,
      attack: playing && (take("attack") || edge("KeyJ")),
      heavy: playing && (take("heavy") || edge("KeyF")),
      dodge: playing && (take("dodge") || edge("Space") || edge("ShiftLeft")),
      skill: playing && (take("skill") || edge("KeyQ")),
      interact: playing && (take("interact") || edge("KeyE")),
      lock: playing && (take("lock") || edge("Tab")),
      flask: playing && (take("flask") || edge("KeyR")),
      crouch: playing && (take("crouch") || edge("KeyC")),
      pause: take("pause") || edge("Escape"),
      lookL: down("KeyZ"),
      lookR: down("KeyX"),
      gamepadLook,
    };
  }

  private step(dt: number, input: Input) {
    if (input.pause) {
      if (this.screen === "play") {
        this.setScreen("pause");
        this.commit();
      } else if (this.screen === "pause" || this.screen === "rest") {
        this.setScreen("play");
      } else if (this.screen === "talk") {
        gameStore.set({ beat: null, npcId: null });
        this.setScreen("play");
      }
    }
    if (this.screen !== "play" || this.player.dead || !this.save) {
      this.player.speed = 0;
      this.player.moving = false;
      this.player.vx = 0;
      this.player.vz = 0;
      return;
    }
    const save = this.save;
    const stats = derivedStats(save);
    const playerSide = sideOf(save.oath);
    this.player.hp = Math.min(stats.hp, this.player.hp);
    this.winded = Math.max(0, this.winded - dt);
    this.player.iframe = Math.max(0, this.player.iframe - dt);
    this.player.flash = Math.max(0, this.player.flash - dt);
    this.player.comboT = Math.max(0, this.player.comboT - dt);
    this.player.stamDelay = Math.max(0, this.player.stamDelay - dt);
    if (this.player.stamDelay <= 0) {
      this.player.stam = Math.min(stats.stam, this.player.stam + (22 + save.stats.endurance * 0.4) * dt);
    }
    this.player.ec = Math.min(stats.echo, this.player.ec + (5 + save.stats.echo * 0.15) * dt);
    if (input.crouch) this.player.crouch = !this.player.crouch;
    if (input.flask && this.player.busy <= 0 && save.flasks > 0 && this.player.hp < stats.hp) {
      save.flasks -= 1;
      this.player.hp = Math.min(stats.hp, this.player.hp + stats.hp * 0.42);
      this.player.busy = 0.45;
      this.audio.shrine();
      this.toast("Marsh draught.");
    }
    if (input.lock) {
      if (this.lock && !this.lock.dead) this.lock = null;
      else {
        let best: Actor | null = null;
        let score = 18;
        for (const enemy of this.world.enemies) {
          if (enemy.dead || !this.hostile(enemy)) continue;
          const dx = enemy.x - this.player.x;
          const dz = enemy.z - this.player.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 18) continue;
          const rank = dist * 0.35 + Math.abs(angleDelta(this.lookYaw, yawOf(dx, dz))) * 6;
          if (rank < score) {
            best = enemy;
            score = rank;
          }
        }
        this.lock = best;
      }
    }
    if (this.lock && (this.lock.dead || Math.hypot(this.lock.x - this.player.x, this.lock.z - this.player.z) > 24)) {
      this.lock = null;
    }
    if (input.dodge && this.player.dodgeT < 0 && this.player.stam >= 20) {
      this.player.stam -= 20;
      this.player.stamDelay = 0.4;
      const wish = cameraRelative(this.lock ? this.player.yaw : this.lookYaw, input.moveX, input.moveY);
      const dir = wish.mag > 0.1 ? wish : forward(this.player.yaw);
      const mag = Math.hypot(dir.x, dir.z) || 1;
      this.player.dvx = (dir.x / mag) * 13.5;
      this.player.dvz = (dir.z / mag) * 13.5;
      this.player.dodgeT = 0;
      this.player.iframe = 0.26;
      this.player.swingT = -1;
      this.audio.dodge();
    }
    if (!(this.player.dodgeT >= 0 || this.player.swingT >= 0 || this.player.busy > 0) && this.player.busy <= 0) {
      if (input.skill) this.castSkill();
      else if (input.heavy) this.tryAssassinate() || this.startSwing(true);
      else if (input.attack) this.tryAssassinate() || this.startSwing(false);
      else if (input.interact) this.interact();
    }
    this.player.busy = Math.max(0, this.player.busy - dt);

    const damp = 1 - Math.exp(-12 * dt);
    if (this.player.dodgeT >= 0) {
      this.player.dodgeT += dt;
      this.player.vx = this.player.dvx;
      this.player.vz = this.player.dvz;
      if (this.player.dodgeT > 0.42) this.player.dodgeT = -1;
      this.player.moving = true;
      this.player.speed = 13;
    } else if (this.player.swingT < 0 && this.player.busy <= 0) {
      let vx = 0;
      let vz = 0;
      const wet = terrainHeight(this.player.x, this.player.z) < 0.02 ? 0.62 : 1;
      if (this.lock && !this.lock.dead) {
        const face = yawOf(this.lock.x - this.player.x, this.lock.z - this.player.z);
        this.player.yaw = turnToward(this.player.yaw, face, 12, dt);
        const f = forward(face);
        const r = right(face);
        let mx = f.x * input.moveY + r.x * input.moveX;
        let mz = f.z * input.moveY + r.z * input.moveX;
        const mag = Math.hypot(mx, mz);
        if (mag > 1) {
          mx /= mag;
          mz /= mag;
        }
        const speed = stats.speed * (this.player.crouch ? 0.46 : 1) * wet;
        vx = mx * speed;
        vz = mz * speed;
      } else {
        const wish = cameraRelative(this.lookYaw, input.moveX, input.moveY);
        if (wish.mag > 0.08) {
          this.player.yaw = turnToward(this.player.yaw, yawOf(wish.x, wish.z), 10, dt);
          const speed = stats.speed * wish.mag * (this.player.crouch ? 0.46 : 1) * wet;
          vx = wish.x * speed;
          vz = wish.z * speed;
        }
        if (input.moveY > 0.55 && Math.abs(input.moveX) < 0.35) {
          this.lookYaw = turnToward(this.lookYaw, this.player.yaw, 1.35, dt);
        }
      }
      this.player.vx += (vx - this.player.vx) * damp;
      this.player.vz += (vz - this.player.vz) * damp;
      this.player.speed = Math.hypot(this.player.vx, this.player.vz);
      this.player.moving = this.player.speed > 0.45;
    } else {
      this.player.vx *= 1 - damp;
      this.player.vz *= 1 - damp;
      this.player.speed = Math.hypot(this.player.vx, this.player.vz);
      this.player.moving = false;
    }
    this.player.phase += dt * (this.player.moving ? 2.6 + this.player.speed * 0.28 : 1.6);
    if (this.player.vx || this.player.vz) {
      const next = resolveCircle(
        this.player.x + this.player.vx * dt,
        this.player.z + this.player.vz * dt,
        0.42,
        this.world.colliders,
      );
      this.player.x = next.x;
      this.player.z = next.z;
    }
    for (const enemy of this.world.enemies) {
      if (enemy.dead) continue;
      const dx = this.player.x - enemy.x;
      const dz = this.player.z - enemy.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.78 && dist > 0.001) {
        this.player.x += (dx / dist) * (0.78 - dist) * 0.65;
        this.player.z += (dz / dist) * (0.78 - dist) * 0.65;
      }
    }
    this.player.x = Math.max(-90, Math.min(122, this.player.x));
    this.player.z = Math.max(-106, Math.min(66, this.player.z));
    if (Math.hypot(this.player.x - PIT.x, this.player.z - PIT.z) < PIT.hole - 0.2) {
      const angle = Math.atan2(this.player.z - PIT.z, this.player.x - PIT.x);
      this.player.x = PIT.x + Math.cos(angle) * (PIT.hole + 1.4);
      this.player.z = PIT.z + Math.sin(angle) * (PIT.hole + 1.4);
      this.damagePlayer(16, PIT.x, PIT.z);
      this.toast("The hole does not want you.");
    }
    if (this.player.swingT >= 0) {
      this.player.swingT += dt;
      const weapon = stats.weapon;
      const dmg =
        (this.player.heavy ? stats.light * weapon.heavyMul : stats.light) *
        (this.player.combo === 2 && !this.player.heavy ? 1.45 : 1);
      if (
        !this.player.fired &&
        this.player.swingT >= this.player.windup &&
        this.player.swingT < this.player.windup + this.player.active + 0.02
      ) {
        if (weapon.style === "bolt" && !this.player.heavy) {
          this.player.fired = true;
          this.player.hit.add("bolt");
          this.spawnBolt(this.player.x, this.player.z, this.player.yaw, dmg, true, false, 17);
        } else {
          this.arc(
            dmg,
            this.player.heavy ? weapon.range + 0.25 : weapon.range,
            this.player.heavy ? weapon.arc + 0.2 : weapon.arc,
            this.player.heavy,
          );
          if (Math.hypot(this.player.x - SHOAL.x, this.player.z - SHOAL.z) < 8) this.wakeOrin();
        }
      }
      if (this.player.swingT >= this.player.swingDur) this.player.swingT = -1;
    }

    this.stepEnemies(dt, stats.stealth);
    this.stepBolts(dt);
    this.stepOrin(dt);
    this.notePlace();
    if (playerSide === "pale" && (save.flags.greetingCleared || GREETING_IDS.every((id) => save.dead.includes(id)))) {
      save.flags.greetingCleared = true;
      if (!save.flags.throatReached && Math.hypot(this.player.x - WARDEN.x, this.player.z - WARDEN.z) < WARDEN_REACH) {
        save.flags.throatReached = true;
        this.toast("The Gate Warden holds the door. The marsh has not agreed to the tax.");
        this.commit();
      }
    }
    if (!save.flags.tutorial && this.time > 1.4) {
      save.flags.tutorial = true;
      this.toast("Gold on a blade means the cut is coming. Dodge, then answer.");
    }
    for (const floater of this.floaters) {
      floater.life -= dt;
      floater.y += dt * 0.8;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) if (this.floaters[i].life <= 0) this.floaters.splice(i, 1);
    for (const toast of this.toasts) toast.life -= dt;
    while (this.toasts.length && this.toasts[this.toasts.length - 1].life <= 0) this.toasts.pop();
    this.autosave += dt;
    if (this.autosave > 14) {
      this.autosave = 0;
      this.commit();
    }
  }

  private stepEnemies(dt: number, stealth: number) {
    for (const enemy of this.world.enemies) {
      if (enemy.dead) continue;
      const arch = ENEMIES[enemy.arch];
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.cd = Math.max(0, enemy.cd - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.phase += dt * (enemy.alert ? 8 : 3);
      enemy.moving = false;
      const dx = this.player.x - enemy.x;
      const dz = this.player.z - enemy.z;
      const dist = Math.hypot(dx, dz);
      if (enemy.stun > 0) continue;
      const hostile = this.hostile(enemy);
      if (!hostile) {
        enemy.alert = false;
        if (enemy.mode !== "idle") enemy.mode = "idle";
      }
      if (enemy.arch === "priest" && enemy.alert) {
        for (const ally of this.world.enemies) {
          if (ally.dead || ally === enemy || ally.camp !== enemy.camp) continue;
          if (Math.hypot(ally.x - enemy.x, ally.z - enemy.z) < 8) ally.hp = Math.min(ally.max, ally.hp + 6 * dt);
        }
      }
      const inReeds = this.player.crouch && reedAt(this.player.x, this.player.z);
      let sight =
        arch.sight *
        (this.player.crouch ? 0.62 : 1) *
        (inReeds ? 0.48 : 1) *
        (1 - Math.min(0.4, Math.max(0, stealth)));
      const toward = dist > 0.001 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
      const facing = forward(enemy.yaw);
      if (facing.x * toward.x + facing.z * toward.z < -0.05 && this.player.crouch) sight *= 0.55;
      const sees =
        hostile && dist < sight && lineOfSight(enemy.x, enemy.z, this.player.x, this.player.z, this.world.colliders);
      if (sees) {
        enemy.alert = true;
        if (enemy.arch === "scout" && !enemy.whistled && enemy.mode !== "attack" && enemy.mode !== "whistle") {
          enemy.mode = "whistle";
          enemy.timer = 0;
          this.audio.whistle();
        }
      }
      if (enemy.mode === "whistle") {
        enemy.timer += dt;
        enemy.yaw = turnToward(enemy.yaw, yawOf(dx, dz), 6, dt);
        if (enemy.timer > 1.05) {
          enemy.whistled = true;
          enemy.mode = "idle";
          this.alertCamp(enemy.camp, enemy.x, enemy.z, 22);
          this.toast("A scout's horn. They know.");
        }
        continue;
      }
      if (enemy.mode === "attack") {
        enemy.timer += dt;
        enemy.yaw = turnToward(enemy.yaw, yawOf(dx, dz), 8, dt);
        if (!enemy.did && enemy.timer >= arch.windup && enemy.timer < arch.windup + 0.16) {
          enemy.did = true;
          if (arch.bolt) this.spawnBolt(enemy.x, enemy.z, enemy.yaw, arch.dmg, false, enemy.arch === "cantor", 13);
          else if (dist < arch.range + 0.45 && Math.abs(angleDelta(enemy.yaw, yawOf(dx, dz))) < 0.9) {
            this.damagePlayer(arch.dmg, enemy.x, enemy.z);
          }
        }
        if (enemy.timer > arch.windup + arch.recover) {
          enemy.mode = "idle";
          enemy.cd = arch.boss ? 0.45 : 0.35;
          enemy.did = false;
        }
        continue;
      }
      const home = Math.hypot(enemy.x - enemy.homeX, enemy.z - enemy.homeZ);
      if (!enemy.alert || (home > arch.leash && dist > arch.sight + 2)) {
        if (home > arch.leash && !sees) enemy.alert = false;
        if (!enemy.alert) {
          enemy.phase += dt;
          const tx = enemy.homeX + Math.cos(enemy.phase * 0.45 + enemy.seed) * (arch.boss ? 0.4 : 2.4);
          const tz = enemy.homeZ + Math.sin(enemy.phase * 0.45 + enemy.seed) * (arch.boss ? 0.4 : 2.4);
          const wx = tx - enemy.x;
          const wz = tz - enemy.z;
          const wander = Math.hypot(wx, wz);
          if (wander > 0.4) {
            enemy.yaw = turnToward(enemy.yaw, yawOf(wx, wz), 4, dt);
            const step = 1.4 * dt;
            const next = resolveCircle(
              enemy.x + (wx / wander) * step,
              enemy.z + (wz / wander) * step,
              arch.radius * 0.8,
              this.world.colliders,
            );
            enemy.x = next.x;
            enemy.z = next.z;
            enemy.moving = true;
          }
          continue;
        }
      }
      enemy.yaw = turnToward(enemy.yaw, yawOf(dx, dz), 7, dt);
      const prefer = arch.bolt ? arch.range * 0.75 : arch.range * 0.85;
      if (dist > prefer) {
        const speed = arch.speed * (enemy.slow > 0 ? 0.45 : 1);
        const next = resolveCircle(
          enemy.x + (dx / dist) * speed * dt,
          enemy.z + (dz / dist) * speed * dt,
          arch.radius * 0.85,
          this.world.colliders,
        );
        enemy.x = next.x;
        enemy.z = next.z;
        enemy.moving = true;
      } else if (arch.bolt && dist < prefer * 0.55 && dist > 0.001) {
        const speed = arch.speed * 0.8;
        const next = resolveCircle(
          enemy.x - (dx / dist) * speed * dt,
          enemy.z - (dz / dist) * speed * dt,
          arch.radius * 0.85,
          this.world.colliders,
        );
        enemy.x = next.x;
        enemy.z = next.z;
        enemy.moving = true;
      } else if (enemy.cd <= 0) {
        enemy.mode = "attack";
        enemy.timer = 0;
        enemy.did = false;
      }
    }
  }

  private stepBolts(dt: number) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.life -= dt;
      bolt.x += bolt.vx * dt;
      bolt.z += bolt.vz * dt;
      let done = bolt.life <= 0;
      if (bolt.friendly) {
        for (const enemy of this.world.enemies) {
          if (enemy.dead || !this.hostile(enemy)) continue;
          if (Math.hypot(enemy.x - bolt.x, enemy.z - bolt.z) < 0.7) {
            this.damageEnemy(enemy, bolt.dmg, false);
            if (bolt.slow) enemy.slow = 2.4;
            done = true;
            break;
          }
        }
      } else if (Math.hypot(this.player.x - bolt.x, this.player.z - bolt.z) < 0.7) {
        this.damagePlayer(bolt.dmg, bolt.x, bolt.z);
        done = true;
      }
      if (done) {
        this.world.scene.remove(bolt.mesh);
        bolt.mesh.geometry.dispose();
        (bolt.mesh.material as THREE.Material).dispose();
        this.bolts.splice(i, 1);
      } else {
        bolt.mesh.position.set(bolt.x, terrainHeight(bolt.x, bolt.z) + 1.1, bolt.z);
      }
    }
  }

  private stepOrin(dt: number) {
    const ring = this.world.shockwave;
    const material = ring.material as THREE.MeshBasicMaterial;
    if (!this.orinAwake || !this.save) {
      material.opacity = 0;
      return;
    }
    this.orinTime += dt;
    this.orinPulse -= dt;
    if (this.orinPulse <= 0) {
      this.orinPulse = 2.6;
      this.pulseT = 0;
      this.pulseHit = false;
      this.audio.orin();
    }
    if (this.pulseT >= 0) {
      this.pulseT += dt;
      const radius = this.pulseT * 11;
      ring.scale.setScalar(Math.max(0.2, radius));
      material.opacity = Math.max(0, 0.55 - this.pulseT * 0.22);
      const dist = Math.hypot(this.player.x - SHOAL.x, this.player.z - SHOAL.z);
      if (!this.pulseHit && this.pulseT > 0.15 && Math.abs(dist - radius) < 1.35) {
        this.pulseHit = true;
        this.damagePlayer(24, SHOAL.x, SHOAL.z);
      }
      if (this.pulseT > 2.4) this.pulseT = -1;
    }
    const far = Math.hypot(this.player.x - SHOAL.x, this.player.z - SHOAL.z) > 30;
    if (this.orinTime > 26 || far) {
      this.orinAwake = false;
      this.save.flags.orinSlept = true;
      if (!far) {
        const tithe = applyOrinTithe(this.save);
        this.toast(tithe.toast);
        if (tithe.damage > 0) {
          this.player.hp -= tithe.damage;
          this.floater(this.player.x, this.player.z, String(tithe.damage), "hurt");
          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.player.dead = true;
            dropEchoes(this.save, this.player.x, this.player.z);
            this.audio.die();
            this.toast("The marsh took its tithe.");
            this.setScreen("dead");
          }
        }
      }
      this.pulseT = -1;
      material.opacity = 0;
      this.commit();
    }
  }

  private notePlace() {
    if (!this.save) return;
    const region = regionAt(this.player.x, this.player.z);
    if (region.id !== "marsh" && !this.save.regions.includes(region.id)) this.save.regions.push(region.id);
    for (const hearth of HEARTHS) {
      if (!this.save.discovered.includes(hearth.id) && this.near(hearth.x, hearth.z, 8)) {
        this.save.discovered.push(hearth.id);
      }
    }
  }

  private wakeOrin() {
    if (this.orinAwake || !this.save) return;
    if (Math.hypot(this.player.x - SHOAL.x, this.player.z - SHOAL.z) > 20) return;
    this.orinAwake = true;
    this.orinTime = 0;
    this.orinPulse = 1.2;
    this.save.flags.orinWoke = true;
    this.toast("The shoal inhales. Orin is awake.");
    this.audio.orin();
    this.shake(0.55);
  }

  private damagePlayer(amount: number, fromX: number, fromZ: number) {
    if (this.player.dead || this.player.iframe > 0 || !this.save) return;
    const stats = derivedStats(this.save);
    const dealt = Math.max(1, Math.round((amount * 100) / (100 + stats.def)));
    this.player.hp -= dealt;
    this.player.flash = 0.12;
    this.player.stamDelay = Math.max(this.player.stamDelay, 0.35);
    this.shake(0.28);
    this.audio.hurt();
    this.floater(this.player.x, this.player.z, String(dealt), "hurt");
    const away = forward(yawOf(this.player.x - fromX, this.player.z - fromZ));
    this.player.x += away.x * 0.35;
    this.player.z += away.z * 0.35;
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.dead = true;
      dropEchoes(this.save, this.player.x, this.player.z);
      this.audio.die();
      this.toast("The marsh took its tithe.");
      this.setScreen("dead");
      this.commit();
    }
  }

  private damageEnemy(enemy: Actor, amount: number, stagger: boolean) {
    if (enemy.dead || !this.hostile(enemy)) return;
    let dmg = amount;
    if (this.player.empowered > 0) {
      dmg *= 1.7;
      this.player.empowered = 0;
    }
    if (this.priestNear(enemy) && enemy.arch !== "priest") dmg *= 0.78;
    dmg = Math.max(1, Math.round(dmg));
    enemy.hp -= dmg;
    enemy.flash = 0.1;
    enemy.alert = true;
    this.alertCamp(enemy.camp, enemy.x, enemy.z, 14);
    if (stagger && !ENEMIES[enemy.arch].boss) {
      enemy.mode = "idle";
      enemy.stun = Math.max(enemy.stun, 0.35);
      enemy.timer = 0;
    }
    this.floater(enemy.x, enemy.z, String(dmg), "hit");
    this.audio.hit();
    this.shake(stagger ? 0.34 : 0.18);
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Actor, mult = 1) {
    if (enemy.dead || !this.save) return;
    enemy.dead = true;
    enemy.hp = 0;
    enemy.rig.group.visible = false;
    if (!this.save.dead.includes(enemy.id)) this.save.dead.push(enemy.id);
    const echoes = Math.round(ENEMIES[enemy.arch].echoes * mult);
    this.save.echoes += echoes;
    this.floater(enemy.x, enemy.z, `+${echoes}`, "echo");
    this.audio.pickup();
    if (enemy.id === "cap") {
      this.save.flags.captainDead = true;
      this.toast("The probe breaks. Bix will want that written down.");
      this.grant(BOSS_DROPS.captain);
      this.audio.boss();
    } else if (enemy.id === "war") {
      this.save.flags.wardenDead = true;
      this.toast("The gate remembers who paid.");
      this.grant(BOSS_DROPS.warden);
      this.audio.boss();
    } else if (enemy.id === "can") {
      this.save.flags.cantorDead = true;
      this.toast("The chord snaps.");
      this.audio.boss();
    }
    const save = this.save;
    if (save && GREETING_IDS.every((id) => save.dead.includes(id))) save.flags.greetingCleared = true;
    if (this.lock === enemy) this.lock = null;
    this.commit();
  }

  private priestNear(enemy: Actor) {
    return this.world.enemies.some(
      (other) =>
        !other.dead &&
        other.arch === "priest" &&
        other.camp === enemy.camp &&
        Math.hypot(other.x - enemy.x, other.z - enemy.z) < 8,
    );
  }

  private alertCamp(camp: string, x: number, z: number, radius: number) {
    for (const enemy of this.world.enemies) {
      if (!enemy.dead && enemy.camp === camp && Math.hypot(enemy.x - x, enemy.z - z) <= radius) enemy.alert = true;
    }
  }

  private spawnBolt(x: number, z: number, yaw: number, dmg: number, friendly: boolean, slow: boolean, speed: number) {
    const dir = forward(yaw);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(slow ? 0.2 : 0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: slow ? 0xd5e4ea : friendly ? 0xe7e0d2 : 0xc9a04a }),
    );
    this.world.scene.add(mesh);
    this.bolts.push({ x, z, vx: dir.x * speed, vz: dir.z * speed, life: 1.4, dmg, friendly, slow, mesh });
  }

  private ring(x: number, z: number, radius: number, dmg: number, stun: number) {
    for (const enemy of this.world.enemies) {
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - x, enemy.z - z) <= radius + 0.3) {
        this.damageEnemy(enemy, dmg, true);
        enemy.stun = Math.max(enemy.stun, stun);
      }
    }
  }

  private arc(dmg: number, range: number, arc: number, heavy: boolean) {
    for (const enemy of this.world.enemies) {
      if (enemy.dead || this.player.hit.has(enemy.id)) continue;
      const dx = enemy.x - this.player.x;
      const dz = enemy.z - this.player.z;
      if (Math.hypot(dx, dz) > range + ENEMIES[enemy.arch].radius) continue;
      if (Math.abs(angleDelta(this.player.yaw, yawOf(dx, dz))) > arc) continue;
      this.player.hit.add(enemy.id);
      this.damageEnemy(enemy, dmg, heavy);
    }
  }

  private blink(distance: number) {
    const dir = forward(this.player.yaw);
    let x = this.player.x;
    let z = this.player.z;
    for (let i = 0; i < 8; i++) {
      const nx = x + (dir.x * distance) / 8;
      const nz = z + (dir.z * distance) / 8;
      const resolved = resolveCircle(nx, nz, 0.42, this.world.colliders);
      if (Math.hypot(resolved.x - nx, resolved.z - nz) > 0.2) break;
      x = resolved.x;
      z = resolved.z;
    }
    this.player.x = x;
    this.player.z = z;
    this.player.iframe = Math.max(this.player.iframe, 0.12);
  }

  private tryAssassinate() {
    if (!this.player.crouch) return false;
    let best: Actor | null = null;
    let bestDist = 2.05;
    for (const enemy of this.world.enemies) {
      if (enemy.dead || enemy.alert || !this.hostile(enemy)) continue;
      const dx = this.player.x - enemy.x;
      const dz = this.player.z - enemy.z;
      const dist = Math.hypot(dx, dz);
      if (dist > bestDist) continue;
      const facing = forward(enemy.yaw);
      if ((facing.x * dx + facing.z * dz) / (dist || 1) < -0.05) {
        best = enemy;
        bestDist = dist;
      }
    }
    if (!best) return false;
    this.audio.hit();
    this.shake(0.4);
    if (ENEMIES[best.arch].boss) this.damageEnemy(best, best.max * 0.38, true);
    else this.killEnemy(best, 1.25);
    this.player.stam = Math.max(0, this.player.stam - 8);
    return true;
  }

  private startSwing(heavy: boolean) {
    if (!this.save) return;
    const stats = derivedStats(this.save);
    const cost = heavy ? stats.weapon.stam * 1.65 : stats.weapon.stam;
    if (this.player.stam < cost * 0.7) {
      if (this.winded <= 0) {
        this.toast("Winded.");
        this.winded = 1.2;
      }
      return;
    }
    this.player.stam -= cost;
    this.player.stamDelay = 0.45;
    this.player.heavy = heavy;
    this.player.swingT = 0;
    this.player.windup = heavy ? stats.weapon.windup * 1.55 : stats.weapon.windup;
    this.player.active = stats.weapon.active;
    this.player.swingDur =
      this.player.windup + this.player.active + (heavy ? stats.weapon.recover * 1.15 : stats.weapon.recover);
    this.player.fired = false;
    this.player.hit.clear();
    if (heavy) this.player.combo = 0;
    else {
      this.player.combo = this.player.comboT > 0 ? (this.player.combo + 1) % 3 : 0;
      this.player.comboT = 0.85;
    }
    this.audio.swing();
  }

  private castSkill() {
    if (!this.save) return;
    const skill = OATHS[this.save.oath].skill;
    if (this.player.ec < skill.echoCost) {
      this.toast("The oath is quiet.");
      return;
    }
    this.player.ec -= skill.echoCost;
    const power = skillPower(this.save.stats) * skill.damageScale;
    this.audio.skill();
    this.shake(0.3);
    if (skill.kind === "ring") this.ring(this.player.x, this.player.z, skill.radius, power, skill.stun);
    else if (skill.kind === "blink") {
      this.blink(skill.blink ?? 6);
      this.player.empowered = 1;
      this.toast("Echo step.");
    } else if (skill.kind === "arc") this.arc(power, skill.radius, skill.arc ?? 1, true);
    else if (skill.kind === "bolt") this.spawnBolt(this.player.x, this.player.z, this.player.yaw, power, true, !!skill.slow, 18);
    else if (skill.kind === "dash") {
      const dir = forward(this.player.yaw);
      this.player.dodgeT = 0;
      this.player.iframe = 0.18;
      this.player.dvx = dir.x * (skill.dashSpeed ?? 16);
      this.player.dvz = dir.z * (skill.dashSpeed ?? 16);
      this.player.swingDur = 0.42;
      this.ring(this.player.x + dir.x * 2, this.player.z + dir.z * 2, skill.radius, power, skill.stun);
    }
    if (skill.wakesWithin && Math.hypot(this.player.x - SHOAL.x, this.player.z - SHOAL.z) < skill.wakesWithin) {
      this.wakeOrin();
    }
  }

  private interact() {
    if (!this.save) return;
    const save = this.save;
    for (const hearth of HEARTHS) {
      if (!this.near(hearth.x, hearth.z, 2.5)) continue;
      if (!save.discovered.includes(hearth.id)) save.discovered.push(hearth.id);
      save.shrine = hearth.id;
      gameStore.set({ shrineName: hearth.name });
      this.audio.shrine();
      this.setScreen("rest");
      this.commit();
      return;
    }
    for (const npc of NPCS) {
      if (!this.near(npc.x, npc.z, 2.5)) continue;
      if (npc.id === "nezz") save.flags.metNezz = true;
      gameStore.set({ npcId: npc.id, beat: dialogueFor(npc.id, save) });
      this.setScreen("talk");
      return;
    }
    for (const chest of CHESTS) {
      if (save.opened.includes(chest.id) || !this.near(chest.x, chest.z, 2.2)) continue;
      const denial = chestDenial(save, chest);
      if (denial) {
        this.toast(denial);
        return;
      }
      save.opened.push(chest.id);
      this.grant(chest.item);
      const mesh = this.world.props.get(chest.id);
      if (mesh) mesh.visible = false;
      this.commit();
      return;
    }
    if (!save.hasSatchel && !save.flags.returnedMap && this.near(SATCHEL.x, SATCHEL.z, 2.2)) {
      save.hasSatchel = true;
      this.world.satchel.visible = false;
      this.toast("FORTY DAYS. This is a schedule, not a raid.");
      this.audio.pickup();
      this.alertCamp("camp", SATCHEL.x, SATCHEL.z, 20);
      this.commit();
      return;
    }
    for (const cask of CASKS) {
      if (save.smashed.includes(cask.id) || !this.near(cask.x, cask.z, 2.1)) continue;
      save.smashed.push(cask.id);
      save.flags.casks = save.smashed.length;
      const mesh = this.world.props.get(cask.id);
      if (mesh) mesh.visible = false;
      this.toast(`Cask smashed. ${save.flags.casks}/3.`);
      this.audio.hit();
      if (save.flags.casks >= 3) this.toast("The shoal can go back to ordinary rot.");
      this.commit();
      return;
    }
    for (const stone of STONES) {
      if (save.silenced.includes(stone.id) || !this.near(stone.x, stone.z, 2.3)) continue;
      save.silenced.push(stone.id);
      save.flags.stones = save.silenced.length;
      save.flags.chordAsked = true;
      const mesh = this.world.props.get(stone.id);
      if (mesh) mesh.visible = false;
      this.toast("The stone goes quiet.");
      this.audio.shrine();
      this.alertCamp("pit", stone.x, stone.z, 30);
      this.commit();
      return;
    }
    if (save.lostEchoes > 0 && this.near(save.lostX, save.lostZ, 2)) {
      save.echoes += save.lostEchoes;
      this.toast(`Recovered ${save.lostEchoes} echoes.`);
      save.lostEchoes = 0;
      this.audio.pickup();
      this.commit();
    }
  }

  private prompt() {
    if (!this.save || this.screen !== "play") return "";
    const save = this.save;
    const label = (text: string) => (this.fine ? `E  ${text}` : text);
    if (this.player.crouch) {
      for (const enemy of this.world.enemies) {
        if (enemy.dead || enemy.alert || !this.hostile(enemy)) continue;
        const dx = this.player.x - enemy.x;
        const dz = this.player.z - enemy.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 2.05) continue;
        const facing = forward(enemy.yaw);
        if ((facing.x * dx + facing.z * dz) / (dist || 1) < -0.05) return this.fine ? "Strike  Assassinate" : "Assassinate";
      }
    }
    for (const hearth of HEARTHS) if (this.near(hearth.x, hearth.z, 2.5)) return label(`Rest at ${hearth.name}`);
    for (const npc of NPCS) if (this.near(npc.x, npc.z, 2.5)) return label(`Speak with ${npc.name}`);
    for (const chest of CHESTS) {
      if (save.opened.includes(chest.id) || !this.near(chest.x, chest.z, 2.2)) continue;
      if (chestDenial(save, chest)) return "Not your coat";
      return label("Open the chest");
    }
    if (!save.hasSatchel && !save.flags.returnedMap && this.near(SATCHEL.x, SATCHEL.z, 2.2)) return label("Take the satchel");
    for (const cask of CASKS) if (!save.smashed.includes(cask.id) && this.near(cask.x, cask.z, 2.1)) return label("Smash the cask quietly");
    for (const stone of STONES) {
      if (!save.silenced.includes(stone.id) && this.near(stone.x, stone.z, 2.3)) return label("Silence the chord stone");
    }
    if (save.lostEchoes > 0 && this.near(save.lostX, save.lostZ, 2)) return label("Recover echoes");
    return "";
  }

  private near(x: number, z: number, radius: number) {
    return Math.hypot(this.player.x - x, this.player.z - z) <= radius;
  }

  private grant(id: string) {
    if (!this.save || this.save.items.includes(id)) return;
    this.save.items.push(id);
    this.toast(`Found ${WEAPONS[id]?.name ?? CLOAKS[id]?.name ?? id}.`);
    this.audio.pickup();
  }

  private updateCamera(dt: number) {
    const dir = forward(this.lookYaw);
    const aim = forward(this.player.yaw);
    const focusX = this.lock ? (this.player.x + this.lock.x) * 0.5 : this.player.x + aim.x * 1.1;
    const focusZ = this.lock ? (this.player.z + this.lock.z) * 0.5 : this.player.z + aim.z * 1.1;
    const distance = this.lock ? 9.4 : 7.8;
    const lift = this.lock ? 4.3 : 3.45;
    const ground = terrainHeight(this.player.x, this.player.z);
    const resolved = resolveCamera(
      this.player.x,
      ground + 1.55,
      this.player.z,
      this.player.x - dir.x * distance,
      ground + lift,
      this.player.z - dir.z * distance,
      0.42,
      this.world.colliders,
    );
    this.desired.set(resolved.x, resolved.y, resolved.z);
    const blend = 1 - Math.exp(-6 * dt);
    this.camera.position.x += (this.desired.x - this.camera.position.x) * blend;
    this.camera.position.y += (this.desired.y - this.camera.position.y) * blend;
    this.camera.position.z += (this.desired.z - this.camera.position.z) * blend;
    this.look.set(focusX + this.player.vx * 0.28, ground + 1.35, focusZ + this.player.vz * 0.28);
    if (this.shakeAmt > 0) {
      const mag = this.shakeAmt * this.shakeAmt;
      this.camera.position.x += Math.sin(this.time * 43) * mag * 0.28;
      this.camera.position.y += Math.cos(this.time * 37) * mag * 0.16;
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.7);
    }
    this.camera.lookAt(this.look);
  }

  private renderActors() {
    const rig = this.world.playerRig;
    const ground = terrainHeight(this.player.x, this.player.z);
    rig.group.position.set(this.player.x, ground - (this.player.crouch ? 0.06 : 0), this.player.z);
    rig.group.rotation.y = this.player.yaw + Math.PI;
    let swing = 0;
    if (this.player.swingT >= 0) {
      const u = this.player.swingT / Math.max(0.01, this.player.windup);
      swing =
        u < 1
          ? u * 0.8
          : -Math.sin(Math.min(1, (this.player.swingT - this.player.windup) / 0.25) * Math.PI) *
            (this.player.heavy ? 2.1 : 1.45);
    }
    const roll = this.player.dodgeT >= 0 ? Math.sin((this.player.dodgeT / 0.42) * Math.PI) * 0.55 : 0;
    poseRig(rig, this.player.phase, this.player.moving, this.player.crouch, swing, roll);
    rig.material.emissive.setHex(this.player.flash > 0 ? 0xe7e0d2 : 0);
    rig.material.emissiveIntensity = this.player.flash > 0 ? 0.85 : 0;

    for (const enemy of this.world.enemies) {
      if (enemy.dead) continue;
      const y = terrainHeight(enemy.x, enemy.z);
      enemy.rig.group.position.set(enemy.x, y, enemy.z);
      enemy.rig.group.rotation.y = enemy.yaw + Math.PI;
      const arch = ENEMIES[enemy.arch];
      let arm = 0;
      if (enemy.mode === "attack") {
        const u = enemy.timer / arch.windup;
        arm = u < 1 ? u * 0.9 : -1.4;
      }
      poseRig(enemy.rig, enemy.phase, enemy.moving, false, arm, 0);
      const winding = enemy.mode === "attack" && enemy.timer < arch.windup;
      enemy.rig.material.emissive.setHex(enemy.flash > 0 ? 0xffffff : winding ? 0xc9a04a : 0);
      enemy.rig.material.emissiveIntensity = enemy.flash > 0 ? 0.9 : winding ? 0.55 : 0;
    }
    this.world.npcs.forEach((npc, index) => {
      npc.rig.group.position.y = terrainHeight(npc.x, npc.z);
      poseRig(npc.rig, this.time * 1.4 + index, false, false, 0, 0);
      if (this.screen === "play") {
        npc.rig.group.rotation.y = yawOf(this.player.x - npc.x, this.player.z - npc.z) + Math.PI;
      }
    });
    this.world.orin.position.y = (this.orinAwake ? 1.3 : -0.15) + Math.sin(this.time * 0.8) * 0.08;
    this.world.orinEyes.emissiveIntensity = this.orinAwake ? 0.9 : 0.15;
    const objective = this.save && this.screen === "play" ? objectiveFor(this.save) : null;
    if (objective) {
      this.world.objective.visible = true;
      this.world.objective.position.set(objective.x, terrainHeight(objective.x, objective.z) + 7, objective.z);
    } else this.world.objective.visible = false;
    if (this.lock && !this.lock.dead) {
      this.world.lockRing.visible = true;
      this.world.lockRing.position.set(this.lock.x, terrainHeight(this.lock.x, this.lock.z) + 2.05, this.lock.z);
      this.world.lockRing.rotation.x = Math.PI / 2;
      this.world.lockRing.rotation.z = this.time * 1.5;
    } else this.world.lockRing.visible = false;
    if (this.save) {
      this.world.echoMote.visible = this.save.lostEchoes > 0;
      if (this.world.echoMote.visible) {
        this.world.echoMote.position.set(
          this.save.lostX,
          terrainHeight(this.save.lostX, this.save.lostZ) + 0.8 + Math.sin(this.time * 4) * 0.15,
          this.save.lostZ,
        );
      }
      this.world.satchel.visible = !this.save.hasSatchel && !this.save.flags.returnedMap;
      for (const chest of CHESTS) {
        const mesh = this.world.props.get(chest.id);
        if (mesh) mesh.visible = !this.save.opened.includes(chest.id);
      }
      for (const cask of CASKS) {
        const mesh = this.world.props.get(cask.id);
        if (mesh) mesh.visible = !this.save.smashed.includes(cask.id);
      }
      for (const stone of STONES) {
        const mesh = this.world.props.get(stone.id);
        if (mesh) mesh.visible = !this.save.silenced.includes(stone.id);
      }
    }
    for (const gem of this.world.hearthGems) {
      gem.rotation.y = this.time * 1.4;
      gem.position.y = 1.15 + Math.sin(this.time * 3) * 0.06;
    }
  }

  private pushHud() {
    if (!this.save) return;
    const stats = derivedStats(this.save);
    const quest = questsFor(this.save)[0];
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const project = (x: number, y: number, z: number) => {
      this.project.set(x, y, z).project(this.camera);
      if (this.project.z > 1) return null;
      return { x: (this.project.x * 0.5 + 0.5) * width, y: (-this.project.y * 0.5 + 0.5) * height };
    };
    let seen = false;
    for (const enemy of this.world.enemies) {
      if (!enemy.dead && enemy.alert && Math.hypot(enemy.x - this.player.x, enemy.z - this.player.z) < 22) seen = true;
    }
    const labels: HudState["labels"] = [];
    if (this.screen === "play") {
      for (const npc of this.world.npcs) {
        if (Math.hypot(npc.x - this.player.x, npc.z - this.player.z) > 22) continue;
        const point = project(npc.x, terrainHeight(npc.x, npc.z) + 2.3, npc.z);
        if (!point || point.x < -20 || point.x > width + 20 || point.y < -20 || point.y > height + 20) continue;
        labels.push({ id: npc.id, x: point.x, y: point.y, name: npc.name, sub: npc.title });
      }
    }
    const floaters: HudState["floaters"] = [];
    for (const floater of this.floaters) {
      const point = project(floater.x, floater.y, floater.z);
      if (point) floaters.push({ id: floater.id, x: point.x, y: point.y, text: floater.text, kind: floater.kind });
    }
    const compass: HudState["compass"] = [];
    const mark = (id: string, x: number, z: number, hot: boolean) => {
      const u = 0.5 - angleDelta(this.lookYaw, yawOf(x - this.player.x, z - this.player.z)) / Math.PI;
      if (u > -0.08 && u < 1.08) compass.push({ id, u, hot });
    };
    const objective = objectiveFor(this.save);
    if (objective) mark("obj", objective.x, objective.z, true);
    for (const hearth of HEARTHS) {
      if (this.save.discovered.includes(hearth.id)) mark(hearth.id, hearth.x, hearth.z, false);
    }
    let bossName = "";
    let bossRatio = 0;
    const boss =
      this.lock && ENEMIES[this.lock.arch].boss
        ? this.lock
        : this.world.enemies.find(
            (enemy) =>
              !enemy.dead &&
              ENEMIES[enemy.arch].boss &&
              enemy.alert &&
              Math.hypot(enemy.x - this.player.x, enemy.z - this.player.z) < 22,
          );
    if (boss && !boss.dead) {
      bossName = boss.title;
      bossRatio = Math.max(0, boss.hp / boss.max);
    }
    gameStore.set({
      hud: {
        hp: Math.max(0, this.player.hp),
        hpMax: stats.hp,
        st: Math.max(0, this.player.stam),
        stMax: stats.stam,
        ec: Math.max(0, this.player.ec),
        ecMax: stats.echo,
        flasks: this.save.flasks,
        flaskMax: this.save.flaskMax,
        echoes: this.save.echoes,
        level: this.save.level,
        zone: regionAt(this.player.x, this.player.z).name,
        questTitle: quest?.title ?? "",
        questBody: quest?.body ?? "",
        prompt: this.prompt(),
        bossName,
        bossRatio,
        stealth: seen ? "seen" : this.player.crouch ? "hidden" : "off",
        crouched: this.player.crouch,
        locked: this.lock && !this.lock.dead ? this.lock.title : "",
        toasts: this.toasts.map((toast) => ({ id: toast.id, text: toast.text })),
        floaters,
        labels,
        compass,
      },
    });
  }

  private resize = () => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.fov = width < 820 ? 66 : 56;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 820 ? 1.15 : 1.5));
    this.renderer.setSize(width, height, false);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (CODES.has(event.code)) event.preventDefault();
    this.keys.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private clearKeys = () => {
    this.keys.clear();
  };

  private onHide = () => {
    if (document.hidden) this.keys.clear();
  };

  private onPointerDown = (event: PointerEvent) => {
    this.audio.unlock();
    if (event.button === 2 || event.pointerType === "touch") this.dragging = true;
    else if (event.button === 0 && event.pointerType === "mouse" && this.screen === "play") {
      this.holding = true;
      this.heldAt = performance.now();
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    if (event.button === 0 && this.holding && event.pointerType === "mouse") {
      this.taps.push(performance.now() - this.heldAt > 280 ? "heavy" : "attack");
      this.holding = false;
    }
    this.dragging = false;
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.dragging && (event.pointerType !== "mouse" || (event.buttons & 2) !== 0)) {
      this.pointerDX += event.movementX;
    }
  };

  private onContext = (event: Event) => {
    event.preventDefault();
  };
}
