export default function BouncingDots() {
  return (
    <div className="flex gap-1 justify-center items-center">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
