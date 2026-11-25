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

// The device has internet and the real Cloudflare Turnstile widget can load
// (we saw it before). Do NOT shim `window.turnstile` — an injected fake object
// shadows the real one and prevents a real token, which the server rejects.
// Instead, let the real Turnstile run, but make it solve invisibly so no
// manual interaction is needed on the old device.
const patches = [
  // The original game uses "interaction-only", which only issues a challenge
  // on user interaction and may never fire a real token. "execute" makes
  // Cloudflare solve the challenge in the background and call callback() with
  // a real, server-valid token.
  ['appearance:"interaction-only"', 'appearance:"execute"']
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
