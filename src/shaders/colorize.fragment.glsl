uniform vec3 uForegroundColor;
uniform vec3 uBackgroundColor;

void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
) {
    float brightness = inputColor.r;
    vec3 color = mix(uBackgroundColor, uForegroundColor, brightness);
    outputColor = vec4(color, 1.);
}