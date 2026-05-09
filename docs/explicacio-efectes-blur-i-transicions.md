# Efectes de blur i activació després de la Hero

Aquest document explica quins efectes visuals s'apliquen al projecte, com es construeixen a nivell de codi i com es controla que no apareguin fins que l'usuari ha superat la pantalla `HeroSection` i entra a `ArchiveIntroSection`.

## 1. Ordre de les pantalles dins del track horitzontal

A [`src/App.jsx`](/Users/satus/Desktop/VLADA/paralax/src/App.jsx:75) l'ordre dels panells és:

1. `HeroSection`
2. `ArchiveIntroSection`
3. `WorksSection`

Tots tres viuen dins de `.horizontal-track`, que és el contenidor que es desplaça horitzontalment mentre l'usuari fa scroll vertical.

## 2. L'efecte global de transició entre panells

La transició general es defineix a [`src/hooks/useHorizontalScroll.js`](/Users/satus/Desktop/VLADA/paralax/src/hooks/useHorizontalScroll.js:124).

Per a cada `.horizontal-panel` s'aplica aquesta animació:

```js
gsap.fromTo(
  panel,
  { filter: "blur(0px)", scale: 1 },
  {
    filter: "blur(8px)",
    scale: 0.97,
    ease: "power2.in",
    scrollTrigger: {
      trigger: panel,
      containerAnimation: mainTween,
      start: "left left",
      end: "right left",
      scrub: true,
    },
  }
);
```

### Què fa exactament

- `filter: "blur(0px)"` inicia el panell completament nítid.
- `filter: "blur(8px)"` augmenta el desenfocament a mesura que el panell surt del viewport.
- `scale: 0.97` redueix lleugerament l'escala perquè la sortida sigui més suau.
- `scrub: true` fa que el progrés de l'animació segueixi directament el scroll.
- `containerAnimation: mainTween` indica que el càlcul no es fa sobre scroll vertical normal, sinó sobre el desplaçament horitzontal generat per `mainTween`.

Aquest efecte és global: afecta qualsevol secció que tingui la classe `.horizontal-panel`.

## 3. L'entrada específica de `ArchiveIntroSection`

L'efecte d'entrada propi d'aquesta secció es defineix a [`src/components/ArchiveIntroSection.jsx`](/Users/satus/Desktop/VLADA/paralax/src/components/ArchiveIntroSection.jsx:73).

La idea és:

- la secció entra amb `opacity`, `scale` i `blur`
- l'animació no depèn d'un `translateX` o `translateY`
- el progrés es calcula segons la posició real de la secció dins del track horitzontal

El fragment clau és:

```js
const scrollX = totalDistance * self.progress;
const sectionLeft = section.offsetLeft;
const sectionWidth = section.offsetWidth;
const localProgress =
  (scrollX - sectionLeft + window.innerWidth) / (sectionWidth + window.innerWidth);
const clamped = Math.max(0, Math.min(1, localProgress));
```

### Què representa `localProgress`

Aquest valor converteix la posició actual del scroll en un progrés local de la secció:

- `0` vol dir que la secció encara no ha entrat realment
- `1` vol dir que la secció ja ha recorregut tot el tram previst

El `clamped` limita el valor entre `0` i `1`, evitant números negatius o superiors a `1`.

Després s'aplica una corba suau:

```js
const smoothstep = (t) => t * t * (3 - 2 * t);
const ep = smoothstep(Math.min(1, clamped / 0.55));
```

### Per què es fa servir `smoothstep`

Perquè l'entrada no sigui lineal ni brusca. Aquesta funció accelera i frena suaument, fent que el `blur` desaparegui amb més qualitat visual.

## 4. Com es genera el blur de `ArchiveIntroSection`

El `blur` real surt d'aquí:

```js
const blurPx = (1 - ep) * 12;
const sc = 0.94 + ep * 0.06;

gsap.set(layout, {
  opacity: ep,
  scale: sc,
  filter: `blur(${blurPx.toFixed(2)}px)`,
  x: 0,
  y: 0,
});
```

### Lectura visual del càlcul

- Quan `ep = 0`
  - `opacity = 0`
  - `scale = 0.94`
  - `blur = 12px`
- Quan `ep = 1`
  - `opacity = 1`
  - `scale = 1`
  - `blur = 0px`

Per tant, la secció comença desenfocada i lleugerament petita, i es va definint a mesura que entra.

## 5. Per què l'efecte no s'activa fins després de la Hero

La clau és que `ArchiveIntroSection` calcula el seu progrés respecte a la seva pròpia posició (`section.offsetLeft`) dins del track.

Com que a [`src/App.jsx`](/Users/satus/Desktop/VLADA/paralax/src/App.jsx:75) la `HeroSection` va abans, mentre l'usuari encara està dins la `hero`:

- `scrollX` encara no ha arribat a la posició d'`ArchiveIntroSection`
- `localProgress` queda molt baix o negatiu
- `clamped` es manté a `0`
- el contingut continua amb l'estat inicial del blur

És a dir: l'efecte no s'activa amb un "if hero acabada", sinó perquè la fórmula de progrés encara no considera que la secció hagi entrat.

## 6. El punt concret on comença a aparèixer el contingut

Aquesta línia accelera l'entrada només durant el primer 55% del progrés útil:

```js
const ep = smoothstep(Math.min(1, clamped / 0.55));
```

Això vol dir:

- mentre `clamped` és molt petit, el blur encara domina
- quan `clamped` arriba aproximadament a `0.55`, l'entrada principal pràcticament ja s'ha completat

