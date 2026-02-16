"use client";

import Link from "next/link";
import { useState } from "react";
import localFont from "next/font/local";


const NAV = [
  { label: "Examples", href: "#examples" },
  { label: "About", href: "#about" },
  { label: "Creators", href: "#creators" },
  { label: "Pricing", href: "#pricing" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50  backdrop-blur-xl border-b border-[#22B2C1]/30 bg-black">
      <div className="page-container flex items-center justify-between py-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-unbounded font-bold text-lg tracking-wide"
        >
         

          <span className="hover:text-[#22B2C1] transition">
            AnimVox AI
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-white transition relative
              after:absolute after:left-0 after:-bottom-1
              after:h-[2px] after:w-0 after:bg-[#22B2C1]
              hover:after:w-full after:transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-4 ">

          <Link
            href="/login"
            className="hidden sm:block font-unbounded font-medium text-white/70 hover:text-white transition"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="hidden sm:inline-flex px-5 py-2 rounded-full 
            text-black bg-[#22B2C1]
            hover:shadow-[0_0_25px_#22B2C1]
            transition font-unbounded font-medium"
          >
            Get Started
          </Link>

          {/* Mobile Button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden h-10 w-10 rounded-lg
            bg-black border border-white/20
            text-white text-lg"
          >
            ☰
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-black/90 border-t border-[#22B2C1]/30">
          <div className="page-container py-4 space-y-4 text-white/80">

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block hover:text-[#22B2C1]"
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-white/10 pt-4 space-y-3">

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block"
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block text-center py-2 rounded-full
                bg-[#22B2C1] text-black font-semibold"
              >
                Get Started
              </Link>

            </div>

          </div>
        </div>
      )}
    </header>
  );
}
