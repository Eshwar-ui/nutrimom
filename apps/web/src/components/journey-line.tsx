"use client";

import { motion } from "framer-motion";

/**
 * A hand-drawn, dashed route connecting the "how it works" steps — draws
 * itself in as the section scrolls into view, instead of a static straight
 * line. Desktop only (mirrors the row-based step layout above it).
 */
export function JourneyLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 90"
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-[10%] right-[10%] top-7 hidden h-[70px] w-[80%] md:block"
    >
      <motion.path
        d="M0,22 C250,22 250,64 500,64 C750,64 750,22 1000,22"
        fill="none"
        stroke="var(--border)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="1 12"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
