uniform sampler2D tMap;
uniform vec2 uMapScale;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uMapScale + 0.5; 
  gl_FragColor = texture2D(tMap, uv);
}
