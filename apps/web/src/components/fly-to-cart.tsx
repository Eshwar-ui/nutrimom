"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { FlyDetail } from "@/lib/fly-to-cart";

interface Flight extends FlyDetail {
  id: number;
  to: { x: number; y: number };
}

export function FlyToCart() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<FlyDetail>).detail;
      const target = document.querySelector("[data-fly-cart-target]");
      if (!target) return; // no cart icon (e.g. signed out) — skip the animation
      const t = target.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setFlights((f) => [
        ...f,
        { ...detail, id, to: { x: t.left + t.width / 2, y: t.top + t.height / 2 } },
      ]);
      window.setTimeout(
        () => setFlights((f) => f.filter((x) => x.id !== id)),
        750,
      );
    };
    window.addEventListener("fly-to-cart", onFly);
    return () => window.removeEventListener("fly-to-cart", onFly);
  }, []);

  if (!ready) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            initial={{
              x: f.from.left,
              y: f.from.top,
              width: f.from.width,
              height: f.from.height,
              opacity: 1,
              borderRadius: 20,
              rotate: 0,
            }}
            animate={{
              x: f.to.x - 18,
              y: f.to.y - 18,
              width: 36,
              height: 36,
              opacity: 0.25,
              borderRadius: 999,
              rotate: 24,
            }}
            transition={{ duration: 0.72, ease: [0.5, -0.2, 0.7, 1] }}
            className="absolute left-0 top-0 grid place-items-center overflow-hidden bg-primary text-primary-foreground shadow-lg ring-2 ring-background"
          >
            {f.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
