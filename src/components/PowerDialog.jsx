import { useEffect, useRef } from "react";

export default function PowerDialog() {
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
    const startedAt = performance.now();
    let totalPresses = 0;
    const BUTTON_COUNT = 4;
    const BUTTON_R = 9;

    const buttons = Array.from({ length: BUTTON_COUNT }).map(() => ({
      x: 0,
      y: 0,
      r: BUTTON_R,
      pressedAt: 0,
      appearedAt: 0,
    }));

    const relocateButton = (b) => {
      const m = b.r * 1.5 + 30;
      const maxX = width * 0.55 - m;
      b.x = m + Math.random() * Math.max(20, maxX - m);
      b.y = m + Math.random() * (height - m * 2 - 40);
      b.appearedAt = performance.now();
    };

    const relocateAll = () => {
      for (const b of buttons) relocateButton(b);
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (buttons.every((b) => b.x === 0 && b.y === 0)) relocateAll();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const localCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
        inside:
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom,
      };
    };

    const onMove = (e) => {
      const c = localCoords(e);
      if (!c || !c.inside) {
        mx = -9999;
        my = -9999;
        return;
      }
      mx = c.x;
      my = c.y;
    };

    const onDown = (e) => {
      const c = localCoords(e);
      if (!c || !c.inside) return;
      for (const b of buttons) {
        const dx = c.x - b.x;
        const dy = c.y - b.y;
        if (dx * dx + dy * dy < b.r * b.r * 1.6) {
          b.pressedAt = performance.now();
          totalPresses += 1;
          const captured = b;
          setTimeout(() => relocateButton(captured), 220);
        }
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      const elapsed = (now - startedAt) * 0.001;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < buttons.length; i += 1) {
        const b = buttons[i];
        const since = now - b.appearedAt;
        const intro = Math.min(1, since / 280);
        const introScale = 0.3 + 0.7 * (1 - Math.pow(1 - intro, 3));

        const dx = mx - b.x;
        const dy = my - b.y;
        const distSq = dx * dx + dy * dy;
        const isHover = distSq < b.r * b.r * 1.6;

        const pressAge = now - b.pressedAt;
        const isPressed = pressAge < 320;
        const pressT = isPressed ? 1 - pressAge / 320 : 0;
        const scale = (1 - pressT * 0.22) * introScale;

        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5.5 + i * 1.2);

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(scale, scale);

        ctx.strokeStyle = `rgba(0, 220, 80, ${(0.55 + 0.45 * pulse).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 220, 80, 0.85)";
        ctx.lineWidth = 1.2;
        const tR = b.r * 1.75;
        const tg = 6;
        ctx.beginPath();
        ctx.moveTo(-tR, -tR + tg); ctx.lineTo(-tR, -tR); ctx.lineTo(-tR + tg, -tR);
        ctx.moveTo(tR - tg, -tR); ctx.lineTo(tR, -tR); ctx.lineTo(tR, -tR + tg);
        ctx.moveTo(tR, tR - tg); ctx.lineTo(tR, tR); ctx.lineTo(tR - tg, tR);
        ctx.moveTo(-tR + tg, tR); ctx.lineTo(-tR, tR); ctx.lineTo(-tR, tR - tg);
        ctx.stroke();

        const base = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, 0, 0, 0, b.r);
        base.addColorStop(0, "rgba(0, 60, 25, 0.95)");
        base.addColorStop(1, "rgba(0, 14, 6, 0.95)");
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 220, 80, ${(0.55 + 0.25 * (isHover ? 1 : 0)).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        const capR = b.r * 0.7;
        const cap = isPressed
          ? "rgba(120, 255, 160, 1)"
          : isHover
          ? "rgba(0, 200, 70, 1)"
          : `rgba(0, ${150 + Math.round(60 * pulse)}, 60, 1)`;
        ctx.fillStyle = cap;
        ctx.beginPath();
        ctx.arc(0, 0, capR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(220, 255, 230, 0.45)";
        ctx.beginPath();
        ctx.arc(-capR * 0.35, -capR * 0.4, capR * 0.42, 0, Math.PI * 2);
        ctx.fill();

        if (pressT > 0) {
          ctx.strokeStyle = `rgba(0, 220, 80, ${pressT.toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, b.r * (1 + (1 - pressT) * 0.7), 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ── comptador ──
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillStyle = "rgba(0, 220, 80, 0.7)";
      const label = `TASQUES · ${totalPresses.toString().padStart(5, "0")}`;
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, width - lw - 16, height - 14);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="power-dialog-canvas" aria-hidden="true" />;
}
