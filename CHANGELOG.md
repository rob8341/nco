# Changelog

All notable changes to the Neon City Overdrive FoundryVTT system will be documented in this file.

## [1.3.0] - 2026-04-04

### Fixed
- **Text field persistence** — text fields (name, bio, trademarks, edges, traumas, flaws, drive note) no longer wipe when clicking checkboxes or buttons; values are cached before re-render and restored after
- **Character name** — name now saves on change with explicit listener; window title and sidebar update correctly
- **Close saves** — all text fields on character, gear, and special gear sheets save when the sheet is closed
- **Portrait click** — character portrait now opens a file picker (migrated from legacy `data-edit` to ApplicationV2 click handler)
- **Boon calculation (retirement roll)** — cancelled 6s no longer count toward boons; only remaining action dice are considered
- **Add special gear button** — button was not bound due to `querySelector` only matching the first `.add-gear-btn`; changed to `querySelectorAll`
- **Item sheet form submission** — pressing Enter in gear name fields no longer breaks Foundry layout; Enter now blurs the input to trigger save
- **FilePicker namespace** — all `FilePicker` calls updated to `foundry.applications.apps.FilePicker.implementation` for v13+ compatibility

### Changed
- **Header theme** — character sheet header changed from purple/pink/cyan to black-cyan-black deep teal gradient
- **Name/bio text** — silver-white with cyan neon glow for contrast against header background
- **Trademarks & Edges label** — changed from pink to cyan to match the rest of the UI
- **Roll button** — moved to top-right corner as a square icon button
- **Sheet spacing** — increased header and body padding/gap
- **Retirement roll chat card** — dice display now matches basic roll style (cancelled grey/strikethrough, chosen gold, boon purple)
- **Item sheet titles** — gear and special gear sheets now show item name in window title instead of raw type key
- **Special gear sheet** — increased height to fit tags without clipping; made resizable
- **Danger dice from traumas** — trauma count now reads from DOM inputs so unsaved edits are included in roll calculations

## [1.2.0] - 2026-04-03

### Changed
- **Foundry v14 compatibility** — system now supports FoundryVTT v12 through v14
- **Combat tracker** — initiative roll button override rewritten with native DOM APIs to support ApplicationV2 (v14's `CombatTracker` passes an `HTMLElement` instead of a jQuery object)
- **Dice rolling** — removed deprecated `allowInteractive` option from all `Roll.evaluate()` calls

## [1.1.0] - 2026-03-31

### Added
- **Trademark & Edge highlighting** — click the pip next to any trademark or edge to highlight it for a roll; highlighted count adds to default action dice automatically
- **Roll dialog breakdown** — action dice default pre-filled from highlighted trademarks and edges, shown as separate labelled sources (Trademarks / Edges)
- **Randomised chat flavour text** — "took a hit", "used a stunt", and "death awaits another day" each rotate through 3 variants

### Changed
- **Dialog window headers** — all dialog windows now display their title with icon, colour, and Orbitron neon-glow font matching the in-content style; titles no longer appear blank
- **Roll chat card** — cancelled dice shown in grey with strikethrough; chosen die highlighted yellow; boon dice highlighted purple; cancelled pairs sorted so the action die appears above the danger die that cancelled it; remaining/cancelled breakdown sections removed for a cleaner card
- **Roll chat card colour coding** — danger sources (Conditions, Traumas) in red; action sources (Trademarks, Edges) in blue in the roll dialog breakdown
- **Roll chat card speaker** — chat messages from the Roll button now show the actor's name instead of the player's name
- **Boon calculation** — boons now counted from remaining (non-cancelled) action dice only
- **Boon label** — coloured purple to match boon dice
- **Dialog default button** — removed Foundry's red glow from the default roll button; styled consistently with the NCO cyan theme

### Removed
- "(3 blocks × 5 XP)" hint label from the Experience section

## [1.0.0] - Initial Release

### Added
- Character sheet with full NCO mechanics
  - Trademarks (5) with Edges (5 each)
  - Hits (3+1 upgradeable) with Rest button
  - Conditions (6 + custom) with chat notifications
  - Traumas (4) with Trauma Roll and Recovery Roll
  - Flaws (2)
  - Stunt Points (3+2 upgradeable) with Refresh and Bonus buttons
  - Drive (10 tri-state checkboxes) with Retire mechanic
  - Experience (15, 3 blocks of 5) with Advancement system
  - Basic Gear (20 max) and Special Gear (4 max) management
  - Stash/Leverage system with Gain, Bonus, and Spend buttons
  - Gear Roll system with counter

- Threat sheet for NPCs/enemies
  - Numeric hits (current/max)
  - Drive, Tags, and Actions text fields

- Item sheets
  - Basic Gear (icon, name, description)
  - Special Gear (icon, name, description, 6 tags)

- Full dice rolling system
  - Action dice (d6) vs Danger dice (d6)
  - Dice cancellation mechanics
  - Botch, Fail, Partial Success, Success, Boon outcomes
  - Dice So Nice integration with chrome dice

- Styled chat messages for all actions
- Cyberpunk neon theme (cyan, pink, purple)
- Orbitron and Rajdhani fonts

### Compatibility
- FoundryVTT v12-v13 (v14 added in 1.2.0)
