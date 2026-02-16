"use client";

export default function ModelHero() {
  return (
    <section className="relative z-10 flex flex-col items-center px-6">
      <p className="mb-6 text-sm text-gray-400 tracking-wide">
        Our state-of-the-art video generation model
      </p>

      <div className="relative w-full max-w-6xl rounded-xl overflow-hidden border border-white/10 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-auto object-cover"
        >
          <source src="/videos/demo.mp4" type="video/mp4" />
          <source src="/videos/demo.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>
    </section>
  );
}