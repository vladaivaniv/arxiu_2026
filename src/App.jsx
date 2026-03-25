import { useEffect, useRef } from "react";
import ShuffleText from "./components/ShuffleText.jsx";
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
          <WordMask text="art" letterSpacing={0.2} textScale={2.18} />
        </div>

        <div className="copy copy-left">
          <ShuffleText text="COL.LECCIO DE" delay={200} interval={2600} />
          <ShuffleText text="PROJECTES ARTISTICS" delay={500} interval={3000} />
        </div>

        <div className="copy copy-right">
          <ShuffleText
            text="UN ESPAI DIGITAL QUE REUNEIX ELS PROJECTES DESENVOLUPATS A LES"
            delay={700}
            interval={3600}
          />
          <ShuffleText
            text="ASSIGNATURES D'ART I CULTURA DIGITAL I LABORATORI DE CREACIONS"
            delay={1000}
            interval={3900}
          />
          <ShuffleText text="ARTISTIQUES." delay={1300} interval={3200} />
          <ShuffleText
            text="AQUI S'HI RECULL MATERIAL VISUAL, AUDIOVISUAL I INFORMACIO SOBRE CADA"
            delay={1600}
            interval={4100}
          />
          <ShuffleText
            text="PROPOSTA I ELS SEUS AUTORS."
            delay={1900}
            interval={3400}
          />
        </div>
      </section>
    </main>
  );
}
