/* Automation engine + minimal control UI. Injected BEFORE the game IIFE.
   Pure ES5 (iOS 12). The game-internal primitives live in window.__fx.game,
   provided by the block injected at `function dN` inside the game. */
(function () {
  if (typeof window === "undefined") return;
  window.__fx = window.__fx || {};

  var enabled = true;
  try {
    var saved = window.localStorage.getItem("fx_auto_enabled");
    if (saved === "0") enabled = false;
  } catch (e) {}

  var attackPercent = 0.12; // fraction of troops sent on each free-land attack
  var actEveryMs = 2000;    // minimum gap between free-land attacks
  var surplusRatio = 12;    // only farm when troops > land * surplusRatio
  var lastAct = 0;

  function ready() { return !!(window.__fx.gameReady && window.__fx.game); }

  function act() {
    if (!ready() || !enabled) return;
    var g = window.__fx.game;
    if (g.isReplay()) return;
    if (!g.mapRendered()) return;
    var p = g.playerId();
    if (p == null) return;
    var troops = g.getTroops();
    var land = g.getLand();
    if (troops <= 0 || land <= 0) return;
    var now = Date.now();
    if (now - lastAct < actEveryMs) return;
    lastAct = now;
    if (troops < land * surplusRatio) return;
    g.attackFreeLand(attackPercent);
  }

  function makeButton() {
    var b = document.createElement("div");
    b.id = "fxAutoBtn";
    b.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:999999;padding:6px 10px;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;";
    b.textContent = enabled ? "Auto: ON" : "Auto: OFF";
    b.style.color = enabled ? "#0f0" : "#f66";
    b.onclick = function () {
      enabled = !enabled;
      b.textContent = enabled ? "Auto: ON" : "Auto: OFF";
      b.style.color = enabled ? "#0f0" : "#f66";
      try { window.localStorage.setItem("fx_auto_enabled", enabled ? "1" : "0"); } catch (e) {}
    };
    document.body.appendChild(b);
    return b;
  }

  function attachButton() {
    try {
      if (document.body && !document.getElementById("fxAutoBtn")) makeButton();
    } catch (e) {}
  }

  attachButton();
  setInterval(attachButton, 1000);
  setInterval(act, 500);
})();
