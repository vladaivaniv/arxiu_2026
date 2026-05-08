import { useEffect, useRef } from "react";

const GLYPHS = "ART4#%+=:*R/TX3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}/\\|<>";
const CELL_SIZE = 10;
const FPS = 30;
const TRAIL_LENGTH = 28;
const HEAT_RADIUS = 55;
const COOL_RATE = 0.04;
const COLOR_DEFAULT = "#FF0000";
const COLOR_HOVER = "#000000";

function randomGlyph(seed) {
  return GLYPHS[Math.abs(seed) % GLYPHS.length];
}

export default function AsciiBackground({ color = "#ffffff", opacity = 0.12, pointerRef, scrollProgressRef }) {
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
    // heat grid — each cell stores a 0..1 heat value
    let heat = [];

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
          ox: 0, oy: 0, // current offset (lerped)
        }))
      );

      heat = Array.from({ length: rows }, () => new Float32Array(cols));
    };

    // circular buffer of recent cursor positions
    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -999, y: -999, t: 0 }));
    let trailHead = 0;
    let velX = 0;
    let velY = 0;

    const addTrailPoint = (x, y, t) => {
      const prev = trail[(trailHead - 1 + TRAIL_LENGTH) % TRAIL_LENGTH];
      if (prev.x > 0 && t - prev.t > 0) {
        const dt = Math.max(1, t - prev.t);
        velX = velX * 0.6 + ((x - prev.x) / dt) * 0.4;
        velY = velY * 0.6 + ((y - prev.y) / dt) * 0.4;
      }
      trail[trailHead] = { x, y, t };
      trailHead = (trailHead + 1) % TRAIL_LENGTH;
    };

    const draw = (time) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.font = `700 ${CELL_SIZE - 2}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cols = grid[0]?.length ?? 0;
      const rows = grid.length;

      // add heat from cursor trail
      const mx = pointerRef?.current?.x ?? -999;
      const my = pointerRef?.current?.y ?? -999;
      if (mx > 0) addTrailPoint(mx, my, time);

      // update heat grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = c * CELL_SIZE + CELL_SIZE / 2;
          const cy = r * CELL_SIZE + CELL_SIZE / 2;

          let maxHeat = 0;
          for (let i = 0; i < TRAIL_LENGTH; i++) {
            const p = trail[i];
            if (p.x < 0) continue;
            const age = (time - p.t) / 1000;
            const decay = Math.max(0, 1 - age * 0.9);
            const dist = Math.hypot(cx - p.x, cy - p.y);
            const t = dist / HEAT_RADIUS;
            // gaussian falloff — soft wide brush, strong centre
            const proximity = Math.exp(-t * t * 2.5);
            maxHeat = Math.max(maxHeat, proximity * decay);
          }

          // heat approaches maxHeat quickly, cools slowly
          const current = heat[r][c];
          heat[r][c] = maxHeat > current
            ? maxHeat
            : Math.max(0, current - COOL_RATE);
        }
      }

      // draw cells
      const progress = scrollProgressRef?.current ?? 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const h = heat[r][c];

          if (time >= cell.shuffleAt) {
            cell.char = randomGlyph(Math.floor(time * cell.speed * (1 + h * 14)) + r * 97 + c * 31);
            cell.shuffleAt = time + (h > 0.05 ? 20 + Math.random() * 50 : 80 + Math.random() * 400);
          }

          const baseAlpha = opacity + h * 0.88;

          const cellCX = c * CELL_SIZE + CELL_SIZE / 2;
          const cellCY = r * CELL_SIZE + CELL_SIZE / 2;
          const mx2 = pointerRef?.current?.x ?? -999;
          const my2 = pointerRef?.current?.y ?? -999;

          const drawX = cellCX;
          const drawY = cellCY;

          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = COLOR_DEFAULT;
          ctx.fillText(cell.char, drawX, drawY);
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
