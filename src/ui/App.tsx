import { useEffect, useRef, useState } from "react";
import { loadSave } from "../game/rules";
import { Game } from "../game/Game";
import { useGame } from "../game/store";
import type { OathId } from "../types";
import { CardsViewer } from "./CardsViewer";
import { DeadOverlay } from "./DeadOverlay";
import { DialogueOverlay } from "./DialogueOverlay";
import { Hud } from "./Hud";
import { PauseMenu, type PauseTab } from "./PauseMenu";
import { RestMenu } from "./RestMenu";
import { TitleScreen } from "./TitleScreen";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const screen = useGame((view) => view.screen);
  const hud = useGame((view) => view.hud);
  const beat = useGame((view) => view.beat);
  const shrineName = useGame((view) => view.shrineName);
  const saveTick = useGame((view) => view.saveTick);
  const booted = useGame((view) => view.booted);
  const [gallery, setGallery] = useState<"cards" | "intro" | null>(null);
  const [tab, setTab] = useState<PauseTab>("oath");
  const [touch, setTouch] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(!!loadSave());
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(media.matches || window.innerWidth < 900);
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas);
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const save = booted ? (gameRef.current?.snapshot() ?? null) : null;
  void saveTick;

  function start(oath: OathId, name: string) {
    gameRef.current?.startNew(oath, name);
    setHasSave(true);
  }

  return (
    <main className="relative h-dvh w-full select-none overflow-hidden bg-ink text-bone">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      {screen === "play" && (
        <Hud
          hud={hud}
          touch={touch}
          onPause={() => gameRef.current?.tap("pause")}
          onMap={() => {
            setTab("map");
            gameRef.current?.tap("pause");
          }}
          onStick={(x, y) => gameRef.current?.setStick(x, y)}
          onTap={(action) => gameRef.current?.tap(action)}
        />
      )}
      {screen === "title" && (
        <TitleScreen
          booted={booted}
          hasSave={hasSave}
          onStart={start}
          onContinue={() => gameRef.current?.continue()}
          onCards={() => setGallery("cards")}
          onIntro={() => setGallery("intro")}
        />
      )}
      {gallery && <CardsViewer kind={gallery} onClose={() => setGallery(null)} />}
      {screen === "talk" && beat && (
        <DialogueOverlay beat={beat} onChoose={(id) => gameRef.current?.choose(id)} />
      )}
      {screen === "dead" && <DeadOverlay onRise={() => gameRef.current?.respawn()} />}
      {screen === "rest" && save && (
        <RestMenu
          save={save}
          shrineName={shrineName}
          onLevel={(key) => gameRef.current?.level(key)}
          onRest={() => gameRef.current?.rest()}
          onTravel={(id) => gameRef.current?.travel(id)}
          onClose={() => gameRef.current?.resume()}
        />
      )}
      {screen === "pause" && save && (
        <PauseMenu
          save={save}
          tab={tab}
          onTab={setTab}
          onResume={() => gameRef.current?.resume()}
          onEquip={(id) => gameRef.current?.equip(id)}
          onShake={(on) => gameRef.current?.setShake(on)}
          onVolume={(volume) => gameRef.current?.setVolume(volume)}
        />
      )}
    </main>
  );
}
