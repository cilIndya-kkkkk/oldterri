/* Minimal auto on/off toggle. Injected BEFORE the game IIFE (after the engine
   bundle). Talks to the engine through its public methods, which persist to
   localStorage (fx_auto_settings), so the state survives reloads and the button
   reflects the engine's actual state via getAutoAttackMode(). ES5 (iOS 12). */
(function () {
  if (typeof window === "undefined") return;
  var BTN_ID = "fxAutoBtn";
  function engine() { return (window.__fx && window.__fx.openingAutomation) || null; }
  function isOn() {
    var a = engine();
    if (!a) return true;
    try { return a.getAutoAttackMode() !== "off"; } catch (e) { return true; }
  }
  function setOn(on) {
    var a = engine();
    if (!a) return;
    try {
      if (on) {
        a.setOpeningAutomationEnabled(true);
        a.setAutoAttackMode("v20reserve");
      } else {
        a.setOpeningAutomationEnabled(false);
        a.setAutoAttackMode("off");
      }
    } catch (e) {}
  }
  function makeButton() {
    var b = document.createElement("div");
    b.id = BTN_ID;
    b.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:999999;padding:6px 10px;background:rgba(0,0,0,0.7);color:#fff;font:12px sans-serif;border-radius:4px;cursor:pointer;user-select:none;-webkit-user-select:none;";
    b.onclick = function () { setOn(!isOn()); refresh(); };
    document.body.appendChild(b);
    return b;
  }
  function refresh() {
    var b = document.getElementById(BTN_ID);
    if (!b) return;
    var on = isOn();
    b.textContent = on ? "Auto: ON" : "Auto: OFF";
    b.style.color = on ? "#0f0" : "#f66";
  }
  function attach() {
    try {
      if (document.body) {
        if (!document.getElementById(BTN_ID)) makeButton();
        refresh();
      }
    } catch (e) {}
  }
  attach();
  setInterval(attach, 500);
})();
