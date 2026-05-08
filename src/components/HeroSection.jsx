import ShuffleText from "./ShuffleText.jsx";
import TypeLine from "./TypeLine.jsx";
import WebcamAscii from "./WebcamAscii.jsx";
import WordMask from "./WordMask.jsx";
import AsciiScatter from "./AsciiScatter.jsx";
import AsciiArrow from "./AsciiArrow.jsx";

export default function HeroSection() {
  return (
    <section className="hero-section horizontal-panel">
      <AsciiScatter />
      <div className="hero-logo" aria-hidden="true">
        <img src="/logo-ddtec-blanc.png" alt="" className="hero-logo-image" />
      </div>

      <WebcamAscii />
      <div className="word-mask hero-word-mask">
        <WordMask text="art" letterSpacing={0} textScale={2.18} colors={{ bright: "#FF0000", solid: "#FF0000", ghost: "#FF0000" }} />
      </div>

      <div className="copy copy-left">
        <TypeLine text="COL·LECCIÓ DE" delay={1200} speed={8} />
        <TypeLine text="PROJECTES ARTISTICS" delay={1600} speed={8} />
      </div>

      <div className="copy copy-right">
        <div className="hero-scroll-callout">
          <ShuffleText
            as="span"
            className="hero-scroll-label"
            text="[SCROLL]"
            delay={700}
            interval={3600}
            color="#fff"
          />
          <TypeLine as="span" className="hero-scroll-copy" text="Per descobrir" delay={2000} speed={8} />
          <TypeLine as="span" className="hero-scroll-copy" text="el que hem creat" delay={2400} speed={8} />
          <AsciiArrow className="hero-scroll-arrow" />
        </div>
      </div>
    </section>
  );
}
