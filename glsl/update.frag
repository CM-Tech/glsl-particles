#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D position;
uniform sampler2D velocity;
uniform sampler2D obstacles;
uniform sampler2D collisons;
uniform int derivative;
uniform vec2 scale;
uniform float random;
uniform float gravity;
uniform float restitution;
uniform vec2 worldsize;
uniform float size;
varying vec2 index;

const float BASE = 255.0;
const float OFFSET = BASE * BASE / 2.0;

float decode(vec2 channels, float scale) {
    return (dot(channels, vec2(BASE, BASE * BASE)) - OFFSET) / scale;
}

vec2 encode(float value, float scale) {
    value = value * scale + OFFSET;
    float x = mod(value, BASE);
    float y = floor(value / BASE);
    return vec2(x, y) / BASE;
}

vec2 updatePosition(inout vec2 p, inout vec2 v, vec2 obstacle,vec3 collison) {
    p += v;
    if (p.y <= 0.0 || p.x < 0.0 || p.x > worldsize.x) {
        /* Left the world, reset particle. */
        p.y += worldsize.y + random + (index.y - 0.5) * sign(random);
        p.x = mod(p.x + random * worldsize.x / 2.0, worldsize.x);
    }
    if (length(obstacle) > 0.5||(length(collison.xy) > 0.5 && collison.z<1.0-1.5/size)) {
        //p -= v;        // back out velocity change
    }
    if (length(obstacle) > 0.5) {
        p += obstacle; // push out out obstacle
    }
    if ((length(collison.xy) > 0.5 && collison.z<1.0-1.5/size)) {
        //p += collison.xy*size*collison.z/2.0; // push out out obstacle
    }
    return p;
}

vec2 updateVelocity(inout vec2 p, inout vec2 v, vec2 obstacle,vec3 collison) {
    v.y -= gravity;
    if (p.y + v.y < -1.0) {
        /* Left the world, reset particle. */
        v.x = v.x + random / 2.0 + (index.x - 0.5) * sign(random);
        v.y = -gravity;
    }
    if (length(obstacle) > 0.5) {
        float vDot=dot(v,obstacle);
       
        if(vDot<0.0 && length(obstacle)<2.0){
             v +=reflect(v, obstacle)*(1.0+restitution);// * restitution;
        }
        if (length(v) < 0.5) {
            v = obstacle * 0.5; // velocity too low, jiggle outward
        } /*else {
            v = reflect(v, obstacle) * restitution; // bounce
        }*/
    }
    if ((length(collison.xy) > 0.5 && collison.z<1.0-1.5/size)) {
        float vDot=dot(v,collison.xy);
       
        if(vDot<0.0 && length(collison.xy)<2.0){
            //v+=-normalize(collsion.xy);
            v +=reflect(v, collison.xy)*(1.0+restitution);// * restitution;
        }
        if (length(v) < 0.5) {
            v = collison.xy * 0.5; // velocity too low, jiggle outward
        }
       /* if (length(v) < 0.5) {
            v = collison.xy * 0.5; // velocity too low, jiggle outward
        } else {
            v = reflect(v, collison.xy) * restitution; // bounce
        }*/
    }
    return v;
}

void main() {
    vec4 psample = texture2D(position, index);
    vec4 vsample = texture2D(velocity, index);
    vec2 p = vec2(decode(psample.rg, scale.x), decode(psample.ba, scale.x));
    vec2 v = vec2(decode(vsample.rg, scale.y), decode(vsample.ba, scale.y));
    vec2 obstacle = (texture2D(obstacles, p / worldsize).xy - 0.5) * 2.0;
    vec3 collison = vec3((texture2D(collisons, p / worldsize).xy - 0.5) * 2.0,texture2D(collisons, p / worldsize).z);
    vec2 result;
    float s;
    if (derivative == 0) {
        result = updatePosition(p, v, obstacle,collison);
        s = scale.x;
    } else {
        result = updateVelocity(p, v, obstacle,collison);
        s = scale.y;
    }
    gl_FragColor = vec4(encode(result.x, s), encode(result.y, s));
}
