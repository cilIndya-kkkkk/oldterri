/* Injected INSIDE the game IIFE (at `function dN`). Exposes a minimal game
   interface on window.__fx.game for the automation engine. Pure ES5 (iOS 12).
   Raw-name reference table (Territorial.io 2.17.16):
     aE    = game
     aE.fV = playerId
     aE.hu = gIsReplay
     ah    = playerData
     ah.hn = playerBalances
     ah.hZ = playerTerritories
     ah.hR = playerTiles
     bV    = mapManager
     bV.aME = mapIsRendered
     bB    = protocolHandler
     bB.iC = gameCommandSender
     bB.iC.iJ = sendAttack(sliderValue, target)
     bw    = teamUtils
     bw.fe = canAttack
   Free-land attack uses the game's sentinel target 512 (empty land). */
(function () {
  if (typeof window === "undefined" || !window.__fx) return;
  var g = window.__fx.game = {};
  g.playerId = function () { return (typeof aE !== "undefined" && aE) ? aE.fV : null; };
  g.getTroops = function () { var p = g.playerId(); if (p == null) return 0; return (typeof ah !== "undefined" && ah && ah.hn) ? (ah.hn[p] || 0) : 0; };
  g.getLand = function () { var p = g.playerId(); if (p == null) return 0; return (typeof ah !== "undefined" && ah && ah.hZ) ? (ah.hZ[p] || 0) : 0; };
  g.isReplay = function () { return !!(typeof aE !== "undefined" && aE && aE.hu); };
  g.mapRendered = function () { return !!(typeof bV !== "undefined" && bV && bV.aME); };
  g.canAttack = function (a, t) { return (typeof bw !== "undefined" && bw && typeof bw.fe === "function") ? !!bw.fe(a, t) : true; };
  g.attackFreeLand = function (percent) {
    var c = (typeof bB !== "undefined" && bB) ? bB.iC : null;
    if (!c || typeof c.iJ !== "function") return false;
    var sv = Math.max(0, Math.min(1023, Math.round((Number(percent) || 0.1) * 1024 - 1)));
    c.iJ(sv, 512);
    return true;
  };
  window.__fx.gameReady = true;
})();
