import WordMask from "./components/WordMask.jsx";

export default function App() {
  return (
    <main className="landing-shell">
      <div className="noise-layer" aria-hidden="true" />
      <div className="scanline-layer" aria-hidden="true" />

      <section className="hero-section">
        <div className="word-mask">
          <WordMask />
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