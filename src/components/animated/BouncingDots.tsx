export default function BouncingDots() {
  return (
    <div className="flex gap-1 justify-center items-center">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue-400 dark:bg-purple-400"
          style={{
            animation: "bounce 2s infinite",
            animationDelay: `${i * 0.2}s`,
            animationFillMode: "both",
          }}
        />
      ))}
    </div>
  );
}
