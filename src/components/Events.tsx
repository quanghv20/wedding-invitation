"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CalendarPlus, Clock, MapPin, Navigation } from "lucide-react";
import { locationText, placeText, type WeddingEvent } from "@/config/wedding";
import { dateParts, formatTime, googleCalendarUrl, mapsEmbedUrl, mapsUrl, weekdayName } from "@/lib/format";
import { useEventPlaces, usePlaces, useWedding } from "./WeddingProvider";
import { Reveal } from "./ui/Reveal";
import { SectionTitle } from "./ui/SectionTitle";
import { TiltCard } from "./ui/TiltCard";

function EventCard({ event, index }: { event: WeddingEvent; index: number }) {
  const wedding = useWedding();
  const places = useEventPlaces(event);
  const single = places.length === 1;
  const d = dateParts(event.start);
  const calendarUrl = googleCalendarUrl({
    title: `${event.title} — ${wedding.groom.name} & ${wedding.bride.name}`,
    start: event.start,
    end: event.end,
    location: locationText(places),
  });

  return (
    <Reveal delay={index * 0.15} className="h-full">
      <TiltCard max={6} className="h-full rounded-[2rem]">
        <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-gold/20 bg-white/95 shadow-[0_25px_60px_rgba(110,40,56,0.12)]">
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform duration-[1.2s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute top-4 left-4 rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-medium tracking-wider text-wine uppercase">
              {event.side}
            </span>
            <h3 className="absolute bottom-4 left-6 font-script text-4xl text-ivory md:text-5xl">{event.title}</h3>
          </div>

          <div className="flex flex-1 flex-col p-6 md:p-7">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-wine to-rose px-4 py-2 text-ivory shadow-md">
                <span className="font-serif text-3xl leading-none font-semibold">{String(d.day).padStart(2, "0")}</span>
                <span className="text-[10px] tracking-widest uppercase">Th {d.month}</span>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Clock className="size-4 text-gold" />
                  {formatTime(event.start)} — {formatTime(event.end)}
                </p>
                <p className="mt-1 font-serif text-lg text-ink">
                  {weekdayName(event.start)}, {d.year}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-gold/15 pt-5 text-sm">
              {places.map((place) => (
                <div key={place.side} className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    {!single && <p className="text-[11px] font-semibold tracking-wider text-gold-dark uppercase">{place.label}</p>}
                    <p className="font-medium text-ink">{place.venue}</p>
                    <p className="mt-1 text-muted">{place.address}</p>
                  </div>
                  {!single && (
                    <a
                      href={mapsUrl(placeText(place))}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Chỉ đường tới ${place.label.toLowerCase()}`}
                      className="h-fit shrink-0 rounded-full border border-wine/30 p-2 text-wine transition hover:border-wine hover:bg-wine/5"
                    >
                      <Navigation className="size-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-auto grid gap-3 pt-6 ${single ? "grid-cols-2" : "grid-cols-1"}`}>
              {single && (
                <a
                  href={mapsUrl(placeText(places[0]))}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-wine px-4 py-2.5 text-xs font-medium text-ivory transition hover:bg-rose hover:shadow-lg"
                >
                  <Navigation className="size-3.5" /> Chỉ đường
                </a>
              )}
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-wine/30 px-4 py-2.5 text-xs font-medium text-wine transition hover:border-wine hover:bg-wine/5"
              >
                <CalendarPlus className="size-3.5" /> Lưu lịch
              </a>
            </div>
          </div>
        </article>
      </TiltCard>
    </Reveal>
  );
}

export function Events() {
  const wedding = useWedding();
  const places = usePlaces();
  return (
    <section id="events" className="relative overflow-hidden bg-gradient-to-b from-ivory via-cream to-ivory px-4 py-24 md:py-32">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="soft-blob-touch pointer-events-none absolute top-1/3 -left-40 size-96 rounded-full bg-blush blur-3xl [--blob:var(--color-blush)]"
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="soft-blob-touch pointer-events-none absolute -right-40 bottom-1/4 size-96 rounded-full bg-champagne blur-3xl [--blob:var(--color-champagne)]"
      />

      <SectionTitle
        script="When & Where"
        title="Sự kiện cưới"
        description="Sự hiện diện của bạn là niềm vinh hạnh lớn nhất của gia đình chúng tôi."
      />

      <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
        {wedding.events.map((event, i) => (
          <EventCard key={event.title} event={event} index={i} />
        ))}
      </div>

      <Reveal direction="zoom" className={`relative mx-auto mt-16 grid max-w-6xl gap-8 ${places.length > 1 ? "md:grid-cols-2" : ""}`}>
        {places.map((place) => (
          <figure key={place.side}>
            {places.length > 1 && (
              <figcaption className="mb-3 text-center font-serif text-lg text-wine">
                {place.label} · <span className="text-ink/70">{place.venue}</span>
              </figcaption>
            )}
            <div className="overflow-hidden rounded-[2rem] border-8 border-white shadow-[0_25px_60px_rgba(58,46,41,0.15)]">
              <iframe
                title={`Bản đồ ${place.label.toLowerCase()}`}
                src={mapsEmbedUrl(placeText(place))}
                className="h-80 w-full grayscale-[40%] transition duration-700 hover:grayscale-0 md:h-[420px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </figure>
        ))}
      </Reveal>
    </section>
  );
}
