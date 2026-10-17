export function DeadOverlay({ onRise }: { onRise: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 p-6">
      <div className="panel max-w-md rounded-md p-6 text-center">
        <div className="font-display text-xs tracking-[0.28em] text-blood uppercase">You died</div>
        <h2 className="mt-2 font-display text-3xl text-bone">The marsh took its tithe.</h2>
        <p className="mt-3 text-base text-bone/90">
          Your echoes are still out there. Rise at the last hearth and go collect them. Die again before you do, and the war
          spends the pile.
        </p>
        <button type="button" className="mt-5 h-12 w-full rounded-md bg-gold font-medium text-ink" onClick={onRise}>
          Rise
        </button>
      </div>
    </div>
  );
}
