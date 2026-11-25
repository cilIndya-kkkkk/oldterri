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

// The real Cloudflare Turnstile widget runs on modern devices (it's the game's
// own code), but on the iOS 12 device it doesn't appear at all. The likely
// cause is that Cloudflare's script uses JS syntax iOS 12 can't parse, so
// `window.turnstile` stays undefined and the widget never renders. No
// appearance/shims fix that, so we need to SEE what the game logs on the device
// — but the old device has no console. This overlay mirrors console.log to an
// on-screen box so the user can report which stage fails. Written in ES5 so it
// runs on iOS 12.
const consoleMirror =
  `(function(){` +
  `var box=document.createElement("div");` +
  `box.id="fxDbg";` +
  `box.style.cssText="position:fixed;top:4px;left:4px;z-index:999999;max-width:60vw;max-height:50vh;overflow:auto;background:rgba(0,0,0,0.75);color:#0f0;font:11px monospace;white-space:pre-wrap;padding:4px;pointer-events:none;";` +
  `var logs=[];` +
  `function show(s){try{logs.push(s);if(logs.length>50){logs.shift();}box.textContent=logs.join("\\n");}catch(e){}}` +
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
  // iOS 12 device). Prepended before the game's IIFE.
  ['"use strict";    (function () {', consoleMirror + '"use strict";    (function () {'],
  // The original game uses "interaction-only", which only issues a challenge
  // on user interaction. "execute" makes Cloudflare solve in the background.
  ['appearance:"interaction-only"', 'appearance:"execute"'],
  // On the old iOS 12 device Cloudflare's Turnstile widget never completes, so
  // no verification UI ever appears and the server kicks the player. The game
  // has a native 16-tile captcha (`ew()`) that is iOS-12-compatible and accepted
  // by the server as an alternative. It is suppressed while Turnstile holds the
  // slot: `bX.ei()` reads a server flag (buffer byte 160) and the 16-box guard
  // `if (bX.ei()) return;` skips it. Force `ei()` to 0 so the 16-box triggers.
  ['this.ei=function(){return bm.buffer.data[160].value;}', 'this.ei=function(){return 0;}']
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
