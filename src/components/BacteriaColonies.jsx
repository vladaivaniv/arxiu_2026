import { useEffect, useRef } from "react";

export default function BacteriaColonies() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;
    const colonies = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseInside = false;
    let autoSpawnCooldown = 4; // frames until next auto-spawn
    const MAX_COLONIES = 22;
    const INITIAL_COLONIES = 18; // spawn many right away so the dish starts full
    let didInitialPopulate = false;

    const allocate = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    allocate();
    const ro = new ResizeObserver(allocate);
    ro.observe(canvas);

    const rand = (a, b) => a + Math.random() * (b - a);

    // palette inspired by real bacterial cultures on petri dishes
    const COLONY_PALETTES = [
      { hue: 50, sat: 60, light: 65 },  // yellow-ochre (E. coli-ish)
      { hue: 90, sat: 45, light: 55 },  // greenish (Pseudomonas)
      { hue: 28, sat: 55, light: 60 },  // orange-amber (Serratia)
      { hue: 0, sat: 0, light: 88 },    // chalky white
      { hue: 320, sat: 30, light: 60 }, // soft magenta
    ];

    // Bacteria morphologies — each colony picks one
    const SHAPES = ["rod", "coccus", "vibrio", "spirillum"];

    // shared motion fields for every cell — gives the bacteria a slow swimming life
    const baseMotion = () => ({
      vx: rand(-0.12, 0.12),
      vy: rand(-0.12, 0.12),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.04, 0.09),
    });

    const makeCell = (cx, cy, scale, shape, sizeFactor = 1) => {
      // Realistic bacterial size: cocci ~1µm, rods 2-5µm. We use px for canvas.
      if (shape === "coccus") {
        const r = rand(1.4, 2.4) * scale * sizeFactor;
        return {
          ...baseMotion(),
          x: cx,
          y: cy,
          shape,
          radius: 0.3,
          targetRadius: r,
          length: r,
          targetLength: r,
          angle: rand(0, Math.PI * 2),
        };
      }
      if (shape === "rod") {
        const r = rand(0.9, 1.4) * scale * sizeFactor;
        return {
          ...baseMotion(),
          x: cx,
          y: cy,
          shape,
          radius: 0.2,
          targetRadius: r,
          length: rand(5, 11) * scale * sizeFactor,
          targetLength: rand(5, 11) * scale * sizeFactor,
          angle: rand(0, Math.PI * 2),
        };
      }
      if (shape === "vibrio") {
        const r = rand(0.9, 1.3) * scale * sizeFactor;
        return {
          ...baseMotion(),
          x: cx,
          y: cy,
          shape,
          radius: 0.2,
          targetRadius: r,
          length: rand(6, 10) * scale * sizeFactor,
          targetLength: rand(6, 10) * scale * sizeFactor,
          angle: rand(0, Math.PI * 2),
          curve: (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.1),
        };
      }
      // spirillum (corkscrew)
      const r = rand(0.7, 1.0) * scale * sizeFactor;
      return {
        ...baseMotion(),
        x: cx,
        y: cy,
        shape,
        radius: 0.2,
        targetRadius: r,
        length: rand(10, 16) * scale * sizeFactor,
        targetLength: rand(10, 16) * scale * sizeFactor,
        angle: rand(0, Math.PI * 2),
        turns: rand(1.5, 3),
        amp: rand(1.5, 2.6) * scale * sizeFactor,
      };
    };

    const spawnColony = (x, y, scale = 1) => {
      const palette = COLONY_PALETTES[Math.floor(Math.random() * COLONY_PALETTES.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const seedCount = 3 + Math.floor(Math.random() * 4);
      const cells = [];
      for (let i = 0; i < seedCount; i += 1) {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(0, 4 * scale);
        cells.push(makeCell(
          x + Math.cos(angle) * dist,
          y + Math.sin(angle) * dist,
          scale,
          shape,
        ));
      }
      colonies.push({
        cx: x,
        cy: y,
        cells,
        palette,
        shape,
        age: 0,
        life: 420 + Math.floor(rand(0, 240)), // ~7-11s — long enough to feel alive
        growthRate: rand(0.05, 0.12),
        spreadRadius: rand(16, 32) * scale,
        maxCells: 10 + Math.floor(rand(0, 14)),
        scale,
      });
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        mouseInside = false;
        return;
      }
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        mouseInside = false;
        return;
      }
      mouseInside = true;
      mouseX = (e.clientX - rect.left) * (width / rect.width);
      mouseY = (e.clientY - rect.top) * (height / rect.height);
    };

    const onLeave = () => {
      mouseInside = false;
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);
      // outbreak: dense central + satellites
      spawnColony(px, py, 1.8);
      for (let i = 0; i < 5; i += 1) {
        spawnColony(px + rand(-30, 30), py + rand(-30, 30), 1);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // First frame with valid dimensions → populate the dish so it's already full
      if (!didInitialPopulate && width > 30 && height > 30) {
        const margin = 24;
        for (let i = 0; i < INITIAL_COLONIES; i += 1) {
          const c = spawnColony(
            rand(margin, width - margin),
            rand(margin, height - margin),
            rand(0.85, 1.25),
          );
          // pre-age each colony randomly so they're at different growth stages already
          const colony = colonies[colonies.length - 1];
          if (colony) {
            const skip = Math.floor(rand(20, 110));
            colony.age = skip;
            // grow their cells partially toward target
            for (const cell of colony.cells) {
              cell.radius = cell.targetRadius * rand(0.6, 1);
              cell.length = cell.targetLength * rand(0.6, 1);
            }
            // pre-bud some so colonies already have several cells
            const extra = Math.floor(rand(2, 7));
            for (let b = 0; b < extra; b += 1) {
              if (colony.cells.length >= colony.maxCells) break;
              const parent = colony.cells[Math.floor(Math.random() * colony.cells.length)];
              const a = rand(0, Math.PI * 2);
              const d = rand((parent.radius || 1) * 1.2, (parent.radius || 1) * 2.2);
              const nx = parent.x + Math.cos(a) * d;
              const ny = parent.y + Math.sin(a) * d;
              if (Math.hypot(nx - colony.cx, ny - colony.cy) < colony.spreadRadius) {
                const child = makeCell(nx, ny, colony.scale, colony.shape);
                if (colony.shape === "rod" || colony.shape === "vibrio") {
                  child.angle = parent.angle + rand(-0.4, 0.4);
                }
                child.radius = child.targetRadius * rand(0.6, 1);
                child.length = child.targetLength * rand(0.6, 1);
                colony.cells.push(child);
              }
            }
          }
        }
        didInitialPopulate = true;
      }

      // continuous replenishment so the dish stays populated as colonies die off
      autoSpawnCooldown -= 1;
      if (autoSpawnCooldown <= 0 && colonies.length < MAX_COLONIES && width > 0 && height > 0) {
        const margin = 24;
        spawnColony(rand(margin, width - margin), rand(margin, height - margin), rand(0.85, 1.2));
        autoSpawnCooldown = 30 + Math.floor(Math.random() * 50);
      }

      for (let i = colonies.length - 1; i >= 0; i -= 1) {
        const colony = colonies[i];
        colony.age += 1;

        // alpha: peak then fade
        const fadeStart = colony.life - 80;
        let alpha = 1;
        if (colony.age > fadeStart) {
          alpha = Math.max(0, 1 - (colony.age - fadeStart) / 80);
        }
        // fade in ramp (so they appear smoothly)
        const fadeIn = Math.min(1, colony.age / 20);
        alpha *= fadeIn;

        // grow existing cells toward target size + animate motion (swimming / wobble)
        for (const cell of colony.cells) {
          cell.radius += (cell.targetRadius - cell.radius) * colony.growthRate;
          cell.length += (cell.targetLength - cell.length) * colony.growthRate;

          // organic wobble — every bacterium drifts and oscillates subtly
          cell.wobblePhase += cell.wobbleSpeed;
          const wob = Math.sin(cell.wobblePhase);
          cell.x += cell.vx + wob * 0.15;
          cell.y += cell.vy + Math.cos(cell.wobblePhase * 1.3) * 0.12;

          // friction so they don't drift too far
          cell.vx *= 0.97;
          cell.vy *= 0.97;
          // tiny random impulse to keep them alive
          if (Math.random() < 0.04) {
            cell.vx += rand(-0.08, 0.08);
            cell.vy += rand(-0.08, 0.08);
          }
          // rods/vibrios/spirilli — slight angle rotation so they swim like real bacilli
          if (cell.shape !== "coccus") {
            cell.angle += wob * 0.012;
          }

          // cursor reaction: push cells away from mouse pointer (perturbation)
          if (mouseInside) {
            const dxm = cell.x - mouseX;
            const dym = cell.y - mouseY;
            const dm = Math.hypot(dxm, dym);
            const REACT_RADIUS = 70;
            if (dm < REACT_RADIUS && dm > 0.01) {
              const force = (1 - dm / REACT_RADIUS) * 0.9;
              cell.vx += (dxm / dm) * force;
              cell.vy += (dym / dm) * force;
              if (cell.shape !== "coccus") {
                cell.angle += rand(-0.08, 0.08);
              }
            }
          }
        }

        // occasionally bud off a new cell from an existing one (binary fission)
        if (
          colony.cells.length < colony.maxCells &&
          colony.age < colony.life * 0.6 &&
          Math.random() < 0.35
        ) {
          const parent = colony.cells[Math.floor(Math.random() * colony.cells.length)];
          // bud at parent's tip for rods/vibrio (chain formation)
          let nx;
          let ny;
          if (parent.shape === "coccus") {
            const a = rand(0, Math.PI * 2);
            const d = rand(parent.radius * 1.2, parent.radius * 2.0);
            nx = parent.x + Math.cos(a) * d;
            ny = parent.y + Math.sin(a) * d;
          } else {
            const tipSign = Math.random() < 0.5 ? -1 : 1;
            const tipDist = parent.length * 0.55 * tipSign + rand(-1.5, 1.5);
            nx = parent.x + Math.cos(parent.angle) * tipDist + rand(-2, 2);
            ny = parent.y + Math.sin(parent.angle) * tipDist + rand(-2, 2);
          }
          if (Math.hypot(nx - colony.cx, ny - colony.cy) < colony.spreadRadius) {
            const child = makeCell(nx, ny, colony.scale, colony.shape);
            // child rods often share parent orientation (chain look)
            if (colony.shape === "rod" || colony.shape === "vibrio") {
              child.angle = parent.angle + rand(-0.4, 0.4);
            }
            colony.cells.push(child);
          }
        }

        const { hue, sat, light } = colony.palette;

        // soft halo behind colony
        const haloR = colony.spreadRadius * 0.9;
        const grad = ctx.createRadialGradient(
          colony.cx,
          colony.cy,
          haloR * 0.1,
          colony.cx,
          colony.cy,
          haloR,
        );
        grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.14})`);
        grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(colony.cx, colony.cy, haloR, 0, Math.PI * 2);
        ctx.fill();

        const bodyColor = `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.72})`;
        const haloColor = `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.18})`;
        const hlColor = `hsla(${hue}, ${Math.max(0, sat - 20)}%, ${Math.min(100, light + 22)}%, ${alpha * 0.85})`;

        // individual bacteria cells — shape-specific drawing
        for (const cell of colony.cells) {
          if (cell.shape === "coccus") {
            // round bacterium with halo + highlight
            ctx.beginPath();
            ctx.arc(cell.x, cell.y, cell.radius + 1, 0, Math.PI * 2);
            ctx.fillStyle = haloColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
            ctx.fillStyle = bodyColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(
              cell.x - cell.radius * 0.3,
              cell.y - cell.radius * 0.3,
              Math.max(0.3, cell.radius * 0.35),
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = hlColor;
            ctx.fill();
          } else if (cell.shape === "rod") {
            // capsule-shaped (bacillus)
            ctx.save();
            ctx.translate(cell.x, cell.y);
            ctx.rotate(cell.angle);
            // halo capsule
            const halfL = cell.length / 2;
            const r = cell.radius;
            ctx.fillStyle = haloColor;
            ctx.beginPath();
            ctx.moveTo(-halfL, -(r + 0.6));
            ctx.lineTo(halfL, -(r + 0.6));
            ctx.arc(halfL, 0, r + 0.6, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(-halfL, r + 0.6);
            ctx.arc(-halfL, 0, r + 0.6, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            // body capsule
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(-halfL, -r);
            ctx.lineTo(halfL, -r);
            ctx.arc(halfL, 0, r, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(-halfL, r);
            ctx.arc(-halfL, 0, r, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            // inner shine along length
            ctx.fillStyle = hlColor;
            ctx.beginPath();
            ctx.ellipse(-halfL * 0.2, -r * 0.45, halfL * 0.55, r * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (cell.shape === "vibrio") {
            // curved rod
            ctx.save();
            ctx.translate(cell.x, cell.y);
            ctx.rotate(cell.angle);
            const halfL = cell.length / 2;
            const curve = (cell.curve || 0.8) * cell.length * 0.3;

            // halo
            ctx.strokeStyle = haloColor;
            ctx.lineWidth = (cell.radius + 0.7) * 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(-halfL, 0);
            ctx.quadraticCurveTo(0, curve, halfL, 0);
            ctx.stroke();

            // body
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = cell.radius * 2;
            ctx.beginPath();
            ctx.moveTo(-halfL, 0);
            ctx.quadraticCurveTo(0, curve, halfL, 0);
            ctx.stroke();

            // highlight
            ctx.strokeStyle = hlColor;
            ctx.lineWidth = Math.max(0.4, cell.radius * 0.9);
            ctx.beginPath();
            ctx.moveTo(-halfL * 0.6, -cell.radius * 0.25);
            ctx.quadraticCurveTo(0, curve * 0.6, halfL * 0.6, -cell.radius * 0.25);
            ctx.stroke();
            ctx.restore();
          } else if (cell.shape === "spirillum") {
            // corkscrew / spiral
            ctx.save();
            ctx.translate(cell.x, cell.y);
            ctx.rotate(cell.angle);
            const halfL = cell.length / 2;
            const turns = cell.turns || 2;
            const amp = cell.amp || 2;
            const steps = 26;

            // halo
            ctx.strokeStyle = haloColor;
            ctx.lineWidth = (cell.radius + 0.7) * 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            for (let s = 0; s <= steps; s += 1) {
              const t = s / steps;
              const px = -halfL + cell.length * t;
              const py = Math.sin(t * turns * Math.PI * 2) * amp;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // body
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = cell.radius * 2;
            ctx.beginPath();
            for (let s = 0; s <= steps; s += 1) {
              const t = s / steps;
              const px = -halfL + cell.length * t;
              const py = Math.sin(t * turns * Math.PI * 2) * amp;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        if (colony.age >= colony.life) {
          colonies.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="bacteria-colonies-canvas" aria-hidden="true" />;
}
