"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type Direction = "up" | "down" | "left" | "right" | "zoom";

const offsets: Record<Direction, Record<string, number>> = {
  up: { y: 50 },
  down: { y: -50 },
  left: { x: -70 },
  right: { x: 70 },
  zoom: { scale: 0.85 },
};

type RevealProps = HTMLMotionProps<"div"> & {
  direction?: Direction;
  delay?: number;
  duration?: number;
};

export function Reveal({
  direction = "up",
  delay = 0,
  duration = 0.9,
  children,
  className = "",
  ...props
}: RevealProps) {
  return (
    <motion.div
      className={`no-blur-touch ${className}`}
      initial={{ opacity: 0, filter: "blur(6px)", ...offsets[direction] }}
      whileInView={{
        opacity: 1,
        filter: "blur(0px)",
        x: 0,
        y: 0,
        scale: 1,
        // Gỡ filter sau khi hiện xong để chữ không bị rasterize nhòe
        transitionEnd: { filter: "none" },
      }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
