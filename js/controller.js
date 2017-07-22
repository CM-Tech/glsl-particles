function Controller(particles) {
    var canvas = particles.igloo.gl.canvas;
    var obstacle = particles.addObstacle([0, 0], 20);

    particles.updateObstacles();

    function place() {
        particles.addObstacle(obstacle.position.slice(0), obstacle.size);
    }

    function mouse(event) {
        obstacle.position = [event.clientX, window.innerHeight - event.clientY];
        if (event.which == 1 && event.target == canvas) place();
        particles.updateObstacles();
    }

    window.addEventListener("mousemove", mouse);
    document.addEventListener("mouseup", mouse);

    function adjust(factor) {
        var current = particles.getCount();
        particles.setCount(Math.max(1, current * factor));
        updateCount();
    }

    this.reset = adjust.bind(null, 1);
    this.increase = adjust.bind(null, 2);
    this.decrease = adjust.bind(null, 0.5);

    var gui = this.gui = new dat.gui.GUI();
    var pControls = gui.addFolder('Particles');
    pControls.addColor(particles, 'color');
    pControls.add(this, 'increase');
    pControls.add(this, 'decrease');
    pControls.add(particles, 'size').min(1).max(50);
    pControls.add(particles, 'gravity').min(0).max(0.5).step(0.01);
    pControls.add(particles, 'restitution').min(0).max(1.5).step(0.25);
    pControls.add(this, 'reset');

    this.clear = function() {
        particles.obstacles = [obstacle];
        particles.updateObstacles();
    };

    var oControls = gui.addFolder('Obstacles');
    oControls.addColor(particles, 'obstacleColor');
    oControls.add(obstacle, 'size')
        .min(2).max(128).step(2)
        .onChange(particles.updateObstacles.bind(particles));
    oControls.add(this, 'clear');
}