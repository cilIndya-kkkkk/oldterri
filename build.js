#!/usr/bin/env node
// oldterri build: applies a minimal text patch to the original Territorial.io
// game script and writes a single deployable JS. No dependencies, lightweight
// enough for old devices (iOS 12).
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const gamePath = path.join(__dirname, 'game', 'latest.js');
const outDir = path.join(__dirname, 'docs');

const script = fs.readFileSync(gamePath, 'utf8');

// Full automation (port of goodclient's openingAutomation engine). These two
// artifacts are pre-built to ES5 (iOS 12 compatible) by automation/full/build:
//   - engine.js: the bundled engine (window.__fx.openingAutomation + deps),
//     injected BEFORE the game IIFE.
//   - injectionA.js: the in-game raw-method bindings, injected at `function dN`.
// A third tiny block (windowAEGetter) exposes the game object so the engine's
// getVar("gameState") -> window.aE.a3z works despite the IIFE not being stripped.
const engineBundle = fs.readFileSync(path.join(__dirname, 'automation', 'full', 'engine.js'), 'utf8');
const injectionA = fs.readFileSync(path.join(__dirname, 'automation', 'full', 'injectionA.js'), 'utf8');
const controlBundle = fs.readFileSync(path.join(__dirname, 'automation', 'full', 'control.js'), 'utf8');
const openingControlBundle = fs.readFileSync(path.join(__dirname, 'automation', 'full', 'openingControl.js'), 'utf8');

// Researched opening strategies from ~/ttresearch/opening/data/best/*.json.
// Their `attacks` are arrays [cycle, exactTick, percent]; the engine needs
// objects {cycle, exactTick, percent}. Convert and embed as window.__fxOpeningStrategies.
// Only strategies for land >= 2500 are kept (user preference for longer games).
const strategiesDir = '/data/data/com.termux/files/home/ttresearch/opening/data/best';
const MIN_OPENING_LAND = 2500;
let strategiesData = 'window.__fxOpeningStrategies={};';
try {
  const files = fs.readdirSync(strategiesDir).filter((f) => /^best-.*\.json$/.test(f)).sort();
  const obj = {};
  let skipped = 0;
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(strategiesDir, f), 'utf8'));
    if (!raw || !raw.strategy) continue;
    if (Number(raw.land) < MIN_OPENING_LAND) { skipped++; continue; }
    const strat = raw.strategy;
    if (strat.attacks) {
      strat.attacks = strat.attacks.map((a) => ({ cycle: Number(a[0]), exactTick: Number(a[1]), percent: Number(a[2]) }));
    }
    obj[f.replace('.json', '')] = strat;
  }
  strategiesData = 'window.__fxOpeningStrategies=' + JSON.stringify(obj) + ';';
  console.log('embedded ' + Object.keys(obj).length + ' researched strategies (>= ' + MIN_OPENING_LAND + ' land, skipped ' + skipped + ')');
} catch (e) {
  console.warn('no researched strategies available (' + e.message + ')');
}
const windowAEGetter =
  `if(typeof Object.defineProperty==="function"){try{Object.defineProperty(window,"aE",{get:function(){return typeof aE!=="undefined"?aE:null;},configurable:true});Object.defineProperty(window,"ah",{get:function(){return typeof ah!=="undefined"?ah:null;},configurable:true});}catch(__ge){}}`;

// Build-time guards: if the game is re-obfuscated (a new release), these raw
// access strings / anchors move and the injected blocks would silently no-op.
// Fail the build loudly instead.
const rawChecks = [
  ['bB.iD.iK', 'GameCommandSender.sendAttack'],
  ['bB.iD.s2', 'GameCommandSender.sendSupport'],
  ['bB.iD.sI', 'GameCommandSender.cancelAttack'],
  ['bD.h7.jQ', 'SupportMath.supportAmount'],
  ['bD.h7.sT', 'SupportMath.supportCalc'],
  ['bF.a6M', 'UI controller.setHidden'],
  ['aE.a48', 'gameState'],
  ['aE.fV', 'playerId'],
  ['ah.hn', 'playerBalances'],
  ['ah.hZ', 'playerTerritories'],
  ['aE.hu', 'gIsReplay'],
  ['function dN(){var hq=0;var hr=0;', 'injection-A anchor (dN)'],
  ['this.eq=function(){this.a4N.an9++;', 'injection-B anchor (tick hook)'],
];
for (const [pat, name] of rawChecks) {
  if (!script.includes(pat))
    throw new Error(`Automation raw name check failed: "${pat}" (${name}) not in game/latest.js. The game was updated -- re-derive.`);
}


