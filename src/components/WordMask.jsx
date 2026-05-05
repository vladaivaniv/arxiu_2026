import { useEffect, useRef } from "react";

const DEFAULT_TEXT = "ART";
const DEFAULT_GLYPHS = "ART4#%+=:*R/TX3";
const COLUMNS = 120;
const ROWS = 28;
const MASK_SCALE = 4;
const FILLED_ALPHA = 0.16;
const EDGE_ALPHA = 0.035;
const DEFAULT_LETTER_SPACING = 0.12;
const DEFAULT_TEXT_SCALE = 1.1;

function noise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function toneColor(tone, alpha = 1) {
  if (tone === "bright") {
    return `rgba(255, 42, 42, ${0.98 * alpha})`;
  }

  if (tone === "solid") {
    return `rgba(255, 42, 42, ${0.86 * alpha})`;
  }

  if (tone === "ghost") {
    return `rgba(255, 42, 42, ${0.24 * alpha})`;
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

function buildAlphaGrid(data, maskWidth) {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) =>
      sampleAlpha(data, maskWidth, column, row),
    ),
  );
}

function measureSpacedText(context, text, tracking) {
  const glyphWidths = [...text].map((char) => context.measureText(char).width);
  const trackingWidth = Math.max(0, text.length - 1) * tracking;
  const textWidth = glyphWidths.reduce((total, width) => total + width, 0) + trackingWidth;

  return {
    glyphWidths,
    textWidth,
  };
}

function fitFontSize(context, text, maxWidth, maxHeight, letterSpacing, textScale) {
  let fontSize = maxHeight * 0.92;
  context.font = `700 ${fontSize}px "Space Mono", monospace`;

  const tracking = fontSize * letterSpacing;
  const spacedMetrics = measureSpacedText(context, text, tracking);
  const textWidth = Math.max(spacedMetrics.textWidth, 1);
  const textHeight = Math.max(
    context.measureText(text).actualBoundingBoxAscent +
      context.measureText(text).actualBoundingBoxDescent,
    fontSize,
  );
  const scale = Math.min(maxWidth / textWidth, maxHeight / textHeight);

  return fontSize * Math.min(scale * textScale, 1.34);
}

function drawSpacedText(context, text, centerX, centerY, fontSize, letterSpacing) {
  const tracking = fontSize * letterSpacing;
  const { glyphWidths, textWidth } = measureSpacedText(context, text, tracking);
  let cursorX = centerX - textWidth / 2;

  [...text].forEach((char, index) => {
    const glyphWidth = glyphWidths[index];
    context.fillText(char, cursorX + glyphWidth / 2, centerY);
    cursorX += glyphWidth + tracking;
  });
}

function countNeighbors(alphaGrid, row, column, radius) {
  let count = 0;

  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const nextRow = row + offsetY;
      const nextColumn = column + offsetX;

      if (
        nextRow < 0 ||
        nextRow >= ROWS ||
        nextColumn < 0 ||
        nextColumn >= COLUMNS
      ) {
        continue;
      }

      if (alphaGrid[nextRow][nextColumn] > FILLED_ALPHA) {
        count += 1;
      }
    }
  }

  return count;
}

function buildColumnBounds(alphaGrid) {
  return Array.from({ length: COLUMNS }, (_, column) => {
    let top = -1;
    let bottom = -1;

    for (let row = 0; row < ROWS; row += 1) {
      if (alphaGrid[row][column] > FILLED_ALPHA) {
        if (top === -1) {
          top = row;
        }

        bottom = row;
      }
    }

    return { top, bottom };
  });
}

function baseGlyph(column, row, glyphs) {
  return glyphs[(row * 17 + column * 11) % glyphs.length];
}

