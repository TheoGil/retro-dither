import { Vector2 } from "three";

const settings = {
  // Must be a multiple of 2 as pixelisation effect only works with multiples of 2
  // https://github.com/pmndrs/postprocessing/blob/main/src/effects/PixelationEffect.js#L68
  granularity: 2,
  brightness: 0.43,
  contrast: 0.14,
  foregroundColor: "#31ff57",
  backgroundColor: "#242424",
  bloom: {
    threshold: 0.75,
    smoothing: 0.08,
    intensity: 1.8,
    scale: 1.5,
  },
  noise: {
    threshold: 0.995,
    opacity: 0.35,
  },
  vignette: {
    offset: 0.5,
    darkness: 0.5,
  },
  chromaticAberration: {
    offset: new Vector2(0.1, 0),
    radialModulation: true,
    modulationOffset: 0.5,
  },
};

export { settings };
