import { useEffect, useRef } from "react";
import WordMask from "./components/WordMask.jsx";

export default function App() {
  const noiseRef = useRef(null);

  useEffect(() => {
    const noiseLayer = noiseRef.current;
    if (!noiseLayer) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeoutId = 0;

    const updateNoise = () => {
      const visible = Math.random() > 0.42;
      const opacity = visible ? 0.015 + Math.random() * 0.08 : 0;
      const offsetX = `${Math.floor(Math.random() * 220)}px`;
      const offsetY = `${Math.floor(Math.random() * 220)}px`;

      noiseLayer.style.setProperty("--noise-opacity", opacity.toFixed(3));
      noiseLayer.style.setProperty("--noise-offset-x", offsetX);
      noiseLayer.style.setProperty("--noise-offset-y", offsetY);

      const nextDelay = mediaQuery.matches
        ? 700 + Math.random() * 900
        : 70 + Math.random() * 240;

      timeoutId = window.setTimeout(updateNoise, nextDelay);
    };

    updateNoise();

    const handleMotionChange = () => {
      window.clearTimeout(timeoutId);
      updateNoise();
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.clearTimeout(timeoutId);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <main className="landing-shell">
      <div ref={noiseRef} className="noise-layer" aria-hidden="true" />
      <div className="scanline-layer" aria-hidden="true" />

      <section className="hero-section">
        <div className="word-mask">
          <WordMask text="art" letterSpacing={0.18} textScale={2.18} />
        </div>

        <div className="copy copy-left">
          <p>COL.LECCIO DE</p>
          <p>PROJECTES ARTISTICS</p>
        </div>

        <div className="copy copy-right">
          <p>UN ESPAI DIGITAL QUE REUNEIX ELS PROJECTES DESENVOLUPATS A LES</p>
          <p>ASSIGNATURES D&apos;ART I CULTURA DIGITAL I LABORATORI DE CREACIONS</p>
          <p>ARTISTIQUES.</p>
          <p>AQUI S&apos;HI RECULL MATERIAL VISUAL, AUDIOVISUAL I INFORMACIO SOBRE CADA</p>
          <p>PROPOSTA I ELS SEUS AUTORS.</p>
        </div>
      </section>
    </main>
  );
}