function buildCells(text, glyphs, letterSpacing, textScale) {
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
    maskWidth * 0.98,
    maskHeight * 0.88,
    letterSpacing,
    textScale,
  );

  maskContext.font = `700 ${fontSize}px "Space Mono", monospace`;
  drawSpacedText(
    maskContext,
    content,
    maskWidth / 2,
    maskHeight / 2 + maskHeight * 0.02,
    fontSize,
    letterSpacing,
  );

  const imageData = maskContext.getImageData(0, 0, maskWidth, maskHeight).data;
  const alphaGrid = buildAlphaGrid(imageData, maskWidth);
  const columnBounds = buildColumnBounds(alphaGrid);

  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const alpha = alphaGrid[row][column];
      const immediateNeighbors = countNeighbors(alphaGrid, row, column, 1);
      const wideNeighbors = countNeighbors(alphaGrid, row, column, 2);
      const structure = noise(column * 0.83 + 1, row * 0.47 + 1);
      const fracture = noise(column * 1.91 + 9, row * 2.37 + 13);
      const edgeNoise = noise(column * 0.36 + 29, row * 1.17 + 7);
      const drift = noise(column * 0.51 + 81, row * 1.41 + 31);
      const rowBias = Math.abs(row / ROWS - 0.5);
      const bounds = columnBounds[column];
      const aboveDistance = bounds.top === -1 ? Infinity : bounds.top - row;
      const belowDistance = bounds.bottom === -1 ? Infinity : row - bounds.bottom;

      if (alpha > FILLED_ALPHA) {
        const densityBoost = alpha * 0.52 + immediateNeighbors * 0.06;
        const keepThreshold =
          0.22 + rowBias * 0.12 - Math.min(wideNeighbors, 10) * 0.012;

        if (structure + densityBoost > keepThreshold && fracture > 0.12) {
          return {
            char: baseGlyph(column, row, glyphs),
            interactive: true,
            tone:
              alpha > 0.58 || immediateNeighbors > 4 || fracture > 0.84
                ? "bright"
                : "solid",
          };
        }

        return {
          char: fracture > 0.58 ? baseGlyph(column + 3, row + 2, glyphs) : ".",
          interactive: true,
          tone: "ghost",
        };
      }

      if (alpha > EDGE_ALPHA) {
        return {
          char: fracture > 0.42 ? baseGlyph(column + 5, row + 1, glyphs) : ".",
          interactive: true,
          tone: "ghost",
        };
      }

      if (
        aboveDistance > 0 &&
        aboveDistance < 7 &&
        drift > 0.83 + aboveDistance * 0.02
      ) {
        return {
          char: drift > 0.94 ? baseGlyph(column + 2, row + 4, glyphs) : ".",
          interactive: false,
          tone: "ghost",
        };
      }

      if (
        belowDistance > 0 &&
        belowDistance < 4 &&
        drift > 0.88 + belowDistance * 0.025
      ) {
        return {
          char: ".",
          interactive: false,
          tone: "ghost",
        };
      }

      if (wideNeighbors > 0 && edgeNoise > 0.93 + rowBias * 0.05) {
        return {
          char: edgeNoise > 0.978 ? baseGlyph(column + 1, row + 5, glyphs) : ".",
          interactive: false,
          tone: "ghost",
        };
      }

      if (edgeNoise > 0.993) {
        return {
          char: baseGlyph(column + 7, row + 3, glyphs),
          interactive: false,
          tone: "ghost",
        };
      }

      if (edgeNoise > 0.974) {
        return {
          char: ".",
          interactive: false,
          tone: "ghost",
        };
      }

      return {
        char: " ",
        interactive: false,
        tone: "empty",
      };
    }),
  );
}

export default function WordMask({
  text = DEFAULT_TEXT,
  glyphs = DEFAULT_GLYPHS,
  letterSpacing = DEFAULT_LETTER_SPACING,
  textScale = DEFAULT_TEXT_SCALE,
}) {
  const canvasRef = useRef(null);
  const pointerRef = useRef({
    active: false,
    energy: 0,
    x: COLUMNS / 2,
    y: ROWS / 2,
    targetX: COLUMNS / 2,
    targetY: ROWS / 2,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const cells = buildCells(text, glyphs, letterSpacing, textScale);
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

      const pointer = pointerRef.current;
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      pointer.energy = pointer.active
        ? Math.min(1, pointer.energy + 0.08)
        : Math.max(0, pointer.energy - 0.06);
      const hoverRadius = 12;

      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const cell = cells[row][column];
          if (cell.tone === "empty") {
            continue;
          }

          const dx = column + 0.5 - pointer.x;
          const dy = row + 0.5 - pointer.y;
          const distance = Math.hypot(dx * 0.95, dy * 1.2);
          const hoverStrength = cell.interactive
            ? Math.max(0, 1 - distance / hoverRadius) * pointer.energy
            : 0;
          const flicker = noise(column + time * 0.002, row + time * 0.0015);
          const baseAlpha = cell.tone === "ghost"
            ? 0.45 + flicker * 0.7
            : 0.84 + flicker * 0.18;
          const distortionNoise = noise(column * 1.7 + time * 0.003, row * 2.1 + 17);
          const angle = noise(column * 0.73 + 5, row * 0.61 + 11) * Math.PI * 2;
          const drift = hoverStrength * (4 + distortionNoise * 18);
          const drawX = (column + 0.5) * cellWidth + Math.cos(angle) * drift;
          const drawY = offsetY + (row + 0.5) * cellHeight + Math.sin(angle) * drift;
          const alpha = Math.max(
            0.08,
            baseAlpha * (cell.interactive ? 1 - hoverStrength * 0.42 : 1),
          );
          const char = cell.char === "."
            ? "."
            : hoverStrength > 0.04
              ? animatedGlyph(column + 7, row + 3, time * 1.35, glyphs)
              : animatedGlyph(column, row, time, glyphs);

          context.fillStyle = toneColor(cell.tone, alpha);
          context.fillText(char, drawX, drawY);
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

    const updatePointerTarget = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.targetX = ((clientX - rect.left) / rect.width) * COLUMNS;
      pointerRef.current.targetY = ((clientY - rect.top) / rect.height) * ROWS;
    };

    const handlePointerMove = (event) => {
      pointerRef.current.active = true;
      updatePointerTarget(event.clientX, event.clientY);
    };

    const handlePointerEnter = (event) => {
      pointerRef.current.active = true;
      updatePointerTarget(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerenter", handlePointerEnter);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    const handleMotionPreferenceChange = () => {
      window.cancelAnimationFrame(frameId);
      render(performance.now());
    };

    prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerenter", handlePointerEnter);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      prefersReducedMotion.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, [glyphs, letterSpacing, text, textScale]);

  return <canvas ref={canvasRef} className="word-canvas" aria-hidden="true" />;
}
