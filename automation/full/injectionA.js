__fx.gameUi = __fx.gameUi || {
  isHidden: function() {
    var game = typeof aE !== "undefined" ? aE : null;
    return Boolean(game && game.oF === true);
  },
  setHidden: function(value) {
    var hidden = Boolean(value);
    var controller = typeof bF !== "undefined" ? bF : null;
    try {
      if (controller && typeof controller.a6M === "function") controller.a6M(hidden);
    } catch (_error) {
    }
    var game = typeof aE !== "undefined" ? aE : null;
    if (game && game.oF !== hidden) {
      game.oF = hidden;
      try {
        if (typeof hE !== "undefined" && hE && typeof hE.resize === "function") hE.resize();
      } catch (_error) {
      }
      try {
        window.dispatchEvent(new Event("resize"));
      } catch (_error) {
      }
    }
  },
  isSpawnSelection: function() {
    var game = typeof aE !== "undefined" ? aE : null;
    return Boolean(game && game.iB === true);
  }
};
var __fxAd = typeof ad !== "undefined" ? ad : void 0;
var __fxTargetStart = (humans) => aE.il ? 0 : humans;
__fx.openingAutomation.attack = () => __fx.openingAutomation.attackFreeLand();
var __fxNeutralBorderTileCount = () => {
  var _a;
  var player = aE.fV;
  var borderTiles = (_a = ah.hR) == null ? void 0 : _a[player];
  if (!borderTiles || !borderTiles.length) return 0;
  var offsets = __fxAd == null ? void 0 : __fxAd.fn;
  if (!offsets || typeof __fxAd.fc !== "function") return 0;
  var seen = /* @__PURE__ */ new Set();
  var count = 0;
  for (var i2 = borderTiles.length - 1; i2 >= 0; i2--) {
    var tile = borderTiles[i2];
    for (var d = 0; d < 4; d++) {
      var neighbor = tile + offsets[d];
      var key = neighbor >> 2;
      if (seen.has(key)) continue;
      if (!__fxAd.fc(neighbor)) continue;
      seen.add(key);
      count++;
    }
  }
  return count;
};
__fx.openingAutomation.hasFreeLandAroundPlayer = () => __fxNeutralBorderTileCount() > 0;
__fx.openingAutomation.findBorderBotAttackTarget = () => {
  var _a;
  var player = aE.fV;
  var borderTiles = (_a = ah.hR) == null ? void 0 : _a[player];
  if (!borderTiles || !borderTiles.length) return -1;
  var offsets = __fxAd == null ? void 0 : __fxAd.fn;
  if (!offsets || typeof __fxAd.hL !== "function" || typeof __fxAd.fd !== "function") return -1;
  var humans = aE.l9;
  var maxPlayers = aE.a19 || 512;
  var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
  var lastTick = __fx.openingAutomation.lastTick;
  var seen = /* @__PURE__ */ new Set();
  var bestId = -1;
  var bestLand = -1;
  for (var i2 = borderTiles.length - 1; i2 >= 0; i2--) {
    var tile = borderTiles[i2];
    for (var d = 0; d < 4; d++) {
      var neighbor = tile + offsets[d];
      if (!__fxAd.hL(neighbor)) continue;
      var owner = __fxAd.fd(neighbor);
      if (owner < __fxTargetStart(humans) || owner >= maxPlayers || owner === player || seen.has(owner)) continue;
      seen.add(owner);
      if ((recentTargets == null ? void 0 : recentTargets.has(owner)) && lastTick - recentTargets.get(owner) < 30) continue;
      var land = ah.hZ[owner] || 0;
      if (land <= bestLand) continue;
      var troops = ah.hn[owner] || 0;
      var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
      if (!isFinite(density) || density > 0.2) continue;
      bestId = owner;
      bestLand = land;
    }
  }
  return bestId;
};
__fx.openingAutomation.findV20ReserveBotAttackTarget = (tick, attackPercent) => {
  var _a;
  var player = aE.fV;
  var borderTiles = (_a = ah.hR) == null ? void 0 : _a[player];
  if (!borderTiles || !borderTiles.length) return -1;
  var offsets = __fxAd == null ? void 0 : __fxAd.fn;
  if (!offsets || typeof __fxAd.hL !== "function" || typeof __fxAd.fd !== "function") return -1;
  var humans = Number(aE.l9);
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(humans) || humans < 1) return -1;
  var ownTroops = ah.hn[player] || 0;
  var ownLand = ah.hZ[player] || 0;
  if (ownTroops <= 0 || ownLand <= 0) return -1;
  var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
  var activeTargets = __fx.openingAutomation.automatedBotAttacks;
  var cycle = Math.floor(tick / 100);
  var breakeven = { 9: 1.84, 10: 2.01, 11: 2.16, 12: 2.25, 13: 2.27, 14: 2.18, 15: 1.95, 16: 1.56, 17: 1.88 };
  var maxCostPerLand = (breakeven[cycle] || 1.8) * 2;
  if (ownTroops > ownLand * 70) maxCostPerLand = Math.max(maxCostPerLand, 6);
  var minLand = Math.max(300, Math.floor(ownLand * 5e-3));
  var sendTroops = ownTroops * Math.max(0, Math.min(0.11, Number(attackPercent) || 0));
  if (sendTroops < 200) return -1;
  var seen = /* @__PURE__ */ new Set();
  var bestId = -1;
  var bestScore = -1;
  for (var i2 = borderTiles.length - 1; i2 >= 0; i2--) {
    var tile = borderTiles[i2];
    for (var d = 0; d < 4; d++) {
      var neighbor = tile + offsets[d];
      if (!__fxAd.hL(neighbor)) continue;
      var id = __fxAd.fd(neighbor);
      if (id < __fxTargetStart(humans) || id >= maxPlayers || id === player || seen.has(id)) continue;
      seen.add(id);
      if (!__fxCanAttack(player, id) || !__fxBorders(id, player)) continue;
      if (activeTargets == null ? void 0 : activeTargets.has(id)) continue;
      if ((recentTargets == null ? void 0 : recentTargets.has(id)) && tick - recentTargets.get(id) < 20) continue;
      var land = ah.hZ[id] || 0;
      if (land < minLand) continue;
      var troops = ah.hn[id] || 0;
      var density = troops / Math.max(1, land);
      var costPerLand = 2 * (1 + 1.6 * density);
      if (!isFinite(costPerLand) || costPerLand > maxCostPerLand) continue;
      var killCost = costPerLand * land / (253 / 256);
      var expectedLand = Math.min(sendTroops, killCost) / Math.max(2, costPerLand);
      var completionRatio = Math.min(1, sendTroops / Math.max(1, killCost));
      var efficiencyMultiplier = Math.pow(2 / Math.max(2, costPerLand), 0.7);
      var score = expectedLand * efficiencyMultiplier * (0.7 + completionRatio * 0.3);
      if (score > bestScore) {
        bestId = id;
        bestScore = score;
      }
    }
  }
  return bestId;
};
__fx.openingAutomation.getDeployedTroops = () => {
  var player = aE.fV;
  if (typeof ae !== "undefined" && typeof ae.gs === "function") {
    var freeLandTarget = 512;
    var count = ae.gs(player) || 0;
    for (var attackIndex = count - 1; attackIndex >= 0; attackIndex--) {
      var target = ae.gx(player, attackIndex);
      if (target === freeLandTarget) return ae.gy(player, attackIndex) || 0;
    }
  }
  return 0;
};
__fx.openingAutomation.getNeutralOutgoing = () => __fx.openingAutomation.getDeployedTroops();
__fx.openingAutomation.getNeutralBorderTileCount = () => __fxNeutralBorderTileCount();
__fx.openingAutomation.getPlayerTroops = () => ah.hn[aE.fV];
__fx.openingAutomation.getPlayerLand = () => ah.hZ[aE.fV];
__fx.openingAutomation.attack = () => __fx.openingAutomation.attackFreeLand();
__fx.openingAutomation.attackFreeLand = () => {
  if (aE.hu) return false;
  var freeLandTarget = 512;
  var percent = __fx.keybindFunctions.getAttackPercentage();
  var sliderValue = Math.max(0, Math.min(1023, Math.round(percent * 1024 - 1)));
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.iK === "function") {
    bB.iD.iK(sliderValue, freeLandTarget);
    return true;
  }
  return false;
};
__fx.openingAutomation.attackFreeLandWithPercent = (percent) => {
  if (aE.hu) return false;
  percent = Math.max(0, Math.min(1, Number(percent || 0)));
  var freeLandTarget = 512;
  var sliderValue = Math.max(0, Math.min(1023, Math.round(percent * 1024 - 1)));
  __fx.keybindFunctions.setAbsolute(percent);
  __fx.keybindFunctions.repaintAttackPercentageBar();
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.iK === "function") {
    bB.iD.iK(sliderValue, freeLandTarget);
    return true;
  }
  return false;
};
var __fxCanAttack = (attacker, target) => {
  if (!aE.il) return true;
  if (typeof bw !== "undefined" && typeof bw.fe === "function") {
    return bw.fe(attacker, target);
  }
  return true;
};
var __fxBorders = (left, right) => {
  if (typeof bw !== "undefined" && typeof bw.fe === "function") {
    return bw.fe(left, right);
  }
  return true;
};
var __fxOffsets = () => [1, -1, 512, -512];
var __fxTileOwned = (tile) => false;
var __fxTileOwner = (tile) => void 0;
var __fxTileNeutral = (tile) => false;
__fx.openingAutomation.attackPlayer = (target) => {
  var _a, _b;
  if (aE.hu) return false;
  var humans = Number(aE.l9);
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(humans) || humans < 1) return false;
  if (target < __fxTargetStart(humans) || target >= maxPlayers) return false;
  var targetLand = ah.hZ[target];
  if (!targetLand || targetLand <= 0) return false;
  if (!__fxCanAttack(aE.fV, target)) return false;
  var percent = Number(((_b = (_a = __fx.keybindFunctions).getAttackPercentage) == null ? void 0 : _b.call(_a)) || 0.32);
  if (!isFinite(percent) || percent <= 0) percent = 0.32;
  __fx.keybindFunctions.setAbsolute(percent);
  __fx.keybindFunctions.repaintAttackPercentageBar();
  var sliderValue = Math.max(0, Math.min(1023, Math.round(percent * 1024 - 1)));
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.iK === "function") {
    bB.iD.iK(sliderValue, target);
    return true;
  }
  return false;
};
var __fxCanSupportTarget = (target) => {
  if (aE.hu) return false;
  if (!aE.il) return false;
  var player = aE.fV;
  target = Number(target);
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(target) || target < 0 || target >= maxPlayers || target === player) return false;
  if ((ah.hZ[target] || 0) <= 0) return false;
  if (typeof bw === "undefined" || typeof bw.fe !== "function") return false;
  if (bw.fe(player, target)) return false;
  return true;
};
__fx.openingAutomation.getMaxSupportPercent = (target) => {
  if (!__fxCanSupportTarget(target)) return 0;
  var player = aE.fV;
  var support = bD.h7;
  if (!support || typeof support.jQ !== "function" || typeof support.sT !== "function") return 0;
  var best = -1;
  for (var sliderValue = 0; sliderValue < 1024; sliderValue++) {
    var amount = support.jQ(player, sliderValue);
    if (support.sT(player, amount, Number(target))) best = sliderValue;
  }
  return best < 0 ? 0 : (best + 1) / 1024;
};
__fx.openingAutomation.canSupport = (target) => __fxCanSupportTarget(target) && __fx.openingAutomation.getMaxSupportPercent(target) > 0;
__fx.openingAutomation.sendSupport = (target, percent) => {
  if (!__fxCanSupportTarget(target)) return false;
  percent = Number(percent);
  if (!isFinite(percent)) percent = 0.1;
  percent = Math.max(0, Math.min(1, percent));
  var sliderValue = Math.max(0, Math.min(1023, Math.round(percent * 1024 - 1)));
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.s2 === "function") {
    bB.iD.s2(sliderValue, target);
    return true;
  }
  return false;
};
__fx.openingAutomation.canAttackTarget = (target) => {
  if (aE.hu) return false;
  target = Number(target);
  var player = aE.fV;
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(target) || target < 0 || target >= maxPlayers || target === player) return false;
  if ((ah.hZ[target] || 0) <= 0) return false;
  return __fxCanAttack(player, target);
};
__fx.openingAutomation.attackPlayerTarget = (target, percent) => {
  if (!__fx.openingAutomation.canAttackTarget(target)) return false;
  percent = Number(percent);
  if (!isFinite(percent)) percent = 0.09;
  percent = Math.max(0, Math.min(1, percent));
  var sliderValue = Math.max(0, Math.min(1023, Math.round(percent * 1024 - 1)));
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.iK === "function") {
    bB.iD.iK(sliderValue, Number(target));
    return true;
  }
  return false;
};
__fx.botMap = __fx.botMap || {};
__fx.botMap.playerAt = function(clientX, clientY) {
  try {
    var scale = __fx.hoveringTooltip && __fx.hoveringTooltip.canvasPixelScale || 1;
    var coordX = bP.i2(Number(clientX) * scale);
    var coordY = bP.i4(Number(clientY) * scale);
    if (!bP.i5(coordX, coordY)) return -1;
    var tile = bP.fb(bP.g8(coordX, coordY));
    if (!ad.hL(tile)) return -1;
    return ad.fd(tile);
  } catch (_error) {
    return -1;
  }
};
__fx.botMap.launchShipAt = function(clientX, clientY, percent) {
  try {
    var scale = i.l || 1;
    var value = Number(percent);
    if (!isFinite(value)) value = 0.04;
    value = Math.max(0, Math.min(1, value));
    var keybinds = __fx.keybindFunctions;
    var previous = keybinds && typeof keybinds.getAttackPercentage === "function" ? keybinds.getAttackPercentage() : null;
    if (keybinds && typeof keybinds.setAbsolute === "function") {
      keybinds.setAbsolute(value);
      if (typeof keybinds.repaintAttackPercentageBar === "function") keybinds.repaintAttackPercentageBar();
    }
    bW.hs(Math.floor(scale * Number(clientX)), Math.floor(scale * Number(clientY)));
    bW.ht(1);
    if (previous !== null && keybinds && typeof keybinds.setAbsolute === "function") {
      keybinds.setAbsolute(previous);
      if (typeof keybinds.repaintAttackPercentageBar === "function") keybinds.repaintAttackPercentageBar();
    }
    return true;
  } catch (_error) {
    return false;
  }
};
__fx.openingAutomation.cancelPlayerAttack = (target) => {
  if (aE.hu) return false;
  if (target < 0 || target >= aE.a19) return false;
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.sI === "function") {
    bB.iD.sI(target);
    return true;
  }
  return false;
};
__fx.openingAutomation.cancelFreeLandAttack = () => {
  if (aE.hu) return false;
  var freeLandTarget = 512;
  if (typeof bB !== "undefined" && bB.iD && typeof bB.iD.sI === "function") {
    bB.iD.sI(freeLandTarget);
    return true;
  }
  return false;
};
__fx.openingAutomation.getTargetLand = (target) => ah.hZ[target];
__fx.openingAutomation.getTargetTroops = (target) => ah.hn[target];
__fx.openingAutomation.getBotAttackSnapshot = (target) => {
  var _a, _b;
  if (target < aE.l9 || target >= aE.a19) return null;
  var targetLand = ah.hZ[target];
  if (targetLand <= 0) return null;
  var targetTroops = ah.hn[target];
  var targetDensity = targetTroops / (targetLand * 150) * 100;
  var attackPercent = Number(((_b = (_a = __fx.keybindFunctions).getAttackPercentage) == null ? void 0 : _b.call(_a)) || 0);
  var playerTroops = ah.hn[aE.fV];
  return {
    target,
    targetName: ah.a4x[target],
    targetLand,
    targetTroops,
    targetDensity: Number(targetDensity.toFixed(4)),
    attackPercent: Number(attackPercent.toFixed(4)),
    playerTroops,
    attackTroops: Math.floor(playerTroops * attackPercent)
  };
};
__fx.openingAutomation.isLiveLowDensityBotTarget = (target, mode, reserved) => {
  var _a;
  if (target < aE.l9 || target >= aE.a19) return false;
  var land = ah.hZ[target];
  if (land <= 0) return false;
  if (!__fxBorders(target, aE.fV) || !__fxCanAttack(aE.fV, target)) return false;
  var troops = ah.hn[target];
  var density = troops / (land * 150);
  if (reserved) return isFinite(density) && density <= 0.3;
  if (mode === "raw") {
    var rawDensity = density * 100;
    var record = ((_a = __fx.openingAutomation).safeBotDensityTracker || (_a.safeBotDensityTracker = /* @__PURE__ */ new Map())).get(target);
    var now = __fx.openingAutomation.lastTick;
    var attackTarget = __fx.openingAutomation.inferBotAttackTarget(target);
    var landGrowthAge = (record == null ? void 0 : record.landGrowthTick) !== void 0 ? now - record.landGrowthTick : Infinity;
    var lowDensityAge = (record == null ? void 0 : record.rawLowDensityTick) !== void 0 ? now - record.rawLowDensityTick : Infinity;
    var sizeableTarget = attackTarget && (attackTarget.land >= 300 || attackTarget.land >= land * 0.08);
    var movingWindow = sizeableTarget && landGrowthAge <= 35;
    var freshLowDensity = lowDensityAge <= 18;
    var stationaryException = rawDensity <= 0.1 && land >= 1800 && freshLowDensity;
    return isFinite(rawDensity) && rawDensity <= 0.3 && (movingWindow || stationaryException);
  }
  if (mode !== "safe" && mode !== "best") return isFinite(density) && density <= 0.2;
  var ownTroops = ah.hn[aE.fV];
  var estimatedKillCost = troops * 2;
  return isFinite(density) && estimatedKillCost <= ownTroops * 0.55;
};
__fx.openingAutomation.findLowDensityBorderingBots = (limit, mode) => {
  var targets = [];
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    if (ah.hZ[id] <= 0) continue;
    if (id === aE.fV || !__fxBorders(id, aE.fV) || !__fxCanAttack(aE.fV, id)) continue;
    var density = ah.hn[id] / (ah.hZ[id] * 150);
    if (density >= 0.4) continue;
    targets.push({ id, density, land: ah.hZ[id], balance: ah.hn[id] });
  }
  if (mode === "small") targets.sort((a, b) => a.density - b.density || a.land - b.land || a.balance - b.balance);
  else targets.sort((a, b) => a.density - b.density || b.land - a.land || b.balance - a.balance);
  return targets.slice(0, limit || 10).map((target) => target.id);
};
__fx.openingAutomation.updateSafeBotDensityTracker = () => {
  var _a;
  var playerId = aE.fV;
  var now = __fx.openingAutomation.lastTick;
  if (!isFinite(now) || now < 0) now = 0;
  if (__fx.openingAutomation.safeBotDensityTrackerLastUpdate === now) return;
  __fx.openingAutomation.safeBotDensityTrackerLastUpdate = now;
  var tracker = (_a = __fx.openingAutomation).safeBotDensityTracker || (_a.safeBotDensityTracker = /* @__PURE__ */ new Map());
  var seen = /* @__PURE__ */ new Set();
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land <= 0) continue;
    var record = tracker.get(id) || {};
    record.landDelta = isFinite(record.land) ? land - record.land : 0;
    if (isFinite(record.land) && land > record.land) {
      record.landGrowthTick = now;
    }
    if (__fxBorders(id, playerId) && __fxCanAttack(playerId, id)) {
      var density = ah.hn[id] / (land * 150);
      if (!isFinite(record.density) && density < 0.12 || isFinite(record.density) && record.density >= 0.25 && density < 0.12) {
        record.fullsendAt = performance.now();
      }
      var rawDensity = density * 100;
      if (rawDensity <= 0.3) {
        record.rawLowDensityTick = now;
      }
      record.density = density;
      record.rawDensity = rawDensity;
    }
    record.land = land;
    record.seenAt = now;
    tracker.set(id, record);
    seen.add(id);
  }
  tracker.forEach((record2, id2) => {
    if (!seen.has(id2) || now - (record2.seenAt || 0) > 150) tracker.delete(id2);
  });
};
__fx.openingAutomation.inferBotAttackTarget = (botId) => {
  var _a, _b, _c;
  var tracker = (_a = __fx.openingAutomation).safeBotDensityTracker || (_a.safeBotDensityTracker = /* @__PURE__ */ new Map());
  var botTiles = ((_b = ah.gp) == null ? void 0 : _b[botId]) || ((_c = ah.go) == null ? void 0 : _c[botId]) || [];
  var offsets = __fxOffsets();
  if (!botTiles.length || offsets.length < 4) return null;
  var best = null;
  for (var tileIndex = botTiles.length - 1; tileIndex >= 0; tileIndex--) {
    var tile = botTiles[tileIndex];
    for (var offsetIndex = 3; offsetIndex >= 0; offsetIndex--) {
      var neighbor = tile + offsets[offsetIndex];
      if (__fxTileNeutral(neighbor) || !__fxTileOwned(neighbor)) continue;
      var owner = __fxTileOwner(neighbor);
      if (owner === botId || owner < aE.l9 || owner >= aE.a19) continue;
      var record = tracker.get(owner);
      if (!record || !isFinite(record.landDelta) || record.landDelta >= 0) continue;
      var land = ah.hZ[owner];
      if (land <= 0) continue;
      var loss = -record.landDelta;
      var score = loss * Math.sqrt(Math.max(1, land));
      if (!best || score > best.score) best = { id: owner, land, loss, score };
    }
  }
  return best;
};
__fx.openingAutomation.getBotExposure = (botId) => {
  var _a, _b;
  var playerId = aE.fV;
  var botTiles = ((_a = ah.gp) == null ? void 0 : _a[botId]) || ((_b = ah.go) == null ? void 0 : _b[botId]) || [];
  var offsets = __fxOffsets();
  var botNeighbors = /* @__PURE__ */ new Set();
  var playerEdges = 0;
  var botEdges = 0;
  if (!botTiles.length || offsets.length < 4) return { botNeighbors: 0, botEdges: 0, playerEdges: 0, ratio: 0 };
  for (var tileIndex = botTiles.length - 1; tileIndex >= 0; tileIndex--) {
    var tile = botTiles[tileIndex];
    for (var offsetIndex = 3; offsetIndex >= 0; offsetIndex--) {
      var neighbor = tile + offsets[offsetIndex];
      if (__fxTileNeutral(neighbor) || !__fxTileOwned(neighbor)) continue;
      var owner = __fxTileOwner(neighbor);
      if (owner === botId) continue;
      if (owner === playerId) {
        playerEdges++;
      } else if (owner >= aE.l9 && owner < aE.a19 && ah.hZ[owner] > 0) {
        botNeighbors.add(owner);
        botEdges++;
      }
    }
  }
  return {
    botNeighbors: botNeighbors.size,
    botEdges,
    playerEdges,
    ratio: botEdges / Math.max(1, playerEdges)
  };
};
__fx.openingAutomation.findWeakEncapsulatedBot = (attackPercent, mode) => {
  __fx.openingAutomation.updateSafeBotDensityTracker();
  var playerId = aE.fV;
  var nowTick = __fx.openingAutomation.lastTick;
  var tickInCycle = nowTick % 100;
  var ownTroops = ah.hn[playerId];
  var ownLand = ah.hZ[playerId];
  if (ownTroops <= 0 || ownLand < 18e3 || tickInCycle > 88) return null;
  var requestedPercent = Number(attackPercent);
  var landCap = ownLand < 6e4 ? 0.18 : 0.12;
  var cycleCap = tickInCycle < 35 ? 0.26 : tickInCycle < 70 ? 0.38 : 0.42;
  var maxPercent = Math.min(cycleCap, landCap);
  if (isFinite(requestedPercent) && requestedPercent > 0) maxPercent = Math.min(maxPercent, requestedPercent);
  var reserveTroops = ownTroops * 0.18;
  var taxTroops = Math.floor(ownTroops * 12 / 1024);
  var maxSendTroops = Math.max(0, ownTroops - reserveTroops - taxTroops);
  maxSendTroops = Math.min(maxSendTroops, ownTroops * maxPercent);
  if (maxSendTroops < 1) return null;
  var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
  var best = null;
  var bestScore = -1;
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land < 120 || land > Math.max(2400, ownLand * 0.1)) continue;
    if (id === playerId || !__fxBorders(id, playerId) || !__fxCanAttack(playerId, id)) continue;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && nowTick - recentTargets.get(id) < 18) continue;
    var exposure = __fx.openingAutomation.getBotExposure(id);
    if (exposure.playerEdges < 8 || exposure.botNeighbors > 1) continue;
    var troops = ah.hn[id];
    var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
    if (!isFinite(density) || density > 0.42) continue;
    var required = 2 * (land + troops) / (253 / 256);
    var plannedSendTroops = Math.min(required * 1.16, maxSendTroops);
    var oneShotRatio = plannedSendTroops / Math.max(1, required);
    if (oneShotRatio < 1.04 || oneShotRatio > 1.75) continue;
    var percent = Math.max(0.02, Math.min(maxPercent, plannedSendTroops / Math.max(1, ownTroops)));
    var score = (land * 2.2 + exposure.playerEdges * 12) * oneShotRatio / Math.sqrt(Math.max(density, 0.06));
    if (score > bestScore) {
      best = { target: id, percent, score, oneShotRatio, land, density, exposure };
      bestScore = score;
    }
  }
  __fx.openingAutomation.lastWeakEncapsulatedSelection = best;
  return best;
};
__fx.openingAutomation.findBestDynamicBotAttackTarget = (tick, options) => {
  var _a, _b, _c;
  options = options || {};
  __fx.openingAutomation.updateSafeBotDensityTracker();
  var playerId = aE.fV;
  var ownTroops = ah.hn[playerId];
  var _atkCount = __fxAd ? ((_a = __fxAd.gF || __fxAd.gG) == null ? void 0 : _a(playerId)) || 0 : 0;
  var _ownOutgoing = 0;
  for (var _ai = 0; _ai < _atkCount; _ai++) {
    _ownOutgoing += ((_b = __fxAd.gK ? __fxAd.gL : __fxAd.gM) == null ? void 0 : _b(playerId, _ai)) || 0;
  }
  if (_ownOutgoing / Math.max(1, ownTroops + _ownOutgoing) >= 0.5) return null;
  var ownLand = ah.hZ[playerId];
  var tickInCycle = tick % 100;
  var fixedPercent = Number(options.fixedPercent);
  var hasFixedPercent = isFinite(fixedPercent) && fixedPercent > 0;
  var forceBest = options.forceBest === true;
  var safeMode = options.mode === "safe";
  var reserveRatio = tickInCycle < 35 ? 0.44 : tickInCycle < 70 ? 0.26 : 0.18;
  var landCap = ownLand < 6e4 ? 0.3 : ownLand < 9e4 ? 0.15 : 0.1;
  var cycleCap = tickInCycle < 35 ? 0.26 : tickInCycle < 70 ? 0.38 : 0.42;
  var maxPercent = hasFixedPercent ? Math.min(0.5, Math.max(0.01, fixedPercent)) : Math.min(cycleCap, landCap);
  var taxTroops = Math.floor(ownTroops * 12 / 1024);
  var maxSendTroops = Math.max(0, ownTroops - ownTroops * reserveRatio - taxTroops);
  maxSendTroops = Math.min(maxSendTroops, ownTroops * maxPercent);
  if (maxSendTroops < 1) return null;
  var minLand = ownLand < 1e4 ? 180 : ownLand < 3e4 ? 260 : ownLand < 6e4 ? 500 : 700;
  var minScore = tickInCycle < 35 ? ownLand < 6e4 ? 520 : 850 : tickInCycle < 70 ? ownLand < 6e4 ? 700 : 1050 : ownLand < 6e4 ? 1150 : 1850;
  var stockpilePressure = ownTroops / Math.max(1, ownLand);
  var tracker = (_c = __fx.openingAutomation).safeBotDensityTracker || (_c.safeBotDensityTracker = /* @__PURE__ */ new Map());
  var best = null;
  var bestScore = -1;
  var fallbackBest = null;
  var fallbackBestScore = -1;
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land < minLand) continue;
    if (id === playerId || !__fxBorders(id, playerId) || !__fxCanAttack(playerId, id)) continue;
    var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && tick - recentTargets.get(id) < (forceBest ? 8 : 14)) continue;
    var troops = ah.hn[id];
    var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
    var maxAllowedDensity = safeMode ? 0.3 : 0.32;
    if (!isFinite(density) || density > maxAllowedDensity) continue;
    var record = tracker.get(id);
    var attackTarget = __fx.openingAutomation.inferBotAttackTarget(id);
    var landGrowthAge = (record == null ? void 0 : record.landGrowthTick) !== void 0 ? tick - record.landGrowthTick : Infinity;
    var lowDensityAge = (record == null ? void 0 : record.rawLowDensityTick) !== void 0 ? tick - record.rawLowDensityTick : Infinity;
    var targetIsSizeable = attackTarget && (attackTarget.land >= (safeMode ? 180 : 300) || attackTarget.land >= land * (safeMode ? 0.04 : 0.08));
    var movingWindow = targetIsSizeable && landGrowthAge <= (safeMode ? 55 : 35);
    var freshLowDensity = lowDensityAge <= (safeMode ? 42 : 30);
    var earlyStationaryException = ownLand < 15e3 && density <= (safeMode ? 0.24 : 0.11) && land >= 220 && freshLowDensity;
    var stationaryException = density <= (safeMode ? 0.24 : 0.12) && land >= (safeMode ? 850 : 1200) && freshLowDensity;
    var stockpileException = stockpilePressure >= 0.85 && density <= (safeMode ? 0.28 : 0.11) && land >= (safeMode ? 900 : 1500);
    if (stockpilePressure >= 1.1 && density <= (safeMode ? 0.3 : 0.12) && land >= (safeMode ? 1500 : 2500)) stockpileException = true;
    var oneShotRequired = 2 * (land + troops) / (253 / 256);
    var desiredSendTroops = oneShotRequired * (movingWindow ? 1.18 : 1.28);
    var plannedSendTroops = hasFixedPercent ? maxSendTroops : Math.min(desiredSendTroops, maxSendTroops);
    var oneShotRatio = plannedSendTroops / Math.max(1, oneShotRequired);
    if (forceBest) {
      var forcedDensityScore = Math.pow(land, safeMode ? 1.35 : 1.22) / Math.sqrt(Math.max(density, 0.05));
      var forcedKillScore = Math.min(1.4, Math.max(0.25, oneShotRatio));
      var forcedScore = forcedDensityScore * forcedKillScore;
      if (forcedScore > fallbackBestScore) {
        fallbackBest = {
          target: id,
          percent: Math.max(0.02, Math.min(maxPercent, plannedSendTroops / Math.max(1, ownTroops))),
          score: forcedScore,
          oneShotRatio,
          forced: true
        };
        fallbackBestScore = forcedScore;
      }
    }
    if (!movingWindow && !earlyStationaryException && !stationaryException && !stockpileException) continue;
    var troopKillRatio = plannedSendTroops / Math.max(1, troops * 2.8);
    if (oneShotRatio < (movingWindow ? 0.95 : 1.05) || oneShotRatio > 2.25) continue;
    var exposure = __fx.openingAutomation.getBotExposure(id);
    var exposurePenalty = 1 / (1 + Math.max(0, exposure.botNeighbors - 2) * 0.12);
    var movingBonus = movingWindow ? 2.4 : stockpileException ? 1.35 : 1;
    var windowBonus = attackTarget ? 1 + Math.min(1.5, Math.sqrt(Math.max(1, attackTarget.land)) / 65) : 1;
    var oneShotBonus = 2.4 + Math.min(0.8, oneShotRatio - 1);
    var troopKillBonus = Math.min(1.4, Math.max(0.7, troopKillRatio));
    var valueRatio = land / Math.max(1, oneShotRequired);
    var incomeUrgency = tickInCycle <= 70 ? 1 + (70 - tickInCycle) / 140 : 1;
    var overpayPenalty = 1 / (1 + Math.max(0, oneShotRatio - 1.25) * 0.45);
    var score = Math.pow(land, safeMode ? 1.28 : 1.08) * movingBonus * windowBonus * oneShotBonus * troopKillBonus * exposurePenalty * incomeUrgency * overpayPenalty * (1 + valueRatio * (safeMode ? 30 : 22)) / Math.sqrt(Math.max(density, 0.05));
    if (score < minScore) continue;
    if (score > bestScore) {
      best = {
        target: id,
        percent: Math.max(0.02, Math.min(maxPercent, plannedSendTroops / Math.max(1, ownTroops))),
        score,
        oneShotRatio
      };
      bestScore = score;
    }
  }
  return best || fallbackBest;
};
__fx.openingAutomation.estimateBotReachableLand = (entryTiles, botId, landTotal, budgetRounds) => {
  if (!entryTiles || !entryTiles.length || landTotal <= 0) return { reachable: 0, rounds: 0, complete: false };
  var offsets = __fxAd == null ? void 0 : __fxAd.fn;
  if (!offsets) return { reachable: landTotal, rounds: 0, complete: true };
  var reached = /* @__PURE__ */ new Set();
  var frontier = entryTiles;
  var rounds = 0, stagnant = 0, budgetSnapshot;
  var MAX_ROUNDS = 300;
  while (reached.size < landTotal && rounds < MAX_ROUNDS) {
    var toAdd = /* @__PURE__ */ new Set();
    for (var fi = 0; fi < frontier.length; fi++) {
      var tile = frontier[fi];
      for (var d = 0; d < 4; d++) {
        var neighbor = tile + offsets[d];
        if (reached.has(neighbor)) continue;
        if (!__fxAd.hL(neighbor)) continue;
        if (__fxAd.fd(neighbor) !== botId) continue;
        toAdd.add(neighbor);
      }
    }
    if (toAdd.size === 0) {
      stagnant++;
      if (stagnant >= 2) break;
    } else {
      stagnant = 0;
    }
    toAdd.forEach((t) => reached.add(t));
    frontier = Array.from(toAdd);
    rounds++;
    if (rounds === budgetRounds) budgetSnapshot = reached.size;
  }
  return {
    reachable: budgetSnapshot !== void 0 ? budgetSnapshot : reached.size,
    rounds,
    complete: reached.size >= landTotal
  };
};
__fx.openingAutomation.findMessiahBotAttackTarget = (tick) => {
  var _a;
  var player = aE.fV;
  var borderTiles = (_a = ah.hR) == null ? void 0 : _a[player];
  if (!borderTiles || !borderTiles.length) return null;
  var offsets = __fxAd == null ? void 0 : __fxAd.fn;
  if (!offsets || typeof __fxAd.hL !== "function" || typeof __fxAd.fd !== "function") return null;
  var humans = Number(aE.l9);
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(humans) || humans < 1) return null;
  var ownTroops = ah.hn[player] || 0;
  var ownLand = ah.hZ[player] || 0;
  if (ownTroops <= 0 || ownLand <= 0) return null;
  var entriesByBot = /* @__PURE__ */ new Map();
  for (var i2 = borderTiles.length - 1; i2 >= 0; i2--) {
    var tile = borderTiles[i2];
    for (var d = 0; d < 4; d++) {
      var neighbor = tile + offsets[d];
      if (!__fxAd.hL(neighbor)) continue;
      var owner = __fxAd.fd(neighbor);
      if (owner < __fxTargetStart(humans) || owner >= maxPlayers || owner === player) continue;
      var entries = entriesByBot.get(owner);
      if (!entries) {
        entries = [];
        entriesByBot.set(owner, entries);
      }
      if (entries.indexOf(tile) < 0) entries.push(tile);
    }
  }
  if (!entriesByBot.size) return null;
  var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
  var activeTargets = __fx.openingAutomation.automatedBotAttacks;
  var maxAllowedDensity = 0.32;
  var minLand = ownLand < 1e4 ? 180 : ownLand < 3e4 ? 260 : ownLand < 6e4 ? 500 : 700;
  var reserveRatio = 0.2;
  var taxTroops = Math.floor(ownTroops * 12 / 1024);
  var maxSendTroops = Math.max(0, ownTroops - ownTroops * reserveRatio - taxTroops);
  if (maxSendTroops < 1) return null;
  var BUDGET_ROUNDS = 10;
  var best = null;
  var bestScore = -1;
  entriesByBot.forEach((entryTiles, id) => {
    if (activeTargets == null ? void 0 : activeTargets.has(id)) return;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && tick - recentTargets.get(id) < 20) return;
    var land = ah.hZ[id] || 0;
    if (land < minLand) return;
    var troops = ah.hn[id] || 0;
    var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
    if (!isFinite(density) || density > maxAllowedDensity) return;
    var reach = __fx.openingAutomation.estimateBotReachableLand(entryTiles, id, land, BUDGET_ROUNDS);
    var reachableLand = Math.max(1, reach.reachable);
    var reachRatio = reachableLand / land;
    if (reachRatio < 0.35) return;
    var reachableTroops = troops * reachRatio;
    var killCost = 2 * (reachableLand + reachableTroops) / (253 / 256);
    var desiredSend = killCost * 1.25;
    var plannedSend = Math.min(desiredSend, maxSendTroops);
    var oneShotRatio = plannedSend / Math.max(1, killCost);
    if (oneShotRatio < 0.95) return;
    var score = Math.pow(reachableLand, 1.1) * reachRatio / Math.sqrt(Math.max(density, 0.05));
    if (score > bestScore) {
      best = {
        target: id,
        percent: Math.max(0.02, Math.min(0.5, plannedSend / Math.max(1, ownTroops))),
        score,
        oneShotRatio,
        reachRatio
      };
      bestScore = score;
    }
  });
  return best;
};
__fx.openingAutomation.findThighClientBotAttackTarget = (tick) => {
  var _a;
  __fx.openingAutomation.updateSafeBotDensityTracker();
  var playerId = aE.fV;
  var ownTroops = ah.hn[playerId];
  var ownLand = ah.hZ[playerId];
  var tickInCycle = tick % 100;
  var reserveRatio = tickInCycle < 35 ? 0.44 : tickInCycle < 70 ? 0.26 : 0.18;
  var landCap = ownLand < 6e4 ? 0.3 : ownLand < 9e4 ? 0.15 : 0.1;
  var cycleCap = tickInCycle < 35 ? 0.26 : tickInCycle < 70 ? 0.38 : 0.42;
  var maxPercent = Math.min(cycleCap, landCap);
  var taxTroops = Math.floor(ownTroops * 12 / 1024);
  var maxSendTroops = Math.max(0, ownTroops - ownTroops * reserveRatio - taxTroops);
  maxSendTroops = Math.min(maxSendTroops, ownTroops * maxPercent);
  if (maxSendTroops < 1) return null;
  var minLand = ownLand < 1e4 ? 250 : ownLand < 3e4 ? 350 : ownLand < 6e4 ? 650 : 900;
  var minScore = tickInCycle < 35 ? ownLand < 6e4 ? 750 : 1200 : tickInCycle < 70 ? ownLand < 6e4 ? 1e3 : 1550 : tickInCycle < 86 ? ownLand < 6e4 ? 1550 : 2550 : ownLand < 6e4 ? 2600 : 4200;
  var stockpilePressure = ownTroops / Math.max(1, ownLand);
  var tracker = (_a = __fx.openingAutomation).safeBotDensityTracker || (_a.safeBotDensityTracker = /* @__PURE__ */ new Map());
  var best = null;
  var bestScore = -1;
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land <= 0 || land < minLand) continue;
    if (id === playerId || !__fxBorders(id, playerId) || !__fxCanAttack(playerId, id)) continue;
    var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && tick - recentTargets.get(id) < 30) continue;
    var troops = ah.hn[id];
    var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
    if (!isFinite(density) || density > 0.26) continue;
    var record = tracker.get(id);
    var attackTarget = __fx.openingAutomation.inferBotAttackTarget(id);
    var landGrowthAge = (record == null ? void 0 : record.landGrowthTick) !== void 0 ? tick - record.landGrowthTick : Infinity;
    var lowDensityAge = (record == null ? void 0 : record.rawLowDensityTick) !== void 0 ? tick - record.rawLowDensityTick : Infinity;
    var targetIsSizeable = attackTarget && (attackTarget.land >= 300 || attackTarget.land >= land * 0.08);
    var movingWindow = targetIsSizeable && landGrowthAge <= 35;
    var freshLowDensity = lowDensityAge <= 18;
    var earlyStationaryException = ownLand < 15e3 && density <= 0.08 && land >= 300 && freshLowDensity;
    var earlyFallbackException = ownLand >= 12e3 && ownLand < 24e3 && tick < 1e3 && density <= 0.2 && land >= 350;
    var stationaryException = density <= 0.09 && land >= 2e3 && freshLowDensity;
    var stockpileException = stockpilePressure >= 0.9 && density <= 0.08 && land >= 2400;
    if (stockpilePressure >= 1.15 && density <= 0.09 && land >= 3800) stockpileException = true;
    if (tickInCycle >= 86 && !(movingWindow || stockpileException || freshLowDensity && density <= 0.12 && land >= 900)) continue;
    if (!movingWindow && !earlyStationaryException && !earlyFallbackException && !stationaryException && !stockpileException) continue;
    var oneShotRequired = 2 * (land + troops) / (253 / 256);
    var desiredSendTroops = oneShotRequired * (movingWindow ? 1.18 : earlyFallbackException ? 1.22 : 1.28);
    var plannedSendTroops = Math.min(desiredSendTroops, maxSendTroops);
    var oneShotRatio = plannedSendTroops / Math.max(1, oneShotRequired);
    var troopKillRatio = plannedSendTroops / Math.max(1, troops * 2.8);
    var efficientOneShot = oneShotRatio >= (movingWindow ? 1.1 : earlyFallbackException ? 1.2 : 1.2) && oneShotRatio <= 1.8;
    if (tickInCycle >= 86 && oneShotRatio < 1.24) efficientOneShot = false;
    if (!efficientOneShot) continue;
    var exposure = __fx.openingAutomation.getBotExposure(id);
    var exposurePenalty = 1 / (1 + Math.max(0, exposure.botNeighbors - 2) * 0.12);
    var movingBonus = movingWindow ? 2.4 : earlyFallbackException ? 1.7 : stockpileException ? 1.35 : 1;
    var windowBonus = attackTarget ? 1 + Math.min(1.5, Math.sqrt(Math.max(1, attackTarget.land)) / 65) : 1;
    var oneShotBonus = oneShotRatio >= 1 ? 2.4 + Math.min(0.8, oneShotRatio - 1) : 0.9;
    var troopKillBonus = Math.min(1.4, Math.max(0.7, troopKillRatio));
    var valueRatio = land / Math.max(1, oneShotRequired);
    var incomeUrgency = tickInCycle <= 70 ? 1 + (70 - tickInCycle) / 140 : 1;
    var overpayPenalty = oneShotRatio > 1 ? 1 / (1 + Math.max(0, oneShotRatio - 1.25) * 0.45) : 1;
    var lateFinishBonus = tickInCycle >= 86 ? movingWindow ? 1.25 : 0.78 : 1;
    var score = Math.pow(land, 1.18) * movingBonus * windowBonus * oneShotBonus * troopKillBonus * exposurePenalty * incomeUrgency * overpayPenalty * lateFinishBonus * (1 + valueRatio * 30) / Math.sqrt(Math.max(density, 0.05));
    if (score < minScore) continue;
    if (score > bestScore) {
      best = {
        target: id,
        percent: Math.max(0.02, Math.min(maxPercent, plannedSendTroops / Math.max(1, ownTroops))),
        score,
        oneShotRatio
      };
      bestScore = score;
    }
  }
  return best;
};
__fx.openingAutomation.findSimpleBestBotAttackTarget = (tick) => {
  var playerId = aE.fV;
  var humans = Number(aE.l9);
  var maxPlayers = aE.a19 || 512;
  if (!isFinite(humans) || humans < 1) return -1;
  var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
  var best = -1;
  var bestScore = -1;
  for (var id = __fxTargetStart(humans); id < maxPlayers; id++) {
    if (id === playerId) continue;
    var land = ah.hZ[id];
    if (!land || land <= 0) continue;
    if (!__fxCanAttack(playerId, id)) continue;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && tick - recentTargets.get(id) < 40) continue;
    var troops = ah.hn[id];
    var density = land > 0 ? troops / (land * 150) * 100 : Infinity;
    if (!isFinite(density) || density > 0.45) continue;
    var score = Math.pow(land, 1.35) / Math.sqrt(Math.max(density, 0.03));
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  if (best >= 0) return best;
  for (var fallbackId = __fxTargetStart(humans); fallbackId < maxPlayers; fallbackId++) {
    if (fallbackId === playerId) continue;
    var fallbackLand = ah.hZ[fallbackId];
    if (!fallbackLand || fallbackLand <= 0) continue;
    if (!__fxCanAttack(playerId, fallbackId)) continue;
    if ((recentTargets == null ? void 0 : recentTargets.has(fallbackId)) && tick - recentTargets.get(fallbackId) < 15) continue;
    var fallbackTroops = ah.hn[fallbackId];
    var fallbackDensity = fallbackLand > 0 ? fallbackTroops / (fallbackLand * 150) * 100 : Infinity;
    if (!isFinite(fallbackDensity)) continue;
    var fallbackScore = Math.pow(fallbackLand, 1.2) / Math.sqrt(Math.max(fallbackDensity, 0.03));
    if (fallbackScore > bestScore) {
      best = fallbackId;
      bestScore = fallbackScore;
    }
  }
  return best;
};
__fx.openingAutomation.findFullsendEncapsulatedBot = (attackPercent, mode) => {
  var conservativeMode = mode === "safe";
  var playerId = aE.fV;
  var ownTroops = ah.hn[playerId];
  var now = performance.now();
  var stats = { type: "safe-check", kind: "reserved", considered: 0, lowDensity: 0, rejectKill: 0, selected: false };
  var isEncapsulatedBot = (botId) => {
    var _a, _b;
    var botTiles = ((_a = ah.gp) == null ? void 0 : _a[botId]) || ((_b = ah.go) == null ? void 0 : _b[botId]) || [];
    var offsets = __fxOffsets();
    var touchesUs = false;
    if (!botTiles.length || offsets.length < 4) return false;
    for (var tileIndex = botTiles.length - 1; tileIndex >= 0; tileIndex--) {
      var tile = botTiles[tileIndex];
      for (var offsetIndex = 3; offsetIndex >= 0; offsetIndex--) {
        var neighbor = tile + offsets[offsetIndex];
        if (__fxTileNeutral(neighbor)) return false;
        if (!__fxTileOwned(neighbor)) continue;
        var owner = __fxTileOwner(neighbor);
        if (owner === botId) continue;
        if (owner !== playerId) return false;
        touchesUs = true;
      }
    }
    return touchesUs;
  };
  var best = -1, bestScore = -1;
  var bestInfo = null;
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land <= 0) continue;
    if (id === playerId || !__fxBorders(id, playerId) || !__fxCanAttack(playerId, id)) continue;
    if (!isEncapsulatedBot(id)) continue;
    var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
    if ((recentTargets == null ? void 0 : recentTargets.has(id)) && now - recentTargets.get(id) < 5e3) continue;
    stats.considered++;
    var botTroops = ah.hn[id];
    var density = botTroops / (land * 150);
    if (density >= 0.3) continue;
    stats.lowDensity++;
    var estimatedKillCost = botTroops * 2;
    var minSendPercent = estimatedKillCost / Math.max(1, ownTroops);
    var recommendedSendPercent = Math.min(conservativeMode ? 0.12 : 0.5, Math.max(0.05, minSendPercent * 1.1));
    var actualSendTroops = ownTroops * recommendedSendPercent;
    var fullKillRatio = actualSendTroops / Math.max(1, estimatedKillCost);
    if (fullKillRatio < 0.7) {
      stats.rejectKill++;
      continue;
    }
    var score = land * land / Math.max(1, estimatedKillCost);
    if (score > bestScore) {
      best = id;
      bestScore = score;
      bestInfo = { id, land, density, fullKillRatio, estimatedKillCost, recommendedSendPercent, score };
    }
  }
  if (bestInfo) {
    stats.selected = true;
    stats.target = bestInfo;
  }
  __fx.openingAutomation.lastSafeReservedSelection = bestInfo;
  __fx.openingAutomation.recordSafeTelemetry(stats);
  return best;
};
__fx.openingAutomation.findBestLowDensityBorderingBot = (cycleProgress, mode, attackPercent, excludeEncapsulated) => {
  var _a, _b, _c;
  cycleProgress = Math.max(0, Math.min(0.99, Number(cycleProgress) || 0));
  var playerId = aE.fV;
  var now = performance.now();
  var safeMode = mode === "safe" || mode === "best";
  var conservativeMode = mode === "safe";
  var rawMode = mode === "raw";
  if (!safeMode) __fx.openingAutomation.updateSafeBotDensityTracker();
  var ownTroops = ah.hn[playerId];
  var sendPercent = Number(attackPercent);
  if (!isFinite(sendPercent) || sendPercent <= 0) sendPercent = Number(((_b = (_a = __fx.keybindFunctions).getAttackPercentage) == null ? void 0 : _b.call(_a)) || 0);
  var sendTroops = ownTroops * sendPercent;
  var tracker = safeMode ? null : (_c = __fx.openingAutomation).safeBotDensityTracker || (_c.safeBotDensityTracker = /* @__PURE__ */ new Map());
  var minKillRatio = safeMode ? 0 : cycleProgress >= 0.65 ? 0.7 : 0.45;
  var stats = safeMode ? { type: "safe-check", kind: "normal", cycleProgress, considered: 0, rejectKill: 0, selected: false } : null;
  var fallbackBest = -1, fallbackScore = -1, fallbackInfo = null;
  var isEncapsulatedBot = (botId) => {
    var _a2, _b2;
    var botTiles = ((_a2 = ah.gp) == null ? void 0 : _a2[botId]) || ((_b2 = ah.go) == null ? void 0 : _b2[botId]) || [];
    var offsets = __fxOffsets();
    var touchesUs = false;
    if (!botTiles.length || offsets.length < 4) return false;
    for (var tileIndex = botTiles.length - 1; tileIndex >= 0; tileIndex--) {
      var tile = botTiles[tileIndex];
      for (var offsetIndex = 3; offsetIndex >= 0; offsetIndex--) {
        var neighbor = tile + offsets[offsetIndex];
        if (__fxTileNeutral(neighbor)) return false;
        if (!__fxTileOwned(neighbor)) continue;
        var owner = __fxTileOwner(neighbor);
        if (owner === botId) continue;
        if (owner !== playerId) return false;
        touchesUs = true;
      }
    }
    return touchesUs;
  };
  var best = -1, bestScore = -1;
  var bestInfo = null;
  for (var id = __fxTargetStart(aE.l9); id < aE.a19; id++) {
    var land = ah.hZ[id];
    if (land <= 0) continue;
    if (id === playerId || !__fxBorders(id, playerId) || !__fxCanAttack(playerId, id)) continue;
    var botTroops = ah.hn[id];
    var encapsulated = isEncapsulatedBot(id);
    if (excludeEncapsulated && encapsulated) continue;
    var density = botTroops / (land * 150);
    var score;
    if (safeMode) {
      var recentTargets = __fx.openingAutomation.autoAttackRecentTargets;
      if ((recentTargets == null ? void 0 : recentTargets.has(id)) && now - recentTargets.get(id) < 5e3) continue;
      stats.considered++;
      var safeDensity = botTroops / Math.max(1, land * 100);
      var densityThreshold = land >= 3e3 ? 0.05 : land >= 2e3 ? 0.04 : land >= 1e3 ? 0.03 : 0.02;
      if (safeDensity > densityThreshold) {
        stats.rejectDensity = (stats.rejectDensity || 0) + 1;
        continue;
      }
      var killCost = botTroops * 2;
      var minSendPercent = killCost / Math.max(1, ownTroops);
      var recommendedSendPercent = Math.min(conservativeMode ? 0.12 : 0.5, Math.max(0.05, minSendPercent * 1.6));
      var actualSendTroops = ownTroops * recommendedSendPercent;
      var requiredKillRatio = encapsulated ? 0.7 : 1;
      var fullKillRatio = actualSendTroops / Math.max(1, killCost);
      if (fullKillRatio < requiredKillRatio) {
        stats.rejectKill++;
        continue;
      }
      score = land * land / Math.max(1, killCost);
      if (encapsulated) score *= 2;
      if (score > bestScore) {
        best = id;
        bestScore = score;
        bestInfo = { id, land, safeDensity: safeDensity.toFixed(4), killCost, fullKillRatio, recommendedSendPercent, score };
      }
    } else if (rawMode) {
      var recentRawTargets = __fx.openingAutomation.autoAttackRecentTargets;
      if ((recentRawTargets == null ? void 0 : recentRawTargets.has(id)) && __fx.openingAutomation.lastTick - recentRawTargets.get(id) < 30) continue;
      var rawDensity = density * 100;
      if (!isFinite(rawDensity) || rawDensity > 0.3) continue;
      var rawRecord = tracker.get(id);
      var rawAttackTarget = __fx.openingAutomation.inferBotAttackTarget(id);
      var rawLandGrowthAge = (rawRecord == null ? void 0 : rawRecord.landGrowthTick) !== void 0 ? __fx.openingAutomation.lastTick - rawRecord.landGrowthTick : Infinity;
      var rawLowDensityAge = (rawRecord == null ? void 0 : rawRecord.rawLowDensityTick) !== void 0 ? __fx.openingAutomation.lastTick - rawRecord.rawLowDensityTick : Infinity;
      var rawTargetIsSizeable = rawAttackTarget && (rawAttackTarget.land >= 300 || rawAttackTarget.land >= land * 0.08);
      var rawMovingWindow = rawTargetIsSizeable && rawLandGrowthAge <= 35;
      var rawFreshLowDensity = rawLowDensityAge <= 18;
      var rawStationaryException = rawDensity <= 0.1 && land >= 1800 && rawFreshLowDensity;
      if (!rawMovingWindow && !rawStationaryException) continue;
      var rawKillRatio = sendTroops / Math.max(1, botTroops * 2);
      if (rawKillRatio < (rawMovingWindow ? 0.2 : 0.45)) continue;
      var rawExposure = __fx.openingAutomation.getBotExposure(id);
      var rawExposurePenalty = 1 / (1 + Math.max(0, rawExposure.botNeighbors - 2) * 0.12);
      var rawMovingBonus = rawMovingWindow ? 2.4 : 1;
      var rawWindowBonus = rawAttackTarget ? 1 + Math.min(1.5, Math.sqrt(Math.max(1, rawAttackTarget.land)) / 65) : 1;
      var rawKillBonus = Math.min(1.7, Math.max(0.35, rawKillRatio));
      var rawDensityFloor = Math.max(rawDensity, 0.05);
      score = Math.pow(land, 1.08) * rawMovingBonus * rawWindowBonus * rawKillBonus * rawExposurePenalty / Math.sqrt(rawDensityFloor);
      if (score > bestScore) {
        best = id;
        bestScore = score;
        bestInfo = {
          id,
          land,
          density: Number(rawDensity.toFixed(4)),
          score,
          moving: rawMovingWindow,
          lowDensityAge: isFinite(rawLowDensityAge) ? Math.round(rawLowDensityAge) : null,
          landGrowthAge: isFinite(rawLandGrowthAge) ? Math.round(rawLandGrowthAge) : null,
          attackTarget: rawAttackTarget,
          killRatio: rawKillRatio,
          exposure: rawExposure
        };
      }
    } else {
      if (density > 0.2) continue;
      var record = tracker.get(id);
      var age = (record == null ? void 0 : record.fullsendAt) ? Math.round(now - record.fullsendAt) : null;
      var landGrowthAge = (record == null ? void 0 : record.landGrowthAt) ? Math.round(now - record.landGrowthAt) : null;
      var attackTarget = __fx.openingAutomation.inferBotAttackTarget(id);
      var maxFreshAge = density <= 0.12 ? 1400 : 1e3;
      var targetIsSizeable = attackTarget && (attackTarget.land >= 300 || attackTarget.land >= land * 0.08);
      var recentlyGrowing = landGrowthAge !== null && landGrowthAge <= 1400 && targetIsSizeable;
      var recentlyDropped = age !== null && age <= maxFreshAge;
      if (!record || !recentlyGrowing && !recentlyDropped) continue;
      density = Math.max(density, 1e-3);
      var killRatio = sendTroops / Math.max(1, botTroops * 2);
      var reqKillRatio = encapsulated ? Math.max(0.35, minKillRatio - 0.15) : minKillRatio;
      if (killRatio < reqKillRatio) continue;
      score = Math.pow(land, 1.1) / Math.pow(density, 1.4) * Math.pow(Math.min(killRatio, 1.6), 2.5);
      if (attackTarget) score *= 1 + Math.min(1.5, Math.sqrt(Math.max(1, attackTarget.land)) / 60);
      if (encapsulated) score *= killRatio >= 1 ? 8 : 4;
      if (score > bestScore) {
        best = id;
        bestScore = score;
        bestInfo = { id, land, density, killRatio, reqKillRatio, age, landGrowthAge, attackTarget, score };
      }
    }
  }
  if (rawMode && best === -1 && fallbackBest !== -1) {
    best = fallbackBest;
    bestInfo = fallbackInfo;
  }
  if (safeMode) {
    if (bestInfo) {
      stats.selected = true;
      stats.target = bestInfo;
    }
    __fx.openingAutomation.lastSafeNormalSelection = bestInfo;
    __fx.openingAutomation.recordSafeTelemetry(stats);
  }
  return best;
};
__fx.openingAutomation.findLowDensityBorderingBot = () => {
  var _a;
  return (_a = __fx.openingAutomation.findLowDensityBorderingBots(1)[0]) != null ? _a : -1;
};
if (typeof window !== "undefined" && !window.__gcAutomationHooks) {
  window.__gcAutomationHooks = true;
  console.log("[gc] automation hooks installed: mapData=" + typeof __fxAd + " attackManager=" + typeof ae + " protocolHandler=" + typeof bB + " teamUtils=" + typeof bw);
}
