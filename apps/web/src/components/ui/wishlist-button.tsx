"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const burstHearts = [
  { x: -22, y: -30, r: -28, delay: 0 },
  { x: -11, y: -44, r: 18, delay: 0.02 },
  { x: 4, y: -36, r: -12, delay: 0.01 },
  { x: 20, y: -28, r: 32, delay: 0.04 },
  { x: -18, y: -20, r: -42, delay: 0.03 },
  { x: 14, y: -47, r: 24, delay: 0.05 },
];

export function WishlistButton({
  wished,
  onToggle,
  className,
  size = 18,
}: {
  wished: boolean;
  onToggle: () => void;
  className?: string;
  size?: number;
}) {
  const [burst, setBurst] = useState(0);

  const handle = () => {
    if (!wished) setBurst((b) => b + 1); // puff hearts only when saving
    onToggle();
  };

  return (
    <button
      onClick={handle}
      aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={wished}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur-sm transition-transform hover:scale-110 active:scale-90",
        className,
      )}
    >
      <motion.span
        animate={
          wished
            ? { scale: [1, 1.45, 0.85, 1.12, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Heart
          style={{ width: size, height: size }}
          className={cn(
            "transition-colors",
            wished ? "fill-accent text-accent" : "text-foreground",
          )}
        />
      </motion.span>

      {burst > 0 && (
        <span
          key={burst}
          className="pointer-events-none absolute inset-0 grid place-items-center"
        >
          {burstHearts.map((p, i) => (
            <motion.span
              key={i}
              className="absolute text-accent"
              initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1, x: p.x, y: p.y, rotate: p.r }}
              transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
            >
              <Heart className="h-3 w-3 fill-accent" />
            </motion.span>
          ))}
        </span>
      )}
    </button>
  );
}
