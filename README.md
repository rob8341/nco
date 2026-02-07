# Neon City Overdrive - FoundryVTT System

A FoundryVTT v13 compatible system for **Neon City Overdrive**, a rules-light, fast-playing tabletop roleplaying game of cinematic cyberpunk action.

![Foundry Version](https://img.shields.io/badge/Foundry-v13-informational)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Character Sheet
- **Trademarks & Edges** - 5 trademarks with 5 edges each
- **Hits** - 3 base (+1 upgradeable) with Rest button
- **Conditions** - 6 standard + 1 custom condition
- **Traumas** - 4 trauma lines with Trauma Roll and Recovery Roll
- **Flaws** - 2 flaw lines
- **Stunt Points** - 3 base (+2 upgradeable) with Refresh and Bonus buttons
- **Drive** - 10 tri-state checkboxes (empty/tick/cross) with Retire mechanic
- **Experience** - 15 XP (3 blocks of 5) with Advancement system
- **Gear** - Basic gear (20 max) and Special Gear (4 max) management
- **Stash/Leverage** - Gain, Bonus, and Spend leverage buttons
- **Gear Roll System** - Roll for acquiring special gear with tags

### Threat Sheet
- Numeric hits (current/max)
- Drive, Tags, and Actions text fields

### Item Sheets
- **Basic Gear** - Icon, name, description
- **Special Gear** - Icon, name, description, 6 tags

### Dice System
- Action dice vs Danger dice mechanics
- Automatic dice cancellation
- Botch, Fail, Partial Success, Success, Boon outcomes
- Dice So Nice integration with chrome cyberpunk dice
- Danger dice from conditions and traumas

### Visual Theme
- Cyberpunk neon aesthetic (cyan, pink, purple)
- Orbitron and Rajdhani fonts
- Styled chat messages for all actions
- Custom pause screen

## Installation

### Method 1: Manifest URL (Recommended)
1. In FoundryVTT, go to **Game Systems** tab
2. Click **Install System**
3. Paste the manifest URL:
   ```
   https://github.com/YOUR_GITHUB_USERNAME/NCO/releases/latest/download/system.json
   ```
4. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from [Releases](https://github.com/YOUR_GITHUB_USERNAME/NCO/releases)
2. Extract the `NCO` folder to `<FoundryVTT Data>/Data/systems/`
3. Restart FoundryVTT

## Usage

1. Create a new World and select **Neon City Overdrive** as the game system
2. Create **Characters** for players
3. Create **Threats** for NPCs and enemies
4. Add **Basic Gear** and **Special Gear** items to characters

### Roll Button
Click the roll button (top right of character sheet) to open the dice dialog:
- Set Action dice count
- Danger dice auto-calculated from conditions + traumas
- Results posted to chat with full breakdown

### Advancement
When a character has 5+ XP, click the Advancement button to:
- Write a new Trademark (max 5)
- Write a new Edge for any Trademark
- Increase Hit maximum (+1, max 4)
- Increase Stunt Point maximum (+1, max 5)

## Credits

- **Neon City Overdrive** by Nathan Russell - [Peril Planet](https://www.perilplanet.com/neon-city-overdrive/)
- FoundryVTT system implementation - YOUR_NAME

## License

This system is released under the MIT License. See [LICENSE](LICENSE) for details.

**Note:** This is an unofficial fan implementation. Please support the official game!
