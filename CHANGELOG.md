# Changelog

All notable changes to the Neon City Overdrive FoundryVTT system will be documented in this file.

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
- FoundryVTT v12-v13
