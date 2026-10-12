"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Fade + rise on scroll-into-view — the app's baseline micro-interaction.
 * Skips the motion (renders in its final state immediately) when the user
 * has requested reduced motion at the OS level; CSS animations elsewhere
 * already respect that, but framer-motion needs an explicit opt-out.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
