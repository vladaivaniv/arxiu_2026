import { useEffect, useRef } from "react";

const GLYPHS = "ART4#%+=:*R/TX3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}/\\|<>";
const CELL_SIZE = 14;
const FPS = 12;

function randomGlyph(seed) {
  return GLYPHS[Math.abs(seed) % GLYPHS.length];
}

export default function AsciiBackground({ color = "#ffffff", opacity = 0.12, pointerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let lastTime = 0;
    let grid = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(w / CELL_SIZE) + 1;
      const rows = Math.ceil(h / CELL_SIZE) + 1;

      grid = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => ({
          char: randomGlyph(r * 97 + c * 31 + Math.floor(Math.random() * 1000)),
          shuffleAt: Math.random() * 1000,
          speed: 0.5 + Math.random() * 1.5,
        }))
      );
    };

    const HOVER_RADIUS = 80;

    const draw = (time) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.font = `700 ${CELL_SIZE - 2}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;

      const cols = grid[0]?.length ?? 0;
      const rows = grid.length;
      const mx = pointerRef?.current?.x ?? -999;
      const my = pointerRef?.current?.y ?? -999;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const cx = c * CELL_SIZE + CELL_SIZE / 2;
          const cy = r * CELL_SIZE + CELL_SIZE / 2;
          const dist = Math.hypot(cx - mx, cy - my);
          const hover = Math.max(0, 1 - dist / HOVER_RADIUS);

          if (time >= cell.shuffleAt) {
            const shuffleSpeed = 1 + hover * 12;
            cell.char = randomGlyph(Math.floor(time * cell.speed * shuffleSpeed) + r * 97 + c * 31);
            cell.shuffleAt = time + (hover > 0.1 ? 30 + Math.random() * 60 : 80 + Math.random() * 400);
          }

          ctx.globalAlpha = opacity + hover * (1 - opacity) * 0.9;
          ctx.fillText(cell.char, cx, cy);
        }
      }

      ctx.globalAlpha = 1;
    };

    const render = (time) => {
      if (time - lastTime >= 1000 / FPS) {
        draw(time);
        lastTime = time;
      }
      if (!prefersReducedMotion.matches) {
        frameId = requestAnimationFrame(render);
      }
    };

    resize();

    if (prefersReducedMotion.matches) {
      draw(0);
    } else {
      frameId = requestAnimationFrame(render);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, [color, opacity, pointerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="ascii-background-canvas"
      aria-hidden="true"
    />
  );
}
