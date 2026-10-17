# War of Fate

A third-person action RPG of Act I, Day 1 on the Reed Causeway. You swear a Glass Oath, hold or probe the causeway, and spend echoes at a hearth. This is the readable source for the prototype that was live at [wofrpg.grok.me](https://wofrpg.grok.me).

## Run it locally

```bash
npm install
npm run dev
```

Vite serves the game at `http://localhost:5173/`. The production base path (`/rpg-war-of-fate/`) is applied only by `npm run build`.

```bash
npm test
npm run build
npm run preview
```

Saves live in `localStorage` under `wof-oath-save-v1`, one slot. **Continue** loads it. **Start**, when a save already exists, asks before it overwrites that slot.

## Play

| Input | Action |
| --- | --- |
| WASD or the stick | Move |
| Click, J, or Strike | Light attack |
| F, a held mouse click, or the Heavy button | Heavy attack |
| Space or Dodge | Roll |
| Q or Oath | Oath skill |
| C or Crouch | Crouch in the reeds |
| Tab or Lock | Lock on |
| R or Drink | Marsh draught |
| E or Use | Talk, take, rest |
| Right-drag, Z/X, or a drag on empty screen | Look |
| Esc | Pause. The fight waits. |

On a coarse pointer, or a window under 900px, the stick and buttons appear. A long press on the touch screen turns the camera. It does not swing.

## GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`, which builds with base `/rpg-war-of-fate/` and deploys the `dist` folder.

The site will be at:

`https://grandjiraiya.github.io/rpg-war-of-fate/`

In the repository settings, open **Pages** and set the source to **GitHub Actions**. The workflow cannot flip that switch by itself. After the first green deploy, that URL serves the game.

## Layout

Game content (oaths, weapons, cloaks, enemies, spawns, dialogue, quests, cards, the world map) lives in `src/data/`. The simulation, world mesh, and rules live in `src/game/`. React menus live in `src/ui/`.
