/* ==========================================================================
   Проекты: загрузка projects.json, фильтр с счётчиками, карточки и боковая
   панель с кейсом.

   Чтобы добавить проект, правится только projects.json. Здесь меняется одно
   место — словарь KIND_LABELS, если появится новый тип тега.
   ========================================================================== */

(function () {
  "use strict";

  /** Подписи типов. Ключи совпадают с data-filter у кнопок фильтра. */
  var KIND_LABELS = {
    landing: "сайт",
    bot: "Telegram-бот",
    miniapp: "Mini App",
    integration: "интеграции",
  };

  /** До скольких карточек показывать приглашение на свободное место. */
  var SLOT_UNTIL = 4;

  var grid = document.getElementById("projects");
  var tabsBox = document.querySelector(".tabs");
  var countBox = document.getElementById("work-count");
  var sheet = document.getElementById("project-modal");
  var panel = sheet ? sheet.querySelector(".sheet__panel") : null;
  var panelBody = document.getElementById("modal-content");

  var projects = [];
  var kind = "all";
  var opener = null;

  /* ───────────────────────── Утилиты ───────────────────────── */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function filled(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function matches(project, filter) {
    if (filter === "all") return true;
    return Array.isArray(project.tags) && project.tags.indexOf(filter) !== -1;
  }

  /* ───────────────────────── Карточка ───────────────────────── */

  function shotMarkup(project) {
    if (!filled(project.preview)) {
      return '<div class="work__shot work__shot--blank" aria-hidden="true"></div>';
    }
    return (
      '<div class="work__shot">' +
      '<img class="work__img" src="' +
      esc(project.preview) +
      '" alt="Главная страница проекта «' +
      esc(project.title) +
      '»" loading="lazy" decoding="async" width="1280" height="800">' +
      "</div>"
    );
  }

  function kindsMarkup(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return "";
    var words = tags.map(function (tag) {
      return KIND_LABELS[tag] || tag;
    });
    return '<p class="work__kinds">' + esc(words.join(", ")) + "</p>";
  }

  function chipsMarkup(items) {
    return items
      .map(function (item) {
        return '<span class="chip">' + esc(item) + "</span>";
      })
      .join("");
  }

  function buildCard(project, index) {
    var lead = index === 0;

    var card = document.createElement("article");
    card.className = "work" + (lead ? " work--lead" : "");

    var acts = "";
    if (filled(project.demoUrl)) {
      acts +=
        '<a class="work__act work__act--go" href="' +
        esc(project.demoUrl) +
        '" target="_blank" rel="noopener">Открыть демо</a>';
    }
    if (filled(project.repoUrl)) {
      acts +=
        '<a class="work__act" href="' +
        esc(project.repoUrl) +
        '" target="_blank" rel="noopener">Код на GitHub</a>';
    }
    acts += '<button class="work__act work__act--case" type="button">Открыть кейс</button>';

    // У широкой карточки есть место под стек — показываем его сразу,
    // не заставляя ради этого открывать кейс.
    var stack =
      lead && Array.isArray(project.tech) && project.tech.length
        ? '<div class="work__stack">' + chipsMarkup(project.tech) + "</div>"
        : "";

    card.innerHTML =
      shotMarkup(project) +
      '<div class="work__main">' +
      (lead ? '<p class="work__flag">Свежий проект</p>' : "") +
      '<h3 class="work__title">' +
      esc(project.title) +
      "</h3>" +
      '<p class="work__line">' +
      esc(project.tagline) +
      "</p>" +
      kindsMarkup(project.tags) +
      stack +
      '<div class="work__acts">' +
      acts +
      "</div>" +
      "</div>";

    card.querySelector(".work__act--case").addEventListener("click", function () {
      openCase(project);
    });

    // Клик по свободному месту карточки тоже открывает кейс.
    card.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) return;
      openCase(project, card.querySelector(".work__act--case"));
    });

    return card;
  }

  function buildSlot() {
    var slot = document.createElement("article");
    slot.className = "slot";
    slot.innerHTML =
      '<h3 class="slot__title">Здесь может быть ваш проект</h3>' +
      '<p class="slot__text">Беру в работу сайты, Telegram-ботов, Mini Apps и интеграции. Напишите пару предложений о задаче — отвечу в течение дня.</p>' +
      '<a class="btn btn--quiet btn--compact" href="https://t.me/glushi_ribu" target="_blank" rel="noopener">Обсудить в Telegram</a>';
    return slot;
  }

  /* ───────────────────────── Отрисовка ───────────────────────── */

  function paintCounts() {
    if (!tabsBox) return;

    tabsBox.querySelectorAll(".tab").forEach(function (tab) {
      var filter = tab.dataset.filter || "all";
      var total = projects.filter(function (project) {
        return matches(project, filter);
      }).length;

      var box = tab.querySelector(".tab__count");
      if (box) box.textContent = String(total);
      tab.classList.toggle("is-empty", total === 0);
    });
  }

  function paintHeadCount(total) {
    if (!countBox) return;
    countBox.textContent = total === 0 ? "пока пусто" : total + " демо";
  }

  function render() {
    if (!grid) return;

    var visible = projects.filter(function (project) {
      return matches(project, kind);
    });

    grid.innerHTML = "";
    paintHeadCount(visible.length);

    if (visible.length === 0) {
      var empty = document.createElement("p");
      empty.className = "works__state";
      empty.textContent = "Демо этого типа пока нет. Могу собрать первое — напишите, что нужно.";
      grid.appendChild(empty);
    } else {
      visible.forEach(function (project, index) {
        grid.appendChild(buildCard(project, index));
      });
    }

    // Пока проектов мало, сетка не должна выглядеть обрубленной.
    if (visible.length < SLOT_UNTIL) {
      grid.appendChild(buildSlot());
    }

    grid.setAttribute("aria-busy", "false");
  }

  /* ───────────────────────── Кейс ───────────────────────── */

  function part(key, text) {
    if (!filled(text)) return "";
    return (
      '<div class="story__part">' +
      '<dt class="story__key">' +
      esc(key) +
      "</dt>" +
      '<dd class="story__text">' +
      esc(text) +
      "</dd>" +
      "</div>"
    );
  }

  function openCase(project, focusTarget) {
    if (!sheet || !panel || !panelBody) return;

    opener = focusTarget || document.activeElement;

    var acts = "";
    if (filled(project.demoUrl)) {
      acts +=
        '<a class="btn btn--primary" href="' +
        esc(project.demoUrl) +
        '" target="_blank" rel="noopener">Открыть демо</a>';
    }
    if (filled(project.repoUrl)) {
      acts +=
        '<a class="btn btn--quiet" href="' +
        esc(project.repoUrl) +
        '" target="_blank" rel="noopener">Код на GitHub</a>';
    }

    var stack =
      Array.isArray(project.tech) && project.tech.length
        ? '<div class="story__part">' +
          '<dt class="story__key">Стек</dt>' +
          '<dd class="story__chips">' +
          chipsMarkup(project.tech) +
          "</dd>" +
          "</div>"
        : "";

    panelBody.innerHTML =
      '<h2 class="sheet__title" id="modal-title">' +
      esc(project.title) +
      "</h2>" +
      '<p class="sheet__line">' +
      esc(project.tagline) +
      "</p>" +
      '<dl class="story">' +
      part("Задача", project.task) +
      part("Решение", project.solution) +
      part("Результат", project.result) +
      stack +
      "</dl>" +
      (acts ? '<div class="sheet__acts">' + acts + "</div>" : "");

    sheet.hidden = false;
    document.body.classList.add("is-held");
    panel.scrollTop = 0;
    panel.focus();

    document.addEventListener("keydown", onSheetKey);
  }

  function closeCase() {
    if (!sheet || sheet.hidden) return;

    sheet.hidden = true;
    document.body.classList.remove("is-held");
    document.removeEventListener("keydown", onSheetKey);

    if (opener && typeof opener.focus === "function") opener.focus();
    opener = null;
  }

  function onSheetKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCase();
      return;
    }

    if (event.key !== "Tab" || !panel) return;

    var stops = panel.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (stops.length === 0) return;

    var first = stops[0];
    var last = stops[stops.length - 1];
    var here = document.activeElement;

    if (event.shiftKey && (here === first || here === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && here === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (sheet) {
    sheet.addEventListener("click", function (event) {
      if (event.target.closest("[data-modal-close]")) closeCase();
    });
  }

  /* ───────────────────────── Фильтр ───────────────────────── */

  if (tabsBox) {
    tabsBox.addEventListener("click", function (event) {
      var tab = event.target.closest(".tab");
      if (!tab) return;

      kind = tab.dataset.filter || "all";

      tabsBox.querySelectorAll(".tab").forEach(function (item) {
        var on = item === tab;
        item.classList.toggle("is-on", on);
        item.setAttribute("aria-pressed", on ? "true" : "false");
      });

      render();
    });
  }

  /* ───────────────────────── Данные ───────────────────────── */

  fetch("projects.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      projects = Array.isArray(data) ? data : [];
      paintCounts();
      render();
    })
    .catch(function (error) {
      if (!grid) return;
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML =
        '<p class="works__state works__state--bad">Список проектов не загрузился. ' +
        "Страницу нужно открывать через локальный сервер, а не файлом с диска.</p>";
      if (countBox) countBox.textContent = "";
      console.error("[portfolio] projects.json:", error);
    });
})();
