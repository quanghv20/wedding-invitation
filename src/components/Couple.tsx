"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import type { WeddingContent } from "@/config/wedding";
import { useWedding } from "./WeddingProvider";
import { Reveal } from "./ui/Reveal";
import { SectionTitle } from "./ui/SectionTitle";
import { TiltCard } from "./ui/TiltCard";

type Person = WeddingContent["groom"];

function PersonCard({ person, from }: { person: Person; from: "left" | "right" }) {
  return (
    <Reveal direction={from} className="flex flex-col items-center text-center">
      <TiltCard className="relative w-[min(78vw,320px)] rounded-t-full">
        {/* viền vòm xoay */}
        <div className="absolute -inset-3 rounded-t-full border border-gold/40" />
        <motion.div
          className="absolute -inset-6 rounded-t-full border border-dashed border-gold/30"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="group relative aspect-[2/3] overflow-hidden rounded-t-full shadow-[0_30px_60px_rgba(110,40,56,0.2)]">
          <Image
            src={person.photo}
            alt={person.fullName}
            fill
            sizes="(max-width: 768px) 80vw, 320px"
            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine/60 via-transparent to-transparent" />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-ivory/90 px-5 py-1.5 font-serif text-xs tracking-[0.3em] text-wine uppercase backdrop-blur pointer-coarse:backdrop-blur-none">
            {person.role}
          </span>
        </div>
      </TiltCard>

      <h3 className="mt-10 font-script text-5xl text-wine md:text-6xl">{person.name}</h3>
      <p className="mt-2 rounded-full bg-blush/60 px-4 py-1 text-sm text-wine">Sinh ngày {person.birthday}</p>
      <p className="mt-4 max-w-sm font-serif text-lg leading-relaxed text-muted italic">{person.bio}</p>
      <div className="mt-6 space-y-1 text-sm text-ink/80">
        <p className="text-[11px] tracking-[0.3em] text-gold uppercase">Con của</p>
        <p>{person.parents.father}</p>
        <p>{person.parents.mother}</p>
      </div>
    </Reveal>
  );
}

export function Couple() {
  const wedding = useWedding();
  return (
    <section id="couple" className="relative overflow-hidden bg-gradient-to-b from-ivory via-blush/30 to-ivory px-4 py-24 md:py-32">
      <SectionTitle
        script="Bride & Groom"
        title="Cô dâu & Chú rể"
        description="Hai con người, hai câu chuyện — và từ hôm nay, một hành trình chung."
      />

      <div className="mx-auto grid max-w-6xl items-start gap-20 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <PersonCard person={wedding.groom} from="left" />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 12, delay: 0.4 }}
          className="flex justify-center md:mt-48"
        >
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-rose to-wine shadow-xl">
            <span className="absolute inset-0 animate-ping rounded-full bg-rose/30" />
            <Heart className="size-9 animate-heartbeat fill-ivory text-ivory" />
          </div>
        </motion.div>

        <PersonCard person={wedding.bride} from="right" />
      </div>
    </section>
  );
}
