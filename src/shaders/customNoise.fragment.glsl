uniform float uThreshold;
uniform float uOpacity;

// -----------------------------------------
// Pseudo random
// Reference: https://github.com/mattdesl/glsl-random/blob/master/lowp.glsl
// -----------------------------------------
float random(vec2 co)
{
   return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
}

void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
) {
    float noise = random(uv);
    noise = smoothstep(uThreshold, 1., noise) * uOpacity;
    outputColor = vec4(vec3(noise), 1.);
}