/* Custom opening strategy + tick offset panel. Injected BEFORE the game IIFE.
   Edits settings.openingAutomationStrategy (JSON) and openingAutomationTickOffset
   via the exposed settings object, and persists. Empty strategy = engine default.
   ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var TOGGLE_ID = "fxOpeningSetupBtn";
  var PANEL_ID = "fxOpeningPanel";
  var visible = false;
  function settings() {
    if (typeof window.__fxAutoGetSettings === "function") {
      try { return window.__fxAutoGetSettings() || {}; } catch (e) {}
    }
    return {};
  }
  function persist() {
    if (typeof window.__fxAutoPersist === "function") {
      try { window.__fxAutoPersist(); } catch (e) {}
    }
  }

  function makeToggle() {
    var b = document.createElement("div");
    b.id = TOGGLE_ID;
    b.style.cssText = "position:fixed;bottom:8px;left:8px;z-index:999999;padding:5px 10px;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;";
    b.textContent = "Opening setup";
    b.onclick = function () { visible = !visible; refresh(); };
    document.body.appendChild(b);
    return b;
  }
  function makePanel() {
    var p = document.createElement("div");
    p.id = PANEL_ID;
    p.style.cssText = "position:fixed;bottom:48px;left:8px;z-index:999999;width:min(85vw,300px);max-height:60vh;overflow:auto;background:rgba(0,0,0,0.85);color:#eee;font:12px sans-serif;padding:8px;border-radius:4px;";
    var offL = document.createElement("div");
    offL.textContent = "Tick offset (100 ticks/cycle):";
    var off = document.createElement("input");
    off.type = "number";
    off.step = "0.1";
    off.style.cssText = "width:100%;box-sizing:border-box;margin:2px 0 8px;";
    var stratL = document.createElement("div");
    stratL.textContent = "Opening strategy JSON (empty = default):";
    var ta = document.createElement("textarea");
    ta.spellcheck = false;
    ta.style.cssText = "width:100%;box-sizing:border-box;height:110px;margin:2px 0 8px;font:11px monospace;";
    var apply = document.createElement("button");
    apply.textContent = "Apply";
    apply.style.cssText = "margin-right:6px;padding:3px 10px;";
    apply.onclick = function () {
      try {
        var raw = ta.value.trim();
        if (raw) JSON.parse(raw);
        var st = settings();
        st.openingAutomationTickOffset = off.value;
        st.openingAutomationStrategy = raw;
        persist();
        try { alert("Opening saved (applies next game)"); } catch (e) {}
      } catch (e) {
        try { alert("Invalid strategy JSON: " + e.message); } catch (e2) {}
      }
    };
    var close = document.createElement("button");
    close.textContent = "Close";
    close.style.cssText = "padding:3px 10px;";
    close.onclick = function () { visible = false; refresh(); };
    p.appendChild(offL); p.appendChild(off);
    p.appendChild(stratL); p.appendChild(ta);
    p.appendChild(apply); p.appendChild(close);
    document.body.appendChild(p);
    return p;
  }
  function fill() {
    var p = document.getElementById(PANEL_ID);
    if (!p) return;
    var st = settings();
    var off = p.querySelector("input[type=number]");
    var ta = p.querySelector("textarea");
    if (off) off.value = st.openingAutomationTickOffset || "-9.5";
    if (ta) ta.value = st.openingAutomationStrategy || "";
  }
  function refresh() {
    var t = document.getElementById(TOGGLE_ID);
    if (t) t.style.color = visible ? "#0f0" : "#fff";
    if (visible) {
      if (!document.getElementById(PANEL_ID)) { makePanel(); }
      fill();
      var p = document.getElementById(PANEL_ID);
      if (p) p.style.display = "";
    } else {
      var p = document.getElementById(PANEL_ID);
      if (p) p.style.display = "none";
    }
  }
  function attach() {
    try {
      if (document.body) {
        if (!document.getElementById(TOGGLE_ID)) makeToggle();
        if (visible && !document.getElementById(PANEL_ID)) { makePanel(); fill(); }
        refresh();
      }
    } catch (e) {}
  }
  attach();
  setInterval(attach, 500);
})();
