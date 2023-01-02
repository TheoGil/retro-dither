import { Uniform } from "three";
import { BlendFunction, Effect } from "postprocessing";

import fragmentShader from "../../shaders/customNoise.fragment.glsl?raw";
import { settings } from "../settings";

class CustomNoiseFX extends Effect {
  constructor() {
    super("CustomNoise", fragmentShader, {
      blendFunction: BlendFunction.LIGHTEN,
      uniforms: new Map([
        ["uThreshold", new Uniform(settings.noise.threshold)],
        ["uOpacity", new Uniform(settings.noise.opacity)],
      ]),
    });
  }

  set threshold(value: number) {
    this.uniforms.get("uThreshold")!.value = value;
  }

  set opacity(value: number) {
    this.uniforms.get("uOpacity")!.value = value;
  }
}

export { CustomNoiseFX };
