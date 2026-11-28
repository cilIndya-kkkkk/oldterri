(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // stub_settings.js
  function getSettings() {
    if (_settings) return _settings;
    var s = {};
    try {
      var raw = window.localStorage.getItem("fx_auto_settings");
      if (raw) s = JSON.parse(raw);
    } catch (e) {
    }
    var merged = {};
    for (var k in DEFAULTS) merged[k] = DEFAULTS[k];
    for (var k2 in s) merged[k2] = s[k2];
    _settings = merged;
    return _settings;
  }
  function persistSettings() {
    try {
      window.localStorage.setItem("fx_auto_settings", JSON.stringify(_settings || {}));
    } catch (e) {
    }
  }
  var DEFAULTS, _settings;
  var init_stub_settings = __esm({
    "stub_settings.js"() {
      DEFAULTS = {
        openingAutomationEnabled: true,
        openingAutomationStrategy: "",
        autoAttackLowDensityBots: true,
        autoAttackLowDensityBotsMode: "v20reserve",
        autoAttackLowDensityBotsStartCycle: 8,
        botAttackIntervalMs: 400,
        botSpendPercent: "100",
        infiniteExpansionEnabled: true,
        openingDynamicCompensationEnabled: true,
        openingAutomationTickOffset: "-9.5"
      };
      _settings = null;
      try {
        window.__fxAutoGetSettings = getSettings;
      } catch (e) {
      }
      try {
        window.__fxAutoPersist = persistSettings;
      } catch (e) {
      }
    }
  });

  // stub_gameInterface.js
  function getVar(varName) {
    if (varName === "gameState") {
      var g = typeof window !== "undefined" ? window.aE : null;
      var state = g && typeof g.a48 !== "undefined" ? g.a48 : 0;
      return state === 2 ? 2 : 0;
    }
    return null;
  }
  var init_stub_gameInterface = __esm({
    "stub_gameInterface.js"() {
    }
  });

  // ../../../../home/goodclient_v2/src/infiniteExpansionStrategy.js
  function computeInfiniteExpansionStartTick(cycle, neutralBorderTiles) {
    const baseStart = cycle === 5 ? 60.689956 : cycle === 6 ? 60.689956 : cycle === 7 ? 37.931223 : cycle === 8 ? 22.758734 : 15;
    const referenceTiles = cycle === 5 ? 184 : cycle === 6 ? 220 : cycle === 7 ? 272 : 336;
    return Math.max(2, Math.round(baseStart * neutralBorderTiles / referenceTiles));
  }
  function getInfiniteExpansionMaxSendPercent(ownLand) {
    if (ownLand < 15e3) return 0.383796;
    if (ownLand < 3e4) return 0.328968;
    return 0.27414;
  }
  function getDynamicInfiniteExpansionDecision({
    tick,
    hasAccessibleNeutralLand,
    neutralBorderTiles,
    neutralOutgoing,
    homeTroops,
    ownLand,
    started,
    optimalStart,
    lastAttackTick
  }) {
    if (tick < INFINITE_EXPANSION_START_TICK) return { type: "wait" };
    const cycle = Math.floor(tick / 100);
    const tickInCycle = tick % 100;
    if (cycle >= INFINITE_EXPANSION_END_CYCLE) {
      return { type: "finish", cancelNeutral: neutralOutgoing > 0 };
    }
    if (tickInCycle >= 95) return { type: "wait" };
    if (started && tickInCycle >= 98 && hasAccessibleNeutralLand) {
      if (homeTroops > 200 && neutralOutgoing < homeTroops && tick - lastAttackTick >= 1) {
        const dumpPercent = Math.min(0.95, (homeTroops - 100) / Math.max(1, homeTroops));
        return { type: "attack", optimalStart, percent: dumpPercent };
      }
    }
    if (!hasAccessibleNeutralLand) {
      return { type: "finish", cancelNeutral: false };
    }
    if (neutralBorderTiles <= 0) return { type: "wait", optimalStart };
    const nextOptimalStart = optimalStart < 0 ? computeInfiniteExpansionStartTick(cycle, neutralBorderTiles) : optimalStart;
    let effectiveStarted = started;
    if (!effectiveStarted) {
      if (tickInCycle < nextOptimalStart) return { type: "wait", optimalStart: nextOptimalStart };
      if (neutralOutgoing > 0) effectiveStarted = true;
    }
    if (tick - lastAttackTick < 1) return { type: "wait", optimalStart: nextOptimalStart, started: effectiveStarted || void 0 };
    const maxSendPercent = getInfiniteExpansionMaxSendPercent(ownLand);
    const minToKeepAlive = 1.972047794 * neutralBorderTiles;
    const consumptionPerTick = 2.428476727 * neutralBorderTiles;
    const targetOutgoing = minToKeepAlive + consumptionPerTick * 4.864284269;
    const refillThreshold = minToKeepAlive + consumptionPerTick * 1.331836961;
    if (!effectiveStarted || neutralOutgoing <= 0) {
      if (neutralOutgoing <= 0 && tickInCycle >= 91) return { type: "wait", optimalStart: nextOptimalStart };
      const sendTarget = minToKeepAlive + consumptionPerTick * 8.147730241;
      let initialSend = Math.min(sendTarget, homeTroops * maxSendPercent);
      if (initialSend < minToKeepAlive && homeTroops > minToKeepAlive * 2) initialSend = minToKeepAlive;
      if (initialSend < consumptionPerTick * 3) return { type: "wait", optimalStart: nextOptimalStart };
      const percent2 = Math.max(0.02, Math.min(maxSendPercent, initialSend / Math.max(1, homeTroops)));
      return { type: "attack", optimalStart: nextOptimalStart, percent: percent2, started: true };
    }
    if (neutralOutgoing > refillThreshold) return { type: "wait", optimalStart: nextOptimalStart, started: true };
    const neededTroops = targetOutgoing - neutralOutgoing;
    if (neededTroops <= 0) return { type: "wait", optimalStart: nextOptimalStart, started: true };
    const maxSend = homeTroops * maxSendPercent;
    const sendTroops = Math.min(neededTroops, maxSend);
    if (sendTroops < 101) return { type: "wait", optimalStart: nextOptimalStart, started: true };
    const percent = Math.max(0.02, Math.min(maxSendPercent, sendTroops / Math.max(1, homeTroops)));
    return { type: "attack", optimalStart: nextOptimalStart, percent, started: true };
  }
  var INFINITE_EXPANSION_START_TICK, INFINITE_EXPANSION_END_CYCLE;
  var init_infiniteExpansionStrategy = __esm({
    "../../../../home/goodclient_v2/src/infiniteExpansionStrategy.js"() {
      INFINITE_EXPANSION_START_TICK = 508;
      INFINITE_EXPANSION_END_CYCLE = 9;
    }
  });

  // ../../../../home/goodclient_v2/src/openingTickOffset.js
  function openingTickOffsetToInternalTicks(value) {
    const offset = Number(value || 0);
    return Number.isFinite(offset) ? offset : 0;
  }
  var init_openingTickOffset = __esm({
    "../../../../home/goodclient_v2/src/openingTickOffset.js"() {
    }
  });

  // ../../../../home/goodclient_v2/src/botAttackRate.js
  function intervalMsToAttacksPerCycle(intervalMs) {
    const interval = Number(intervalMs);
    if (!Number.isFinite(interval) || interval <= 0) return 0;
    return Math.min(20, Math.max(0, Math.round(CYCLE_MS / interval)));
  }
  var CYCLE_MS;
  var init_botAttackRate = __esm({
    "../../../../home/goodclient_v2/src/botAttackRate.js"() {
      CYCLE_MS = 5600;
    }
  });

  // ../../../../home/goodclient_v2/src/i18n.js
  function t(text) {
    return text;
  }
  var init_i18n = __esm({
    "../../../../home/goodclient_v2/src/i18n.js"() {
    }
  });

  // ../../../../home/goodclient_v2/src/defaultOpeningStrategy.js
  var defaultOpeningStrategy_exports = {};
  __export(defaultOpeningStrategy_exports, {
    default: () => defaultOpeningStrategy_default
  });
  var DEFAULT_OPENING_STRATEGY, defaultOpeningStrategy_default;
  var init_defaultOpeningStrategy = __esm({
    "../../../../home/goodclient_v2/src/defaultOpeningStrategy.js"() {
      DEFAULT_OPENING_STRATEGY = {
        name: "Gbv5 opening",
        endTick: 508,
        stopAt: [100, 100, 100, 100, 100],
        attacks: [
          { cycle: 1, keybinds: "", exactTick: 7, percent: 20.8008 },
          { cycle: 1, keybinds: "", exactTick: 9.1, percent: 17.8711, targetLand: 144, targetTroops: 799 },
          { cycle: 2, keybinds: "", exactTick: 6.1, percent: 16.5039 },
          { cycle: 2, keybinds: "", exactTick: 7.5, percent: 18.75 },
          { cycle: 2, keybinds: "", exactTick: 8.2, percent: 39.9414 },
          { cycle: 2, keybinds: "", exactTick: 9.6, percent: 24.2188, targetLand: 544, targetTroops: 1043 },
          { cycle: 3, keybinds: "", exactTick: 6.6, percent: 0.0977 },
          { cycle: 3, keybinds: "", exactTick: 7.3, percent: 22.3633 },
          { cycle: 3, keybinds: "", exactTick: 8, percent: 52.7344 },
          { cycle: 3, keybinds: "", exactTick: 9.4, percent: 30.1758, targetLand: 1104, targetTroops: 1650 },
          { cycle: 4, keybinds: "", exactTick: 6.4, percent: 0.0977 },
          { cycle: 4, keybinds: "", exactTick: 7.1, percent: 47.2656 },
          { cycle: 4, keybinds: "", exactTick: 8.5, percent: 36.1328 },
          { cycle: 4, keybinds: "", exactTick: 9.2, percent: 88.3789, targetLand: 2244, targetTroops: 2474 },
          { cycle: 5, keybinds: "", exactTick: 6.2, percent: 28.7109 },
          { cycle: 5, keybinds: "", exactTick: 7.6, percent: 23.9258 },
          { cycle: 5, keybinds: "", exactTick: 8.3, percent: 31.8359 },
          { cycle: 5, keybinds: "", exactTick: 9, percent: 71.7773, targetLand: 3784, targetTroops: 4361 }
        ]
      };
      defaultOpeningStrategy_default = DEFAULT_OPENING_STRATEGY;
    }
  });

  // ../../../../home/goodclient_v2/src/openingAutomation.js
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function getV20ReserveRatioForTick(tick) {
    if (tick >= 1550) return 0.6;
    if (tick >= 1300) return 0.4;
    return 0.55;
  }
  function normalizeAutoAttackMode(settings) {
    var _a;
    settings = settings || ((_a = getSettings) == null ? void 0 : _a()) || {};
    const mode = settings.autoAttackLowDensityBotsMode;
    if (AUTO_ATTACK_MODES.has(mode)) return mode;
    return settings.autoAttackLowDensityBots ? "best" : "off";
  }
  function getBestAttackIntervalMs() {
    const interval = Number(getSettings().botAttackIntervalMs || 400);
    if (interval <= 0) return Infinity;
    if (!Number.isFinite(interval)) return 400;
    return Math.min(5600, Math.max(100, interval));
  }
  function loadStoredBotAttackTelemetry() {
    try {
      const stored = JSON.parse(localStorage.getItem(BOT_ATTACK_TELEMETRY_STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (_error) {
      return [];
    }
  }
  function applyKeybinds(startPercent, keybinds = "") {
    let percent = startPercent;
    for (const key of keybinds) {
      if (!KEY_RATIOS[key]) throw new Error(`Unknown opening keybind: ${key}`);
      percent *= KEY_RATIOS[key];
    }
    return percent;
  }
  function exactTickToInternalTick(cycle, exactTick) {
    return (cycle - 1) * 100 + Math.round(exactTick * 10);
  }
  function readStrategy(settings = getSettings()) {
    var _a;
    const raw = (_a = settings.openingAutomationStrategy) == null ? void 0 : _a.trim();
    if (!raw) {
      if (!cachedDefaultStrategy) console.warn("defaultOpeningStrategy.js dynamic import has not resolved yet; opening automation will not fire this call");
      return cachedDefaultStrategy || EMPTY_STRATEGY_FALLBACK;
    }
    return JSON.parse(raw);
  }
  function isInfiniteExpansionConfigured() {
    var _a, _b;
    return ((_b = (_a = getSettings) == null ? void 0 : _a()) == null ? void 0 : _b.infiniteExpansionEnabled) !== false;
  }
  function normalizeStrategy(config, tickOffset = 0) {
    var _a;
    let currentPercent = Number((_a = config.startPercent) != null ? _a : 50);
    const attacks = (config.attacks || []).map((row) => {
      currentPercent = row.slider !== void 0 ? Number(row.slider) / 1024 * 100 : row.percent === void 0 ? applyKeybinds(currentPercent, row.keybinds || "") : Number(row.percent);
      const exactTick = row.exactTick === void 0 ? row.tick : row.exactTick;
      if (exactTick === void 0) throw new Error("Opening attack is missing exactTick/tick");
      return {
        tick: exactTickToInternalTick(Number(row.cycle), Number(exactTick)) + tickOffset,
        percent: currentPercent / 100
      };
    });
    attacks.sort((a, b) => a.tick - b.tick);
    return attacks;
  }
  function firstSlotAtOrAfter(absTick) {
    return Math.ceil(absTick / SLOT_SIZE) * SLOT_SIZE;
  }
  function lastSlotInCycle(cycle) {
    return Math.floor((cycle * 100 + 99) / SLOT_SIZE) * SLOT_SIZE;
  }
  function getCancelSlotAbs(cycle, stopAt) {
    if (!(stopAt < 100)) return -1;
    const threshold = cycle * 100 + stopAt;
    return Math.min(firstSlotAtOrAfter(threshold), lastSlotInCycle(cycle));
  }
  var cachedDefaultStrategy, EMPTY_STRATEGY_FALLBACK, KEY_RATIOS, AUTO_ATTACK_MODES, BOT_ATTACK_TELEMETRY_STORAGE_KEY, SLOT_SIZE, openingAutomation, openingAutomation_default;
  var init_openingAutomation = __esm({
    "../../../../home/goodclient_v2/src/openingAutomation.js"() {
      init_stub_settings();
      init_stub_gameInterface();
      init_infiniteExpansionStrategy();
      init_openingTickOffset();
      init_botAttackRate();
      init_i18n();
      cachedDefaultStrategy = null;
      Promise.resolve().then(() => (init_defaultOpeningStrategy(), defaultOpeningStrategy_exports)).then((mod) => {
        cachedDefaultStrategy = mod.default;
      }).catch((error) => {
        console.error("Failed to dynamically import defaultOpeningStrategy.js", error);
      });
      EMPTY_STRATEGY_FALLBACK = { name: "fallback (import not yet resolved)", endTick: 0, attacks: [] };
      KEY_RATIOS = {
        "+": 6 / 5,
        "-": 5 / 6,
        w: 8 / 7,
        s: 7 / 8,
        d: 32 / 31,
        a: 31 / 32
      };
      AUTO_ATTACK_MODES = /* @__PURE__ */ new Set(["off", "best", "v20reserve", "messiah"]);
      BOT_ATTACK_TELEMETRY_STORAGE_KEY = "fx_bot_attack_telemetry";
      SLOT_SIZE = 7;
      openingAutomation = new function() {
        this.attack = () => {
        };
        this.attackFreeLand = () => false;
        this.attackFreeLandWithPercent = () => false;
        this.attackPlayer = () => false;
        this.getBotAttackSnapshot = () => null;
        this.isLiveLowDensityBotTarget = () => false;
        this.hasFreeLandAroundPlayer = () => false;
        this.getDeployedTroops = () => 0;
        this.getNeutralOutgoing = () => 0;
        this.getNeutralBorderTileCount = () => 0;
        this.getPlayerTroops = () => 0;
        this.getPlayerLand = () => 0;
        this.findLowDensityBorderingBot = () => -1;
        this.findBestLowDensityBorderingBot = () => -1;
        this.findFullsendEncapsulatedBot = () => -1;
        this.findWeakEncapsulatedBot = () => null;
        this.findThighClientBotAttackTarget = () => null;
        this.findSimpleBestBotAttackTarget = () => -1;
        this.findBorderBotAttackTarget = () => -1;
        this.findV20ReserveBotAttackTarget = () => -1;
        this.findLowDensityBorderingBots = () => [];
        this.enabledForGame = false;
        this.completed = false;
        this.nextAttack = 0;
        this.lastAttackSentTick = -1;
        this.lastAttackScheduledTick = -1;
        this.debugEnabled = false;
        this.debugEvents = [];
        this._debugLastLand = -1;
        this.lastTick = -1;
        this.lastGameState = 0;
        this.attacks = [];
        this.stopAt = 100;
        this.stopAtByCycle = [100, 100, 100, 100, 100];
        this.cancelDelayByCycle = [0, 0, 0, 0, 0];
        this.pendingFreeLandCancel = null;
        this.cancelScheduledCycle = -1;
        this.tickOffset = 0;
        this.stopZoneCycle = -1;
        this.autoAttackCycle = -1;
        this.autoAttackCount = 0;
        this.autoAttackReservedAttackUsed = false;
        this.autoAttackLastTick = -1;
        this.autoAttackLastAttackTime = -Infinity;
        this.autoAttackCheckSlot = 0;
        this.autoAttackTimers = [];
        this.autoAttackInitializedPercent = false;
        this.autoAttackReducedCycles = /* @__PURE__ */ new Set();
        this.safeBotDensityTracker = /* @__PURE__ */ new Map();
        this.autoAttackRecentTargets = /* @__PURE__ */ new Map();
        this.automatedBotAttacks = /* @__PURE__ */ new Map();
        this.automatedBotCancelLastTick = -1;
        this.safeBotTelemetry = {
          events: [],
          maxEvents: 1e3,
          sequence: 0
        };
        this.botAttackTelemetry = {
          events: loadStoredBotAttackTelemetry(),
          maxEvents: 2e3,
          sequence: 0
        };
        this.botAttackTelemetry.sequence = this.botAttackTelemetry.events.reduce(
          (max, event) => Math.max(max, Number(event.sequence) || 0),
          0
        );
        this.autoAttackMode = normalizeAutoAttackMode();
        this.infiniteExpansionEnabled = isInfiniteExpansionConfigured();
        this.infiniteExpansionActive = false;
        this.infiniteExpansionIndex = 0;
        this.infiniteExpansionComplete = false;
        this.infiniteExpansionLastAttackTick = -1;
        this.infiniteExpansionLastCancelCycle = -1;
        this.infiniteExpansionCycle = -1;
        this.infiniteExpansionStarted = false;
        this.infiniteExpansionOptimalStart = -1;
        this.infiniteExpansionDynamicCount = 0;
        this.infiniteExpansionLateTroopsSent = 0;
        this.infiniteExpansionLastPercent = null;
        this.infiniteExpansionPendingSends = [];
        this.findBestDynamicBotAttackTarget = () => null;
        this.findMessiahBotAttackTarget = () => null;
        this.cancelPlayerAttack = () => false;
        this.cancelFreeLandAttack = () => false;
        this.getSafeDynamicAttackPercent = function(cycle) {
          const startCycle = Math.floor(Number(getSettings().autoAttackLowDensityBotsStartCycle || 8));
          const cycleOffset = Math.max(0, cycle - startCycle);
          if (cycleOffset <= 0) return 0.1;
          if (cycleOffset === 1) return 0.07;
          if (cycleOffset === 2) return 0.06;
          return 0.05;
        };
        this.reset = function() {
          this.enabledForGame = false;
          this.completed = false;
          this.nextAttack = 0;
          this.lastAttackSentTick = -1;
          this.lastAttackScheduledTick = -1;
          this.lastTick = -1;
          this.attacks = [];
          this.stopZoneCycle = -1;
          this.pendingFreeLandCancel = null;
          this.cancelScheduledCycle = -1;
          this.autoAttackCycle = -1;
          this.autoAttackCount = 0;
          this.autoAttackReservedAttackUsed = false;
          this.autoAttackLastTick = -1;
          this.autoAttackLastAttackTime = -Infinity;
          this.autoAttackCheckSlot = 0;
          this.autoAttackInitializedPercent = false;
          this.autoAttackReducedCycles.clear();
          this.safeBotDensityTracker.clear();
          this.autoAttackRecentTargets.clear();
          this.automatedBotAttacks.clear();
          this.automatedBotCancelLastTick = -1;
          this.infiniteExpansionActive = false;
          this.infiniteExpansionIndex = 0;
          this.infiniteExpansionComplete = false;
          this.infiniteExpansionLastAttackTick = -1;
          this.infiniteExpansionLastCancelCycle = -1;
          this.infiniteExpansionCycle = -1;
          this.infiniteExpansionStarted = false;
          this.infiniteExpansionOptimalStart = -1;
          this.infiniteExpansionDynamicCount = 0;
          this.infiniteExpansionLateTroopsSent = 0;
          this.infiniteExpansionLastPercent = null;
          this.infiniteExpansionPendingSends = [];
          this.postOpeningPercentageResetDone = false;
          this.clearAutoAttackTimers();
        };
        this.clearAutoAttackTimers = function() {
          this.autoAttackTimers.forEach((timer) => clearTimeout(timer));
          this.autoAttackTimers = [];
        };
        this.recordSafeTelemetry = function(event) {
          const telemetry = this.safeBotTelemetry;
          telemetry.events.push(__spreadValues({
            sequence: ++telemetry.sequence,
            time: Math.round(performance.now())
          }, event));
          if (telemetry.events.length > telemetry.maxEvents) {
            telemetry.events.splice(0, telemetry.events.length - telemetry.maxEvents);
          }
        };
        this.clearSafeTelemetry = function() {
          this.safeBotTelemetry.events = [];
          this.safeBotTelemetry.sequence = 0;
        };
        this.getSafeTelemetry = function() {
          return this.safeBotTelemetry.events.slice();
        };
        this.summarizeSafeTelemetry = function() {
          const summary = this.safeBotTelemetry.events.reduce((result, event) => {
            result.total++;
            result.byType[event.type] = (result.byType[event.type] || 0) + 1;
            if (event.type === "safe-check") {
              result.rejections.density += event.rejectDensity || 0;
              result.rejections.fresh += event.rejectFresh || 0;
              result.rejections.kill += event.rejectKill || 0;
              result.rejections.exposure += event.rejectExposure || 0;
              result.selected += event.selected ? 1 : 0;
            }
            if (event.type === "safe-attack") result.attacks++;
            if (event.type === "safe-conquest-check") {
              result.conquestChecks++;
              if (event.conquered) result.conquests++;
            }
            return result;
          }, {
            total: 0,
            byType: {},
            rejections: { density: 0, fresh: 0, kill: 0, exposure: 0 },
            selected: 0,
            attacks: 0,
            conquestChecks: 0,
            conquests: 0
          });
          if (summary.conquestChecks > 0) {
            summary.conquestRate = (summary.conquests / summary.conquestChecks * 100).toFixed(1) + "%";
          }
          console.table(summary.rejections);
          console.log("Safe telemetry summary", summary);
          return summary;
        };
        this.recordBotAttackTelemetry = function(target, context = {}) {
          const _a = context, { snapshot: providedSnapshot } = _a, eventContext = __objRest(_a, ["snapshot"]);
          const snapshot = providedSnapshot || this.getBotAttackSnapshot(target);
          if (!snapshot) return null;
          const telemetry = this.botAttackTelemetry;
          const event = __spreadValues(__spreadValues({
            sequence: ++telemetry.sequence,
            time: Math.round(performance.now()),
            gameTick: this.lastTick,
            cycle: Math.floor(this.lastTick / 100),
            tickInCycle: this.lastTick - Math.floor(this.lastTick / 100) * 100,
            status: "accepted"
          }, eventContext), snapshot);
          telemetry.events.push(event);
          this.persistBotAttackTelemetry();
          return event;
        };
        this.persistBotAttackTelemetry = function() {
          const telemetry = this.botAttackTelemetry;
          if (telemetry.events.length > telemetry.maxEvents) {
            telemetry.events.splice(0, telemetry.events.length - telemetry.maxEvents);
          }
          try {
            localStorage.setItem(BOT_ATTACK_TELEMETRY_STORAGE_KEY, JSON.stringify(telemetry.events));
          } catch (_error) {
          }
        };
        this.scheduleBotAttackOutcomeCheck = function(event, target) {
          if (!event) return;
          setTimeout(() => {
            var _a, _b, _c, _d;
            const land = (_b = (_a = this.getTargetLand) == null ? void 0 : _a.call(this, target)) != null ? _b : -1;
            const troops = (_d = (_c = this.getTargetTroops) == null ? void 0 : _c.call(this, target)) != null ? _d : -1;
            event.outcomeCheckedAt = Math.round(performance.now());
            event.outcomeDelayMs = 6e3;
            event.conquered = land <= 0;
            event.remainingLand = land;
            event.remainingTroops = troops;
            event.remainingDensity = land > 0 ? Number((troops / (land * 150)).toFixed(4)) : 0;
            this.persistBotAttackTelemetry();
          }, 6e3);
        };
        this.trackAutomatedBotAttack = function(target, event = null) {
          const snapshot = event || this.getBotAttackSnapshot(target);
          if (!snapshot) return;
          this.automatedBotAttacks.set(target, {
            tick: this.lastTick,
            density: Number(snapshot.targetDensity || 0),
            land: Number(snapshot.targetLand || 0),
            troops: Number(snapshot.targetTroops || 0)
          });
        };
        this.cancelBadAutomatedBotAttacks = function(tick) {
          var _a, _b, _c, _d;
          if (!getVar("gameState") || tick - this.automatedBotCancelLastTick < 1) return;
          for (const [target, record] of Array.from(this.automatedBotAttacks.entries())) {
            const land = (_b = (_a = this.getTargetLand) == null ? void 0 : _a.call(this, target)) != null ? _b : 0;
            if (tick - record.tick > 120 || land <= 0) {
              this.automatedBotAttacks.delete(target);
              continue;
            }
            if (tick - record.tick < 3) continue;
            const troops = (_d = (_c = this.getTargetTroops) == null ? void 0 : _c.call(this, target)) != null ? _d : 0;
            const density = land > 0 ? troops / (land * 150) * 100 : 0;
            const cancelDensity = Math.max(0.32, Number(record.density || 0) * 1.85);
            if (density >= cancelDensity && this.cancelPlayerAttack(target)) {
              this.automatedBotAttacks.delete(target);
              this.automatedBotCancelLastTick = tick;
            }
          }
        };
        this.clearBotAttackTelemetry = function() {
          this.botAttackTelemetry.events = [];
          this.botAttackTelemetry.sequence = 0;
          localStorage.removeItem(BOT_ATTACK_TELEMETRY_STORAGE_KEY);
        };
        this.getBotAttackTelemetry = function() {
          return this.botAttackTelemetry.events.slice();
        };
        this.summarizeBotAttackTelemetry = function() {
          const events = this.getBotAttackTelemetry();
          const summary = events.reduce((result, event) => {
            result.total++;
            result.byMode[event.mode] = (result.byMode[event.mode] || 0) + 1;
            result.byKind[event.kind] = (result.byKind[event.kind] || 0) + 1;
            result.avgDensity += Number(event.targetDensity || 0);
            result.avgLand += Number(event.targetLand || 0);
            result.avgAttackPercent += Number(event.attackPercent || 0);
            result.avgAttackTroops += Number(event.attackTroops || 0);
            return result;
          }, {
            total: 0,
            byMode: {},
            byKind: {},
            avgDensity: 0,
            avgLand: 0,
            avgAttackPercent: 0,
            avgAttackTroops: 0
          });
          if (summary.total > 0) {
            summary.avgDensity = Number((summary.avgDensity / summary.total).toFixed(4));
            summary.avgLand = Math.round(summary.avgLand / summary.total);
            summary.avgAttackPercent = Number((summary.avgAttackPercent / summary.total).toFixed(4));
            summary.avgAttackTroops = Math.round(summary.avgAttackTroops / summary.total);
          }
          console.table(summary.byMode);
          console.table(summary.byKind);
          console.log("Bot attack telemetry summary", summary);
          return summary;
        };
        this.getBotAttackTelemetryCsv = function() {
          const events = this.getBotAttackTelemetry();
          const columns = [
            "sequence",
            "time",
            "gameTick",
            "cycle",
            "tickInCycle",
            "mode",
            "kind",
            "target",
            "targetName",
            "targetLand",
            "targetTroops",
            "targetDensity",
            "attackPercent",
            "playerTroops",
            "attackTroops",
            "autoAttackCount",
            "scheduledDelay",
            "cycleProgress",
            "status",
            "conquered",
            "remainingLand",
            "remainingTroops",
            "remainingDensity"
          ];
          const escapeCell = (value) => {
            if (value === void 0 || value === null) return "";
            const text = String(value);
            return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
          };
          return [
            columns.join(","),
            ...events.map((event) => columns.map((column) => escapeCell(event[column])).join(","))
          ].join("\n");
        };
        this.downloadBotAttackTelemetry = function(format = "json") {
          const isCsv = format === "csv";
          const content = isCsv ? this.getBotAttackTelemetryCsv() : JSON.stringify(this.getBotAttackTelemetry(), null, 2);
          const blob = new Blob([content], { type: isCsv ? "text/csv" : "application/json" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `bot-attack-telemetry.${isCsv ? "csv" : "json"}`;
          link.click();
          URL.revokeObjectURL(link.href);
        };
        this.getAutoAttackMode = function() {
          return normalizeAutoAttackMode();
        };
        this.setAutoAttackMode = function(mode) {
          const settings = getSettings();
          const nextMode = AUTO_ATTACK_MODES.has(mode) ? mode : "off";
          settings.autoAttackLowDensityBotsMode = nextMode;
          settings.autoAttackLowDensityBots = nextMode !== "off";
          persistSettings();
          this.autoAttackMode = nextMode;
          this.autoAttackCycle = -1;
          this.autoAttackCount = 0;
          this.autoAttackReservedAttackUsed = false;
          this.autoAttackLastTick = -1;
          this.autoAttackLastAttackTime = -Infinity;
          this.autoAttackInitializedPercent = false;
          this.autoAttackReducedCycles.clear();
          this.safeBotDensityTracker.clear();
          this.autoAttackRecentTargets.clear();
          this.clearAutoAttackTimers();
          return nextMode;
        };
        this.toggleAutoAttackMode = function(mode) {
          return this.setAutoAttackMode(this.getAutoAttackMode() === mode ? "off" : mode);
        };
        this.setOpeningAutomationEnabled = function(enabled) {
          const settings = getSettings();
          settings.openingAutomationEnabled = Boolean(enabled);
          persistSettings();
          if (!settings.openingAutomationEnabled) this.stop();
          else if ((!this.enabledForGame || this.completed) && this.lastTick >= 0 && this.lastTick < 20) this.start();
          return settings.openingAutomationEnabled;
        };
        this.toggleOpeningAutomationEnabled = function() {
          return this.setOpeningAutomationEnabled(!getSettings().openingAutomationEnabled);
        };
        this.getBestAttackIntervalMs = getBestAttackIntervalMs;
        this.setBestAttackIntervalMs = function(intervalMs) {
          const settings = getSettings();
          const interval = Number(intervalMs);
          settings.botAttackIntervalMs = interval <= 0 ? "0" : String(Math.round(Math.min(5600, Math.max(100, interval || 400))));
          persistSettings();
          return Number(settings.botAttackIntervalMs);
        };
        this.getBotSpendPercent = function() {
          var _a;
          const value = Number((_a = getSettings().botSpendPercent) != null ? _a : 100);
          return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 100));
        };
        this.setBotSpendPercent = function(percent) {
          const value = Math.min(100, Math.max(0, Number(percent) || 0));
          getSettings().botSpendPercent = String(value);
          persistSettings();
          return value;
        };
        this.getBotAttackProfile = function(mode = this.getAutoAttackMode(), tick = this.lastTick) {
          const aggression = this.getBotSpendPercent() / 100;
          if (mode === "v20reserve") {
            const baseReserve = getV20ReserveRatioForTick(Number(tick) || 0);
            return {
              mode,
              aggression,
              // 100% = tested V20 reserve route. Lower values raise the
              // reserve and shrink each command without changing target logic.
              reserveRatio: clamp(baseReserve + (1 - aggression) * 0.4, baseReserve, 0.95),
              maxSendFrac: 0.11 * aggression,
              minSendFrac: 0.055 * aggression
            };
          }
          return {
            mode: "best",
            aggression,
            // Legacy land-max mapping: 100% ~= land-max (0.03),
            // 50% ~= balanced (0.60), and 0% stops new sends entirely.
            reserveRatio: 1.17 - 1.14 * aggression,
            maxSendFrac: 0.12,
            minSendFrac: 0
          };
        };
        this.getBotReserveRatio = function(mode = this.getAutoAttackMode(), tick = this.lastTick) {
          return this.getBotAttackProfile(mode, tick).reserveRatio;
        };
        this.prepareBotSpendAttack = function(mode = this.getAutoAttackMode(), tick = this.lastTick) {
          var _a, _b;
          const spendPercent = this.getBotSpendPercent();
          if (spendPercent <= 0) return 0;
          const home = Number(((_a = this.getPlayerTroops) == null ? void 0 : _a.call(this)) || 0);
          const land = Number(((_b = this.getPlayerLand) == null ? void 0 : _b.call(this)) || 0);
          if (home <= 0 || land <= 0) return 0;
          const profile = this.getBotAttackProfile(mode, tick);
          if (profile.maxSendFrac <= 0) return 0;
          const reserve = land * profile.reserveRatio;
          const commandTax = Math.floor(home * 12 / 1024);
          const maxSend = Math.max(0, home - reserve - commandTax);
          const sendFloor = Math.min(maxSend, home * profile.minSendFrac);
          const sendCeiling = Math.min(maxSend, home * profile.maxSendFrac);
          const plannedSend = Math.max(sendFloor, sendCeiling);
          const maxPercent = plannedSend / home;
          if (maxPercent < 2 / 1024) return 0;
          const attackPercent = Math.min(profile.maxSendFrac, maxPercent);
          if (attackPercent < 2 / 1024) return 0;
          window.__fx.keybindFunctions.setAbsolute(attackPercent);
          window.__fx.keybindFunctions.repaintAttackPercentageBar();
          this.lastPreparedBotAttack = {
            mode,
            tick,
            spendPercent,
            reserveRatio: profile.reserveRatio,
            maxSendFrac: profile.maxSendFrac,
            minSendFrac: profile.minSendFrac,
            reserve,
            commandTax,
            maxSend,
            plannedSend,
            attackPercent
          };
          return attackPercent;
        };
        this.isInfiniteExpansionEnabled = function() {
          this.infiniteExpansionEnabled = isInfiniteExpansionConfigured();
          return this.infiniteExpansionEnabled;
        };
        this.setInfiniteExpansionEnabled = function(enabled) {
          const settings = getSettings();
          this.infiniteExpansionEnabled = Boolean(enabled);
          settings.infiniteExpansionEnabled = this.infiniteExpansionEnabled;
          persistSettings();
          this.infiniteExpansionActive = this.infiniteExpansionEnabled && Boolean(getVar("gameState"));
          this.infiniteExpansionIndex = 0;
          this.infiniteExpansionComplete = false;
          this.infiniteExpansionLastAttackTick = -1;
          this.infiniteExpansionLastCancelCycle = -1;
          this.infiniteExpansionCycle = -1;
          this.infiniteExpansionStarted = false;
          this.infiniteExpansionOptimalStart = -1;
          this.infiniteExpansionDynamicCount = 0;
          this.infiniteExpansionLateTroopsSent = 0;
          this.infiniteExpansionLastPercent = null;
          this.infiniteExpansionPendingSends = [];
          return this.infiniteExpansionEnabled;
        };
        this.toggleInfiniteExpansion = function() {
          return this.setInfiniteExpansionEnabled(!this.isInfiniteExpansionEnabled());
        };
        this.setAllAutomationEnabled = function(enabled) {
          const settings = getSettings();
          const nextEnabled = Boolean(enabled);
          settings.openingAutomationEnabled = nextEnabled;
          settings.infiniteExpansionEnabled = nextEnabled;
          settings.autoAttackLowDensityBotsMode = nextEnabled ? "v20reserve" : "off";
          settings.autoAttackLowDensityBots = nextEnabled;
          persistSettings();
          if (!nextEnabled) {
            this.stop();
            this.setInfiniteExpansionEnabled(false);
            this.setAutoAttackMode("off");
          } else {
            this.setInfiniteExpansionEnabled(true);
            this.setAutoAttackMode("v20reserve");
            if ((!this.enabledForGame || this.completed) && this.lastTick >= 0 && this.lastTick < 20) this.start();
          }
          return nextEnabled;
        };
        this.getStopAtForCycle = function(cycle) {
          const values = this.stopAtByCycle;
          if (!Array.isArray(values) || !values.length) return 100;
          const index = Math.max(0, Math.min(Number(cycle) || 0, values.length - 1));
          const value = Number(values[index]);
          if (!Number.isFinite(value)) return 100;
          const stopAt = clamp(value, 0, 100);
          if (stopAt >= 100) return 100;
          const offset = Number(this.tickOffset);
          return clamp(stopAt + (Number.isFinite(offset) ? offset : 0), 0, 100);
        };
        this.getCancelDelayForCycle = function(cycle) {
          const values = this.cancelDelayByCycle;
          if (!Array.isArray(values) || !values.length) return 0;
          const index = Math.max(0, Math.min(Number(cycle) || 0, values.length - 1));
          const value = Number(values[index]);
          return Number.isFinite(value) ? clamp(Math.round(value), -14, 14) : 0;
        };
        this.setDebug = function(value) {
          this.debugEnabled = Boolean(value);
          this.debugEvents = [];
          this._debugLastLand = -1;
          console.log(`[opening] debug ${this.debugEnabled ? "on" : "off"}`);
        };
        this.dumpDebug = function() {
          return this.debugEvents.slice();
        };
        this.debugPush = function(event) {
          if (!this.debugEnabled) return;
          this.debugEvents.push(event);
          if (this.debugEvents.length > 5e3) this.debugEvents.shift();
        };
        this.start = function() {
          var _a, _b;
          try {
            const strategy = readStrategy();
            const tickOffset = openingTickOffsetToInternalTicks(getSettings().openingAutomationTickOffset);
            this.tickOffset = tickOffset;
            this.attacks = normalizeStrategy(strategy, tickOffset);
            const rawStopAt = strategy.stopAt;
            if (Array.isArray(rawStopAt)) {
              this.stopAtByCycle = rawStopAt.slice(0, 5).map((value) => {
                const number = Number(value);
                return Number.isFinite(number) ? clamp(number, 0, 100) : 100;
              });
              while (this.stopAtByCycle.length < 5) this.stopAtByCycle.push(100);
            } else {
              const stopAt = Number(rawStopAt);
              const value = Number.isFinite(stopAt) ? clamp(stopAt, 0, 100) : 100;
              this.stopAtByCycle = [value, value, value, value, value];
            }
            const rawCancelDelay = strategy.cancelDelay;
            if (Array.isArray(rawCancelDelay)) {
              this.cancelDelayByCycle = rawCancelDelay.slice(0, 5).map((value) => {
                const number = Number(value);
                return Number.isFinite(number) ? clamp(Math.round(number), -14, 14) : 0;
              });
              while (this.cancelDelayByCycle.length < 5) this.cancelDelayByCycle.push(0);
            } else {
              const delay = Number(rawCancelDelay);
              const value = Number.isFinite(delay) ? clamp(Math.round(delay), -14, 14) : 0;
              this.cancelDelayByCycle = [value, value, value, value, value];
            }
            this.stopAt = 100;
            this.stopZoneCycle = -1;
            this.pendingFreeLandCancel = null;
            this.cancelScheduledCycle = -1;
            this.enabledForGame = this.attacks.length > 0;
            this.completed = false;
            this.nextAttack = 0;
            this.lastAttackSentTick = -1;
            this.lastAttackScheduledTick = -1;
            this.lastTick = -1;
            this.infiniteExpansionEnabled = isInfiniteExpansionConfigured();
            this.infiniteExpansionActive = this.infiniteExpansionEnabled;
            this.infiniteExpansionIndex = 0;
            this.infiniteExpansionComplete = false;
            this.infiniteExpansionLastAttackTick = -1;
            this.infiniteExpansionLastCancelCycle = -1;
            this.infiniteExpansionCycle = -1;
            this.infiniteExpansionStarted = false;
            this.infiniteExpansionOptimalStart = -1;
            this.infiniteExpansionDynamicCount = 0;
            this.infiniteExpansionLateTroopsSent = 0;
            this.infiniteExpansionLastPercent = null;
            this.infiniteExpansionPendingSends = [];
            this.postOpeningPercentageResetDone = false;
            this.debugEvents = [];
            this._debugLastLand = -1;
            if (window.__fx && window.__fx.openingDebug) this.debugEnabled = true;
            this.debugPush({
              type: "start",
              stopAt: this.stopAtByCycle.slice(),
              cancelDelay: this.cancelDelayByCycle.slice(),
              tickOffset: this.tickOffset,
              attacks: this.attacks.length,
              rttTicks: ((_b = (_a = window.__fx.rtt) == null ? void 0 : _a.getTicks) == null ? void 0 : _b.call(_a)) || 0
            });
            console.log(`Opening automation loaded ${this.attacks.length} attacks (stopAt ${JSON.stringify(this.stopAtByCycle)})`);
          } catch (error) {
            this.reset();
            console.error("Opening automation strategy error", error);
            alert(t("Opening automation strategy error:") + "\n" + error.message);
          }
        };
        this.stop = function() {
          this.reset();
          console.log("Opening automation stopped");
        };
        this.toggle = function() {
          if (this.enabledForGame && !this.completed) this.stop();
          else this.start();
        };
        this.onTick = function(tick) {
          var _a, _b, _c, _d;
          const settings = getSettings();
          const gameState = getVar("gameState");
          if (gameState !== void 0 && !gameState) {
            if (this.lastGameState) this.reset();
            this.lastGameState = gameState;
            return;
          }
          if (gameState !== void 0) this.lastGameState = gameState;
          if (tick < this.lastTick) this.reset();
          this.lastTick = tick;
          if (!this.enabledForGame && !this.completed && settings.openingAutomationEnabled && tick < 20) {
            this.start();
          }
          if (tick >= 518 && !this.postOpeningPercentageResetDone && settings.openingAutomationEnabled) {
            this.postOpeningPercentageResetDone = true;
            window.__fx.keybindFunctions.setAbsolute(0.32);
            window.__fx.keybindFunctions.repaintAttackPercentageBar();
            console.log("Post-opening automation: Reset troop percentage bar to 32% at 29s (tick 518)");
          }
          this.onTickInfiniteExpansion(tick);
          this.onTickAutoAttack(tick);
          const cycle = Math.floor(tick / 100);
          const __rttTicks = settings.openingDynamicCompensationEnabled !== false ? ((_b = (_a = window.__fx.rtt) == null ? void 0 : _a.getTicks) == null ? void 0 : _b.call(_a)) || 0 : 0;
          if (this.debugEnabled) {
            const landNow = Number((_d = (_c = this.getPlayerLand) == null ? void 0 : _c.call(this)) != null ? _d : -1);
            if (landNow !== this._debugLastLand) {
              this.debugPush({ type: "land", tick, cycle, land: landNow, delta: landNow - this._debugLastLand });
              this._debugLastLand = landNow;
            }
          }
          if (!this.enabledForGame || this.completed) {
            if (this.pendingFreeLandCancel) {
              const pending = this.pendingFreeLandCancel;
              const cancelRtt = Number.isFinite(pending.rttTicks) ? pending.rttTicks : __rttTicks;
              const earliest = Number.isFinite(this.lastAttackSentTick) ? this.lastAttackSentTick + 1 : -Infinity;
              const due = pending.cycle < cycle || pending.cycle === cycle && tick >= Math.max(pending.slotAbs - cancelRtt + (pending.delay || 0), earliest);
              if (due) {
                this.debugPush({ type: "cancel-fire", tick, cycle, slotAbs: pending.slotAbs, delay: pending.delay || 0, rttTicks: cancelRtt, earliest, expectedServerTick: tick + cancelRtt });
                try {
                  this.cancelFreeLandAttack();
                } catch (_error) {
                }
                this.pendingFreeLandCancel = null;
              }
            }
            return;
          }
          const stopAt = this.getStopAtForCycle(cycle);
          const cancelSlotAbs = getCancelSlotAbs(cycle, stopAt);
          const cancelSlotInCycle = cancelSlotAbs >= 0 ? cancelSlotAbs - cycle * 100 : 100;
          const effectiveStop = cancelSlotAbs >= 0 ? Math.min(stopAt, cancelSlotInCycle) : stopAt;
          if (stopAt < 100 && cancelSlotAbs >= 0 && this.cancelScheduledCycle !== cycle) {
            this.cancelScheduledCycle = cycle;
            this.pendingFreeLandCancel = {
              cycle,
              slotAbs: cancelSlotAbs,
              delay: this.getCancelDelayForCycle(cycle),
              rttTicks: __rttTicks
            };
            this.debugPush({ type: "cancel-sched", tick, cycle, stopAt, slotAbs: cancelSlotAbs, delay: this.pendingFreeLandCancel.delay, rttTicks: __rttTicks });
          }
          while (this.nextAttack < this.attacks.length) {
            const attack = this.attacks[this.nextAttack];
            if (attack.tick - __rttTicks > tick) break;
            this.nextAttack++;
            const attackCycle = Math.floor(attack.tick / 100);
            const attackStopAt = this.getStopAtForCycle(attackCycle);
            const attackCancelAbs = getCancelSlotAbs(attackCycle, attackStopAt);
            const attackCancelInCycle = attackCancelAbs >= 0 ? attackCancelAbs - attackCycle * 100 : 100;
            const attackEffectiveStop = attackCancelAbs >= 0 ? Math.min(attackStopAt, attackCancelInCycle) : attackStopAt;
            if (attackEffectiveStop < 100 && tick >= attackCycle * 100 + attackEffectiveStop) {
              continue;
            }
            if (attackCycle === cycle && effectiveStop < 100 && attack.tick >= cycle * 100 + effectiveStop) {
              continue;
            }
            if (this.pendingFreeLandCancel && this.pendingFreeLandCancel.cycle === cycle && attack.tick >= this.pendingFreeLandCancel.slotAbs) {
              continue;
            }
            window.__fx.keybindFunctions.setAbsolute(attack.percent);
            window.__fx.keybindFunctions.repaintAttackPercentageBar();
            this.attack();
            this.lastAttackSentTick = tick;
            this.lastAttackScheduledTick = attack.tick;
            this.debugPush({ type: "attack", tick, cycle, scheduledTick: attack.tick, lateBy: tick - (attack.tick - __rttTicks), percent: attack.percent, rttTicks: __rttTicks });
          }
          if (this.pendingFreeLandCancel && this.pendingFreeLandCancel.cycle === cycle) {
            const earliest = Number.isFinite(this.lastAttackSentTick) ? this.lastAttackSentTick + 1 : -Infinity;
            const pending = this.pendingFreeLandCancel;
            const cancelRtt = Number.isFinite(pending.rttTicks) ? pending.rttTicks : __rttTicks;
            if (tick >= Math.max(pending.slotAbs - cancelRtt + (pending.delay || 0), earliest)) {
              this.debugPush({ type: "cancel-fire", tick, cycle, slotAbs: pending.slotAbs, delay: pending.delay || 0, rttTicks: cancelRtt, earliest, expectedServerTick: tick + cancelRtt });
              try {
                this.cancelFreeLandAttack();
              } catch (_error) {
              }
              this.pendingFreeLandCancel = null;
            }
          }
          if (this.nextAttack >= this.attacks.length) {
            this.completed = true;
            this.enabledForGame = false;
          }
        };
        this.runWeakEncapsulatedBotAttack = function(tick, percent, mode = "raw", kind = "encapsulated") {
          var _a;
          const selection = (_a = this.findWeakEncapsulatedBot) == null ? void 0 : _a.call(this, percent, mode);
          if (!selection || selection.target < 0) return false;
          if (selection.percent) {
            window.__fx.keybindFunctions.setAbsolute(selection.percent);
            window.__fx.keybindFunctions.repaintAttackPercentageBar();
          }
          const attackSnapshot = this.getBotAttackSnapshot(selection.target);
          const attackAccepted = this.attackPlayer(selection.target);
          if (!attackAccepted) return false;
          const attackEvent = this.recordBotAttackTelemetry(selection.target, {
            snapshot: attackSnapshot,
            mode,
            kind,
            autoAttackCount: this.autoAttackCount,
            cycleProgress: tick % 100 / 100,
            score: selection.score,
            oneShotRatio: selection.oneShotRatio
          });
          this.trackAutomatedBotAttack(selection.target, attackSnapshot);
          this.scheduleBotAttackOutcomeCheck(attackEvent, selection.target);
          this.autoAttackRecentTargets.set(selection.target, tick);
          this.autoAttackLastTick = tick;
          this.autoAttackCount++;
          return true;
        };
        this.runReferenceInfiniteBotAttack = function(tick, percent) {
          if (this.runWeakEncapsulatedBotAttack(tick, percent, "raw", "infinite-encapsulated")) return true;
          const selection = this.findBestDynamicBotAttackTarget(tick, { mode: "raw", fixedPercent: percent });
          if (!selection || selection.target < 0) return false;
          window.__fx.keybindFunctions.setAbsolute(selection.percent || percent);
          window.__fx.keybindFunctions.repaintAttackPercentageBar();
          const attackSnapshot = this.getBotAttackSnapshot(selection.target);
          const attackAccepted = this.attackPlayer(selection.target);
          if (!attackAccepted) return false;
          const attackEvent = this.recordBotAttackTelemetry(selection.target, {
            snapshot: attackSnapshot,
            mode: "raw",
            kind: "infinite-bot",
            autoAttackCount: this.autoAttackCount,
            cycleProgress: tick % 100 / 100,
            score: selection.score,
            oneShotRatio: selection.oneShotRatio
          });
          this.trackAutomatedBotAttack(selection.target, attackSnapshot);
          this.scheduleBotAttackOutcomeCheck(attackEvent, selection.target);
          this.autoAttackRecentTargets.set(selection.target, tick);
          this.autoAttackLastTick = tick;
          this.autoAttackCount++;
          return true;
        };
        this.computeInfiniteExpansionStartTick = function(cycle, neutralBorderTiles) {
          return computeInfiniteExpansionStartTick(cycle, neutralBorderTiles);
        };
        this.getInfiniteExpansionMaxSendPercent = function(ownLand) {
          return getInfiniteExpansionMaxSendPercent(ownLand);
        };
        this.finishInfiniteExpansion = function(tick) {
          this.infiniteExpansionComplete = true;
          this.infiniteExpansionActive = false;
        };
        this.onTickInfiniteExpansion = function(tick) {
          var _a, _b, _c, _d;
          const settings = getSettings();
          if (!settings.infiniteExpansionEnabled || !getVar("gameState")) {
            this.infiniteExpansionActive = false;
            return;
          }
          const cycle = Math.floor(tick / 100);
          if (cycle !== this.infiniteExpansionCycle) {
            this.infiniteExpansionCycle = cycle;
            this.infiniteExpansionStarted = false;
            this.infiniteExpansionComplete = false;
            this.infiniteExpansionOptimalStart = -1;
            this.infiniteExpansionDynamicCount = 0;
            this.infiniteExpansionLateTroopsSent = 0;
            this.infiniteExpansionLastAttackTick = -1;
            this.infiniteExpansionPendingSends = [];
          }
          const stopTickInCycle = tick - cycle * 100;
          const stopAt = this.getStopAtForCycle(cycle);
          if (stopAt < 100 && stopTickInCycle >= stopAt) {
            this.infiniteExpansionActive = false;
            this.infiniteExpansionPendingSends = [];
            return;
          }
          if (this.infiniteExpansionComplete) {
            this.infiniteExpansionActive = false;
            return;
          }
          this.infiniteExpansionActive = true;
          const PENDING_SEND_WINDOW_TICKS = 8;
          this.infiniteExpansionPendingSends = (this.infiniteExpansionPendingSends || []).filter((entry) => tick - entry.tick < PENDING_SEND_WINDOW_TICKS);
          const pendingTroops = this.infiniteExpansionPendingSends.reduce((sum, entry) => sum + entry.amount, 0);
          const neutralOutgoing = Math.max(0, Number(((_a = this.getNeutralOutgoing) == null ? void 0 : _a.call(this)) || 0));
          const homeTroopsRaw = Math.max(0, Number(((_b = this.getPlayerTroops) == null ? void 0 : _b.call(this)) || 0));
          const homeTroops = Math.max(0, homeTroopsRaw - pendingTroops);
          const ownLand = Math.max(0, Number(((_c = this.getPlayerLand) == null ? void 0 : _c.call(this)) || 0));
          const decision = getDynamicInfiniteExpansionDecision({
            tick,
            hasAccessibleNeutralLand: this.hasFreeLandAroundPlayer(),
            neutralBorderTiles: Number(((_d = this.getNeutralBorderTileCount) == null ? void 0 : _d.call(this)) || 0),
            neutralOutgoing,
            homeTroops,
            ownLand,
            started: this.infiniteExpansionStarted,
            optimalStart: this.infiniteExpansionOptimalStart,
            lastAttackTick: this.infiniteExpansionLastAttackTick
          });
          if (decision.optimalStart !== void 0) this.infiniteExpansionOptimalStart = decision.optimalStart;
          if (decision.started) this.infiniteExpansionStarted = true;
          if (decision.type === "finish") {
            if (decision.cancelNeutral) this.cancelFreeLandAttack();
            this.finishInfiniteExpansion(tick);
            return;
          }
          if (decision.type === "attack") {
            window.__fx.keybindFunctions.setAbsolute(decision.percent);
            window.__fx.keybindFunctions.repaintAttackPercentageBar();
            if (this.attackFreeLand()) {
              this.infiniteExpansionStarted = true;
              this.infiniteExpansionLastAttackTick = tick;
              this.infiniteExpansionDynamicCount++;
              const sentAmount = Math.round(decision.percent * homeTroopsRaw);
              this.infiniteExpansionPendingSends.push({
                tick,
                amount: sentAmount
              });
              this.infiniteExpansionLateTroopsSent += sentAmount;
              this.infiniteExpansionLastPercent = decision.percent;
            }
          }
        };
        this.onTickAutoAttack = function(tick) {
          var _a, _b, _c, _d;
          const mode = this.getAutoAttackMode();
          if (mode === "off") {
            this.clearAutoAttackTimers();
            return;
          }
          if (!getVar("gameState")) return;
          const stopCycle = Math.floor(tick / 100);
          const stopAt = this.getStopAtForCycle(stopCycle);
          if (stopAt < 100 && tick - stopCycle * 100 >= stopAt) {
            this.clearAutoAttackTimers();
            return;
          }
          const settings = getSettings();
          const startCycle = Number(settings.autoAttackLowDensityBotsStartCycle || 8);
          const effectiveStartTick = settings.infiniteExpansionEnabled && !this.infiniteExpansionComplete ? Math.round(startCycle * 100) : 508;
          if (tick < effectiveStartTick) return;
          const cycle = Math.floor(tick / 100);
          const tickInCycle = tick - cycle * 100;
          if (cycle !== this.autoAttackCycle) {
            this.autoAttackCycle = cycle;
            this.autoAttackCount = 0;
            this.autoAttackReservedAttackUsed = false;
            this.autoAttackLastTick = -1;
            this.autoAttackLastAttackTime = -Infinity;
            this.autoAttackCheckSlot = 0;
            this.safeBotDensityTracker.clear();
            this.autoAttackRecentTargets.clear();
            this.clearAutoAttackTimers();
            if (mode === "safe") {
              if (!this.autoAttackInitializedPercent) {
                window.__fx.keybindFunctions.setAbsolute(0.12);
                this.autoAttackInitializedPercent = true;
              } else {
                window.__fx.keybindFunctions.setRelative(KEY_RATIOS.a);
              }
              window.__fx.keybindFunctions.repaintAttackPercentageBar();
            } else if (mode === "best") {
              if (!this.autoAttackInitializedPercent) {
                window.__fx.keybindFunctions.setAbsolute(0.12);
                this.autoAttackInitializedPercent = true;
                window.__fx.keybindFunctions.repaintAttackPercentageBar();
              }
            }
          }
          if (mode === "safe") {
            while (this.autoAttackCheckSlot < 24 && tickInCycle >= Math.round(this.autoAttackCheckSlot * 100 / 24)) {
              const checkSlot = this.autoAttackCheckSlot++;
              if (checkSlot % 3 !== 0) continue;
              if (this.autoAttackCount >= 8) {
                this.cancelBadAutomatedBotAttacks(tick);
                return;
              }
              const safePercent = Number(((_b = (_a = window.__fx.keybindFunctions).getAttackPercentage) == null ? void 0 : _b.call(_a)) || 0.12);
              const selection = this.findBestDynamicBotAttackTarget(tick, {
                mode,
                fixedPercent: safePercent,
                forceBest: true
              });
              if (!selection || selection.target < 0) {
                this.cancelBadAutomatedBotAttacks(tick);
                continue;
              }
              const attackSnapshot = this.getBotAttackSnapshot(selection.target);
              if (attackSnapshot) {
                const playerTroops = Number(attackSnapshot.playerTroops || 0);
                attackSnapshot.attackPercent = Number(safePercent.toFixed(4));
                attackSnapshot.attackTroops = Math.floor(playerTroops * safePercent);
              }
              const attackAccepted = this.attackPlayer(selection.target);
              if (!attackAccepted) {
                this.cancelBadAutomatedBotAttacks(tick);
                continue;
              }
              const attackEvent = this.recordBotAttackTelemetry(selection.target, {
                snapshot: attackSnapshot,
                mode,
                kind: selection.forced ? "safe-forced" : "safe-slot",
                autoAttackCount: this.autoAttackCount,
                checkSlot,
                cycleProgress: tickInCycle / 100,
                fixedSafeAttackPercent: safePercent,
                score: selection.score,
                oneShotRatio: selection.oneShotRatio
              });
              this.trackAutomatedBotAttack(selection.target, attackSnapshot);
              this.scheduleBotAttackOutcomeCheck(attackEvent, selection.target);
              this.autoAttackRecentTargets.set(selection.target, tick);
              this.autoAttackLastTick = tick;
              this.autoAttackCount++;
              this.cancelBadAutomatedBotAttacks(tick);
            }
            return;
          }
          if (mode === "best" || mode === "v20reserve") {
            const attacksPerCycle = intervalMsToAttacksPerCycle(getBestAttackIntervalMs());
            if (attacksPerCycle <= 0) return;
            const tickInterval = Math.max(1, Math.round(100 / attacksPerCycle));
            if (tick - this.autoAttackLastTick < tickInterval) return;
            const attackPercent2 = this.prepareBotSpendAttack(mode, tick);
            if (attackPercent2 <= 0) return;
            if (mode === "v20reserve") this.cancelBadAutomatedBotAttacks(tick);
            let target = mode === "v20reserve" ? this.findV20ReserveBotAttackTarget(tick, attackPercent2) : this.findBorderBotAttackTarget();
            let kind = mode === "v20reserve" ? "v20-reserve" : "border-adjacent";
            if (target < 0) {
              target = this.findSimpleBestBotAttackTarget(tick);
              kind = "simple-best-interval";
              if (target < 0) {
                this.autoAttackRecentTargets.clear();
                target = this.findSimpleBestBotAttackTarget(tick);
              }
            }
            if (target < 0) return;
            const attackSnapshot = this.getBotAttackSnapshot(target);
            const attackAccepted = this.attackPlayer(target);
            if (!attackAccepted) return;
            const attackEvent = this.recordBotAttackTelemetry(target, {
              snapshot: attackSnapshot,
              mode,
              kind,
              autoAttackCount: this.autoAttackCount,
              cycleProgress: tickInCycle / 100,
              botSpendProfile: this.lastPreparedBotAttack || null
            });
            this.trackAutomatedBotAttack(target, attackSnapshot);
            this.scheduleBotAttackOutcomeCheck(attackEvent, target);
            this.autoAttackRecentTargets.set(target, tick);
            this.autoAttackLastTick = tick;
            this.autoAttackLastAttackTime = performance.now();
            this.autoAttackCount++;
            return;
          }
          if (mode === "messiah") {
            if (this.autoAttackCount >= 10) return;
            const attacksPerCycle = intervalMsToAttacksPerCycle(getBestAttackIntervalMs());
            if (attacksPerCycle <= 0) return;
            const tickInterval = Math.max(1, Math.round(100 / attacksPerCycle));
            if (tick - this.autoAttackLastTick < tickInterval) return;
            const selection = this.findMessiahBotAttackTarget(tick);
            if (!selection || selection.target < 0) return;
            window.__fx.keybindFunctions.setAbsolute(selection.percent);
            window.__fx.keybindFunctions.repaintAttackPercentageBar();
            const attackSnapshot = this.getBotAttackSnapshot(selection.target);
            const attackAccepted = this.attackPlayer(selection.target);
            if (!attackAccepted) return;
            const attackEvent = this.recordBotAttackTelemetry(selection.target, {
              snapshot: attackSnapshot,
              mode,
              kind: "messiah-reachability",
              autoAttackCount: this.autoAttackCount,
              cycleProgress: tickInCycle / 100,
              score: selection.score,
              oneShotRatio: selection.oneShotRatio,
              reachRatio: selection.reachRatio
            });
            this.trackAutomatedBotAttack(selection.target, attackSnapshot);
            this.scheduleBotAttackOutcomeCheck(attackEvent, selection.target);
            this.autoAttackRecentTargets.set(selection.target, tick);
            this.autoAttackLastTick = tick;
            this.autoAttackLastAttackTime = performance.now();
            this.autoAttackCount++;
            return;
          }
          if (mode === "raw") {
            if (this.autoAttackCount >= 10) return;
            while (this.autoAttackCheckSlot < 22 && tickInCycle >= Math.round(this.autoAttackCheckSlot * 100 / 22)) {
              this.autoAttackCheckSlot++;
              if (this.autoAttackCount >= 10) return;
              if (!this.autoAttackInitializedPercent) {
                window.__fx.keybindFunctions.setAbsolute(0.15);
                window.__fx.keybindFunctions.repaintAttackPercentageBar();
                this.autoAttackInitializedPercent = true;
              }
              const attackPercent2 = Number(((_d = (_c = window.__fx.keybindFunctions).getAttackPercentage) == null ? void 0 : _d.call(_c)) || 0.15);
              if (!this.autoAttackReservedAttackUsed) {
                if (this.runWeakEncapsulatedBotAttack(tick, void 0, mode, "encapsulated")) {
                  this.autoAttackReservedAttackUsed = true;
                  continue;
                }
              }
              const target = this.findBestLowDensityBorderingBot(tickInCycle / 100, mode, attackPercent2, false);
              if (target < 0) continue;
              if (!this.isLiveLowDensityBotTarget(target, mode, false)) continue;
              const attackSnapshot = this.getBotAttackSnapshot(target);
              const attackAccepted = this.attackPlayer(target);
              if (!attackAccepted) continue;
              const attackEvent = this.recordBotAttackTelemetry(target, {
                snapshot: attackSnapshot,
                mode,
                kind: "normal",
                autoAttackCount: this.autoAttackCount,
                checkSlot: this.autoAttackCheckSlot - 1,
                cycleProgress: tickInCycle / 100
              });
              this.scheduleBotAttackOutcomeCheck(attackEvent, target);
              this.autoAttackRecentTargets.set(target, tick);
              this.autoAttackCount++;
            }
            return;
          }
          if (tickInCycle > 2 || this.autoAttackTimers.length) return;
          const schedule = mode === "raw" ? Array.from({ length: 22 }, (_, index) => index * 255) : mode === "safe" || mode === "best" ? Array.from({ length: 15 }, (_, index) => 300 + index * 310) : Array.from({ length: 20 }, (_, index) => index * 280);
          const maxAttacks = mode === "safe" ? 4 : mode === "best" ? 7 : mode === "raw" ? 10 : 10;
          const firstAttackPercent = mode === "safe" ? 0.12 : mode === "best" ? 0.2 : mode === "raw" ? 0.15 : void 0;
          const attackPercent = this.autoAttackInitializedPercent ? void 0 : firstAttackPercent;
          for (const delay of schedule) {
            const timer = setTimeout(() => {
              if (this.getAutoAttackMode() !== mode) return;
              if (this.autoAttackCount >= maxAttacks) return;
              const reservesEncapsulated = mode === "safe" || mode === "best";
              if (reservesEncapsulated && !this.autoAttackReservedAttackUsed) {
                const reservedTarget = this.findFullsendEncapsulatedBot(attackPercent, mode);
                if (reservedTarget >= 0) {
                  if (!this.isLiveLowDensityBotTarget(reservedTarget, mode, true)) return;
                  if (mode === "safe" || mode === "best") {
                    const rSel = window.__fx.openingAutomation.lastSafeReservedSelection;
                    if (rSel == null ? void 0 : rSel.recommendedSendPercent) {
                      window.__fx.keybindFunctions.setAbsolute(rSel.recommendedSendPercent);
                      window.__fx.keybindFunctions.repaintAttackPercentageBar();
                      this.autoAttackInitializedPercent = true;
                    }
                  }
                  if (!this.autoAttackInitializedPercent) {
                    if (firstAttackPercent !== void 0) {
                      window.__fx.keybindFunctions.setAbsolute(firstAttackPercent);
                      window.__fx.keybindFunctions.repaintAttackPercentageBar();
                    }
                    this.autoAttackInitializedPercent = true;
                  }
                  const attackSnapshot2 = this.getBotAttackSnapshot(reservedTarget);
                  const attackAccepted2 = this.attackPlayer(reservedTarget);
                  if (!attackAccepted2) return;
                  const attackEvent2 = this.recordBotAttackTelemetry(reservedTarget, {
                    snapshot: attackSnapshot2,
                    mode,
                    kind: "reserved",
                    autoAttackCount: this.autoAttackCount,
                    scheduledDelay: delay,
                    cycleProgress: Math.min(0.99, tickInCycle / 100 + delay / 5600)
                  });
                  this.scheduleBotAttackOutcomeCheck(attackEvent2, reservedTarget);
                  this.autoAttackRecentTargets.set(reservedTarget, performance.now());
                  if (mode === "safe" || mode === "best") {
                    this.recordSafeTelemetry({
                      type: "safe-attack",
                      kind: "reserved",
                      target: reservedTarget,
                      selection: window.__fx.openingAutomation.lastSafeReservedSelection || null
                    });
                    const _reserved = reservedTarget;
                    setTimeout(() => {
                      var _a2, _b2, _c2, _d2, _e, _f;
                      const land = (_c2 = (_b2 = (_a2 = window.__fx.openingAutomation).getTargetLand) == null ? void 0 : _b2.call(_a2, _reserved)) != null ? _c2 : -1;
                      const troops = (_f = (_e = (_d2 = window.__fx.openingAutomation).getTargetTroops) == null ? void 0 : _e.call(_d2, _reserved)) != null ? _f : -1;
                      this.recordSafeTelemetry({ type: "safe-conquest-check", target: _reserved, conquered: land <= 0, remainingLand: land, remainingTroops: troops });
                    }, 6e3);
                  }
                  this.autoAttackReservedAttackUsed = true;
                  this.autoAttackCount++;
                  return;
                }
                if (this.autoAttackCount >= maxAttacks - 1) return;
              }
              const cycleProgress = Math.min(0.99, tickInCycle / 100 + delay / 5600);
              const target = this.findBestLowDensityBorderingBot(cycleProgress, mode, attackPercent, mode === "safe" || mode === "best");
              if (target < 0) return;
              if (!this.isLiveLowDensityBotTarget(target, mode, false)) return;
              if (mode === "safe" || mode === "best") {
                const nSel = window.__fx.openingAutomation.lastSafeNormalSelection;
                if (nSel == null ? void 0 : nSel.recommendedSendPercent) {
                  window.__fx.keybindFunctions.setAbsolute(nSel.recommendedSendPercent);
                  window.__fx.keybindFunctions.repaintAttackPercentageBar();
                  this.autoAttackInitializedPercent = true;
                }
              }
              if (!this.autoAttackInitializedPercent) {
                if (firstAttackPercent !== void 0) {
                  window.__fx.keybindFunctions.setAbsolute(firstAttackPercent);
                  window.__fx.keybindFunctions.repaintAttackPercentageBar();
                }
                this.autoAttackInitializedPercent = true;
              }
              const attackSnapshot = this.getBotAttackSnapshot(target);
              const attackAccepted = this.attackPlayer(target);
              if (!attackAccepted) return;
              const attackEvent = this.recordBotAttackTelemetry(target, {
                snapshot: attackSnapshot,
                mode,
                kind: "normal",
                autoAttackCount: this.autoAttackCount,
                scheduledDelay: delay,
                cycleProgress
              });
              this.scheduleBotAttackOutcomeCheck(attackEvent, target);
              this.autoAttackRecentTargets.set(target, performance.now());
              if (mode === "safe" || mode === "best") {
                this.recordSafeTelemetry({
                  type: "safe-attack",
                  kind: "normal",
                  target,
                  selection: window.__fx.openingAutomation.lastSafeNormalSelection || null
                });
                const _target = target;
                setTimeout(() => {
                  var _a2, _b2, _c2, _d2, _e, _f;
                  const land = (_c2 = (_b2 = (_a2 = window.__fx.openingAutomation).getTargetLand) == null ? void 0 : _b2.call(_a2, _target)) != null ? _c2 : -1;
                  const troops = (_f = (_e = (_d2 = window.__fx.openingAutomation).getTargetTroops) == null ? void 0 : _e.call(_d2, _target)) != null ? _f : -1;
                  this.recordSafeTelemetry({ type: "safe-conquest-check", target: _target, conquered: land <= 0, remainingLand: land, remainingTroops: troops });
                }, 6e3);
              }
              this.autoAttackCount++;
            }, delay);
            this.autoAttackTimers.push(timer);
          }
        };
      }();
      openingAutomation_default = openingAutomation;
    }
  });

  // entry.js
  var require_entry = __commonJS({
    "entry.js"() {
      init_openingAutomation();
      window.__fx = window.__fx || {};
      var __pct = 0.32;
      window.__fx.keybindFunctions = {
        setAbsolute: function(v) {
          __pct = Number(v) || 0;
        },
        getAttackPercentage: function() {
          return __pct;
        },
        repaintAttackPercentageBar: function() {
        },
        setRelative: function() {
        }
      };
      window.__fx.rtt = { getTicks: function() {
        return 0;
      } };
      window.__fx.openingAutomation = openingAutomation_default;
    }
  });
  require_entry();
})();
