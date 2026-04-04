# NEON CITY OVERDRIVE — FoundryVTT System

> *"The city never sleeps. The neon never dies. Roll the dice and see if you do."*

A FoundryVTT v12–v14 system for **Neon City Overdrive** — a rules-light, fast-playing tabletop RPG of cinematic cyberpunk action. Neon-soaked streets, chrome implants, corporate war, and dice that glow in the dark.

![Foundry Version](https://img.shields.io/badge/Foundry-v12--v14-informational)
![Version](https://img.shields.io/badge/Version-1.4.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

### Character Sheet
- **Trademarks & Edges** — 5 trademarks with 5 edges each; click the pip to highlight for a roll
- **Hits** — 3 base (+1 upgradeable) with Rest button
- **Conditions** — 6 standard + 1 custom condition
- **Traumas** — 4 trauma lines with Trauma Roll and Recovery Roll
- **Flaws** — 2 flaw lines
- **Stunt Points** — 3 base (+2 upgradeable) with Refresh and Bonus buttons
- **Drive** — 10 tri-state checkboxes (empty/tick/cross) with Retire mechanic
- **Experience** — 15 XP (3 blocks of 5) with Advancement system
- **Gear** — Basic gear (20 max) and Special Gear (4 max) management
- **Stash/Leverage** — Gain, Bonus, and Spend leverage buttons
- **Gear Roll System** — Roll for acquiring special gear with tags
- **Notes** — freeform text field for anything the city throws at you

### Threat Sheet
- Numeric hits (current/max)
- Drive, Tags, and Actions text fields
- All fields persist on close; sidebar updates in real time

### Item Sheets
- **Basic Gear** — Icon, name, description
- **Special Gear** — Icon, name, description, 6 tags displayed inline

### Dice System
- Action dice vs Danger dice mechanics
- Automatic dice cancellation
- Botch, Fail, Partial, Success, Boon outcomes
- **Dice So Nice integration** — neon cyberpunk dice:
  - Action dice: white with cyan numbers, glass material, Orbitron font
  - Danger dice: black with red numbers, glass material, Orbitron font
  - Both pools thrown simultaneously; emissive neon glow on every roll
- Danger dice auto-calculated from conditions and traumas

### Visual Theme
- Cyberpunk neon aesthetic — cyan, red, gold, black
- Orbitron and Rajdhani fonts
- Styled chat messages for every action
- Custom pause screen

---

## Installation

### Method 1: Manifest URL *(recommended)*
1. In FoundryVTT, go to **Game Systems**
2. Click **Install System**
3. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/rob8341/nco/refs/heads/main/system.json
   ```
4. Click **Install**

### Method 2: Manual
1. Download the latest release from [Releases](https://github.com/rob8341/NCO/releases)
2. Extract the `NCO` folder to `<FoundryVTT Data>/Data/systems/`
3. Restart FoundryVTT

---

## Usage

1. Create a new World and select **Neon City Overdrive** as the game system
2. Create **Characters** for the runners
3. Create **Threats** for corps, gangers, and worse
4. Arm them with **Basic Gear** and **Special Gear**

### Rolling Dice
Click the roll button (top-right of the character sheet) to open the dice dialog:
- Highlight trademarks and edges by clicking their pip — each adds 1 action die
- Danger dice are auto-calculated from active conditions and traumas
- Results post to chat: cancelled dice grey, chosen die gold, boon dice purple
- If **Dice So Nice** is active, dice fly — action pool white/cyan, danger pool black/red, both at once

### Advancement
At 5+ XP, click the Advancement button to:
- Write a new Trademark (max 5)
- Write a new Edge for any Trademark
- Increase Hit maximum (+1, max 4)
- Increase Stunt Point maximum (+1, max 5)

---

## Credits

- **Neon City Overdrive** by Nathan Russell — [Peril Planet](https://www.perilplanet.com/neon-city-overdrive/)
- FoundryVTT system by rob8341 with Claude Sonnet 4.6 AI

## License

MIT License. See [LICENSE](LICENSE) for details.

> *This is an unofficial fan implementation. Jack in, run fast, and support the official game.*
