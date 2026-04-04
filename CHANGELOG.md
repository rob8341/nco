# Changelog

> *Every patch is a chrome implant. Every version is a new life.*

---

## [1.4.0] — 2026-04-04 // NEON DICE UPDATE

*"The dice hit the table. The table glows. The city watches."*

### Added
- **Dice So Nice integration** — cyberpunk neon dice for every roll
  - Action dice: white body, cyan `#00f5ff` numbers, glass material, Orbitron font
  - Danger dice: black body, red `#ff3366` numbers, glass material, Orbitron font
  - Action and danger pools throw simultaneously — no waiting
  - Emissive neon glow on all NCO dice; blooms if DSN glow is enabled
  - Non-action rolls (trauma, recovery, gear, stash, retirement) use danger dice defaults
  - Colorsets registered under "Neon City Overdrive" category in DSN settings
- **Notes field** — freeform text area at the bottom of the character sheet, below Experience
- **Threat sheet saves** — all threat fields (name, hits, tags, actions, drive) now save in real time on change; sidebar updates immediately when the threat is renamed

### Fixed
- **Threat name on sidebar** — renaming a threat now updates the actors sidebar and window title on blur, not only on close
- **Threat sheet fields not persisting** — tags, actions, and drive textareas were never saved; now have `change` listeners and a `close()` safety save
- **Special gear tags not saving** — dot-notation array index updates (`system.tags.0`) do not work correctly with `ArrayField`; now rebuilds and sets the full array on every change and on close
- **Notes field not saving on close** — `close()` and the re-render cache only covered `input[type="text"]`; both now include `textarea[name]`

### Changed
- **Gear roll dialog** — ROLL button centered with flexbox
- **Recovery roll dialog** — modifier label and input centered
- **Special gear item line** — all tags displayed in full; only truncated with ellipsis when crowding the remove button
- **Threat sheet height** — bumped from 450 to 500px to prevent bottom clipping

---

## [1.3.0] — 2026-04-04

### Fixed
- **Text field persistence** — text fields no longer wipe when clicking checkboxes or buttons
- **Character name** — saves on change; window title and sidebar update correctly
- **Close saves** — all text fields on character, gear, and special gear sheets save on close
- **Portrait click** — opens file picker via ApplicationV2 handler
- **Boon calculation (retirement roll)** — cancelled 6s no longer count toward boons
- **Add special gear button** — fixed `querySelector` only matching the first `.add-gear-btn`
- **Item sheet form submission** — Enter in gear name fields now blurs instead of breaking layout
- **FilePicker namespace** — updated to `foundry.applications.apps.FilePicker.implementation`

### Changed
- **Header theme** — deep teal gradient (black-cyan-black)
- **Name/bio text** — silver-white with cyan neon glow
- **Trademarks & Edges label** — cyan to match UI
- **Roll button** — top-right square icon
- **Sheet spacing** — increased padding and gap
- **Retirement roll chat card** — matches basic roll style (grey/gold/purple)
- **Item sheet titles** — show item name in window title
- **Special gear sheet** — taller; made resizable
- **Danger dice from traumas** — reads from DOM so unsaved edits are included

---

## [1.2.0] — 2026-04-03

### Changed
- **Foundry v14 compatibility** — v12 through v14 supported
- **Combat tracker** — initiative override rewritten with native DOM APIs for ApplicationV2
- **Dice rolling** — removed deprecated `allowInteractive` option from `Roll.evaluate()`

---

## [1.1.0] — 2026-03-31

### Added
- **Trademark & Edge highlighting** — click the pip to highlight for a roll; count adds to action dice
- **Roll dialog breakdown** — action dice pre-filled from highlighted trademarks and edges
- **Randomised chat flavour** — hit/stunt/death lines rotate through 3 variants

### Changed
- **Dialog window headers** — Orbitron neon-glow titles across all dialogs
- **Roll chat card** — grey strikethrough for cancelled, gold for chosen, purple for boon
- **Roll chat card speaker** — shows actor name, not player name
- **Boon calculation** — counted from remaining (non-cancelled) action dice only
- **Boon label** — purple
- **Default roll button** — no Foundry red glow; NCO cyan theme

### Removed
- "(3 blocks × 5 XP)" hint from Experience section

---

## [1.0.0] — Initial Uplink

*"System online. Neon live. Let's run."*

### Added
- Full character sheet — Trademarks, Edges, Hits, Conditions, Traumas, Flaws, Stunt Points, Drive, Experience, Gear, Stash
- Threat sheet — hits, drive, tags, actions
- Item sheets — Basic Gear and Special Gear
- Action vs Danger dice system with cancellation, botch/fail/partial/success/boon
- Dice So Nice integration (chrome dice)
- Styled chat messages, cyberpunk neon theme, Orbitron/Rajdhani fonts

### Compatibility
- FoundryVTT v12–v13 (v14 added in 1.2.0)
