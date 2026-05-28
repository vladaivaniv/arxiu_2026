import { useEffect, useState } from "react";

export default function NextPageButton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      // hide near the very end so we don't suggest "next" when there is none
      const maxY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setVisible(window.scrollY < maxY - 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    const track = document.querySelector(".horizontal-track");
    if (!track) return;
    const panels = Array.from(track.querySelectorAll(".horizontal-panel"));
    if (!panels.length) return;
    const trackRect = track.getBoundingClientRect();

    // Find the next panel whose left edge is past the current viewport's left (so it counts as "ahead")
    let targetEl = null;
    for (const panel of panels) {
      const r = panel.getBoundingClientRect();
      // a panel is "next" if its left is more than a few px past 0
      if (r.left > 12) {
        targetEl = panel;
        break;
      }
    }
    // if we can't find one ahead, go to the last panel
    if (!targetEl) targetEl = panels[panels.length - 1];

    const elRect = targetEl.getBoundingClientRect();
    const targetY = Math.max(0, elRect.left - trackRect.left);

    const lenis = window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(targetY, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      className={`next-page-btn${visible ? " is-visible" : ""}`}
      onClick={handleClick}
      aria-label="Anar a la pàgina següent"
      title="Següent"
    >
      <span className="next-page-icon" aria-hidden="true">→</span>
    </button>
  );
}
