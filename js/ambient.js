/* Низкое разрешение и редкая перерисовка дают пиксельный фон без библиотек. */
(function () {
  "use strict";
  var canvas = document.getElementById("retro-sky");
  var button = document.getElementById("motion-toggle");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var paused = reduced.matches;
  var frame = null;
  var last = 0;
  var phase = 0;
  var stars = [];
  var width = 0;
  var height = 0;
  var seed = 27;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function resize() {
    width = canvas.width = Math.ceil(window.innerWidth / 3);
    height = canvas.height = Math.ceil(window.innerHeight / 3);
    seed = 27;
    stars = Array.from(
      { length: Math.min(80, Math.ceil((width * height) / 1300)) },
      function () {
        return {
          x: random() * width,
          y: random() * height * 0.83,
          size: random() > 0.91 ? 2 : 1,
          phase: random() * Math.PI * 2,
        };
      },
    );
    draw();
  }
  function mountain(base, amplitude, color, speed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (var x = 0; x <= width + 4; x += 4) {
      var y =
        base +
        Math.sin(x * 0.024 + phase * speed) * amplitude +
        Math.sin(x * 0.061 + 2) * amplitude * 0.34;
      ctx.lineTo(x, Math.floor(y / 3) * 3);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(function (s) {
      var alpha = 0.25 + (Math.sin(phase * 0.65 + s.phase) + 1) * 0.18;
      ctx.fillStyle = "rgba(186,165,224," + alpha + ")";
      var x = Math.floor((s.x + phase * 0.24) % width);
      var y = Math.floor(s.y);
      ctx.fillRect(x, y, s.size, s.size);
      if (s.size === 2) {
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x - 1, y, 4, 1);
        ctx.fillRect(x, y - 1, 1, 4);
        ctx.globalAlpha = 1;
      }
    });
    mountain(height * 0.88, 14, "#28213d", 0.025);
    mountain(height * 0.96, 9, "#342744", -0.035);
    ctx.fillStyle = "#baa5dc";
    ctx.globalAlpha = 0.23;
    // Несколько пикселей на горизонте, как огни далёкого игрового уровня.
    for (var x = 12; x < width; x += 47)
      ctx.fillRect(x, height - 8 - (x % 3) * 3, 1, 1);
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    if (paused || document.hidden) {
      frame = null;
      return;
    }
    if (now - last >= 100) {
      phase += Math.min((now - last) / 1000, 0.15);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (button) {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(paused));
      button.textContent = paused ? "Включить фон" : "Остановить фон";
    }
    draw();
    if (!paused && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  if (button)
    button.addEventListener("click", function () {
      paused = !paused;
      sync();
    });
  reduced.addEventListener("change", function (event) {
    paused = event.matches;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", resize);
  resize();
  sync();
})();
