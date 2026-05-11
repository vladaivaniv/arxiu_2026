import { useEffect, useRef } from "react";

const PALETTE = [
  [255, 220, 60],
  [255, 200, 30],
  [255, 235, 100],
  [240, 180, 0],
  [255, 215, 70],
];

const lerpColor = (now) => {
  const cycle = 6500;
  const t = (now % (cycle * PALETTE.length)) / cycle;
  const i = Math.floor(t) % PALETTE.length;
  const j = (i + 1) % PALETTE.length;
  const f = t - Math.floor(t);
  const a = PALETTE[i];
  const b = PALETTE[j];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
};

export default function EmotionLight() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    const startedAt = performance.now();
    let prevX = 0;
    let prevY = 0;
    let angle = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let active = false;

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
      targetX = (e.clientX - rect.left) * sx;
      targetY = (e.clientY - rect.top) * sy;
      if (x === 0 && y === 0) {
        x = targetX;
        y = targetY;
        prevX = x;
        prevY = y;
      }
      active = true;
    };

    document.addEventListener("mousemove", onMove);

    let prevT = performance.now();
    const tick = (now) => {
      const dt = Math.min(48, now - prevT);
      prevT = now;
      const t = (now - startedAt) * 0.001;

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, width, height);

      // Trajectòria autònoma quan encara no hi ha hagut cursor
      const autoX = width * 0.5 + Math.sin(t * 0.22) * width * 0.32 + Math.sin(t * 0.07) * width * 0.06;
      const autoY = height * 0.5 + Math.cos(t * 0.18) * height * 0.28 + Math.cos(t * 0.05) * height * 0.06;

      const hasTarget = targetX !== 0 || targetY !== 0;
      const aimX = hasTarget ? targetX : autoX;
      const aimY = hasTarget ? targetY : autoY;
      if (x === 0 && y === 0) {
        x = aimX;
        y = aimY;
      }
      x += (aimX - x) * Math.min(1, dt * 0.0018);
      y += (aimY - y) * Math.min(1, dt * 0.0018);
      const cx = x;
      const cy = y;

      const dx = cx - prevX;
      const dy = cy - prevY;
      if (Math.hypot(dx, dy) > 0.1) angle = Math.atan2(dy, dx);
      prevX = cx;
      prevY = cy;

      const lifecycle = 1;

      const breathe = 0.5 + 0.5 * Math.sin(t * 0.7);
      const len = 38 + 10 * breathe;
      const wid = 14 + 4 * breathe;
      const [cr, cg, cb] = lerpColor(now);

      ctx.globalCompositeOperation = "lighter";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const haloAlpha = 0.05 * lifecycle;
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
      halo.addColorStop(0, `rgba(${cr},${cg},${cb},${haloAlpha.toFixed(3)})`);
      halo.addColorStop(0.5, `rgba(${cr},${cg},${cb},${(haloAlpha * 0.35).toFixed(3)})`);
      halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
      ctx.fill();

      const coreAlpha = 0.9 * lifecycle;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, wid * 0.8);
      core.addColorStop(0, `rgba(255, 250, 200, ${coreAlpha.toFixed(3)})`);
      core.addColorStop(0.5, `rgba(${cr},${cg},${cb},${(coreAlpha * 0.55).toFixed(3)})`);
      core.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(0, 0, wid * 1.1, wid * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="emotion-light-canvas" aria-hidden="true" />;
}
