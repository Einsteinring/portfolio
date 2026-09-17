/* =========================================================================
   Форма заявки.

   sendLead(data) — единственное место, которое нужно поменять, когда появится
   бот или бэкенд. Сейчас она пишет заявку в консоль и делает вид, что отправка
   прошла успешно. Пример будущей реализации:

     async function sendLead(data) {
       const response = await fetch("https://api.example.com/lead", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(data),
       });
       if (!response.ok) throw new Error("HTTP " + response.status);
       return response.json();
     }
   ========================================================================= */

/**
 * Отправка заявки.
 * @param {{name: string, telegram: string, message: string, sentAt: string}} data
 * @returns {Promise<{ok: boolean}>}
 */
function sendLead(data) {
  console.log("[portfolio] Новая заявка:", data);
  return Promise.resolve({ ok: true });
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
        return value.length >= 2;
      },
      message: "Напишите, как к вам обращаться.",
    },
    telegram: {
      test: function (value) {
        return value.length >= 3;
      },
      message: "Оставьте Telegram или почту, чтобы я мог ответить.",
    },
    message: {
      test: function (value) {
        return value.length >= 10;
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

    data.sentAt = new Date().toISOString();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Отправляю…";
    }

    Promise.resolve(sendLead(data))
      .then(function () {
        form.reset();
        setStatus("Заявка отправлена. Отвечу в течение дня в Telegram или на почту.", false);
      })
      .catch(function (error) {
        console.error("[portfolio] sendLead:", error);
        setStatus(
          "Отправить не получилось. Напишите напрямую в Telegram: @glushi_ribu",
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
