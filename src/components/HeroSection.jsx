import ShuffleText from "./ShuffleText.jsx";
import WebcamAscii from "./WebcamAscii.jsx";
import WordMask from "./WordMask.jsx";

export default function HeroSection() {
  return (
    <section className="hero-section horizontal-panel">
      <WebcamAscii />
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
  );
}
