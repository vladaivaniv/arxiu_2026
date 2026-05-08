import { useEffect, useRef } from "react";

const PIXEL_SIZE = 18;
const RADIUS = 160;

export default function PixelReveal({ src }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    imgRef.current = img;

    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;

      const resize = () => {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      };
      resize();
      window.addEventListener("resize", resize);

      const render = () => {
        rafRef.current = requestAnimationFrame(render);
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        if (mx < 0) return;

        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // draw pixelated image only around cursor
        const x0 = Math.floor((mx - RADIUS) / PIXEL_SIZE) * PIXEL_SIZE;
        const y0 = Math.floor((my - RADIUS) / PIXEL_SIZE) * PIXEL_SIZE;
        const x1 = Math.ceil((mx + RADIUS) / PIXEL_SIZE) * PIXEL_SIZE;
        const y1 = Math.ceil((my + RADIUS) / PIXEL_SIZE) * PIXEL_SIZE;

        for (let py = y0; py < y1; py += PIXEL_SIZE) {
          for (let px = x0; px < x1; px += PIXEL_SIZE) {
            const cx = px + PIXEL_SIZE / 2;
            const cy = py + PIXEL_SIZE / 2;
            const dist = Math.hypot(cx - mx, cy - my);
            if (dist > RADIUS) continue;

            const t = 1 - dist / RADIUS;
            const smooth = t * t * (3 - 2 * t);

            // sample image color at this block
            const sx = (px / w) * img.naturalWidth;
            const sy = (py / h) * img.naturalHeight;
            const sw = (PIXEL_SIZE / w) * img.naturalWidth;
            const sh = (PIXEL_SIZE / h) * img.naturalHeight;

            ctx.globalAlpha = smooth * 0.9;
            ctx.drawImage(img, sx, sy, sw, sh, px, py, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
        ctx.globalAlpha = 1;
      };

      render();
    };

    img.src = src;

    const section = canvas.closest(".section-divider, .horizontal-panel") || canvas.parentElement;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [src]);

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
        zIndex: 2,
      }}
    />
  );
}
