import { useEffect, useRef } from "react";

const GLYPHS = "ART4#%+=:*R/TX3";
const COLUMNS = 120;
const ROWS = 28;

function noise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function inA(x, y) {
  const leftLeg = x >= 0.08 + y * 0.18 && x <= 0.17 + y * 0.18;
  const rightLeg = x >= 0.62 - y * 0.18 && x <= 0.71 - y * 0.18;
  const crossbar = y >= 0.44 && y <= 0.56 && x >= 0.19 && x <= 0.59;
  const cap = y <= 0.14 && x >= 0.28 && x <= 0.5;
  return leftLeg || rightLeg || crossbar || cap;
}

function inR(x, y) {
  const spine = x >= 0.08 && x <= 0.18;
  const top = y <= 0.14 && x >= 0.08 && x <= 0.6;
  const bowlSide = x >= 0.5 && x <= 0.62 && y >= 0.14 && y <= 0.46;
  const bowlMid = y >= 0.28 && y <= 0.4 && x >= 0.18 && x <= 0.52;
  const diagonal =
    x >= 0.16 + (y - 0.46) * 0.5 &&
    x <= 0.28 + (y - 0.46) * 0.5 &&
    y >= 0.46;

  return spine || top || bowlSide || bowlMid || diagonal;
}

function inT(x, y) {
  const top = y <= 0.16 && x >= 0.08 && x <= 0.72;
  const stem = x >= 0.34 && x <= 0.46 && y >= 0.14;
  return top || stem;
}

function inLetter(column, row) {
  const x = column / COLUMNS;
  const y = row / ROWS;

  if (x >= 0.03 && x <= 0.31) {
    return inA((x - 0.03) / 0.28, y);
  }

  if (x >= 0.36 && x <= 0.66) {
    return inR((x - 0.36) / 0.3, y);
  }

  if (x >= 0.71 && x <= 0.98) {
    return inT((x - 0.71) / 0.27, y);
  }

  return false;
}

function pickGlyph(column, row) {
  return GLYPHS[(row * 17 + column * 11) % GLYPHS.length];
}

function buildCells() {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const letter = inLetter(column, row);
      const value = noise(column + 1, row + 1);
      const edgeValue = noise(column + 9, row + 13);

      if (letter) {
        if (value > 0.18) {
          return {
            char: pickGlyph(column, row),
            tone: value > 0.78 ? "bright" : "solid",
          };
        }

        if (value > 0.09) {
          return {
            char: ".",
            tone: "ghost",
          };
        }
      }

      if (edgeValue > 0.992) {
        return {
          char: pickGlyph(column + 3, row + 5),
          tone: "ghost",
        };
      }

      if (edgeValue > 0.965) {
        return {
          char: ".",
          tone: "ghost",
        };
      }

      return {
        char: " ",
        tone: "empty",
      };
    }),
  );
}

const cells = buildCells();

function toneColor(tone, alpha = 1) {
  if (tone === "bright") {
    return `rgba(255, 255, 255, ${0.98 * alpha})`;
  }

  if (tone === "solid") {
    return `rgba(245, 245, 245, ${0.86 * alpha})`;
  }

  if (tone === "ghost") {
    return `rgba(255, 255, 255, ${0.24 * alpha})`;
  }

  return "transparent";
}

function animatedGlyph(column, row, time) {
  const shuffleIndex = Math.floor(time * 0.01 + noise(column + 21, row + 7) * 9);
  return GLYPHS[(column * 11 + row * 17 + shuffleIndex) % GLYPHS.length];
}

export default function WordMask() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    const draw = (time = 0) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      context.clearRect(0, 0, width, height);

      const cellWidth = width / COLUMNS;
      const cellHeight = Math.min(height / ROWS, cellWidth * 1.18);
      const gridHeight = cellHeight * ROWS;
      const offsetY = (height - gridHeight) * 0.42;

      const fontSize = Math.max(5, cellHeight * 0.9);
      context.font = `700 ${fontSize}px "Space Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const cell = cells[row][column];
          if (cell.tone === "empty") {
            continue;
          }

          const flicker = noise(column + time * 0.002, row + time * 0.0015);
          const alpha = cell.tone === "ghost"
            ? 0.55 + flicker * 0.65
            : 0.82 + flicker * 0.2;
          const char = cell.char === "."
            ? "."
            : animatedGlyph(column, row, time);

          context.fillStyle = toneColor(cell.tone, alpha);
          context.fillText(
            char,
            (column + 0.5) * cellWidth,
            offsetY + (row + 0.5) * cellHeight,
          );
        }
      }
    };

    const render = (time = 0) => {
      draw(time);

      if (!prefersReducedMotion.matches) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      draw(performance.now());
    });

    resizeObserver.observe(canvas);
    const handleMotionPreferenceChange = () => {
      window.cancelAnimationFrame(frameId);
      render(performance.now());
    };

    prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      prefersReducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="word-canvas" aria-hidden="true" />;
}
