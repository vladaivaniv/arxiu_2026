import { useEffect, useRef } from "react";

const CHARS = ' .`\',:;-~+=<>i!lI?/|)(1tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
const COLS = 140;
const ROWS = 55;
const RADIUS = 140;

export default function AsciiReveal({ src }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);
  const dataRef = useRef(null); // pre-computed ascii chars + brightness

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // sample image once
      const tmp = document.createElement("canvas");
      tmp.width = COLS; tmp.height = ROWS;
      const tc = tmp.getContext("2d");
      tc.drawImage(img, 0, 0, COLS, ROWS);
      const { data } = tc.getImageData(0, 0, COLS, ROWS);

      const cells = [];
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const idx = (j * COLS + i) * 4;
          const br = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
          const ci = Math.round(br * (CHARS.length - 1));
          cells.push({ ch: CHARS[ci], br });
        }
      }
      dataRef.current = cells;

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
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        if (mx < 0) return;

        const cw = w / COLS;
        const ch = h / ROWS;
        const fs = Math.max(cw * 1.05, 1);
        ctx.font = `${fs}px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let j = 0; j < ROWS; j++) {
          for (let i = 0; i < COLS; i++) {
            const cx = i * cw + cw / 2;
            const cy = j * ch + ch / 2;
            const dist = Math.hypot(cx - mx, cy - my);
            if (dist > RADIUS) continue;

            const t = 1 - dist / RADIUS;
            const smooth = t * t * (3 - 2 * t);
            const cell = dataRef.current[j * COLS + i];
            if (!cell || cell.ch === " ") continue;

            ctx.globalAlpha = smooth * (0.4 + cell.br * 0.6);
            ctx.fillStyle = "#FF0000";
            ctx.fillText(cell.ch, cx, cy);
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
