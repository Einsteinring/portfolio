/* =========================================================================
   Форма заявки.

   Страница лежит на GitHub Pages, где все файлы открыты для чтения, поэтому
   токен Telegram-бота здесь держать нельзя. Заявку принимает отдельный
   обработчик на Vercel (папка lead-api), он и пересылает её в Telegram.

   Чтобы подключить форму, впишите адрес обработчика в LEAD_ENDPOINT ниже.
   Пока строка пустая, форма честно говорит, что не подключена, и отправляет
   человека в Telegram, вместо того чтобы показывать ложный успех.
   ========================================================================= */

/** Адрес обработчика, например "https://lead-api.vercel.app/api/lead". */
var LEAD_ENDPOINT = "";

/** Куда отправлять человека, если форма недоступна. */
var FALLBACK_CONTACT = "@glushi_ribu";

/**
 * Отправка заявки.
 * @param {{name: string, telegram: string, message: string, company: string}} data
 * @returns {Promise<{ok: boolean}>}
 */
async function sendLead(data) {
  if (!LEAD_ENDPOINT) {
    throw new Error("not-configured");
  }

  var response = await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  return response.json();
}

(function () {
  "use strict";

  var form = document.getElementById("lead-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var submitButton = form.querySelector('button[type="submit"]');

  var RULES = {
    name: {
      test: function (value) {
        return value.length >= 2 && value.length <= 80;
      },
      message: "Напишите, как к вам обращаться.",
    },
    telegram: {
      test: function (value) {
        return value.length >= 3 && value.length <= 120;
      },
      message: "Оставьте Telegram или почту, чтобы я мог ответить.",
    },
    message: {
      test: function (value) {
        return value.length >= 10 && value.length <= 2000;
      },
      message: "Опишите задачу хотя бы парой предложений.",
    },
  };

  function fieldError(name) {
    return form.querySelector('[data-error-for="' + name + '"]');
  }

  function showFieldError(name, text) {
    var input = form.elements[name];
    var box = fieldError(name);
    if (input) input.setAttribute("aria-invalid", "true");
    if (box) {
      box.textContent = text;
      box.hidden = false;
    }
  }

  function clearFieldError(name) {
    var input = form.elements[name];
    var box = fieldError(name);
    if (input) input.removeAttribute("aria-invalid");
    if (box) {
      box.textContent = "";
      box.hidden = true;
    }
  }

  function setStatus(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("form__status--bad", Boolean(isError));
    status.hidden = false;
  }

  function hideStatus() {
    if (!status) return;
    status.hidden = true;
    status.textContent = "";
    status.classList.remove("form__status--bad");
  }

  // Ошибка исчезает, как только человек начал править поле.
  Object.keys(RULES).forEach(function (name) {
    var input = form.elements[name];
    if (input) {
      input.addEventListener("input", function () {
        clearFieldError(name);
      });
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideStatus();

    var data = {};
    var firstInvalid = null;

    Object.keys(RULES).forEach(function (name) {
      var input = form.elements[name];
      var value = input ? String(input.value).trim() : "";
      data[name] = value;

      if (!RULES[name].test(value)) {
        showFieldError(name, RULES[name].message);
        if (!firstInvalid) firstInvalid = input;
      } else {
        clearFieldError(name);
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Поле-ловушка: человек его не видит, бот заполняет.
    data.company = form.elements.company ? String(form.elements.company.value).trim() : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Отправляю…";
    }

    Promise.resolve()
      .then(function () {
        return sendLead(data);
      })
      .then(function () {
        form.reset();
        setStatus("Заявка отправлена. Отвечу в течение дня в Telegram или на почту.", false);
      })
      .catch(function (error) {
        if (error && error.message === "not-configured") {
          setStatus(
            "Форма пока не подключена. Напишите мне напрямую в Telegram: " + FALLBACK_CONTACT,
            true
          );
          return;
        }
        console.error("[portfolio] sendLead:", error);
        setStatus(
          "Отправить не получилось. Напишите напрямую в Telegram: " + FALLBACK_CONTACT,
          true
        );
      })
      .finally(function () {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Отправить заявку";
        }
      });
  });
})();
