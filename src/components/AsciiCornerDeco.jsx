import { useEffect, useRef } from "react";

const GLYPHS = "·░▒▓█▄▀|/\\+=-:.,:;*#%0TAR1X!?[]{}";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeCell(maxOp) {
  return {
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    opacity: 0,
    targetOpacity: rand(0, maxOp),
    glyphTimer: rand(400, 2500),
    fadeSpeed: rand(0.005, 0.018),
    nextFlip: rand(800, 4000),
    maxOp,
  };
}

export default function AsciiCornerDeco({ position = "tl", rows = 6, cols = 8, maxOpacity = 0.32, style }) {
  const containerRef = useRef(null);
  const cellsRef = useRef(
    Array.from({ length: rows * cols }, () => makeCell(maxOpacity))
  );
  const rafRef = useRef(null);
  const lastRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans = Array.from(container.querySelectorAll("span.ascii-cell"));

    const tick = (ts) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = ts - lastRef.current;
      lastRef.current = ts;

      cellsRef.current.forEach((cell, i) => {
        cell.glyphTimer -= dt;
        if (cell.glyphTimer <= 0) {
          cell.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          cell.glyphTimer = rand(300, 2500);
          if (spans[i]) spans[i].textContent = cell.glyph;
        }

        cell.nextFlip -= dt;
        if (cell.nextFlip <= 0) {
          const visible = Math.random() > 0.5;
          cell.targetOpacity = visible ? rand(0.03, cell.maxOp) : 0;
          cell.nextFlip = rand(700, 4500);
        }

        cell.opacity += (cell.targetOpacity - cell.opacity) * cell.fadeSpeed;
        if (spans[i]) spans[i].style.opacity = cell.opacity.toFixed(3);
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const posClass = {
    tl: "ascii-corner-deco--tl",
    tr: "ascii-corner-deco--tr",
    bl: "ascii-corner-deco--bl",
    br: "ascii-corner-deco--br",
    abs: "",
  }[position] ?? "";

  return (
    <div
      ref={containerRef}
      className={`ascii-corner-deco ${posClass}`}
      style={{ ...style, gridTemplateColumns: `repeat(${cols}, 12px)`, gridTemplateRows: `repeat(${rows}, 16px)` }}
      aria-hidden="true"
    >
      {cellsRef.current.map((cell, i) => (
        <span key={i} className="ascii-cell" style={{ opacity: 0 }}>
          {cell.glyph}
        </span>
      ))}
    </div>
  );
}
