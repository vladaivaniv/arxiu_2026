import ShuffleText from "./ShuffleText.jsx";
import WebcamAscii from "./WebcamAscii.jsx";
import WordMask from "./WordMask.jsx";

export default function HeroSection() {
  return (
    <section className="hero-section horizontal-panel">
      <div className="hero-logo" aria-hidden="true">
        <img src="/logo-ddtec-blanc.png" alt="" className="hero-logo-image" />
      </div>

      <WebcamAscii />
      <div className="word-mask">
        <WordMask text="art" letterSpacing={0} textScale={2.18} />
      </div>

      <div className="copy copy-left">
        <ShuffleText text="COL.LECCIO DE" delay={200} interval={2600} />
        <ShuffleText text="PROJECTES ARTISTICS" delay={500} interval={3000} />
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
          <ShuffleText
            as="span"
            className="hero-scroll-copy"
            text="Per descobrir"
            delay={1000}
            interval={4000}
          />
          <ShuffleText
            as="span"
            className="hero-scroll-copy"
            text="el que hem creat"
            delay={1000}
            interval={2000}
          />
        </div>
      </div>
    </section>
  );
}
