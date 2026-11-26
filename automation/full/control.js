/* Auto controls. Injected BEFORE the game IIFE (after the engine bundle).
   - Farm: cycles the bot-farming mode (off/v20reserve/best/messiah)
   - Opening / Inf: independent toggles
   All go through the engine's public methods (persist to fx_auto_settings).
   ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var CONTAINER_ID = "fxAutoControls";
  var FARM_MODES = ["v20reserve", "best", "messiah", "off"];
  function engine() { return (window.__fx && window.__fx.openingAutomation) || null; }
  function settings() {
    if (typeof window.__fxAutoGetSettings === "function") {
      try { return window.__fxAutoGetSettings() || {}; } catch (e) {}
    }
    return {};
  }
  function getFarmMode() {
    var a = engine();
    if (!a) return "off";
    try { return a.getAutoAttackMode() || "off"; } catch (e) { return "off"; }
  }
  function state() {
    var s = settings();
    return {
      farm: getFarmMode(),
      opening: s.openingAutomationEnabled !== false,
      inf: s.infiniteExpansionEnabled !== false
    };
  }
  function cycleFarm() {
    var a = engine();
    if (!a) return;
    var cur = getFarmMode();
    var idx = FARM_MODES.indexOf(cur);
    var next = FARM_MODES[(idx + 1) % FARM_MODES.length];
    try { a.setAutoAttackMode(next); } catch (e) {}
  }
  function setOpening(on) { var a = engine(); if (!a) return; try { a.setOpeningAutomationEnabled(on); } catch (e) {} }
  function setInf(on) { var a = engine(); if (!a) return; try { a.setInfiniteExpansionEnabled(on); } catch (e) {} }

  function makeButton(id) {
    var b = document.createElement("div");
    b.id = id;
    b.style.cssText = "padding:5px 10px;margin:2px 0;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;text-align:center;";
    return b;
  }
  function paintToggle(id, label, on) {
    var b = document.getElementById(id);
    if (!b) return;
    b.textContent = label + ": " + (on ? "ON" : "OFF");
    b.style.color = on ? "#0f0" : "#f66";
  }
  function paintFarm(id, mode) {
    var b = document.getElementById(id);
    if (!b) return;
    b.textContent = "Farm: " + mode;
    b.style.color = mode === "off" ? "#f66" : "#0f0";
  }
  function build() {
    var c = document.createElement("div");
    c.id = CONTAINER_ID;
    c.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:999999;";
    var bFarm = makeButton("fxFarmBtn");
    bFarm.onclick = function () { cycleFarm(); refresh(); };
    var bOp = makeButton("fxOpeningBtn");
    bOp.onclick = function () { setOpening(!state().opening); refresh(); };
    var bInf = makeButton("fxInfBtn");
    bInf.onclick = function () { setInf(!state().inf); refresh(); };
    c.appendChild(bFarm);
    c.appendChild(bOp);
    c.appendChild(bInf);
    document.body.appendChild(c);
  }
  function refresh() {
    var st = state();
    paintFarm("fxFarmBtn", st.farm);
    paintToggle("fxOpeningBtn", "Opening", st.opening);
    paintToggle("fxInfBtn", "Inf", st.inf);
  }
  function attach() {
    try {
      if (document.body) {
        if (!document.getElementById(CONTAINER_ID)) build();
        refresh();
      }
    } catch (e) {}
  }
  attach();
  setInterval(attach, 500);
})();
