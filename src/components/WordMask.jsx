import { useEffect, useRef } from "react";

const DEFAULT_TEXT = "ART";
const DEFAULT_GLYPHS = "ART4#%+=:*R/TX3";
const COLUMNS = 120;
const ROWS = 28;
const MASK_SCALE = 4;

function noise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

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

function animatedGlyph(column, row, time, glyphs) {
  const shuffleIndex = Math.floor(time * 0.01 + noise(column + 21, row + 7) * 9);
  return glyphs[(column * 11 + row * 17 + shuffleIndex) % glyphs.length];
}

function sampleAlpha(data, maskWidth, column, row) {
  let totalAlpha = 0;

  for (let sampleY = 0; sampleY < MASK_SCALE; sampleY += 1) {
    for (let sampleX = 0; sampleX < MASK_SCALE; sampleX += 1) {
      const x = column * MASK_SCALE + sampleX;
      const y = row * MASK_SCALE + sampleY;
      const index = (y * maskWidth + x) * 4 + 3;
      totalAlpha += data[index];
    }
  }

  return totalAlpha / (MASK_SCALE * MASK_SCALE * 255);
}

function fitFontSize(context, text, maxWidth, maxHeight) {
  let fontSize = maxHeight * 0.92;
  context.font = `700 ${fontSize}px "Space Mono", monospace`;

  const metrics = context.measureText(text);
  const textWidth = Math.max(metrics.width, 1);
  const textHeight = Math.max(
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    fontSize,
  );
  const scale = Math.min(maxWidth / textWidth, maxHeight / textHeight);

  return fontSize * Math.min(scale, 1.25);
}

function buildCells(text) {
  const content = text.trim() || DEFAULT_TEXT;
  const maskCanvas = document.createElement("canvas");
  const maskWidth = COLUMNS * MASK_SCALE;
  const maskHeight = ROWS * MASK_SCALE;

  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;

  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLUMNS }, () => ({ char: " ", tone: "empty" })),
    );
  }

  maskContext.clearRect(0, 0, maskWidth, maskHeight);
  maskContext.fillStyle = "#ffffff";
  maskContext.textAlign = "center";
  maskContext.textBaseline = "middle";

  const fontSize = fitFontSize(
    maskContext,
    content,
    maskWidth * 0.9,
    maskHeight * 0.64,
  );

  maskContext.font = `700 ${fontSize}px "Space Mono", monospace`;
  maskContext.fillText(content, maskWidth / 2, maskHeight / 2 + maskHeight * 0.03);

  const imageData = maskContext.getImageData(0, 0, maskWidth, maskHeight).data;

  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const alpha = sampleAlpha(imageData, maskWidth, column, row);
      const value = noise(column + 1, row + 1);
      const edgeValue = noise(column + 9, row + 13);

      if (alpha > 0.12) {
        if (value > 0.14) {
          return {
            char: DEFAULT_GLYPHS[(row * 17 + column * 11) % DEFAULT_GLYPHS.length],
            tone: alpha > 0.52 || value > 0.76 ? "bright" : "solid",
          };
        }

        return {
          char: ".",
          tone: "ghost",
        };
      }

      if (alpha > 0.035) {
        return {
          char: ".",
          tone: "ghost",
        };
      }

      if (edgeValue > 0.992) {
        return {
          char: DEFAULT_GLYPHS[(row * 13 + column * 7) % DEFAULT_GLYPHS.length],
          tone: "ghost",
        };
      }

      if (edgeValue > 0.968) {
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

export default function WordMask({
  text = DEFAULT_TEXT,
  glyphs = DEFAULT_GLYPHS,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const cells = buildCells(text);
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
            : animatedGlyph(column, row, time, glyphs);

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
  }, [glyphs, text]);

  return <canvas ref={canvasRef} className="word-canvas" aria-hidden="true" />;
}
