# oldterri

A minimal patch to the original [Territorial.io](https://territorial.io) game so
it runs on very old devices (e.g. iOS 12 Safari), where the standard FX client
is too heavy and the Cloudflare **Turnstile** verification won't load.

The goal: **pass the verification** (either Turnstile *or* the game's 16-tile
captcha) without needing the modern browser features iOS 12 lacks.

## How it works

`build.js` applies a plain-text patch to the original minified game
(`game/latest.js`) and writes a single deployable script to `dist/latest.js`.
No dependencies, tiny output — suitable for serving via GitHub Pages.

## Current state

- First-attempt bypass: a `window.turnstile` shim that resolves the token
  callback immediately. This only works if the game server accepts the
  placeholder token; otherwise we need a real Turnstile run (invisible mode) or
  the 16-tile captcha auto-solve path.

## Build

```bash
node build.js      # reads game/latest.js, writes dist/latest.js
```

To serve via Pages, publish the `dist/` output (with a matching `index.html`).
