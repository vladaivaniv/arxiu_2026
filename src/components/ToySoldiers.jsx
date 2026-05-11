import { useEffect, useRef } from "react";

const COLORS = [
  "#e74c3c", // red
  "#3498db", // blue
  "#27ae60", // green
  "#f39c12", // orange
  "#f1c40f", // yellow
  "#9b59b6", // purple
];

export default function ToySoldiers() {
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
    let prev = performance.now();

    const soldiers = [];

    const buildSoldiers = () => {
      soldiers.length = 0;
      const count = 42;
      for (let i = 0; i < count; i += 1) {
        soldiers.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          size: 6 + Math.random() * 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (soldiers.length === 0) buildSoldiers();
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
        mx = -9999;
        my = -9999;
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
    };

    document.addEventListener("mousemove", onMove);

    const drawSoldier = (s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = s.color;
      // cos rectangular
      ctx.beginPath();
      ctx.rect(-s.size * 0.4, -s.size * 0.5, s.size * 0.8, s.size);
      ctx.fill();
      // cap rodó
      ctx.beginPath();
      ctx.arc(0, -s.size * 0.55, s.size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // braços (linies fines a banda i banda)
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size * 0.18;
      ctx.beginPath();
      ctx.moveTo(-s.size * 0.4, -s.size * 0.15);
      ctx.lineTo(-s.size * 0.75, s.size * 0.05);
      ctx.moveTo(s.size * 0.4, -s.size * 0.15);
      ctx.lineTo(s.size * 0.75, s.size * 0.05);
      ctx.stroke();
      // cames
      ctx.beginPath();
      ctx.moveTo(-s.size * 0.15, s.size * 0.5);
      ctx.lineTo(-s.size * 0.3, s.size * 0.95);
      ctx.moveTo(s.size * 0.15, s.size * 0.5);
      ctx.lineTo(s.size * 0.3, s.size * 0.95);
      ctx.stroke();
      ctx.restore();
    };

    const PUSH_RADIUS = 70;
    const PUSH_RADIUS_SQ = PUSH_RADIUS * PUSH_RADIUS;
    const PUSH_STRENGTH = 1.8;
    const FRICTION = 0.94;
    const MAX_SPEED = 6;

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.55;

      const dtNorm = dt / 16;

      for (const s of soldiers) {
        // empenta del ratolí
        if (mx > -100) {
          const dx = s.x - mx;
          const dy = s.y - my;
          const distSq = dx * dx + dy * dy;
          if (distSq < PUSH_RADIUS_SQ && distSq > 0.1) {
            const dist = Math.sqrt(distSq);
            const force = ((PUSH_RADIUS - dist) / PUSH_RADIUS) * PUSH_STRENGTH;
            s.vx += (dx / dist) * force;
            s.vy += (dy / dist) * force;
            s.rotSpeed += (Math.random() - 0.5) * 0.08;
          }
        }

        // limitar velocitat
        const speed = Math.hypot(s.vx, s.vy);
        if (speed > MAX_SPEED) {
          s.vx = (s.vx / speed) * MAX_SPEED;
          s.vy = (s.vy / speed) * MAX_SPEED;
        }

        // aplicar moviment
        s.x += s.vx * dtNorm;
        s.y += s.vy * dtNorm;
        s.rotation += s.rotSpeed * dtNorm;

        // fricció
        s.vx *= FRICTION;
        s.vy *= FRICTION;
        s.rotSpeed *= 0.92;

        // rebot suau contra les vores
        const m = s.size * 0.8;
        if (s.x < m) { s.x = m; s.vx = Math.abs(s.vx) * 0.6; }
        else if (s.x > width - m) { s.x = width - m; s.vx = -Math.abs(s.vx) * 0.6; }
        if (s.y < m) { s.y = m; s.vy = Math.abs(s.vy) * 0.6; }
        else if (s.y > height - m) { s.y = height - m; s.vy = -Math.abs(s.vy) * 0.6; }

        drawSoldier(s);
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

  return <canvas ref={canvasRef} className="toy-soldiers-canvas" aria-hidden="true" />;
}
