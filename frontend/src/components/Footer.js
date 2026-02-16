"use client";

import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#16727f]/40 font-unbounded bg-black">

      {/* Removed Ambient Glow */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-3 items-center">

        {/* Brand */}
        <div className="text-center md:text-left space-y-3">
          <h3 className="text-xl font-bold text-[#1ba8b1] tracking-tighter uppercase">
            AnimVox
          </h3>
          <p className="text-[#16727f] text-xs font-light leading-relaxed max-w-xs mx-auto md:mx-0">
            Generate cinematic videos, expressive voices, and immersive 3D
            content using AI.
          </p>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-6 text-[11px] font-medium uppercase tracking-widest">
          <Link
            href="/pricing"
            className="text-[#16727f] hover:text-[#1ba8b1] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-[#16727f] hover:text-[#1ba8b1] transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-[#16727f] hover:text-[#1ba8b1] transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center md:justify-end gap-6 text-[#1ba8b1]">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 hover:text-white transition-all duration-200"
          >
            <FaTwitter size={20} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 hover:text-white transition-all duration-200"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 hover:text-white transition-all duration-200"
          >
            <FaLinkedin size={20} />
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#16727f]/30 py-4 text-center text-[10px] font-light text-[#16727f] tracking-widest uppercase">
        © 2026 AnimVox AI. All rights reserved.
      </div>
    </footer>
  );
}
