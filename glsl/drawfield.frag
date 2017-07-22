#ifdef GL_ES
precision highp float;
#endif

uniform vec4 color;
varying vec2 velocity;

const float DELTA = 0.6;

void main() {
    vec2 p = 2.0 * (gl_PointCoord - 0.5);
    if (length(p) < 1.0&&length(p) >1.0/3.0) {
        vec2 norm = normalize(p* vec2(1, -1) );
        gl_FragColor = vec4((norm + 1.0) / 2.0, 1.0-(length(p)-1.0/3.0)/2.0*3.0, 1);
    } else {
        discard;
    }
}
