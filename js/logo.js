/* Два независимых вращения, кадры пересчитываются на целочисленной сетке. */
(function () {
  "use strict";
  var canvas = document.getElementById("logo-animation");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var mark = canvas.parentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var paused = reduced.matches;
  var frame = null;
  var last = 0;
  var step = 0;
  var base = (-35 * Math.PI) / 180;
  function ring(a, b, angle, color, thickness) {
    var cos = Math.cos(angle),
      sin = Math.sin(angle);
    ctx.fillStyle = color;
    for (var y = 0; y < 24; y++) {
      for (var x = 0; x < 24; x++) {
        var dx = x - 11.5,
          dy = y - 11.5;
        var u = dx * cos + dy * sin;
        var v = -dx * sin + dy * cos;
        if (Math.abs(Math.sqrt((u / a) ** 2 + (v / b) ** 2) - 1) < thickness)
          ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  function draw() {
    var angle = (step / 96) * Math.PI * 2;
    ctx.clearRect(0, 0, 24, 24);
    ring(24 * 0.24, 24 * 0.36, base - angle, "#77629e", 0.12);
    ring(24 * 0.4, 24 * 0.18, base + angle, "#bca4ff", 0.13);
    ctx.fillStyle = "#f1edff";
    ctx.fillRect(11, 11, 2, 2);
    ctx.fillRect(
      Math.round(11.5 + 9.6 * Math.cos(base + angle)),
      Math.round(11.5 + 9.6 * Math.sin(base + angle)),
      2,
      2,
    );
  }
  function tick(now) {
    if (paused || document.hidden) {
      frame = null;
      return;
    }
    if (now - last >= 125) {
      step = (step + 1) % 96;
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    // При уменьшении движения показываем исходный статичный SVG.
    canvas.hidden = reduced.matches;
    mark.classList.toggle("is-animated", !reduced.matches);
    if (!paused && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  document.addEventListener("portfolio:motion", function (event) {
    paused = event.detail.paused || reduced.matches;
    sync();
  });
  reduced.addEventListener("change", function (event) {
    paused = event.matches;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  draw();
  sync();
})();
