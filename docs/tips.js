/**
 * tips.js - Play the poem line by line, then redirect to CH's homepage.
 *
 * Paired with docs/index.html.
 * Timing constants must stay in sync with playSeconds in that generator.
 */
(function () {
  "use strict";

  var TARGET = "https://me.nekoc.cc";
  var BASE_DELAY = 0.15; // s, first line fade-in start
  var STEP = 0.18; // s, gap between lines
  var FADE = 0.9; // s, single line fade-in duration

  var lines = Array.prototype.slice.call(
    document.querySelectorAll(".poem .lines p")
  );
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var done = false;

  function go() {
    if (done) return;
    done = true;
    window.location.replace(TARGET);
  }

  // Reduced motion (or no lines): skip the show, redirect right away.
  if (reduced || lines.length === 0) {
    go();
    return;
  }

  lines.forEach(function (p, i) {
    p.style.animationDelay = (BASE_DELAY + i * STEP) + "s";
  });

  var playMs =
    (BASE_DELAY + Math.max(lines.length - 1, 0) * STEP + FADE) * 1000;

  // Countdown timer
  var countdownEl = document.getElementById("countdown");
  if (countdownEl) {
    var totalSeconds = Math.ceil(playMs / 1000) + 1;
    var currentSeconds = totalSeconds;
    var interval = setInterval(function () {
      currentSeconds--;
      if (currentSeconds <= 0) {
        clearInterval(interval);
        go();
      } else {
        countdownEl.textContent = "(" + currentSeconds + "s)";
      }
    }, 1000);
  }

  // Click / key jumps immediately; a hidden tab redirects without waiting.
  document.addEventListener("click", go);
  document.addEventListener("keydown", go);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) go();
  });

  setTimeout(go, playMs);
})();
