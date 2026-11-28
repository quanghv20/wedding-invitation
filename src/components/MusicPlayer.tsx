"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Music, Pause } from "lucide-react";
import { useWedding } from "./WeddingProvider";

// thử phát ở mọi tương tác: chạm/click/phím chắc chắn được; cuộn/vuốt thì tùy trình duyệt có cho phát hay không
const UNLOCK_EVENTS = ["pointerdown", "pointerup", "touchstart", "touchend", "click", "keydown", "scroll", "wheel", "touchmove"];

export function MusicPlayer() {
  const wedding = useWedding();
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  // trình duyệt thường chặn tự phát nhạc: nếu bị chặn thì phát ở lần tương tác đầu tiên
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    let pending = false;
    const stopListening = () => UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, tryPlay));
    const tryPlay = (event?: Event) => {
      // chạm vào nút nhạc thì để toggle xử lý, không thì vừa phát xong lại bị toggle tắt
      if (event?.target instanceof Node && buttonRef.current?.contains(event.target)) return;
      // cuộn bắn sự kiện liên tục: chỉ thử một lần mỗi lúc
      if (pending || !audio.paused) return;
      pending = true;
      audio
        .play()
        .then(() => {
          setPlaying(true);
          stopListening();
        })
        .catch(() => setPlaying(false))
        .finally(() => (pending = false));
    };
    UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    tryPlay();
    return stopListening;
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => setAvailable(false));
    else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={wedding.music} loop preload="none" onError={() => setAvailable(false)} />
      {available && (
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring" }}
          aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
          className="fixed top-4 right-4 z-50 cursor-pointer md:top-6 md:right-6"
        >
          {playing && <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" />}
          <span
            className={`relative flex size-12 items-center justify-center rounded-full bg-[repeating-radial-gradient(circle,#2b2220_0_2px,#3a2e29_2px_4px)] shadow-lg ring-2 ring-gold-light/70 ${
              playing ? "animate-spin-slow" : ""
            }`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-gold-light">
              {playing ? <Music className="size-3 text-wine" /> : <Pause className="size-3 text-wine" />}
            </span>
          </span>
        </motion.button>
      )}
    </>
  );
}
