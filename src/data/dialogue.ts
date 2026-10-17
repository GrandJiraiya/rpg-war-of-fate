import { OATHS } from "./oaths";
import type { DialogueBeat, OathId, Save } from "../types";

const leave = (speaker: string, text: string): DialogueBeat => ({
  speaker,
  text,
  options: [{ id: "close", label: "Leave" }],
});

function paleLine(npcId: string): DialogueBeat {
  switch (npcId) {
    case "bix":
      return leave(
        "Bix",
        "You came dressed like the tax. The reed line is mine. Stay on your side of the gap, and tell your captain the marsh already wrote him down.",
      );
    case "karl":
      return leave(
        "King Karl",
        "Pale Dawn. I told the ledger this misery would last forty days. I did not invite the tax to my fire. The causeway was a greeting. It was not a door.",
      );
    case "tal":
      return leave(
        "Steward Tal",
        "The ledger does not take your ink. If you came for numbers, they are red, and none of them have your name on them.",
      );
    case "nezz":
      return leave(
        "Prince Nezz",
        "You wear the probe's colors. Something in my skull finds that funny. I do not. The gate is not a conversation, and neither is the paper your priests are carrying.",
      );
    case "goss":
      return leave(
        "Captain Goss",
        "If you are the probe, the fortress is not a suggestion. Your warden is already at the gate. Go stand with him, or the wall will write the rest.",
      );
    case "sila":
      return leave(
        "Sila",
        "Deepwell did not send for the western host. The hole collects interest from anyone, and it prefers the uninvited. Don't lean over the lip.",
      );
    default:
      return leave("Stranger", "The marsh has enough voices.");
  }
}

function peckLine(npcId: string, save: Save): DialogueBeat {
  const flags = save.flags;
  if (npcId === "bix") {
    if (flags.captainDead) {
      if (flags.spokeBix) {
        return leave(
          "Bix",
          "Causeway's held. Don't teach the marsh bad habits. No fire in the water, and no heroics with the turtle.",
        );
      }
      return {
        speaker: "Bix",
        text: "First blood to us — if we don't drown. This wasn't a victory. It was a greeting. Karl needs it in a voice he trusts. Wet Peck. Don't decorate the story.",
        options: [{ id: "bix-go", label: "I'll take it to the king." }],
      };
    }
    return leave(
      "Bix",
      "They're dressed like a tax visit. Don't believe the tailoring. Captain's behind the gap, pale banner, expensive helmet. Break him and the rest remember how to walk backwards.",
    );
  }
  if (npcId === "karl") {
    if (!flags.captainDead && !flags.spokeBix) {
      return leave(
        "King Karl",
        "You came inland while the road was still arguing. Bix has the line. Help him, or come back when the causeway has a result.",
      );
    }
    if (!flags.spokeKarl && !save.hasSatchel) {
      return {
        speaker: "King Karl",
        text: "Forty days. That's how long I told the ledger this misery intends to last. Pale Dawn left a satchel on the Crow Road — Wells wax, priest's hands. Bring me the schedule, not a speech.",
        options: [{ id: "karl-ask", label: "I'll bring the satchel." }],
      };
    }
    if (!flags.returnedMap && save.hasSatchel) {
      return {
        speaker: "King Karl",
        text: "You already have it. Of course you do. Let's see how honest the Stone Hills are when the ink thinks nobody important is reading.",
        options: [{ id: "karl-map", label: "Give him the map." }],
      };
    }
    if (flags.returnedMap) {
      if (flags.wardenDead) {
        return leave(
          "King Karl",
          "You made the gate expensive. Indigo will call that prudence. I call it a start. Rest. The turtle is still listening.",
        );
      }
      return leave(
        "King Karl",
        "Goss keeps Nezz from doing anything heroic before supper. Get the schedule to the fortress stair. If a warden is already knocking, charge him for the noise.",
      );
    }
    return leave(
      "King Karl",
      "The camp is east of the north road. Scouts, a priest, paper that thinks it's a god. Steal it if you can. Kill them if you can't.",
    );
  }
  if (npcId === "tal") {
    if (!flags.caskAsked && flags.casks < 3) {
      return {
        speaker: "Steward Tal",
        text: "I don't have space for more red numbers. Someone rolled poison casks toward Orin's shoal. Smash them. Quietly. If you wake the turtle, write smaller and run.",
        options: [
          { id: "tal-take", label: "I'll smash them quietly." },
          { id: "close", label: "The ledger can wait." },
        ],
      };
    }
    if (flags.casks >= 3 && !flags.caskReward) {
      return {
        speaker: "Steward Tal",
        text: "The shoal is only ordinarily cursed again. I hate initiative, but I hate dead kings more. Take the coat. Wet Peck pays in things that don't drown.",
        options: [{ id: "tal-pay", label: "Take the coat." }],
      };
    }
    return leave(
      "Steward Tal",
      flags.casks >= 3
        ? "Day one is already a curse in the margin. Try not to add a second color of ink."
        : "Three casks. No fire in the water. I will know if you get creative.",
    );
  }
  if (npcId === "nezz") {
    return leave(
      "Prince Nezz",
      save.hasSatchel
        ? "Forty days, in a hand that doesn't shake. They're feeding a march, not a raid. Get it to Goss. And if something in your skull offers advice — don't answer. Mine already has a tenant."
        : "Yezmir says the satchel east of here is heavier than paper. He also says a great many unhelpful things. The camp has a priest. Priests are just ledgers that bleed.",
    );
  }
  if (npcId === "goss") {
    if (!flags.spokeGoss && (save.hasSatchel || flags.returnedMap)) {
      return {
        speaker: "Captain Goss",
        text: "Wells wax. I can smell the piety from here. Indigo will hate this, which means it's true. There's a warden at the gate who thinks the fortress is a suggestion. Correct him.",
        options: [{ id: "goss-ok", label: "The gate, then." }],
      };
    }
    if (flags.wardenDead) {
      return leave(
        "Captain Goss",
        "Gate's shut. For today. That's the only kind of forever stone gives you. Nezz will pretend he meant to help. Let him.",
      );
    }
    if (flags.spokeGoss) {
      return leave(
        "Captain Goss",
        "Warden's still at the gate. He telegraphs like a man who expects the wall to be afraid of him. Dodge, then take the pride out of his knees.",
      );
    }
    return leave(
      "Captain Goss",
      "If you're Karl's, say it with evidence. A satchel. A map. Not a feeling. The prince is already out collecting feelings.",
    );
  }
  if (npcId === "sila") {
    if (flags.stones >= 2 && flags.cantorDead && !flags.chordReward) {
      return {
        speaker: "Sila",
        text: "The hum stopped. I can hear my own heart again, which I'm not sure I wanted. Take this and don't lean over the lip. The hole collects interest.",
        options: [{ id: "sila-pay", label: "Take the rim-brand." }],
      };
    }
    if (flags.chordAsked) {
      return leave(
        "Sila",
        "Stones first, cantor second, or the other way if you enjoy being sung at. Just finish it before the chord decides the cliff is optional.",
      );
    }
    return {
      speaker: "Sila",
      text: "They didn't take the pit. They tuned it. Two chord stones on the rim, and a cantor keeping the note. Silence the stones. I'll pretend I didn't see the rest.",
      options: [
        { id: "sila-take", label: "I'll quiet the stones." },
        { id: "close", label: "Not my hole." },
      ],
    };
  }
  return leave("Stranger", "The marsh has enough voices.");
}

