function Particles(igloo, nparticles) {
    var gl = igloo.gl;
    this.igloo = igloo;

    gl.disable(gl.DEPTH_TEST);
    this.worldsize = new Float32Array([w, h]);
    var scale = Math.floor(Math.pow(Particles.BASE, 2) / Math.max(w, h) / 3);
    this.scale = [
        scale, scale * 100
    ];

    this.size = 8;
    this.color = [36, 158, 255, 1];
    this.obstacleColor = [115, 89, 64, 1.0];

    this.gravity = 0.05;
    this.restitution = 0.25;
    this.obstacles = [];

    this.stats = new Stats();
    this
        .stats
        .showPanel(0);
    document
        .body
        .appendChild(this.stats.dom);
    this.stats.dom.style.cssText = 'position:fixed;bottom:0;right:0;cursor:pointer;opacity:0.8;';

    function texture() {
        return igloo.texture(null, gl.RGBA, gl.CLAMP_TO_EDGE, gl.NEAREST);
    }
    //append timeStamp to avoid browser caching
    var timeStamp = new Date().getTime();
    this.programs = {
        update: igloo.program("glsl/quad.vert?" + timeStamp, "glsl/update.frag?" + timeStamp),
        draw: igloo.program("glsl/draw.vert?" + timeStamp, "glsl/draw.frag?" + timeStamp),
        drawfield: igloo.program("glsl/drawfield.vert?" + timeStamp, "glsl/drawfield.frag?" + timeStamp),
        flat: igloo.program("glsl/quad.vert?" + timeStamp, "glsl/flat.frag?" + timeStamp),
        ocircle: igloo.program("glsl/ocircle.vert?" + timeStamp, "glsl/ocircle.frag?" + timeStamp)
    };
    this.buffers = {
        quad: igloo.array(Igloo.QUAD2),
        indexes: igloo.array(),
        point: igloo.array(new Float32Array([0, 0]))
    };
    this.textures = {
        p0: texture(),
        p1: texture(),
        v0: texture(),
        v1: texture(),
        obstacles: igloo
            .texture()
            .blank(w, h),
        collisions: igloo
            .texture()
            .blank(w, h)
    };
    this.framebuffers = {
        step: igloo.framebuffer(),
        obstacles: igloo
            .framebuffer()
            .attach(this.textures.obstacles),
        collisions: igloo
            .framebuffer()
            .attach(this.textures.collisions)
    };

    this.initTextures = function () {
        var tw = this.statesize[0],
            th = this.statesize[1],
            w = this.worldsize[0],
            h = this.worldsize[1],
            s = this.scale,
            rgbaP = new Uint8Array(tw * th * 4),
            rgbaV = new Uint8Array(tw * th * 4);
        for (var y = 0; y < th; y++) {
            for (var x = 0; x < tw; x++) {
                var i = y * tw * 4 + x * 4,
                    px = Particles.encode(Math.random() * w, s[0]),
                    py = Particles.encode(Math.random() * h, s[0]),
                    vx = Particles.encode(Math.random() * 1.0 - 0.5, s[1]),
                    vy = Particles.encode(Math.random() * 2.5, s[1]);
                rgbaP[i + 0] = px[0];
                rgbaP[i + 1] = px[1];
                rgbaP[i + 2] = py[0];
                rgbaP[i + 3] = py[1];
                rgbaV[i + 0] = vx[0];
                rgbaV[i + 1] = vx[1];
                rgbaV[i + 2] = vy[0];
                rgbaV[i + 3] = vy[1];
            }
        }
        this
            .textures
            .p0
            .set(rgbaP, tw, th);
        this
            .textures
            .v0
            .set(rgbaV, tw, th);
        this
            .textures
            .p1
            .blank(tw, th);
        this
            .textures
            .v1
            .blank(tw, th);
        return this;
    };

    this.initBuffers = function () {
        var tw = this.statesize[0],
            th = this.statesize[1],
            gl = this.igloo.gl,
            indexes = new Float32Array(tw * th * 2);
        for (var y = 0; y < th; y++) {
            for (var x = 0; x < tw; x++) {
                var i = y * tw * 2 + x * 2;
                indexes[i + 0] = x;
                indexes[i + 1] = y;
            }
        }
        this
            .buffers
            .indexes
            .update(indexes, gl.STATIC_DRAW);
        return this;
    };

    this.setCount = function (n) {
        var tw = Math.ceil(Math.sqrt(n)),
            th = Math.floor(Math.sqrt(n));
        this.statesize = new Float32Array([tw, th]);
        this.initTextures();
        this.initBuffers();
        return this;
    };

    this.getCount = function () {
        return this.statesize[0] * this.statesize[1];
    };

    this.swap = function () {
        var tmp = this.textures.p0;
        this.textures.p0 = this.textures.p1;
        this.textures.p1 = tmp;
        tmp = this.textures.v0;
        this.textures.v0 = this.textures.v1;
        this.textures.v1 = tmp;
        return this;
    };

    this.updateObstacles = function () {
        var gl = this.igloo.gl;
        this
            .framebuffers
            .obstacles
            .bind();
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.worldsize[0], this.worldsize[1]);
        gl.clearColor(0.5, 0.5, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            this
                .programs
                .ocircle
                .use()
                .attrib("vert", this.buffers.point, 2)
                .uniform("position", new Float32Array(obstacle.position))
                .uniform("worldsize", this.worldsize)
                .uniform("size", obstacle.size)
                .draw(gl.POINTS, 1);
        }
        return this;
    };

    this.addObstacle = function (center, radius) {
        var obstacle = {
            position: center,
            size: radius
        };
        this
            .obstacles
            .push(obstacle);
        this.updateObstacles();
        return obstacle;
    };

    this.updateCollisions = function () {
        var gl = this.igloo.gl;
        this
            .framebuffers
            .collisions
            .bind();
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.worldsize[0], this.worldsize[1]);
        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this
            .textures
            .p0
            .bind(0);
        this
            .textures
            .v0
            .bind(1);
        this
            .programs
            .drawfield
            .use()
            .attrib("index", this.buffers.indexes, 2)
            .uniformi("positions", 0)
            .uniformi("velocities", 1)
            .uniform("statesize", this.statesize)
            .uniform("worldsize", this.worldsize)
            .uniform("size", this.size)
            .uniform("scale", this.scale)
            .uniform("color", this.color)
            .draw(gl.POINTS, this.statesize[0] * this.statesize[1]);
        return this;
    };

    this.addObstacle = function (center, radius) {
        var obstacle = {
            position: center,
            size: radius
        };
        this
            .obstacles
            .push(obstacle);
        this.updateObstacles();
        return obstacle;
    };


    this.step = function () {
        this.updateCollisions();
        var igloo = this.igloo,
            gl = igloo.gl;
        gl.disable(gl.BLEND);
        this
            .framebuffers
            .step
            .attach(this.textures.v1);
        this
            .textures
            .p0
            .bind(0);
        this
            .textures
            .v0
            .bind(1);
        this
            .textures
            .obstacles
            .bind(2);
        this
            .textures
            .collisions
            .bind(3);
        gl.viewport(0, 0, this.statesize[0], this.statesize[1]);
        this
            .programs
            .update
            .use()
            .attrib("quad", this.buffers.quad, 2)
            .uniformi("position", 0)
            .uniformi("velocity", 1)
            .uniformi("obstacles", 2)
            .uniformi("collisons", 3)
            .uniform("scale", this.scale)
            .uniform("random", Math.random() * 2.0 - 1.0)
            .uniform("gravity", this.gravity)
            .uniform("restitution", this.restitution)
            .uniform("worldsize", this.worldsize)
            .uniform("size", this.size)
            .uniformi("derivative", 1)
            .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2);
        this
            .framebuffers
            .step
            .attach(this.textures.p1);
        this
            .programs
            .update
            .uniformi("derivative", 0)
            .uniform("random", Math.random() * 2.0 - 1.0)
            .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2);
        this.swap();
        return this;
    };

    this.draw = function () {
        var igloo = this.igloo,
            gl = igloo.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        igloo
            .defaultFramebuffer
            .bind();
        gl.viewport(0, 0, this.worldsize[0], this.worldsize[1]);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this
            .textures
            .p0
            .bind(0);
        this
            .textures
            .v0
            .bind(1);
        this
            .programs
            .draw
            .use()
            .attrib("index", this.buffers.indexes, 2)
            .uniformi("positions", 0)
            .uniformi("velocities", 1)
            .uniform("statesize", this.statesize)
            .uniform("worldsize", this.worldsize)
            .uniform("size", this.size)
            .uniform("scale", this.scale)
            .uniform("color", this.color)
            .draw(gl.POINTS, this.statesize[0] * this.statesize[1]);
        this
            .textures
            .obstacles
            .bind(2);
        this
            .programs
            .flat
            .use()
            .attrib("quad", this.buffers.quad, 2)
            .uniformi("background", 2)
            .uniform("color", this.obstacleColor)
            .uniform("worldsize", this.worldsize)
            .draw(gl.TRIANGLE_STRIP, Igloo.QUAD2.length / 2);
        return this;
    };

    this.frame = function () {
        window
            .requestAnimationFrame(function () {
                this
                    .stats
                    .begin();
                this
                    .step()
                    .draw()
                    .frame();
                this
                    .stats
                    .end();
            }.bind(this));
        return this;
    };

    this.setCount(nparticles, true);
    this.addObstacle([
        w / 2,
        h / 2
    ], 32);
}

Particles.BASE = 255;

Particles.encode = function (value, scale) {
    var b = Particles.BASE;
    value = value * scale + b * b / 2;
    var pair = [
        Math.floor((value % b) / b * 255),
        Math.floor(Math.floor(value / b) / b * 255)
    ];
    return pair;
};
