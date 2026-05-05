import { useEffect } from "react";

export default function useNoiseLayer(noiseRef) {
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
  }, [noiseRef]);
}
