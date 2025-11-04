// src/components/habits/ButtonConfetti.jsx
import React, { useEffect, useRef } from "react";

export default function ButtonConfetti({ trigger }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = (canvas.width = 150);
    const H = (canvas.height = 150);

    const parts = Array.from({ length: 25 }, () => ({
      x: W / 2,
      y: H / 2,
      r: Math.random() * 2 + 1.5,
      a: Math.random() * Math.PI * 2,
      v: Math.random() * 4 + 1,
      hue: Math.random() * 360,
      alpha: 1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += Math.cos(p.a) * p.v;
        p.y += Math.sin(p.a) * p.v;
        p.v *= 0.97;
        p.alpha -= 0.03;
      });
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].alpha <= 0) parts.splice(i, 1);
      }
      if (parts.length > 0) raf = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 150, height: 150 }}
    />
  );
}