import { useEffect, useRef } from "react";

const GLYPHS = "·░▒▓█▄▀|/\\+=-:.,:;*#%0123456789TAR!?[]{}XIS";
const COUNT = 100;
const PUSH_RADIUS = 80; // px

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function cornerPos() {
  const c = Math.random();
  if (c < 0.38) return { x: rand(0, 24),   y: rand(0, 30),   size: 8 };
  if (c < 0.72) return { x: rand(76, 100), y: rand(0, 30),   size: 7 };
  if (c < 0.86) return { x: rand(0, 22),   y: rand(72, 100), size: 8 };
  return              { x: rand(78, 100),  y: rand(72, 100), size: 7 };
}

function fullPos() {
  return { x: rand(2, 98), y: rand(2, 98), size: rand(7, 11) };
}

function makeChar(spread) {
  const pos = spread ? fullPos() : cornerPos();
  return {
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    hx: pos.x, hy: pos.y,   // home position (%)
    ox: 0, oy: 0,            // spring offset (px)
    vox: 0, voy: 0,          // spring velocity
    size: pos.size,
    opacity: 0,
    targetOpacity: 0,
    fadeSpeed: rand(0.008, 0.022),
    glyphTimer: rand(300, 3000),
    nextFlip: rand(0, 5000),
    maxOp: rand(0.22, 0.38),
  };
}

export default function AsciiScatter({ fullSpread = false, count = COUNT, maxOpacity }) {
  const containerRef = useRef(null);
  const charsRef = useRef(Array.from({ length: count }, () => makeChar(fullSpread)));
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans = Array.from(container.querySelectorAll("span"));

    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    // attach to parent section so we get mouse even when over other elements
    const section = container.closest(".hero-section, .section-divider, .horizontal-panel") || container;
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    const tick = (ts) => {
      rafRef.current = requestAnimationFrame(tick);
      const dt = Math.min(ts - lastRef.current, 50);
      lastRef.current = ts;

      const W = container.offsetWidth  || window.innerWidth;
      const H = container.offsetHeight || window.innerHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      charsRef.current.forEach((ch, i) => {
        // world px position of char's home
        const hpx = ch.hx / 100 * W;
        const hpy = ch.hy / 100 * H;
        // current screen pos (home + spring offset)
        const cpx = hpx + ch.ox;
        const cpy = hpy + ch.oy;

        // spring force toward home
        const springK = 0.12;
        const damping  = 0.78;
        let ax = -ch.ox * springK;
        let ay = -ch.oy * springK;

        // push force from cursor
        const dx = cpx - mx;
        const dy = cpy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PUSH_RADIUS && dist > 0.1) {
          const strength = (1 - dist / PUSH_RADIUS) * 18;
          ax += (dx / dist) * strength;
          ay += (dy / dist) * strength;
        }

        ch.vox = (ch.vox + ax) * damping;
        ch.voy = (ch.voy + ay) * damping;
        ch.ox += ch.vox;
        ch.oy += ch.voy;

        // tremble: small random jitter each frame
        const jitter = ch.opacity > 0.05 ? rand(-0.4, 0.4) : 0;
        const jitterY = ch.opacity > 0.05 ? rand(-0.3, 0.3) : 0;

        const finalX = ch.hx + (ch.ox / W * 100);
        const finalY = ch.hy + (ch.oy / H * 100);

        if (spans[i]) {
          spans[i].style.left = `${finalX}%`;
          spans[i].style.top  = `${finalY}%`;
          spans[i].style.transform = `translate(${jitter}px, ${jitterY}px)`;
        }

        // glyph shuffle — faster when cursor is close
        const shuffleSpeed = dist < PUSH_RADIUS ? rand(30, 80) : rand(200, 1200);
        ch.glyphTimer -= dt;
        if (ch.glyphTimer <= 0) {
          ch.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          ch.glyphTimer = shuffleSpeed;
          if (spans[i]) spans[i].textContent = ch.glyph;
        }

        // fade in/out
        ch.nextFlip -= dt;
        if (ch.nextFlip <= 0) {
          const visible = Math.random() > 0.35;
          ch.targetOpacity = visible ? rand(0.1, ch.maxOp) : 0;
          ch.nextFlip = rand(600, 5000);
        }

        if (maxOpacity !== undefined && ch.targetOpacity > maxOpacity) ch.targetOpacity = maxOpacity;
        ch.opacity += (ch.targetOpacity - ch.opacity) * ch.fadeSpeed;
        if (spans[i]) spans[i].style.opacity = ch.opacity.toFixed(3);
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}
      aria-hidden="true"
    >
      {charsRef.current.map((ch, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${ch.hx}%`,
            top: `${ch.hy}%`,
            fontFamily: '"Space Mono", monospace',
            fontSize: `${ch.size}px`,
            color: "#FF0000",
            opacity: 0,
            lineHeight: 1,
            willChange: "transform",
          }}
        >
          {ch.glyph}
        </span>
      ))}
    </div>
  );
}
