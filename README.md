# FOCUS — Gamified Focus Timer

A focus timer with XP, levels, daily goals, streaks, and session
history — no build step, no dependencies to install. Open `index.html` in a
browser, or serve the folder with any static file server.

## Running it

```bash
# From inside the focus-timer/ folder
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly (double-click) also works, since everything is
plain HTML/CSS/JS with no bundler.

## Project structure

```
focus-timer/
├── index.html            Markup only — all styling and logic are external
├── manifest.json         Web app manifest (installable as a PWA shell)
├── css/
│   ├── base.css           CSS variables, resets, theme/background/font presets
│   ├── layout.css         App shell, HUD, and the central timer stage
│   ├── components.css     Buttons, modals, history panel, toast, settings UI
│   └── responsive.css     Breakpoints for mobile, very narrow, and landscape
├── js/
│   ├── state.js           Shared `Focus` namespace, state shape, persistence
│   ├── ui.js               Theme application, settings sync, toasts, sound, confetti
│   ├── timer.js            Timer start/pause/reset, progress ring, daily goal
│   ├── xp.js                Leveling formula, XP awarding, streak tracking
│   ├── history.js          Session summary modal, history CRUD, JSON export
│   └── app.js               Boots the app once the DOM is ready
└── assets/
    └── favicon.svg
```

All JS modules attach to a single global `Focus` namespace (`window.Focus`)
instead of polluting the global scope — `js/state.js` must load first since
every other module extends it. `app.js` loads last and calls `init()` on
`DOMContentLoaded`.

## Features

- **Timer** — large circular progress ring, kaomoji face that reacts to state
  (idle / active / tired / win), millisecond display (toggleable)
- **XP & levels** — exponential leveling curve, animated XP bar, floating
  "+N XP" bursts while a session runs
- **Daily goal** — set a target in minutes; live progress shown under the
  timer, with a toast + chime when you hit it
- **Streaks** — a day counter that increments when you save at least one
  session per calendar day, shown next to the clock
- **Session history** — slide-out panel, editable names, delete, and export
  to a timestamped `.json` file
- **Studio (settings)** — 6 accent colors, 8 backgrounds, 4 textures, 4 fonts,
  light/dark mode, sound toggle, keyboard shortcut reference
- **Keyboard shortcuts** — `Space` start/pause, `Esc` closes dialogs, `H`
  toggles history
- **Persistence** — everything saved to `localStorage`; a `try/catch` guard
  means the app still works (just without persistence) in private-browsing
  modes that block storage
- **Accessibility** — visible focus rings, `aria-live` toast region, keyboard-
  operable history items and color swatches, `prefers-reduced-motion` support
- **Responsive** — safe-area-aware layout for notches/home indicators, a
  dedicated short-screen/landscape breakpoint, and a sub-380px layout pass

## Customizing

- **Add an accent color**: add `{ id, hex }` to `themeColors` in `js/state.js`
  and a matching `[data-color="id"]` rule in `css/base.css`.
- **Add a background**: add a `[data-bg="id"]` rule in `css/base.css` and a
  button in the Background pill group in `index.html`.
- **Change the XP curve**: edit `getXPRequiredForLevel()` in `js/xp.js`.
- **Change the daily goal default**: edit `dailyGoalMinutes` in the `state`
  object in `js/state.js`.

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Uses CSS custom
properties, `backdrop-filter`, and the Web Audio API — all widely supported,
though `backdrop-filter` gracefully degrades to a solid-ish background on
very old browsers without it.
