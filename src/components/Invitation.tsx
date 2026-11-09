"use client";

import { Hero } from "./Hero";
import { Countdown } from "./Countdown";
import { Couple } from "./Couple";
import { LoveStory } from "./LoveStory";
import { Events } from "./Events";
import { Gallery } from "./Gallery";
import { Rsvp } from "./Rsvp";
import { Wishes } from "./Wishes";
import { Gift } from "./Gift";
import { Footer } from "./Footer";
import { MusicPlayer } from "./MusicPlayer";
import { Navigation, ScrollProgress } from "./Navigation";
import { SmoothScroll } from "./SmoothScroll";
import { DeferredEffects } from "./effects/DeferredEffects";

export function Invitation() {
  return (
    <>
      <SmoothScroll />

      <MusicPlayer />

      <ScrollProgress />
      <Navigation />
      <DeferredEffects />

      <main>
        <Hero />
        <Countdown />
        <Couple />
        <LoveStory />
        <Events />
        <Gallery />
        <Rsvp />
        <Wishes />
        <Gift />
        <Footer />
      </main>
    </>
  );
}
