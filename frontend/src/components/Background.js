"use client";

export default function Background({ children, className = "" }) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Dark base gradient (AnimVox vibe) */}
      <div
        className="pointer-events-none fixed inset-0 z-[-3]"
        style={{
          background:
            "linear-gradient(180deg, #061e1f 0%, #0a2f30 45%, #041414 100%)",
        }}
      />

      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-[-2] bg-grid-dark opacity-[0.18] animate-grid-glow" />

      {/* Glow accents */}
      <div className="pointer-events-none fixed inset-0 z-[-1]">
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-(--accent-primary) opacity-[0.20] blur-[150px]" />
        <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-(--accent-secondary) opacity-[0.18] blur-[170px]" />
        <div className="absolute top-[30%] left-[-220px] h-[520px] w-[520px] rounded-full bg-(--accent-primary) opacity-[0.10] blur-[190px]" />
      </div>

      {/* Vignette + noise */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-vignette opacity-70" />
      <div className="pointer-events-none fixed inset-0 z-1 bg-noise" />

      {children}
    </div>
  );
}
