import { useEffect, useState } from "react";

export default function BackToStartButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      // visible after the first viewport, but HIDDEN when the ending page is the dominant panel
      const scrolledEnough = window.scrollY > window.innerHeight * 0.6;
      const ending = document.querySelector(".ending-section");
      let onEnding = false;
      if (ending) {
        const r = ending.getBoundingClientRect();
        const overlap = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
        onEnding = overlap > window.innerWidth * 0.6;
      }
      setVisible(scrolledEnough && !onEnding);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const handleClick = () => {
    const lenis = window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      className={`back-to-start-btn${visible ? " is-visible" : ""}`}
      onClick={handleClick}
      aria-label="Tornar al començament"
      title="Tornar al començament"
    >
      <span className="back-to-start-icon" aria-hidden="true">←</span>
    </button>
  );
}
