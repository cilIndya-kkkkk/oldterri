#!/usr/bin/env node
// oldterri build: applies a minimal text patch to the original Territorial.io
// game script and writes a single deployable JS. No dependencies, lightweight
// enough for old devices (iOS 12).
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const gamePath = path.join(__dirname, 'game', 'latest.js');
const outDir = path.join(__dirname, 'dist');

const script = fs.readFileSync(gamePath, 'utf8');

// Shim injected before the game: the game reads `window.turnstile` and calls
// `.render(el, opts)`, which must invoke `opts.callback(token)`. On old
// browsers Cloudflare's Turnstile script may not load, so we provide a shim
// that resolves immediately. The token is a placeholder; if the game server
// rejects it we need a real Turnstile run (invisible mode) or the 16-box path.
const turnstileShim =
  `(function(){` +
  `if(!window.turnstile){` +
  `  var fakeToken = "__oldterri_turnstile_placeholder__";` +
  `  window.turnstile = {` +
  `    render: function(el, opts){` +
  `      if(opts && typeof opts.callback === "function"){` +
  `        setTimeout(function(){ opts.callback(fakeToken); }, 0);` +
  `      }` +
  `      return "oldterri-widget";` +
  `    },` +
  `    remove: function(){},` +
  `    reset: function(){},` +
  `    getResponse: function(){ return fakeToken; }` +
  `  };` +
  `}` +
  `})();`;

const patches = [
  ['"use strict";    (function () {', turnstileShim + '"use strict";    (function () {']
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
