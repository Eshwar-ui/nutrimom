"use client";

import { motion } from "framer-motion";

/**
 * Playful hover: a springy wobble + pop on hover, and a squash on press.
 * Wrap a CTA (button/link) to give it bounce. Replaces the magnetic pull.
 */
export function Playful({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={{ display: "inline-flex" }}
      whileHover={{ scale: 1.05, rotate: [0, -4, 3, -2, 0] }}
      whileTap={{ scale: 0.93, rotate: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {children}
    </motion.div>
  );
}
