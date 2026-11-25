/* Auto on/off controls. Injected BEFORE the game IIFE (after the engine bundle).
   Independent Opening / Inf toggles, each calling the engine's public methods
   (which persist to localStorage fx_auto_settings). ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var CONTAINER_ID = "fxAutoControls";
  function engine() { return (window.__fx && window.__fx.openingAutomation) || null; }
  function settings() {
    if (typeof window.__fxAutoGetSettings === "function") {
      try { return window.__fxAutoGetSettings() || {}; } catch (e) {}
    }
    return {};
  }
  function state() {
    var s = settings();
    var opening = s.openingAutomationEnabled !== false;
    var inf = s.infiniteExpansionEnabled !== false;
    return { opening: opening, inf: inf };
  }
  function setOpening(on) { var a = engine(); if (!a) return; try { a.setOpeningAutomationEnabled(on); } catch (e) {} }
  function setInf(on) { var a = engine(); if (!a) return; try { a.setInfiniteExpansionEnabled(on); } catch (e) {} }

  function makeButton(label, id, on) {
    var b = document.createElement("div");
    b.id = id;
    b.style.cssText = "padding:5px 10px;margin:2px 0;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;text-align:center;";
    b.textContent = label + ": " + (on ? "ON" : "OFF");
    b.style.color = on ? "#0f0" : "#f66";
    return b;
  }
  function paint(id, label, on) {
    var b = document.getElementById(id);
    if (!b) return;
    b.textContent = label + ": " + (on ? "ON" : "OFF");
    b.style.color = on ? "#0f0" : "#f66";
  }
  function build() {
    var st = state();
    var c = document.createElement("div");
    c.id = CONTAINER_ID;
    c.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:999999;";
    var bOp = makeButton("Opening", "fxOpeningBtn", st.opening);
    bOp.onclick = function () { setOpening(!state().opening); refresh(); };
    var bInf = makeButton("Inf", "fxInfBtn", st.inf);
    bInf.onclick = function () { setInf(!state().inf); refresh(); };
    c.appendChild(bOp);
    c.appendChild(bInf);
    document.body.appendChild(c);
  }
  function refresh() {
    var st = state();
    paint("fxOpeningBtn", "Opening", st.opening);
    paint("fxInfBtn", "Inf", st.inf);
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
