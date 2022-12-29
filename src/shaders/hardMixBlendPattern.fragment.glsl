uniform float uGranularity;
uniform vec2 uResolution;
uniform sampler2D uPatternTexture;

void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
) {
    vec2 pixelSize = uGranularity / uResolution;
    vec2 fractUvs = fract(uv / pixelSize);
    outputColor = texture2D(uPatternTexture, fractUvs);
}