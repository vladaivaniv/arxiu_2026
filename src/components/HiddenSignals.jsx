import { useEffect, useRef } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function HiddenSignals() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999, inside: false };
    const masks = [];

    const rebuild = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    rebuild();
    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(canvas);

    const localCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.clientWidth,
        y: ((e.clientY - rect.top) / rect.height) * canvas.clientHeight,
        inside:
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom,
      };
    };

    const onMove = (e) => {
      const coords = localCoords(e);
      if (!coords || !coords.inside) {
        pointer.inside = false;
        return;
      }

      pointer.x = coords.x;
      pointer.y = coords.y;
      pointer.inside = true;

      masks.push({
        x: coords.x,
        y: coords.y,
        w: 56 + Math.random() * 28,
        h: 16 + Math.random() * 12,
        rotation: (Math.random() - 0.5) * 0.18,
        life: 1,
      });
      if (masks.length > 22) masks.shift();
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = masks.length - 1; i >= 0; i -= 1) {
        const mask = masks[i];
        mask.life -= pointer.inside ? 0.012 : 0.02;

        if (mask.life <= 0) {
          masks.splice(i, 1);
          continue;
        }

        const alpha = clamp(mask.life, 0, 1);
        ctx.save();
        ctx.translate(mask.x, mask.y);
        ctx.rotate(mask.rotation);
        ctx.fillStyle = `rgba(5,6,8,${(0.9 * alpha).toFixed(3)})`;
        ctx.fillRect(-mask.w / 2, -mask.h / 2, mask.w, mask.h);
        ctx.restore();
      }

      if (pointer.inside) {
        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 40);
        grad.addColorStop(0, "rgba(5,6,8,0.98)");
        grad.addColorStop(0.72, "rgba(5,6,8,0.48)");
        grad.addColorStop(1, "rgba(5,6,8,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 12,
      }}
    />
  );
}
