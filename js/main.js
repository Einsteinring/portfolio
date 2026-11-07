/* ==========================================================================
   Поведение страницы: мобильное меню и год в подвале.
   ========================================================================== */

(function () {
  "use strict";

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

  /* ───────── Год ───────── */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