// The old device has no console, so this overlay mirrors console.log to an
// on-screen box so the user can report what the game is doing. Written in ES5
// so it runs on iOS 12. It is now OPT-IN: it only activates when the URL has
// ?debug=1. Otherwise it is a no-op — mirroring every log to the DOM box caused
// layout thrashing / frame drops on the slow iOS 12 device (and may have blocked
// the 16-box captcha from rendering). Keep it off for normal play.
const consoleMirror =
  `(function(){` +
  `if(!(window.location&&window.location.search&&/[?&]debug=1/.test(window.location.search))){return;}` +
  `var box=document.createElement("div");` +
  `box.id="fxDbg";` +
  `box.style.cssText="position:fixed;top:4px;left:4px;z-index:999999;max-width:60vw;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.75);color:#0f0;font:11px monospace;padding:2px;pointer-events:auto;";` +
  `var logs=[];var hidden=false;` +
  `var head=document.createElement("div");` +
  `head.style.cssText="font:12px sans-serif;text-align:right;cursor:pointer;color:#fff;user-select:none;-webkit-user-select:none;";` +
  `head.textContent="[x]";` +
  `var content=document.createElement("div");` +
  `content.style.cssText="white-space:pre-wrap;";` +
  `box.appendChild(head);box.appendChild(content);` +
  `function show(s){try{logs.push(s);if(logs.length>50){logs.shift();}content.textContent=logs.join("\\n");}catch(e){}}` +
  `head.onclick=function(){` +
  `  hidden=!hidden;` +
  `  content.style.display=hidden?"none":"";` +
  `  box.style.maxHeight=hidden?"20px":"50vh";` +
  `  box.style.overflow=hidden?"hidden":"auto";` +
  `  head.textContent=hidden?"[show]":"[x]";` +
  `};` +
  `if(window.console){` +
  `  var orig=window.console.log?window.console.log.bind(window.console):function(){};` +
  `  window.console.log=function(){try{orig.apply(window.console,arguments);}catch(e){}show("[log] "+Array.prototype.slice.call(arguments).join(" "));};` +
  `}` +
  `show("fxdbg ready");` +
  `function attach(){try{if(box.parentNode!==document.body){document.body.appendChild(box);}}catch(e){}}` +
  `attach();` +
  `setInterval(attach,1000);` +
  `})();`;

const patches = [
  // Mirror the game's console logs to an on-screen box (for the console-less
  // iOS 12 device), and load the automation engine. Prepended before the game's
  // IIFE so window.__fx exists before the in-game block runs.
  ['"use strict";    (function () {', consoleMirror + engineBundle + controlBundle + openingControlBundle + strategiesData + '"use strict";    (function () {'],
  // Inject the in-game automation bindings at the start of `function dN` (the
  // mouse/input action manager constructor), exposing the game internals. The
  // window.aE getter lets the engine's getVar("gameState") work (IIFE not stripped).
  ['function dN(){var hq=0;var hr=0;', 'function dN(){' + windowAEGetter + injectionA + 'var hq=0;var hr=0;'],
  // Drive the engine each game tick by hooking the tick counter increment.
  ['this.eq=function(){this.a4N.an9++;',
   'this.eq=function(){this.a4N.an9++;try{__fx.openingAutomation.onTick(this.a4N.an9);__fx.openingAutomation.onTickAutoAttack(this.a4N.an9);}catch(__fxTickError){if(!window.__fxTickError){window.__fxTickError=__fxTickError;console.error("[oldterri] automation tick",__fxTickError);}}'],
  // The original game uses "interaction-only", which only issues a challenge
  // on user interaction. "execute" makes Cloudflare solve in the background.
  ['appearance:"interaction-only"', 'appearance:"execute"'],
  // On the old iOS 12 device Cloudflare's Turnstile widget never completes, so
  // no verification UI ever appears and the server kicks the player. The game
  // has a native 16-tile captcha (`ew()`) that is iOS-12-compatible and accepted
  // by the server as an alternative. It is suppressed while Turnstile holds the
  // slot: `bX.ei()` reads a server flag (buffer byte 160) and the 16-box guard
  // `if (bX.ei()) return;` skips it. Force `ei()` to 0 so the 16-box triggers.
  ['this.ei=function(){return bm.buffer.data[160].value;}', 'this.ei=function(){return 0;}'],
  // We use the native 16-box now, so keep Cloudflare's Turnstile from loading at
  // all (it hangs on iOS 12 and even shows on newer devices). Making the guard
  // always-true makes `dv()` return early before injecting the Cloudflare script.
  ['this.dv=function(){if(m.e8||(!m.aA&&!m.eG)){', 'this.dv=function(){if(true){']
];

fs.mkdirSync(outDir, { recursive: true });
let out = script;
for (const [search, replacement] of patches) {
  const count = out.split(search).length - 1;
  if (count !== 1) {
    throw new Error(`patch anchor found ${count} times (expected 1): ${search.slice(0, 60)}...`);
  }
  out = out.split(search).join(replacement);
}

const outPath = path.join(outDir, 'latest.js');
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${Buffer.byteLength(out)} bytes)`);

// Copy the game page into dist so Pages can serve a playable build.
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(outDir, 'index.html'));
console.log(`Wrote ${path.join(outDir, 'index.html')}`);
