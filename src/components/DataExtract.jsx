import { useEffect, useRef } from "react";

const TAGS = [
  "X", "Y", "Z", "ID", "T+", "GAZE", "PULSE", "HEAD", "POSE", "BPM",
  "EYE.L", "EYE.R", "JAW", "PALM", "GAIT", "HAND", "FACE", "VEC",
  "BIO", "META", "SCAN", "TICK", "FRAME", "TRACE",
];

const LABELS = [
  "Presència activa",
  "Estat físic aparent",
  "Activitat corporal",
  "Moviment",
  "Densitat cap.",
  "Cos detectat",
  "Identitat pendent",
  "Gest registrat",
  "Mirada activa",
  "Postura",
  "Freqüència",
  "Vector trajectòria",
];

const BRACKET_W = 26;
const BRACKET_H = 22;

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
    const brackets = [];
    let lastBracket = 0;

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

    const spawnBracket = () => {
      brackets.push({
        x: Math.random() * (width - BRACKET_W * 4) + BRACKET_W * 2,
        y: Math.random() * (height - BRACKET_H * 3) + BRACKET_H * 1.5,
        w: BRACKET_W * (1 + Math.random() * 0.6),
        h: BRACKET_H * (1 + Math.random() * 0.4),
        label: LABELS[Math.floor(Math.random() * LABELS.length)],
        born: performance.now(),
        ttl: 1800 + Math.random() * 1400,
      });
      if (brackets.length > 16) brackets.shift();
    };

    const drawBracket = (b, now) => {
      const age = now - b.born;
      const t = age / b.ttl;
      if (t >= 1) return false;
      let alpha;
      if (t < 0.12) alpha = t / 0.12;
      else if (t > 0.78) alpha = (1 - t) / 0.22;
      else alpha = 1;
      alpha *= 0.7;

      const x = b.x;
      const y = b.y;
      const w = b.w;
      const h = b.h;
      const corner = 5;
      ctx.strokeStyle = `rgba(255, 220, 0, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
      ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner);
      ctx.moveTo(x + w, y + h - corner); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - corner, y + h);
      ctx.moveTo(x + corner, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - corner);
      ctx.stroke();

      ctx.font = '9px "Space Mono", monospace';
      ctx.fillStyle = `rgba(255, 220, 0, ${alpha.toFixed(3)})`;
      ctx.fillText(b.label, x + w + 4, y + h - 2);
      return true;
    };

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      ctx.clearRect(0, 0, width, height);

      // ── marcs de detecció amb etiquetes ──
      if (now - lastBracket > 220) {
        spawnBracket();
        lastBracket = now;
      }
      for (let i = brackets.length - 1; i >= 0; i -= 1) {
        const alive = drawBracket(brackets[i], now);
        if (!alive) brackets.splice(i, 1);
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
