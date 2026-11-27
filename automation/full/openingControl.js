/* Custom opening strategy + tick offset panel. Injected BEFORE the game IIFE.
   The toggle button is draggable (touch events; iOS 12 has no Pointer Events)
   and its position is persisted to localStorage so it can be moved off the
   game's exit button. The panel opens relative to the button.
   ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var TOGGLE_ID = "fxOpeningSetupBtn";
  var PANEL_ID = "fxOpeningPanel";
  var visible = false;
  var POS_KEY = "fx_opening_pos";
  var bpos = null; // {x,y} in px (left/top)

  function loadPos() {
    try {
      var raw = window.localStorage.getItem(POS_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (typeof p.x === "number" && typeof p.y === "number") bpos = { x: p.x, y: p.y };
      }
    } catch (e) {}
  }
  function savePos() {
    try { window.localStorage.setItem(POS_KEY, JSON.stringify(bpos)); } catch (e) {}
  }
  function defaultPos() {
    // bottom-left of the viewport
    return { x: 8, y: Math.max(8, (window.innerHeight || 600) - 44) };
  }

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

  function applyPos(el, p) {
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.bottom = "auto";
    el.style.right = "auto";
  }

  function makeToggle() {
    var b = document.createElement("div");
    b.id = TOGGLE_ID;
    b.style.cssText = "position:fixed;z-index:999999;padding:5px 10px;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;";
    b.textContent = "Opening setup";
    if (!bpos) loadPos();
    applyPos(b, bpos || defaultPos());
    b.onclick = function () {
      if (b.__moved) { b.__moved = false; return; }
      visible = !visible;
      refresh();
    };

    // Drag via touch events (iOS 12 has no Pointer Events)
    var startX = 0, startY = 0, startPos = null, dragging = false;
    b.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      startPos = bpos ? { x: bpos.x, y: bpos.y } : null;
      dragging = false;
      b.__moved = false;
    }, { passive: true });
    b.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragging = true;
      if (dragging) {
        var p = startPos ? { x: startPos.x + dx, y: startPos.y + dy }
                         : { x: t.clientX, y: t.clientY };
        bpos = { x: Math.max(0, Math.min((window.innerWidth || 700) - 20, p.x)),
                 y: Math.max(0, Math.min((window.innerHeight || 600) - 20, p.y)) };
        applyPos(b, bpos);
        b.__moved = true;
        e.preventDefault();
      }
    }, { passive: false });
    b.addEventListener("touchend", function (e) {
      if (dragging) { savePos(); dragging = false; }
    }, { passive: true });

    document.body.appendChild(b);
    return b;
  }
  function makePanel() {
    var p = document.createElement("div");
    p.id = PANEL_ID;
    p.style.cssText = "position:fixed;z-index:999999;width:min(85vw,300px);max-height:60vh;overflow:auto;background:rgba(0,0,0,0.85);color:#eee;font:12px sans-serif;padding:8px;border-radius:4px;";

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

    var presets = (typeof window.__fxOpeningStrategies === "object" && window.__fxOpeningStrategies) ? window.__fxOpeningStrategies : {};
    var presetSel = document.createElement("select");
    presetSel.style.cssText = "width:100%;box-sizing:border-box;margin:2px 0 8px;";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "-- choose a researched strategy --";
    presetSel.appendChild(ph);
    for (var key in presets) {
      var o = document.createElement("option");
      o.value = key;
      o.textContent = key;
      presetSel.appendChild(o);
    }
    presetSel.onchange = function () {
      var key = presetSel.value;
      if (key && presets[key]) ta.value = JSON.stringify(presets[key], null, 2);
    };

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
    p.appendChild(presetSel);
    p.appendChild(apply); p.appendChild(close);
    document.body.appendChild(p);
    return p;
  }
  function positionPanel(p) {
    // Place the panel relative to the toggle button (just above it).
    var tb = document.getElementById(TOGGLE_ID);
    var px = 8, py = 48;
    if (tb) {
      var r = tb.getBoundingClientRect();
      px = r.left;
      var ph = p.offsetHeight || 200;
      py = r.top - ph - 6;
      if (py < 4) py = r.top + r.height + 6;
    }
    p.style.left = px + "px";
    p.style.top = Math.max(4, py) + "px";
    p.style.right = "auto";
    p.style.bottom = "auto";
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
  var wasVisible = false;
  function refresh() {
    var t = document.getElementById(TOGGLE_ID);
    if (t) t.style.color = visible ? "#0f0" : "#fff";
    if (visible) {
      if (!document.getElementById(PANEL_ID)) { makePanel(); }
      if (!wasVisible) { fill(); positionPanel(document.getElementById(PANEL_ID)); }
      var p = document.getElementById(PANEL_ID);
      if (p) p.style.display = "";
    } else {
      var p = document.getElementById(PANEL_ID);
      if (p) p.style.display = "none";
    }
    wasVisible = visible;
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
  loadPos();
  attach();
  setInterval(attach, 500);
})();
