/* ==========================================================================
   Поведение страницы: приход уведомлений на первом экране, появление секций,
   мобильное меню, аккордеон вопросов, год в подвале.
   ========================================================================== */

(function () {
  "use strict";

  var calm =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────── Единственный запланированный момент движения ─────────
     Уведомления о заявках приходят одно за другим один раз при загрузке.
     Дальше страница не двигается сама. */

  var stream = document.getElementById("stream");

  if (stream && !calm) {
    var start = function () {
      stream.classList.add("is-live");
    };
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }
  }

  /* ───────── Появление секций ───────── */

  var watcher = null;

  if (!calm && "IntersectionObserver" in window) {
    watcher = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          watcher.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
  }

  document.querySelectorAll(".band__reveal").forEach(function (block) {
    if (!watcher) {
      block.classList.add("is-in");
      return;
    }
    watcher.observe(block);
  });

  /* ───────── Мобильное меню ───────── */

  var burger = document.querySelector(".burger");
  var drawer = document.getElementById("drawer");

  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    drawer.hidden = !open;
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      setDrawer(burger.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) setDrawer(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setDrawer(false);
        burger.focus();
      }
    });

    // Меню нужно только на узких экранах: на десктопе закрываем его.
    var wide = window.matchMedia("(min-width: 1000px)");
    var onWide = function (event) {
      if (event.matches) setDrawer(false);
    };
    if (typeof wide.addEventListener === "function") {
      wide.addEventListener("change", onWide);
    } else if (typeof wide.addListener === "function") {
      wide.addListener(onWide);
    }
  }

  /* ───────── Вопросы ───────── */

  var questions = document.querySelectorAll(".qa__q");

  questions.forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      var answer = document.getElementById(button.getAttribute("aria-controls"));

      // Открыт всегда один ответ: список не разъезжается под пальцами.
      questions.forEach(function (other) {
        if (other === button) return;
        other.setAttribute("aria-expanded", "false");
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.hidden = true;
      });

      button.setAttribute("aria-expanded", open ? "false" : "true");
      if (answer) answer.hidden = open;
    });
  });

  /* ───────── Год ───────── */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
