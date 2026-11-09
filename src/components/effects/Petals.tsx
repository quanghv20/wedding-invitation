"use client";

import { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  spin: number;
  sway: number;
  swaySpeed: number;
  color: string;
  opacity: number;
};

const COLORS = ["#f4c7cc", "#f8dade", "#eab3ba", "#f6e3d3", "#e9c9a8"];

/** Cánh hoa rơi nhẹ nhàng — vẽ bằng canvas để mượt trên mobile */
export function Petals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);

    const create = (initial: boolean): Petal => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20,
      size: 7 + Math.random() * 9,
      speedY: 0.5 + Math.random() * 1.1,
      speedX: -0.3 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.55 + Math.random() * 0.4,
    });

    let petals: Petal[] = [];

    const resize = () => {
      // Trên điện thoại, thanh địa chỉ co giãn khi cuộn cũng bắn "resize":
      // bỏ qua để canvas không bị tạo lại và cánh hoa không nhảy vị trí
      if (touch && width && window.innerWidth === width) return;
      width = window.innerWidth;
      // chừa sẵn phần thanh địa chỉ sẽ thu lại
      height = window.innerHeight + (touch ? 120 : 0);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 768 ? 18 : 34;
      petals = Array.from({ length: count }, () => create(true));
    };

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(1, Math.abs(Math.sin(p.angle * 1.5)) * 0.5 + 0.5);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.7, p.size * 0.6, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.6, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.sway += p.swaySpeed;
        p.x += p.speedX + Math.sin(p.sway) * 0.6;
        p.y += p.speedY;
        p.angle += p.spin;
        if (p.y > height + 20 || p.x < -30 || p.x > width + 30) Object.assign(p, create(false));
        drawPetal(p);
      }
      frame = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden />;
}
