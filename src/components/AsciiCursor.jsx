import { useEffect, useRef } from "react";

export default function AsciiCursor() {
  const cursorRef = useRef(null);
  const posRef = useRef({ x: -999, y: -999 });
  const frameRef = useRef(0);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onLeave = () => {
      posRef.current = { x: -999, y: -999 };
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    const tick = () => {
      frameRef.current = requestAnimationFrame(tick);
      const { x, y } = posRef.current;

      if (x < 0) {
        el.style.opacity = "0";
        return;
      }

      el.style.opacity = "1";
      el.style.transform = `translate(${x}px, ${y}px)`;
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="ascii-cursor"
      aria-hidden="true"
    />
  );
}
