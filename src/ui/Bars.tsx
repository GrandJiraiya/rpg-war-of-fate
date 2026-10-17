export function Bar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "blood" | "gold" | "bone";
}) {
  const width = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const fill = tone === "blood" ? "bg-blood" : tone === "gold" ? "bg-gold" : "bg-bone";
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-reed">
      <div className={`h-full ${fill}`} style={{ width: `${width}%` }} />
    </div>
  );
}
