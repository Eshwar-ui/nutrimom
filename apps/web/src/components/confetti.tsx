"use client";

import { motion } from "framer-motion";

// Brand palette confetti — coral, forest, gold, blush, sky, sage.
const COLORS = ["#ef8377", "#4f7c5a", "#d8a84c", "#f7c6d0", "#cfe8f9", "#a8c3a0"];

/** One-shot celebratory confetti. Render it (client-side) on a success moment. */
export function Confetti({ count = 46 }: { count?: number }) {
  const random = (seed: number) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };
  const pieces = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: random(i + 1) * 100,
        color: COLORS[i % COLORS.length],
        size: 6 + random(i + 2) * 9,
        delay: random(i + 3) * 0.3,
        duration: 1.9 + random(i + 4) * 1.5,
        rotate: (random(i + 5) - 0.5) * 720,
        drift: (random(i + 6) - 0.5) * 170,
        round: random(i + 7) > 0.5,
      }));

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