També hi ha l'activació del text animat:

```js
if (ep > 0.1) setTypingActive(true);
```

Per tant, el text no comença a escriure's immediatament quan la secció existeix, sinó només quan la capa visual ja ha començat a fer-se visible.

## 7. Diferència amb `SectionDivider`

Inicialment `SectionDivider` funcionava diferent, però ara s'ha adaptat perquè la pantalla de `PROJECTES TREPAT` entri amb el mateix llenguatge visual que `ArchiveIntroSection`.

La diferència important és que, en aquest cas, l'efecte ja no s'aplica només al contingut interior, sinó a tota la superfície visual de la pàgina.

## 8. Com funciona ara l'entrada de `PROJECTES TREPAT`

A [`src/components/SectionDivider.jsx`](/Users/satus/Desktop/VLADA/paralax/src/components/SectionDivider.jsx:1) s'ha creat una capa completa:

```jsx
<div ref={surfaceRef} className="section-divider-surface">
  ...
</div>
```

Aquesta `surface` ocupa tot el viewport del divider i és la que rep el desenfocament global d'entrada. D'aquesta manera, la pantalla sencera de `PROJECTES TREPAT` queda visualment "tapada" fins que realment entra bé en escena.

El càlcul principal és aquest:

```js
const ep = smoothstep(Math.min(1, Math.max(0, (clamped - 0.08) / 0.62)));
const surfaceBlur = (1 - ep) * 16;
const surfaceScale = 0.94 + ep * 0.06;
```

I s'aplica així:

```js
gsap.set(surface, {
  opacity: ep,
  scale: surfaceScale,
  filter: `blur(${surfaceBlur.toFixed(2)}px)`,
  x: 0,
  y: 0,
});
```

### Lectura visual

- al principi, tota la pàgina entra amb `opacity: 0`, `scale: 0.94` i `blur: 16px`
- quan el progrés puja, la pàgina recupera nitidesa
- només quan `ep` s'acosta a `1`, la pantalla es veu completament clara

Això fa que el pas `Arxiu 2026 -> Projectes Trepat` tingui la mateixa lògica d'entrada progressiva que la secció anterior, però aplicada a nivell de pàgina completa.

## 9. Els elements que es mouen no s'activen fins que la pàgina ja està mostrada

Una part important del comportament nou és que els elements amb moviment propi no poden començar massa aviat.

Per això s'ha introduït un estat específic:

```js
const [motionReady, setMotionReady] = useState(false);
```

I dins del `ScrollTrigger`:

```js
if (ep > 0.98) {
  setMotionReady(true);
  setTypingActive(true);
} else {
  setMotionReady(false);
  setTypingActive(false);
}
```

### Què vol dir això

- mentre la pàgina encara entra amb blur, `motionReady` és `false`
- quan la pàgina està pràcticament completament visible, `motionReady` passa a `true`
- només a partir d'aquell punt s'encenen els elements animats

És una separació clara entre:

- `mostrar la pàgina`
- `activar el moviment intern de la pàgina`

## 10. Quins elements queden bloquejats fins al final de l'entrada

Els elements que ara depenen de `motionReady` són:

- `ShuffleText` dels títols principals
- `FloatingTitles`
- `AsciiScatter`
- la línia ASCII `.section-divider-line`
- el `TypeLine` del subtítol

Exemple dels títols:

```jsx
<ShuffleText
  text={line}
  trigger={motionReady}
/>
```

Exemple dels fons flotants:

```jsx
<AsciiScatter fullSpread count={25} maxOpacity={0.18} active={motionReady} />
<FloatingTitles active={motionReady} />
```

I la línia CSS queda pausada fins que la classe de desbloqueig apareix:

```css
.section-divider-line {
  animation-play-state: paused;
}

.section-divider-line.is-motion-ready {
  animation-play-state: running;
}
```

## 11. Per què aquesta separació és important

Sense aquest control, els textos i ornaments en moviment podien començar a animar-se mentre la pantalla encara estava entrant i desenfocant-se.

El problema visual era aquest:

- la pàgina encara no era llegible
- però alguns elements ja es movien
- això feia que la transició semblés menys precisa

Amb el nou sistema, primer es resol la presència completa de la pàgina i només després arrenca la capa de moviment.

## 12. Resum curt del mecanisme

- `useHorizontalScroll` crea el desplaçament horitzontal general del lloc.
- Cada secció calcula el seu progrés local amb `scrollX`, `offsetLeft` i `offsetWidth`.
- `ArchiveIntroSection` transforma aquest progrés en `opacity`, `scale` i `filter: blur(...)`.
- `SectionDivider` fa el mateix sobre una capa de pàgina completa (`section-divider-surface`).
- Els elements amb moviment intern no s'activen fins que `motionReady === true`.
- Com que la `hero` està abans dins del track, el blur d'`ArchiveIntroSection` no comença a resoldre's fins que el scroll ja ha avançat més enllà de la primera pantalla.

## 13. Si es vol fer encara més estricte

Si es volgués que `ArchiveIntroSection` no comencés absolutament cap efecte fins que la `HeroSection` hagués desaparegut del tot, es podria introduir un llindar extra abans de calcular `ep`, per exemple:

```js
const delayedProgress = Math.max(0, clamped - 0.15);
const ep = smoothstep(Math.min(1, delayedProgress / 0.4));
```

Això desplaçaria l'inici visual una mica més endavant, fent que el blur es mantingui més temps abans de començar a desaparèixer.