export function dialogueFor(npcId: string, save: Save): DialogueBeat {
  if (OATHS[save.oath].side === "pale") return paleLine(npcId);
  return peckLine(npcId, save);
}

function grant(save: Save, itemId: string) {
  if (!save.items.includes(itemId)) save.items.push(itemId);
}

/**
 * Applies a dialogue choice. Pale Dawn never receives Wet Peck orders,
 * so their options cannot advance the causeway quests.
 * Returns the next beat, or "close" when the talk should end.
 */
export function applyChoice(npcId: string, optionId: string, save: Save): DialogueBeat | "close" {
  if (optionId === "close") return "close";
  if (OATHS[save.oath].side === "pale") return "close";
  const flags = save.flags;
  if (optionId === "bix-go") {
    flags.spokeBix = true;
    flags.spokeKarl = false;
    return "close";
  }
  if (optionId === "karl-ask") {
    flags.spokeBix = true;
    flags.spokeKarl = true;
    return "close";
  }
  if (optionId === "karl-map") {
    flags.spokeBix = true;
    flags.spokeKarl = true;
    flags.returnedMap = true;
    save.hasSatchel = false;
    if (!flags.mapReward) {
      flags.mapReward = true;
      save.echoes += 80;
    }
    return leave(
      "King Karl",
      "Forty days. Written like a curse because it is one. Take it to Goss at the fortress stair before Indigo hears a softer version from someone who wants a favor.",
    );
  }
  if (optionId === "tal-take") {
    flags.caskAsked = true;
    return "close";
  }
  if (optionId === "tal-pay") {
    flags.caskReward = true;
    flags.caskAsked = true;
    grant(save, "wetcoat");
    save.echoes += 40;
    return "close";
  }
  if (optionId === "goss-ok") {
    flags.spokeGoss = true;
    return "close";
  }
  if (optionId === "sila-take") {
    flags.chordAsked = true;
    return "close";
  }
  if (optionId === "sila-pay") {
    flags.chordReward = true;
    flags.chordAsked = true;
    grant(save, "rimBrand");
    save.echoes += 70;
    return "close";
  }
  return dialogueFor(npcId, save);
}

export function oathOf(id: OathId) {
  return OATHS[id];
}
