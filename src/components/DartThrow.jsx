import { useEffect, useRef } from "react";

export default function DartThrow() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let spawnAccum = 0;
    let lastMouseSpawn = 0;
    let lastMx = -1;
    let lastMy = -1;

    const darts = [];

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

    const pushDart = (startX, startY, targetX, targetY) => {
      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const speed = 11 + Math.random() * 5;
      darts.push({
        x: startX,
        y: startY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        angle: 0,
        flying: true,
        flightAge: 0,
        flightLimit: 240 + Math.random() * 220,
        stuckBorn: 0,
        ttl: 2200 + Math.random() * 2200,
      });
      if (darts.length > 90) darts.shift();
    };

    const spawnFromEdge = () => {
      const side = Math.floor(Math.random() * 4);
      const m = 40;
      let startX = 0;
      let startY = 0;
      if (side === 0) { startX = -m; startY = Math.random() * height; }
      else if (side === 1) { startX = width + m; startY = Math.random() * height; }
      else if (side === 2) { startX = Math.random() * width; startY = -m; }
      else { startX = Math.random() * width; startY = height + m; }
      const targetX = Math.random() * width;
      const targetY = Math.random() * height;
      pushDart(startX, startY, targetX, targetY);
    };

    const spawnNearCursor = (mx, my) => {
      const offset = 90 + Math.random() * 60;
      const dirAngle = Math.random() * Math.PI * 2;
      const startX = mx - Math.cos(dirAngle) * offset;
      const startY = my - Math.sin(dirAngle) * offset;
      const targetX = mx + (Math.random() - 0.5) * 28;
      const targetY = my + (Math.random() - 0.5) * 28;
      pushDart(startX, startY, targetX, targetY);
    };

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
      if (now - lastMouseSpawn > 90 && dist > 8) {
        spawnNearCursor(mx, my);
        lastMouseSpawn = now;
        lastMx = mx;
        lastMy = my;
      }
    };

    document.addEventListener("mousemove", onMove);

    const drawDart = (x, y, angle, alpha, wobble) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + wobble);

      // shaft
      ctx.strokeStyle = `rgba(245, 245, 245, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      // tip
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(8, -2.4);
      ctx.lineTo(8, 2.4);
      ctx.closePath();
      ctx.fill();

      // fletching
      ctx.fillStyle = `rgba(255, 0, 0, ${(alpha * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-28, -3.4);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-28, 3.4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    let prev = performance.now();
    const SPAWN_RATE_PER_MS = 0.0011; // ~1.1 dards/s automàtics
    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;

      spawnAccum += dt * SPAWN_RATE_PER_MS;
      while (spawnAccum >= 1) {
        spawnFromEdge();
        spawnAccum -= 1;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = darts.length - 1; i >= 0; i -= 1) {
        const d = darts[i];

        if (d.flying) {
          d.flightAge += dt;
          d.vy += 0.18 * (dt / 16);
          d.x += d.vx * (dt / 16);
          d.y += d.vy * (dt / 16);
          d.angle = Math.atan2(d.vy, d.vx);

          const offscreen =
            d.x < -40 || d.x > width + 40 || d.y > height + 40 || d.y < -40;
          if (d.flightAge >= d.flightLimit || offscreen) {
            d.flying = false;
            d.stuckBorn = now;
            d.x = Math.max(-10, Math.min(width + 10, d.x));
            d.y = Math.max(-10, Math.min(height + 10, d.y));
            if (offscreen) {
              darts.splice(i, 1);
              continue;
            }
          }
          drawDart(d.x, d.y, d.angle, 0.95, 0);
          continue;
        }

        const stuckAge = now - d.stuckBorn;
        if (stuckAge > d.ttl) {
          darts.splice(i, 1);
          continue;
        }
        const fade = 1 - stuckAge / d.ttl;
        const wobble = Math.sin(stuckAge * 0.02) * 0.06 * Math.max(0, 1 - stuckAge / 320);
        drawDart(d.x, d.y, d.angle, fade, wobble);
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

  return <canvas ref={canvasRef} className="dart-throw-canvas" aria-hidden="true" />;
}
