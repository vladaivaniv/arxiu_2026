import { useEffect, useRef } from "react";

const SCRAP_COLORS = [
  "#3a2418", // òxid fosc
  "#52301c", // òxid mig
  "#6b3a1d", // òxid clar
  "#2c1d12", // ferralla
];

const GOLD = "#d4a13b";
const GOLD_BRIGHT = "#ffe19a";

export default function ScrapGold() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let prev = performance.now();
    let lastTransform = 0;
    let mx = -9999;
    let my = -9999;
    let active = false;

    const fragments = [];

    const buildFragments = () => {
      fragments.length = 0;
      const count = 58;
      for (let i = 0; i < count; i += 1) {
        fragments.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          size: 2 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.0008,
          color: SCRAP_COLORS[Math.floor(Math.random() * SCRAP_COLORS.length)],
          // estats: 'scrap' | 'morphing' | 'gold' | 'fading'
          state: "scrap",
          stateAt: 0,
          shape: Math.random() < 0.5 ? "shard" : "polygon",
          jewel: null,
        });
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fragments.length === 0) buildFragments();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        active = false;
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
      active = true;
    };

    document.addEventListener("mousemove", onMove);

    const pickJewelShape = () => {
      const shapes = ["ring", "diamond", "star", "drop"];
      return shapes[Math.floor(Math.random() * shapes.length)];
    };

    const startTransform = (f, now) => {
      f.state = "morphing";
      f.stateAt = now;
      f.jewel = pickJewelShape();
    };

    const drawScrap = (f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.fillStyle = f.color;
      const s = f.size;
      if (f.shape === "shard") {
        ctx.beginPath();
        ctx.moveTo(-s, -s * 0.3);
        ctx.lineTo(s, -s * 0.6);
        ctx.lineTo(s * 0.6, s * 0.3);
        ctx.lineTo(-s * 0.5, s);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawJewel = (f, brightness) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);

      // glow halo (molt més suau)
      const haloR = f.size * (1.8 + brightness * 1.4);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
      grad.addColorStop(0, `rgba(255, 220, 130, ${(0.15 * brightness).toFixed(3)})`);
      grad.addColorStop(0.6, `rgba(212, 161, 59, ${(0.05 * brightness).toFixed(3)})`);
      grad.addColorStop(1, "rgba(212, 161, 59, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fill();

      const s = f.size * 1.3;

      // gradient daurat
      const metalGrad = ctx.createLinearGradient(-s, -s, s, s);
      metalGrad.addColorStop(0, "#fff0c0");
      metalGrad.addColorStop(0.45, "#e6b94c");
      metalGrad.addColorStop(0.75, "#a87a1f");
      metalGrad.addColorStop(1, "#7a5212");

      const gemGrad = ctx.createLinearGradient(-s * 0.4, -s * 0.5, s * 0.4, s * 0.5);
      gemGrad.addColorStop(0, "#fff8da");
      gemGrad.addColorStop(0.4, "#ffd66a");
      gemGrad.addColorStop(1, "#a06c12");

      // ── ganxo d'arracada (sempre dalt) ──
      ctx.strokeStyle = "#a87a1f";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, -s * 1.35, s * 0.18, Math.PI * 0.2, Math.PI * 1.0);
      ctx.stroke();
      // anella de subjecció
      ctx.beginPath();
      ctx.arc(0, -s * 1.15, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.9;

      if (f.jewel === "ring") {
        // arracada criolla / aro
        ctx.strokeStyle = "#a87a1f";
        ctx.lineWidth = s * 0.18;
        ctx.beginPath();
        ctx.arc(0, s * 0.25, s * 0.95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#ffe8a0";
        ctx.lineWidth = s * 0.06;
        ctx.beginPath();
        ctx.arc(0, s * 0.25, s * 0.95, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      } else if (f.jewel === "diamond") {
        // arracada de pendent amb gemma
        ctx.strokeStyle = "#a87a1f";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.95);
        ctx.lineTo(0, -s * 0.35);
        ctx.stroke();
        // diamant
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.35);
        ctx.lineTo(s * 0.55, s * 0.1);
        ctx.lineTo(0, s * 0.95);
        ctx.lineTo(-s * 0.55, s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#7a5212";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // facetes
        ctx.strokeStyle = "#fff5d0";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, s * 0.1);
        ctx.lineTo(s * 0.55, s * 0.1);
        ctx.moveTo(0, -s * 0.35);
        ctx.lineTo(0, s * 0.95);
        ctx.stroke();
      } else if (f.jewel === "star") {
        // arracada de cluster (3 gemmes encadenades)
        ctx.strokeStyle = "#a87a1f";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.95);
        ctx.lineTo(0, -s * 0.5);
        ctx.stroke();
        // tres gemmes vertical
        for (let i = 0; i < 3; i += 1) {
          const cy = -s * 0.45 + i * s * 0.55;
          const r = s * (0.32 - i * 0.05);
          ctx.fillStyle = gemGrad;
          ctx.beginPath();
          ctx.arc(0, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#7a5212";
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.fillStyle = "rgba(255, 250, 220, 0.7)";
          ctx.beginPath();
          ctx.arc(-r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          // unió entre gemmes
          if (i < 2) {
            ctx.strokeStyle = "#a87a1f";
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, cy + r);
            ctx.lineTo(0, cy + s * 0.55 - s * (0.32 - (i + 1) * 0.05));
            ctx.stroke();
          }
        }
      } else {
        // arracada amb cadena + gota
        ctx.strokeStyle = "#a87a1f";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.95);
        ctx.lineTo(0, -s * 0.25);
        ctx.stroke();
        // baules de cadena
        for (let i = 0; i < 3; i += 1) {
          const cy = -s * 0.95 + i * s * 0.22;
          ctx.beginPath();
          ctx.arc(0, cy + s * 0.11, s * 0.06, 0, Math.PI * 2);
          ctx.stroke();
        }
        // gota
        ctx.fillStyle = metalGrad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.25);
        ctx.bezierCurveTo(s * 0.7, s * 0.05, s * 0.6, s * 0.95, 0, s * 1.05);
        ctx.bezierCurveTo(-s * 0.6, s * 0.95, -s * 0.7, s * 0.05, 0, -s * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#7a5212";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // reflex
        ctx.fillStyle = "rgba(255, 250, 220, 0.55)";
        ctx.beginPath();
        ctx.ellipse(-s * 0.2, s * 0.2, s * 0.13, s * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // espurna múltiple
      ctx.fillStyle = `rgba(255, 250, 220, ${(0.95 * brightness).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s * 0.55, -s * 0.45, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 250, 220, ${(0.5 * brightness).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(-s * 0.35, s * 0.15, s * 0.07, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const MORPH_MS = 600;
    const GOLD_MS = 2200;
    const FADE_MS = 1500;
    const TRANSFORM_INTERVAL = 280;
    const MOUSE_RADIUS = 90;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      ctx.clearRect(0, 0, width, height);

      // transformació automàtica periòdica
      if (now - lastTransform > TRANSFORM_INTERVAL) {
        const candidates = fragments.filter((f) => f.state === "scrap");
        if (candidates.length > 0) {
          const f = candidates[Math.floor(Math.random() * candidates.length)];
          startTransform(f, now);
          lastTransform = now;
        }
      }

      // mouse: tots els fragments propers al cursor són empesos
      if (active) {
        for (const f of fragments) {
          const dx = f.x - mx;
          const dy = f.y - my;
          const distSq = dx * dx + dy * dy;
          if (distSq < MOUSE_RADIUS_SQ) {
            const dist = Math.sqrt(distSq) || 1;
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 1.8;
            f.vx += (dx / dist) * force;
            f.vy += (dy / dist) * force;
            f.rotSpeed += (Math.random() - 0.5) * 0.0025;
            if (f.state === "scrap") startTransform(f, now);
          }
        }
      }

      for (const f of fragments) {
        f.x += f.vx * (dt / 16);
        f.y += f.vy * (dt / 16);
        f.rotation += f.rotSpeed * dt;
        // fricció gradual perquè les peces empeses tornin a calmar-se
        f.vx *= 0.96;
        f.vy *= 0.96;
        f.vx += ((Math.random() - 0.5) * 0.008);
        f.vy += ((Math.random() - 0.5) * 0.008);
        // recol·loca en sortir
        if (f.x < -10) f.x = width + 10;
        else if (f.x > width + 10) f.x = -10;
        if (f.y < -10) f.y = height + 10;
        else if (f.y > height + 10) f.y = -10;

        if (f.state === "scrap") {
          drawScrap(f);
        } else if (f.state === "morphing") {
          const t = (now - f.stateAt) / MORPH_MS;
          if (t >= 1) {
            f.state = "gold";
            f.stateAt = now;
          }
          // mostra el shard fos amb llum creixent
          const mix = Math.min(1, t);
          drawScrap(f);
          drawJewel(f, mix);
        } else if (f.state === "gold") {
          const t = (now - f.stateAt) / GOLD_MS;
          if (t >= 1) {
            f.state = "fading";
            f.stateAt = now;
          }
          drawJewel(f, 1);
        } else if (f.state === "fading") {
          const t = (now - f.stateAt) / FADE_MS;
          if (t >= 1) {
            f.state = "scrap";
            f.stateAt = now;
            f.color = SCRAP_COLORS[Math.floor(Math.random() * SCRAP_COLORS.length)];
            f.jewel = null;
          } else {
            const b = 1 - t;
            drawJewel(f, b);
            ctx.save();
            ctx.globalAlpha = t;
            drawScrap(f);
            ctx.restore();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="scrap-gold-canvas" aria-hidden="true" />;
}
