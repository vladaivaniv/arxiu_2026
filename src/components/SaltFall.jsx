import { useEffect, useRef } from "react";

export default function SaltFall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = [];
    let pile = null;
    const CELL = 2;
    let raf = 0;
    let width = 0;
    let height = 0;
    let emitAccum = 0;
    let mouseInside = false;
    let mx = 0;
    let my = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cells = Math.max(1, Math.ceil(width / CELL));
      pile = new Float32Array(cells);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (x, y) => {
      particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: Math.random() * 0.15 + 0.05,
        r: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.5 + 0.5,
      });
      if (particles.length > 1500) particles.splice(0, particles.length - 1500);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width ? canvas.clientWidth / rect.width : 1;
      const sy = rect.height ? canvas.clientHeight / rect.height : 1;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
      mouseInside = true;
    };
    const onLeave = () => {
      mouseInside = false;
    };

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);

    const pileHeightAt = (px) => {
      if (!pile) return 0;
      const idx = Math.max(0, Math.min(pile.length - 1, Math.floor(px / CELL)));
      return pile[idx];
    };

    const settle = (px, mass) => {
      if (!pile) return;
      const idx = Math.max(0, Math.min(pile.length - 1, Math.floor(px / CELL)));
      pile[idx] += mass;
    };

    // sand-pile relaxation: if a cell is taller than its neighbor by > slope, transfer
    const relaxPile = () => {
      if (!pile) return;
      const MAX_SLOPE = 1.6;
      for (let i = 0; i < pile.length - 1; i += 1) {
        const diff = pile[i] - pile[i + 1];
        if (diff > MAX_SLOPE) {
          const flow = (diff - MAX_SLOPE) * 0.25;
          pile[i] -= flow;
          pile[i + 1] += flow;
        } else if (-diff > MAX_SLOPE) {
          const flow = (-diff - MAX_SLOPE) * 0.25;
          pile[i + 1] -= flow;
          pile[i] += flow;
        }
      }
    };

    let prev = performance.now();
    const RATE_PER_MS = 0.12;

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;

      if (mouseInside) {
        emitAccum += dt * RATE_PER_MS;
        while (emitAccum >= 1) {
          spawn(mx, my);
          emitAccum -= 1;
        }
      } else {
        emitAccum = 0;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.vy += 0.005 * dt;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);

        const groundY = height * 0.82 - pileHeightAt(p.x);
        if (p.y >= groundY) {
          settle(p.x, 2.4);
          particles.splice(i, 1);
          continue;
        }
        if (p.x < 0 || p.x > width) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(245,245,245,${p.alpha.toFixed(3)})`;
        ctx.fillRect(p.x, p.y, p.r, p.r);
      }

      // relax pile a few times per frame for smoother slopes
      for (let r = 0; r < 2; r += 1) relaxPile();

      // draw pile
      const floorY = height * 0.82;
      if (pile && pile.length) {
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        for (let i = 0; i < pile.length; i += 1) {
          const x = i * CELL;
          const y = floorY - pile[i];
          if (i === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(width, floorY);
        ctx.closePath();
        ctx.fillStyle = "rgba(245,245,245,0.92)";
        ctx.fill();
        // subtle top highlight
        ctx.beginPath();
        for (let i = 0; i < pile.length; i += 1) {
          const x = i * CELL;
          const y = floorY - pile[i];
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="salt-fall-canvas" aria-hidden="true" />;
}
