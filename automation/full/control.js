/* Auto controls. Injected BEFORE the game IIFE (after the engine bundle).
   - Farm: cycles the bot-farming mode (off/v20reserve/best/messiah)
   - Opening / Inf: independent toggles
   All go through the engine's public methods (persist to fx_auto_settings).
   The whole block is draggable (touch events; iOS 12 has no Pointer Events)
   and its position is persisted, like the Opening setup toggle.
   ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var CONTAINER_ID = "fxAutoControls";
  var POS_KEY = "fx_controls_pos";
  var FARM_MODES = ["v20reserve", "best", "messiah", "off"];
  var bpos = null; // {x,y} in px (left/top)

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
  function applyPos(el, p) {
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.bottom = "auto";
    el.style.right = "auto";
  }

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

  function makeDraggable(c) {
    var startX = 0, startY = 0, startPos = null, dragging = false;
    c.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      startPos = bpos ? { x: bpos.x, y: bpos.y } : null;
      dragging = false;
      c.__moved = false;
    }, { passive: true });
    c.addEventListener("touchmove", function (e) {
      if (!e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragging = true;
      if (dragging) {
        var p = startPos ? { x: startPos.x + dx, y: startPos.y + dy } : { x: t.clientX, y: t.clientY };
        bpos = {
          x: Math.max(0, Math.min((window.innerWidth || 700) - c.offsetWidth - 4, p.x)),
          y: Math.max(0, Math.min((window.innerHeight || 600) - c.offsetHeight - 4, p.y))
        };
        applyPos(c, bpos);
        c.__moved = true;
        e.preventDefault();
      }
    }, { passive: false });
    c.addEventListener("touchend", function () {
      if (dragging) { savePos(); dragging = false; }
    }, { passive: true });
  }

  function build() {
    var c = document.createElement("div");
    c.id = CONTAINER_ID;
    c.style.cssText = "position:fixed;z-index:999999;bottom:8px;right:8px;";
    var bFarm = makeButton("fxFarmBtn");
    bFarm.onclick = function () { if (c.__moved) { c.__moved = false; return; } cycleFarm(); refresh(); };
    var bOp = makeButton("fxOpeningBtn");
    bOp.onclick = function () { if (c.__moved) { c.__moved = false; return; } setOpening(!state().opening); refresh(); };
    var bInf = makeButton("fxInfBtn");
    bInf.onclick = function () { if (c.__moved) { c.__moved = false; return; } setInf(!state().inf); refresh(); };
    c.appendChild(bFarm);
    c.appendChild(bOp);
    c.appendChild(bInf);
    document.body.appendChild(c);

    if (!bpos) loadPos();
    if (!bpos) {
      var r = c.getBoundingClientRect();
      bpos = {
        x: Math.max(4, (window.innerWidth || r.right + 8) - r.width - 8),
        y: Math.max(4, (window.innerHeight || r.bottom + 8) - r.height - 8)
      };
    }
    applyPos(c, bpos);
    makeDraggable(c);
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
