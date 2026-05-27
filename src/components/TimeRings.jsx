import { useEffect, useRef } from "react";

export default function TimeRings() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;

    // A "stroke" is a single continuous engraved line traced by the cursor.
    // It accumulates points while the cursor moves, and fades over time after it ends.
    const strokes = [];
    let activeStroke = null;
    let lastX = -1;
    let lastY = -1;
    let lastMoveTime = 0;
    const STROKE_BREAK_MS = 220; // gap between movements that starts a new line

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

    const newStroke = () => {
      // Each stroke is a "brush" of many parallel sub-strands, like a wire brush
      // dragged across metal — producing a dense flowing pattern of fine lines.
      const strandCount = 10 + Math.floor(Math.random() * 8); // 10-17 sub-strands
      const strandSpacing = rand(0.7, 1.4);
      const strands = [];
      for (let s = 0; s < strandCount; s += 1) {
        strands.push({
          offset: (s - strandCount / 2) * strandSpacing + rand(-0.25, 0.25),
          phase: Math.random() * 1000,
          width: rand(0.32, 0.55),
          alpha: rand(0.55, 1),
          wobbleAmp: rand(0.4, 1.1),
          wobbleFreq: rand(0.05, 0.13),
        });
      }
      return {
        points: [],
        strands,
        age: 0,
        maxAge: 60 + Math.floor(rand(0, 25)),
        finished: false,
      };
    };

    const beginStroke = () => {
      activeStroke = newStroke();
      strokes.push(activeStroke);
    };

    const finishStroke = () => {
      if (activeStroke) {
        activeStroke.finished = true;
        activeStroke = null;
      }
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) {
        finishStroke();
        lastX = -1;
        lastY = -1;
        return;
      }

      const now = performance.now();
      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);

      // Start a new stroke if no active one, or after a pause, or after re-entering
      const needNewStroke =
        !activeStroke ||
        lastX < 0 ||
        now - lastMoveTime > STROKE_BREAK_MS;

      if (needNewStroke) {
        finishStroke();
        beginStroke();
        activeStroke.points.push({ x: px, y: py });
      } else {
        // Interpolate intermediate points so fast cursor still produces a continuous line
        const dx = px - lastX;
        const dy = py - lastY;
        const dist = Math.hypot(dx, dy);
        const step = 3; // px per sub-point for smoothness
        const steps = Math.max(1, Math.floor(dist / step));
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          activeStroke.points.push({ x: lastX + dx * t, y: lastY + dy * t });
        }
      }
      lastX = px;
      lastY = py;
      lastMoveTime = now;
    };

    const onLeave = () => {
      finishStroke();
      lastX = -1;
      lastY = -1;
    };

    const onClick = (e) => {
      // a click creates a tiny anchor mark
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
      finishStroke();
      const tick = newStroke();
      const len = rand(8, 16);
      const angle = rand(0, Math.PI);
      tick.points.push(
        { x: px - Math.cos(angle) * len, y: py - Math.sin(angle) * len },
        { x: px, y: py },
        { x: px + Math.cos(angle) * len, y: py + Math.sin(angle) * len },
      );
      tick.finished = true;
      strokes.push(tick);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    // periodic check: end stroke if cursor stopped moving for a while
    const idleTimer = window.setInterval(() => {
      if (
        activeStroke &&
        performance.now() - lastMoveTime > STROKE_BREAK_MS
      ) {
        finishStroke();
      }
    }, 80);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = strokes.length - 1; i >= 0; i -= 1) {
        const s = strokes[i];
        // active strokes don't age; finished ones do
        if (s.finished) s.age += 1;

        // alpha: fade out only after stroke is finished
        let alpha = 1;
        if (s.finished) {
          const fadeStart = s.maxAge - 30;
          if (s.age > fadeStart) {
            alpha = Math.max(0, 1 - (s.age - fadeStart) / 30);
          }
        }

        const pts = s.points;
        if (pts.length < 2) continue;

        // For each cursor point, compute the local perpendicular axis so the brush strands
        // remain parallel to the motion (like real engraved grooves).
        const perps = pts.map((p, idx) => {
          const prev = pts[Math.max(0, idx - 1)];
          const next = pts[Math.min(pts.length - 1, idx + 1)];
          const tx = next.x - prev.x;
          const ty = next.y - prev.y;
          const tl = Math.hypot(tx, ty) || 1;
          return { perpX: -ty / tl, perpY: tx / tl };
        });

        // Draw each strand as its own continuous line, offset perpendicular to the trail
        for (const strand of s.strands) {
          ctx.beginPath();
          for (let idx = 0; idx < pts.length; idx += 1) {
            const p = pts[idx];
            const { perpX, perpY } = perps[idx];
            // organic wobble on top of base offset (dual freq)
            const wob =
              Math.sin(strand.phase + idx * strand.wobbleFreq) * strand.wobbleAmp +
              Math.sin(strand.phase * 1.7 + idx * strand.wobbleFreq * 3.3) * (strand.wobbleAmp * 0.35);
            const off = strand.offset + wob;
            const x = p.x + perpX * off;
            const y = p.y + perpY * off;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `hsla(210, 12%, 92%, ${alpha * strand.alpha * 0.85})`;
          ctx.lineWidth = strand.width;
          ctx.shadowColor = `hsla(210, 18%, 80%, ${alpha * 0.25})`;
          ctx.shadowBlur = 0.8;
          ctx.stroke();
        }

        if (s.finished && s.age >= s.maxAge) {
          strokes.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearInterval(idleTimer);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="time-rings-canvas" aria-hidden="true" />;
}
