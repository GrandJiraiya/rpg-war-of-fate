import { OATHS } from "./oaths";
import { GREETING_IDS, SPAWNS } from "./spawns";
import { CASKS, SATCHEL, STONES } from "./world";
import type { Objective, QuestView, Save } from "../types";

const WARDEN = SPAWNS.find((spawn) => spawn.id === "war")!;

function greetingCleared(save: Save) {
  return save.flags.greetingCleared || GREETING_IDS.every((id) => save.dead.includes(id));
}

function paleQuests(save: Save): QuestView[] {
  const killed = GREETING_IDS.filter((id) => save.dead.includes(id)).length;
  if (!greetingCleared(save)) {
    return [
      {
        id: "probe",
        title: "The Greeting",
        body: `You are the probe. The reed line is across the gap. Break it. ${killed}/${GREETING_IDS.length}.`,
        done: false,
        main: true,
      },
    ];
  }
  if (!save.flags.throatReached) {
    return [
      {
        id: "probe",
        title: "The Throat",
        body: "The causeway gave. Cock Fortress is the next door that thinks it has time. Reach the Gate Warden.",
        done: false,
        main: true,
      },
    ];
  }
  return [
    {
      id: "probe",
      title: "The Throat",
      body: "The gate is held. The marsh has not agreed to the tax.",
      done: true,
      main: true,
    },
  ];
}

function peckQuests(save: Save): QuestView[] {
  const flags = save.flags;
  const quests: QuestView[] = [];
  if (!flags.captainDead) {
    quests.push({
      id: "blood",
      title: "First Blood",
      body: "The Pale Dawn probe is on the north causeway. Break the captain.",
      done: false,
      main: true,
    });
  } else if (!flags.spokeBix) {
    quests.push({
      id: "blood",
      title: "First Blood",
      body: "Tell Bix the vanguard is done. He is on the south palisade.",
      done: false,
      main: true,
    });
  } else if (!save.hasSatchel && !flags.returnedMap) {
    quests.push({
      id: "satchel",
      title: "A Schedule, Not a Raid",
      body: "A Wells satchel sits in the Crow Road camp. Steal it, or take it.",
      done: false,
      main: true,
    });
  } else if (!flags.returnedMap) {
    quests.push({
      id: "satchel",
      title: "A Schedule, Not a Raid",
      body: "Bring the Forty Days map to King Karl at Wet Peck.",
      done: false,
      main: true,
    });
  } else if (!flags.wardenDead) {
    quests.push({
      id: "gate",
      title: "The Gate Is a Suggestion",
      body: flags.spokeGoss
        ? "The Gate Warden is testing Cock Fortress. Correct him."
        : "Carry word to Captain Goss, then deal with the warden at the gate.",
      done: false,
      main: true,
    });
  } else {
    quests.push({
      id: "gate",
      title: "The Western Front",
      body: "The fortress holds for today. Side roads still have work.",
      done: true,
      main: true,
    });
  }
  if (flags.caskAsked || flags.casks > 0) {
    const done = flags.casks >= 3;
    quests.push({
      id: "casks",
      title: "Sleep, Old Turtle",
      body: done
        ? "The casks are smashed. Orin can keep napping."
        : `Smash the poison casks at the shoal. Quietly. ${flags.casks}/3.`,
      done,
      main: false,
    });
  }
  if (flags.chordAsked || flags.stones > 0 || flags.cantorDead) {
    const done = flags.stones >= 2 && flags.cantorDead;
    quests.push({
      id: "chord",
      title: "What Deepwell Saw",
      body: done
        ? "The chord is quiet. The pit is not your problem. Today."
        : `Silence both chord stones and stop the Stone Cantor. Stones ${flags.stones}/2.`,
      done,
      main: false,
    });
  }
  return quests;
}

export function questsFor(save: Save): QuestView[] {
  return OATHS[save.oath].side === "pale" ? paleQuests(save) : peckQuests(save);
}

export function objectiveFor(save: Save): Objective {
  const flags = save.flags;
  if (OATHS[save.oath].side === "pale") {
    if (!greetingCleared(save)) return { x: 0.6, z: 20, label: "Reed line" };
    if (!flags.throatReached) return { x: WARDEN.x, z: WARDEN.z, label: "The gate" };
    return null;
  }
  if (!flags.captainDead) return { x: 0.4, z: -18, label: "Vanguard Captain" };
  if (!flags.spokeBix) return { x: -6.4, z: 34, label: "Bix" };
  if (!save.hasSatchel && !flags.returnedMap) return { x: SATCHEL.x, z: SATCHEL.z, label: "Wells satchel" };
  if (!flags.returnedMap) return { x: -52, z: 49, label: "King Karl" };
  if (!flags.spokeGoss) return { x: 60, z: -82, label: "Captain Goss" };
  if (!flags.wardenDead) return { x: WARDEN.x, z: WARDEN.z, label: "Gate Warden" };
  if (flags.caskAsked && flags.casks < 3) {
    const cask = CASKS.find((item) => !save.smashed.includes(item.id));
    return cask ? { x: cask.x, z: cask.z, label: "Poison cask" } : null;
  }
  if (flags.chordAsked && !(flags.stones >= 2 && flags.cantorDead)) {
    if (flags.stones < 2) {
      const stone = STONES.find((item) => !save.silenced.includes(item.id));
      if (stone) return { x: stone.x, z: stone.z, label: "Chord stone" };
    }
    return { x: 90, z: 28, label: "Stone Cantor" };
  }
  return null;
}
