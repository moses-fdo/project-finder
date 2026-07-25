// Pre-compute random particle positions so they don't change on re-render
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  width:  Math.random() * 30 + 10,
  height: Math.random() * 30 + 10,
  top:    Math.random() * 100,
  left:   Math.random() * 100,
  duration: 20 + i * 2,
  delay: i * 0.5,
}));

export default function SciFiGradient() {
  return (
    <div className="absolute inset-0 isolate overflow-hidden pointer-events-none">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/20 dark:from-purple-900/20 dark:via-indigo-900/10 dark:to-blue-900/15" />

      {/* Neon grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-bg"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1)"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(139, 92, 246, 0.08)"
              strokeWidth="1"
            />
            <path
              d="M 20 0 L 0 20 20 20"
              fill="none"
              stroke="rgba(59, 130, 246, 0.06)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-bg)" />
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 blur-sm opacity-30"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              top: `${p.top}%`,
              left: `${p.left}%`,
              animation: `float ${p.duration}s infinite ease-in-out`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Radial highlights */}
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)",
        zIndex: 1,
      }} />

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: reveal 1s ease both; }
      `}</style>
    </div>
  );
}
