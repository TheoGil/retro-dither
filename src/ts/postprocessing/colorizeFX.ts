import { Color, Uniform } from "three";
import { BlendFunction, Effect } from "postprocessing";

import fragmentShader from "../../shaders/colorize.fragment.glsl?raw";
import { settings } from "../settings";

class ColorizeFX extends Effect {
  constructor() {
    super("Colorize", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ["uForegroundColor", new Uniform(new Color(settings.foregroundColor))],
        ["uBackgroundColor", new Uniform(new Color(settings.backgroundColor))],
      ]),
    });
  }

  setSize(width: number, height: number) {
    this.uniforms.get("uResolution")?.value.set(width, height);
  }

  set foregroundColor(value: string) {
    this.uniforms.get("uForegroundColor")!.value = new Color(value);
  }

  set backgroundColor(value: string) {
    this.uniforms.get("uBackgroundColor")!.value = new Color(value);
  }
}

export { ColorizeFX };
