if (window.requestAnimationFrame == null) {
    window.requestAnimationFrame =
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
}

function openNav() {
    document.querySelector(".sidenav").style.width = "385px";
    document.querySelector(".btn-open").style.opacity = "0";
}

function closeNav() {
    document.querySelector(".sidenav").style.width = "0";
    document.querySelector(".btn-open").style.opacity = "1";
}

function comma(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

var w = window.innerWidth, h = window.innerHeight,
    particles = null,
    controller = null;

function updateCount() {
    var count = particles.statesize[0] * particles.statesize[1];
    document.getElementById("count").innerText = comma(count);
}

document.addEventListener("DOMContentLoaded", function() {
    var canvas = document.getElementById("display");
    var igloo = new Igloo(canvas)
    particles = new Particles(igloo, 1024 * 16).frame();
    controller = new Controller(particles);
    updateCount();

    canvas.width = w;
    canvas.height = h;
    window.addEventListener("resize", function() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    });
});
