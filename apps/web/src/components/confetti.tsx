"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Brand palette confetti — coral, forest, gold, blush, sky, sage.
const COLORS = ["#ef8377", "#4f7c5a", "#d8a84c", "#f7c6d0", "#cfe8f9", "#a8c3a0"];

/** One-shot celebratory confetti. Render it (client-side) on a success moment. */
export function Confetti({ count = 46 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 9,
        delay: Math.random() * 0.3,
        duration: 1.9 + Math.random() * 1.5,
        rotate: (Math.random() - 0.5) * 720,
        drift: (Math.random() - 0.5) * 170,
        round: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? 999 : 3,
          }}
          initial={{ y: "-12vh", x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "112vh", x: p.drift, opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
