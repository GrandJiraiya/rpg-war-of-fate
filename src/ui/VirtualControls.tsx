import { useRef, useState } from "react";
import type { Action } from "../game/Game";

type Origin = { id: number; ox: number; oy: number };

function TouchButton({
  label,
  primary,
  onTap,
}: {
  label: string;
  primary?: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      className={`h-14 w-14 rounded-full text-xs ${
        primary ? "bg-gold text-ink" : "border border-bone/40 bg-ink/80 text-bone"
      }`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onTap();
      }}
    >
      {label}
    </button>
  );
}

export function VirtualControls({
  onStick,
  onTap,
}: {
  onStick: (x: number, y: number) => void;
  onTap: (action: Action) => void;
}) {
  const origin = useRef<Origin | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function move(x: number, y: number) {
    setKnob({ x, y });
    onStick(x, y);
  }

  return (
    <div className="pointer-events-none absolute inset-0 safe-b">
      <div
        className="pointer-events-auto absolute bottom-4 left-4 h-28 w-28 rounded-full border border-gold/40 bg-ink/50"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const box = event.currentTarget.getBoundingClientRect();
          origin.current = { id: event.pointerId, ox: box.left + box.width / 2, oy: box.top + box.height / 2 };
        }}
        onPointerMove={(event) => {
          const held = origin.current;
          if (!held || held.id !== event.pointerId) return;
          let x = (event.clientX - held.ox) / 48;
          let y = (held.oy - event.clientY) / 48;
          const mag = Math.hypot(x, y);
          if (mag > 1) {
            x /= mag;
            y /= mag;
          }
          move(x, y);
        }}
        onPointerUp={(event) => {
          if (origin.current?.id === event.pointerId) {
            origin.current = null;
            move(0, 0);
          }
        }}
        onPointerCancel={() => {
          origin.current = null;
          move(0, 0);
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full bg-gold/80"
          style={{ transform: `translate(calc(-50% + ${knob.x * 36}px), calc(-50% + ${-knob.y * 36}px))` }}
        />
      </div>
      <div className="pointer-events-auto absolute right-3 bottom-4 grid grid-cols-3 gap-2">
        <span />
        <TouchButton label="Heavy" onTap={() => onTap("heavy")} />
        <TouchButton label="Oath" onTap={() => onTap("skill")} />
        <TouchButton label="Dodge" onTap={() => onTap("dodge")} />
        <TouchButton label="Strike" primary onTap={() => onTap("attack")} />
        <TouchButton label="Use" onTap={() => onTap("interact")} />
        <TouchButton label="Lock" onTap={() => onTap("lock")} />
        <TouchButton label="Drink" onTap={() => onTap("flask")} />
        <TouchButton label="Crouch" onTap={() => onTap("crouch")} />
      </div>
    </div>
  );
}
