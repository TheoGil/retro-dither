import { Texture, Uniform, Vector2 } from "three";
import { BlendFunction, Effect } from "postprocessing";

import fragmentShader from "../shaders/hardMixBlendPattern.fragment.glsl?raw";
import { settings } from "./settings";

class PatternOverlayFX extends Effect {
  resolution: Vector2;

  constructor(patternTexture: Texture) {
    const resolution = new Vector2();

    super("HardMixPatternBlend", fragmentShader, {
      blendFunction: BlendFunction.HARD_MIX,
      uniforms: new Map([
        ["uResolution", new Uniform(resolution)],
        ["uGranularity", new Uniform(settings.granularity)],
        ["uPatternTexture", new Uniform(patternTexture)],
      ]),
    });

    this.resolution = resolution;
  }

  setSize(width: number, height: number) {
    this.uniforms.get("uResolution")?.value.set(width, height);
  }

  set granularity(value: number) {
    this.uniforms.get("uGranularity")!.value = value;
  }
}

export { PatternOverlayFX };
