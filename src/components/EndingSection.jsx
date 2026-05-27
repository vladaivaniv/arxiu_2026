import ShuffleText from "./ShuffleText.jsx";
import AsciiScatter from "./AsciiScatter.jsx";
import WebcamAscii from "./WebcamAscii.jsx";
import logoDdtec from "../../assets/logo-ddtec-blanc.png";

export default function EndingSection() {
  return (
    <section className="ending-section horizontal-panel">
      <AsciiScatter fullSpread count={30} maxOpacity={0.18} />
      <WebcamAscii color="255,30,30" />

      <div className="ending-logo" aria-hidden="true">
        <img
          src={logoDdtec.src ?? logoDdtec}
          alt="DDTEC"
          className="ending-logo-image"
        />
      </div>

      <div className="ending-content">
        <ShuffleText
          as="h2"
          className="ending-title works-title"
          text="[ GRÀCIES ]"
          delay={500}
          duration={900}
          interval={4200}
        />

        <div className="ending-credits-below">
          <ShuffleText
            as="span"
            className="ending-credit-line"
            text="DISSENY DIGITAL I TECNOLOGIES CREATIVES"
            delay={1100}
            duration={700}
            interval={6000}
          />
          <ShuffleText
            as="span"
            className="ending-credit-line ending-credit-author"
            text="WEB BY VLADA IVANIV"
            delay={1400}
            duration={700}
            interval={6500}
          />
        </div>
      </div>

      <div className="ending-corner ending-corner--tl" aria-hidden="true">[ FI DEL TRAJECTE ]</div>
    </section>
  );
}
