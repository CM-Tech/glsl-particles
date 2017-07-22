#ifdef GL_ES
precision highp float;
#endif

uniform vec4 color;
varying vec2 velocity;

const float DELTA = 0.6;

void main() {
    vec2 p = 2.0 * (gl_PointCoord - 0.5);
    float a = smoothstep(DELTA, 1.0, length(p));
    float e = 0.0 + length(velocity) / 3.0;
    vec4 glColor = vec4(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a);
    gl_FragColor = pow(mix(glColor, vec4(0, 0, 0, 0), a), vec4(e));
}
