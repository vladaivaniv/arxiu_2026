import { useEffect, useRef } from "react";

export default function SeaWaves() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let start = performance.now();

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

    const ripples = [];
    let lastRippleTime = 0;
    let lastMx = -1;
    let lastMy = -1;

    const addRipple = (x, y) => {
      ripples.push({ x, y, born: performance.now(), maxR: 320 + Math.random() * 120 });
      if (ripples.length > 30) ripples.shift();
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;
      const now = performance.now();
      const dx = mx - lastMx;
      const dy = my - lastMy;
      const dist = Math.hypot(dx, dy);
      if (now - lastRippleTime > 70 && dist > 6) {
        addRipple(mx, my);
        lastRippleTime = now;
        lastMx = mx;
        lastMy = my;
      }
    };

    document.addEventListener("mousemove", onMove);

    const layers = [
      { amp: 22, len: 320, speed: 0.00038, phase: 0,    offsetY: 0.78, alpha: 0.10, line: 0.18 },
      { amp: 16, len: 240, speed: 0.00055, phase: 1.7,  offsetY: 0.84, alpha: 0.12, line: 0.22 },
      { amp: 11, len: 180, speed: 0.00075, phase: 3.1,  offsetY: 0.90, alpha: 0.14, line: 0.28 },
    ];

    const RIPPLE_TTL = 3200;

    const rippleDisplacement = (x, baseY, now) => {
      let dy = 0;
      for (let i = 0; i < ripples.length; i += 1) {
        const r = ripples[i];
        const age = now - r.born;
        if (age > RIPPLE_TTL) continue;
        const t = age / RIPPLE_TTL;
        const front = r.maxR * t;
        const dx = x - r.x;
        const dist = Math.abs(dx);
        if (dist > front) continue;
        const decay = (1 - t) ** 1.4;
        const envelope = Math.exp(-((dist - front * 0.55) ** 2) / (2 * (front * 0.45) ** 2));
        dy += Math.sin((dist * 0.045) - age * 0.012) * 22 * envelope * decay;
      }
      return dy;
    };

    const tick = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, width, height);

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        if (now - ripples[i].born > RIPPLE_TTL) ripples.splice(i, 1);
      }

      for (const w of layers) {
        const baseY = height * w.offsetY;
        ctx.beginPath();
        const step = 6;
        for (let x = 0; x <= width + step; x += step) {
          const k = (x / w.len) * Math.PI * 2;
          let y = baseY + Math.sin(k + t * w.speed + w.phase) * w.amp
                        + Math.sin(k * 0.5 + t * w.speed * 0.6) * (w.amp * 0.35);
          y += rippleDisplacement(x, y, now);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = `rgba(166, 237, 255, ${w.alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(166, 237, 255, ${w.line})`;
        ctx.lineWidth = 1;
        ctx.stroke();
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

  return <canvas ref={canvasRef} className="sea-waves-canvas" aria-hidden="true" />;
}
