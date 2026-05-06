import { useEffect, useRef } from "react";

const DEFAULT_TEXT = "ART";
const DEFAULT_GLYPHS = "ART4#%+=:*R/TX3";
const DEFAULT_COLUMNS = 120;
const DEFAULT_ROWS = 28;
const MASK_SCALE = 4;
const FILLED_ALPHA = 0.16;
const EDGE_ALPHA = 0.035;
const DEFAULT_LETTER_SPACING = 0.12;
const DEFAULT_TEXT_SCALE = 1.1;
const DEFAULT_DENSITY = 1;
const DEFAULT_COLORS = {
  bright: "#ff2a2a",
  solid: "#ff2a2a",
  ghost: "#ff2a2a",
};
const DEFAULT_TONE_OPACITY = {
  bright: 0.98,
  solid: 0.86,
  ghost: 0.24,
};

function noise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toneColor(tone, colors) {
  return colors[tone] ?? "transparent";
}

function toneOpacity(tone, alpha = 1) {
  return (DEFAULT_TONE_OPACITY[tone] ?? 0) * alpha;
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

function buildAlphaGrid(data, maskWidth, columns, rows) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) =>
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

function countNeighbors(alphaGrid, row, column, radius, columns, rows) {
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
        nextRow >= rows ||
        nextColumn < 0 ||
        nextColumn >= columns
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

function buildColumnBounds(alphaGrid, columns, rows) {
  return Array.from({ length: columns }, (_, column) => {
    let top = -1;
    let bottom = -1;

    for (let row = 0; row < rows; row += 1) {
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

function buildCells(text, glyphs, letterSpacing, textScale, density, columns, rows) {
  const content = text.trim() || DEFAULT_TEXT;
  const normalizedDensity = clamp(density, 0.4, 1.8);
  const maskCanvas = document.createElement("canvas");
  const maskWidth = columns * MASK_SCALE;
  const maskHeight = rows * MASK_SCALE;

  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;

  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ({ char: " ", tone: "empty" })),
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
  const alphaGrid = buildAlphaGrid(imageData, maskWidth, columns, rows);
  const columnBounds = buildColumnBounds(alphaGrid, columns, rows);

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const alpha = alphaGrid[row][column];
      const immediateNeighbors = countNeighbors(alphaGrid, row, column, 1, columns, rows);
      const wideNeighbors = countNeighbors(alphaGrid, row, column, 2, columns, rows);
      const structure = noise(column * 0.83 + 1, row * 0.47 + 1);
      const fracture = noise(column * 1.91 + 9, row * 2.37 + 13);
      const edgeNoise = noise(column * 0.36 + 29, row * 1.17 + 7);
      const drift = noise(column * 0.51 + 81, row * 1.41 + 31);
      const rowBias = Math.abs(row / rows - 0.5);
      const bounds = columnBounds[column];
      const aboveDistance = bounds.top === -1 ? Infinity : bounds.top - row;
      const belowDistance = bounds.bottom === -1 ? Infinity : row - bounds.bottom;

      if (alpha > FILLED_ALPHA) {
        const densityBoost =
          alpha * (0.44 + normalizedDensity * 0.08) +
          immediateNeighbors * (0.04 + normalizedDensity * 0.02);
        const keepThreshold =
          0.22 +
          rowBias * 0.12 -
          Math.min(wideNeighbors, 10) * (0.008 + normalizedDensity * 0.004);
        const densityOffset = (normalizedDensity - 1) * 0.16;

        if (structure + densityBoost > keepThreshold - densityOffset && fracture > 0.12) {
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
  density = DEFAULT_DENSITY,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  colors = DEFAULT_COLORS,
}) {
  const normalizedColumns = clamp(Math.round(columns), 24, 180);
  const normalizedRows = clamp(Math.round(rows), 12, 72);
  const canvasRef = useRef(null);
  const pointerRef = useRef({
    active: false,
    energy: 0,
    x: normalizedColumns / 2,
    y: normalizedRows / 2,
    targetX: normalizedColumns / 2,
    targetY: normalizedRows / 2,
    vx: 0,
    vy: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const cells = buildCells(
      text,
      glyphs,
      letterSpacing,
      textScale,
      density,
      normalizedColumns,
      normalizedRows,
    );

    // pre-compute random scatter targets for each interactive cell
    cells.forEach((row) => {
      row.forEach((cell) => {
        if (cell.interactive) {
          cell.scatterX = (Math.random() * 2 - 1) * 5;
          cell.scatterY = (Math.random() * 2 - 1) * 5;
        }
      });
    });
    const tonePalette = {
      ...DEFAULT_COLORS,
      ...colors,
    };
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    // per-cell displacement grid — decays toward 0 each frame
    let disp = Array.from({ length: normalizedRows }, () =>
      Array.from({ length: normalizedColumns }, () => ({ ox: 0, oy: 0 }))
    );

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

      const cellWidth = width / normalizedColumns;
      const cellHeight = Math.min(height / normalizedRows, cellWidth * 1.18);
      const gridHeight = cellHeight * normalizedRows;
      const offsetY = (height - gridHeight) * 0.42;
      const fontSize = Math.max(5, cellHeight * 0.9);

      context.font = `700 ${fontSize}px "Space Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const pointer = pointerRef.current;
      // velocity from raw mouse position (no smoothing lag)
      const rawVx = pointer.targetX - (pointer.prevTargetX ?? pointer.targetX);
      const rawVy = pointer.targetY - (pointer.prevTargetY ?? pointer.targetY);
      pointer.prevTargetX = pointer.targetX;
      pointer.prevTargetY = pointer.targetY;
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      pointer.energy = pointer.active
        ? Math.min(1, pointer.energy + 0.06)
        : Math.max(0, pointer.energy - 0.035);

      const speed = Math.hypot(rawVx, rawVy);
      const wakeRadius = 4;

      // convert raw mouse position to actual grid coordinates (accounts for offsetY)
      const mousePixelY = (pointer.targetY / normalizedRows) * height;
      const mouseGridY = (mousePixelY - offsetY) / cellHeight;
      const mouseGridX = pointer.targetX;

      // apply velocity push to cells near cursor when moving fast
      if (speed > 0.15) {
        for (let row = 0; row < normalizedRows; row += 1) {
          for (let column = 0; column < normalizedColumns; column += 1) {
            if (!cells[row][column].interactive) continue;
            const dx = column + 0.5 - mouseGridX;
            const dy = row + 0.5 - mouseGridY;
            const dist = Math.hypot(dx * 0.95, dy * 1.1);
            if (dist > wakeRadius) continue;
            const falloff = Math.pow(1 - dist / wakeRadius, 2);
            const push = falloff * speed * 8;
            const d = Math.max(dist, 0.001);
            disp[row][column].ox += (dx / d) * push;
            disp[row][column].oy += (dy / d) * push;
          }
        }
      }

      for (let row = 0; row < normalizedRows; row += 1) {
        for (let column = 0; column < normalizedColumns; column += 1) {
          const cell = cells[row][column];
          if (cell.tone === "empty") {
            continue;
          }

          // decay displacement slowly — "tornen lents"
          disp[row][column].ox *= 0.75;
          disp[row][column].oy *= 0.75;

          const baseX = (column + 0.5) * cellWidth;
          const baseY = offsetY + (row + 0.5) * cellHeight;
          const drawX = baseX + disp[row][column].ox * cellWidth;
          const drawY = baseY + disp[row][column].oy * cellHeight;

          const flicker = noise(column + time * 0.002, row + time * 0.0015);
          const baseAlpha = cell.tone === "ghost"
            ? 0.45 + flicker * 0.7
            : 0.84 + flicker * 0.18;

          const char = cell.char === "."
            ? "."
            : animatedGlyph(column, row, time, glyphs);

          const alpha = Math.max(0.08, baseAlpha);
          context.fillStyle = toneColor(cell.tone, tonePalette);
          context.globalAlpha = toneOpacity(cell.tone, Math.min(1, alpha));
          context.fillText(char, drawX, drawY);
        }
      }

      context.globalAlpha = 1;
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
      pointerRef.current.targetX =
        ((clientX - rect.left) / rect.width) * normalizedColumns;
      pointerRef.current.targetY =
        ((clientY - rect.top) / rect.height) * normalizedRows;
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
      pointerRef.current.vx = 0;
      pointerRef.current.vy = 0;
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
  }, [
    colors,
    density,
    glyphs,
    letterSpacing,
    normalizedColumns,
    normalizedRows,
    text,
    textScale,
  ]);

  return <canvas ref={canvasRef} className="word-canvas" aria-hidden="true" />;
}
