import { useEffect, useRef } from "react";

export default function SaltFall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = [];
    let raf = 0;
    let width = 0;
    let height = 0;
    let emitAccum = 0;
    let mouseInside = false;
    let mx = 0;
    let my = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (x, y) => {
      particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: Math.random() * 0.15 + 0.05,
        r: Math.random() * 1.2 + 0.4,
        life: 0,
        ttl: 4500 + Math.random() * 3000,
        alpha: Math.random() * 0.5 + 0.5,
      });
      if (particles.length > 1200) particles.splice(0, particles.length - 1200);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width ? canvas.clientWidth / rect.width : 1;
      const sy = rect.height ? canvas.clientHeight / rect.height : 1;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
      mouseInside = true;
    };
    const onLeave = () => {
      mouseInside = false;
    };

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    let prev = performance.now();
    const RATE_PER_MS = 0.025; // ~25 partícules/s mentre el ratolí està sobre la card
    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;

      if (mouseInside) {
        emitAccum += dt * RATE_PER_MS;
        while (emitAccum >= 1) {
          spawn(mx, my);
          emitAccum -= 1;
        }
      } else {
        emitAccum = 0;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life > p.ttl || p.y > height + 4) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += 0.005 * dt;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        const fade = 1 - p.life / p.ttl;
        ctx.fillStyle = `rgba(245,245,245,${(p.alpha * fade).toFixed(3)})`;
        ctx.fillRect(p.x, p.y, p.r, p.r);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="salt-fall-canvas" aria-hidden="true" />;
}
