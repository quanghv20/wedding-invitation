"use client";

import { motion } from "motion/react";
import { Ornament } from "./Ornament";

type Props = {
  script: string;
  title: string;
  description?: string;
  light?: boolean;
};

export function SectionTitle({ script, title, description, light = false }: Props) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={`font-script text-4xl md:text-5xl ${light ? "text-gold-light" : "text-rose"}`}
      >
        {script}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, letterSpacing: "0.35em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.12em" }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={`mt-2 font-serif text-2xl font-semibold uppercase md:text-4xl ${
          light ? "text-ivory" : "text-ink"
        }`}
      >
        {title}
      </motion.h2>
      <div className="mt-5 flex justify-center">
        <Ornament />
      </div>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className={`mt-5 font-serif text-lg italic leading-relaxed md:text-xl ${
            light ? "text-ivory/80" : "text-muted"
          }`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
