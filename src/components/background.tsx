// Декоративный кибер-фон: сетка + мягкие радиальные свечения акцента.
// Чисто презентационный слой, aria-hidden.
export function CyberBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="absolute inset-0 cyber-grid opacity-40" />
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background" />
    </div>
  );
}
