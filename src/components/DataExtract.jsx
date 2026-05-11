import { useEffect, useRef } from "react";

const TAGS = [
  "X", "Y", "Z", "ID", "T+", "GAZE", "PULSE", "HEAD", "POSE", "BPM",
  "EYE.L", "EYE.R", "JAW", "PALM", "GAIT", "HAND", "FACE", "VEC",
  "BIO", "META", "SCAN", "TICK", "FRAME", "TRACE",
];

const randomBinary = (len) => {
  let s = "";
  for (let i = 0; i < len; i += 1) s += Math.random() < 0.5 ? "0" : "1";
  return s;
};

const randomValue = () => {
  const types = [
    () => `${(Math.random() * 999).toFixed(2)}`,
    () => `0x${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0").toUpperCase()}`,
    () => randomBinary(6),
    () => `${Math.floor(Math.random() * 90 + 10)}%`,
    () => `Δ${(Math.random() * 2 - 1).toFixed(3)}`,
  ];
  return types[Math.floor(Math.random() * types.length)]();
};

export default function DataExtract() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let mx = -9999;
    let my = -9999;
    let lastEmit = 0;
    let lastMx = -1;
    let lastMy = -1;
    let active = false;
    let prev = performance.now();

    const particles = [];
    const gridDots = [];

    const buildGrid = () => {
      gridDots.length = 0;
      const step = 38;
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          gridDots.push({ x, y, phase: Math.random() * Math.PI * 2 });
        }
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        active = false;
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
      active = true;
    };

    document.addEventListener("mousemove", onMove);

    const spawnParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 8;
      particles.push({
        x: mx + Math.cos(angle) * dist,
        y: my + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (0.3 + Math.random() * 0.5),
        vy: Math.sin(angle) * (0.3 + Math.random() * 0.5) - 0.4,
        tag: TAGS[Math.floor(Math.random() * TAGS.length)],
        value: randomValue(),
        life: 0,
        ttl: 1400 + Math.random() * 1200,
        size: Math.random() < 0.7 ? "small" : "tag",
      });
      if (particles.length > 80) particles.shift();
    };

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      ctx.clearRect(0, 0, width, height);

      // ── graella de mesura subtil ──
      ctx.fillStyle = "rgba(255, 0, 0, 0.12)";
      for (const g of gridDots) {
        const distSq = (g.x - mx) ** 2 + (g.y - my) ** 2;
        const near = distSq < 110 * 110 && active;
        const pulse = near ? 1 : 0.4;
        const r = (Math.sin(now * 0.001 + g.phase) * 0.3 + 0.7) * pulse;
        ctx.fillRect(g.x - 0.5, g.y - 0.5, 1, 1);
        if (near) {
          ctx.fillStyle = `rgba(255, 0, 0, ${(0.55 * r).toFixed(3)})`;
          ctx.fillRect(g.x - 1, g.y - 1, 2, 2);
          ctx.fillStyle = "rgba(255, 0, 0, 0.12)";
        }
      }

      // ── emissió de partícules quan el cursor està actiu ──
      if (active) {
        const movedDist = Math.hypot(mx - lastMx, my - lastMy);
        if (now - lastEmit > 80 || movedDist > 14) {
          spawnParticle();
          if (movedDist > 14 && Math.random() < 0.4) spawnParticle();
          lastEmit = now;
          lastMx = mx;
          lastMy = my;
        }

        // ── retícula central ──
        const ringR = 22;
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.moveTo(mx - ringR - 6, my);
        ctx.lineTo(mx - ringR, my);
        ctx.moveTo(mx + ringR, my);
        ctx.lineTo(mx + ringR + 6, my);
        ctx.moveTo(mx, my - ringR - 6);
        ctx.lineTo(mx, my - ringR);
        ctx.moveTo(mx, my + ringR);
        ctx.lineTo(mx, my + ringR + 6);
        ctx.stroke();

        // coords compactes
        ctx.font = '8px "Space Mono", monospace';
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillText(
          `${Math.round(mx).toString().padStart(4, "0")}.${Math.round(my).toString().padStart(4, "0")}`,
          mx + ringR + 4,
          my - ringR - 4,
        );
      }

      // ── partícules de dades surten i s'esvaeixen ──
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.ttl) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.life / p.ttl;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vy -= 0.005 * dt / 16; // pujada lleugera (dades s'escapen amunt)

        const alpha = (1 - t) * 0.9;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(3)})`;
        if (p.size === "small") {
          ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
          ctx.font = '7px "Space Mono", monospace';
          ctx.fillStyle = `rgba(255, 0, 0, ${(alpha * 0.65).toFixed(3)})`;
          ctx.fillText(p.value, p.x + 4, p.y + 2);
        } else {
          ctx.font = '8px "Space Mono", monospace';
          ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(3)})`;
          ctx.fillText(`${p.tag}:${p.value}`, p.x, p.y);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="data-extract-canvas" aria-hidden="true" />;
}
