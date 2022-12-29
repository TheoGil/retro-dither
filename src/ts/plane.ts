import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  Uniform,
  Vector2,
} from "three";
import fragmentShader from "../shaders/plane.fragment.glsl?raw";
import vertexShader from "../shaders/default.vertex.glsl?raw";

class Plane {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  texture: Texture;

  constructor(texture: Texture) {
    this.texture = texture;

    const geometry = new PlaneGeometry(1, 1);
    const material = new ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        tMap: new Uniform(this.texture),
        uMapScale: new Uniform(new Vector2(1, 1)),
      },
    });
    this.mesh = new Mesh(geometry, material);

    this.setScaleUniform();
  }

  setScaleUniform() {
    // Input Aspect Ratio
    const IAR =
      this.texture.image.naturalHeight / this.texture.image.naturalWidth;

    // Output Aspect Ratio
    const OAR = window.innerHeight / window.innerWidth;

    if (IAR > OAR) {
      this.mesh.material.uniforms.uMapScale.value.set(1, OAR / IAR);
    } else {
      this.mesh.material.uniforms.uMapScale.value.set(IAR / OAR, 1);
    }
  }
}

export { Plane };
