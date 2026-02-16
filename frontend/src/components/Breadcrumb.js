// src/components/Breadcrumb.js
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/providers/LanguageProvider";
import en from "@/app/content/en";
import ar from "@/app/content/ar";

export default function Breadcrumb() {
  const { lang } = useLanguage();
  const t = lang === "ar" ? ar : en;

  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Hide breadcrumb on homepage
  if (segments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-[#ffffff] border-b border-[#a0ac98]/40 text-sm px-6 py-3 backdrop-blur-sm mt-16"
    >
      <div className="relative max-w-7xl mx-auto flex items-center gap-2 z-10">
        {/* Home link */}
        <Link
          href="/"
          className="font-medium text-[#566048] hover:text-[#000000] transition-colors duration-200"
        >
          {t.nav.home}
        </Link>

        {segments.map((segment, idx) => {
          const href = "/" + segments.slice(0, idx + 1).join("/");
          const isLast = idx === segments.length - 1;

          // Get translated label if available
          const label =
            t.nav[segment.toLowerCase()] || segment.replace(/-/g, " ");

          return (
            <motion.div
              key={href}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * (idx + 1), duration: 0.25 }}
            >
              <span className="text-[#a0ac98]">{">"}</span>
              {isLast ? (
                <span className="capitalize text-[#566048] font-semibold">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="capitalize text-[#566048] hover:text-[#000000] transition-colors duration-200"
                >
                  {label}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
