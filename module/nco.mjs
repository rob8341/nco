/**
 * Neon City Overdrive System for FoundryVTT v13
 */

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log("NCO | Initializing Neon City Overdrive System");

  // Register system namespace
  game.nco = {
    rollDice
  };

  // Register Handlebars helpers first
  registerHandlebarsHelpers();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("NCO", NCOActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "NCO.CharacterSheet"
  });
  Actors.registerSheet("NCO", NCOThreatSheet, {
    types: ["threat"],
    makeDefault: true,
    label: "NCO.ThreatSheet"
  });

  // Register item sheet classes
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("NCO", NCOGearSheet, {
    types: ["gear"],
    makeDefault: true,
    label: "NCO.GearSheet"
  });
  Items.registerSheet("NCO", NCOSpecialGearSheet, {
    types: ["special-gear"],
    makeDefault: true,
    label: "NCO.SpecialGearSheet"
  });

  // Preload Handlebars templates
  await loadTemplates([
    "systems/NCO/templates/actor-sheet.hbs",
    "systems/NCO/templates/threat-sheet.hbs",
    "systems/NCO/templates/gear-sheet.hbs",
    "systems/NCO/templates/special-gear-sheet.hbs"
  ]);

  console.log("NCO | System Initialization Complete");
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("times", function(n, options) {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += options.fn({ index: i });
    }
    return result;
  });

  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper("lt", function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper("add", function(a, b) {
    return parseInt(a) + parseInt(b);
  });

  Handlebars.registerHelper("tristate", function(value) {
    if (value === 1) return "tick";
    if (value === 2) return "cross";
    return "empty";
  });
}

/* -------------------------------------------- */
/*  Actor Sheet                                 */
/* -------------------------------------------- */

class NCOActorSheet extends ActorSheet {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nco", "sheet", "actor", "character"],
      template: "systems/NCO/templates/actor-sheet.hbs",
      width: 720,
      height: 900,
      resizable: false,
      tabs: [],
      scrollY: [".sheet-body"]
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    const actorData = this.actor.toObject(false);
    
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Safely get values with defaults
    const hits = context.system.hits || { value: 0, max: 3 };
    const stuntPoints = context.system.stuntPoints || { value: 0, max: 3 };
    const stash = context.system.stash || { value: 0, max: 5 };
    const drive = context.system.drive || [0,0,0,0,0,0,0,0,0,0];
    const experience = context.system.experience || { value: 0, max: 15 };
    const conditions = context.system.conditions || {};
    
    // Prepare conditions list
    context.conditionsList = [
      { key: "angry", label: "Angry", checked: !!conditions.angry },
      { key: "dazed", label: "Dazed", checked: !!conditions.dazed },
      { key: "exhausted", label: "Exhausted", checked: !!conditions.exhausted },
      { key: "restrained", label: "Restrained", checked: !!conditions.restrained },
      { key: "scared", label: "Scared", checked: !!conditions.scared },
      { key: "weakened", label: "Weakened", checked: !!conditions.weakened }
    ];

    // Prepare checkbox arrays for hits
    const hitsValue = parseInt(hits.value) || 0;
    const hitsMax = parseInt(hits.max) || 3;
    context.hitsArray = [];
    for (let i = 0; i < hitsMax; i++) {
      context.hitsArray.push({ index: i, checked: i < hitsValue });
    }
    // Check if hits are maxed out (at 4)
    context.hitsMaxed = hitsMax >= 4;

    // Prepare checkbox arrays for stunt points
    const stuntValue = parseInt(stuntPoints.value) || 0;
    const stuntMax = parseInt(stuntPoints.max) || 3;
    context.stuntArray = [];
    for (let i = 0; i < stuntMax; i++) {
      context.stuntArray.push({ index: i, checked: i < stuntValue });
    }
    // Prepare locked stunt boxes (show remaining until max 5)
    context.lockedStuntArray = [];
    for (let i = stuntMax; i < 5; i++) {
      context.lockedStuntArray.push({ index: i });
    }

    // Prepare checkbox arrays for stash
    const stashValue = parseInt(stash.value) || 0;
    const stashMax = parseInt(stash.max) || 5;
    context.stashArray = [];
    for (let i = 0; i < stashMax; i++) {
      context.stashArray.push({ index: i, checked: i < stashValue });
    }

    // Prepare drive array
    context.driveArray = [];
    for (let i = 0; i < drive.length; i++) {
      context.driveArray.push({ index: i, state: drive[i] || 0 });
    }

    // Prepare experience blocks (3 blocks of 5)
    const expValue = parseInt(experience.value) || 0;
    context.expBlocks = [];
    for (let block = 0; block < 3; block++) {
      const blockData = { checkboxes: [] };
      for (let i = 0; i < 5; i++) {
        const idx = block * 5 + i;
        blockData.checkboxes.push({ index: idx, checked: idx < expValue });
      }
      context.expBlocks.push(blockData);
    }

    // Count danger dice from conditions (only count boolean true values)
    let conditionDice = 0;
    for (const key of Object.keys(conditions)) {
      if (conditions[key] === true) {
        conditionDice++;
      }
    }
    
    // Count danger dice from filled trauma lines
    const traumasData = context.system.traumas;
    let traumas = [];
    if (Array.isArray(traumasData)) {
      traumas = traumasData;
    } else if (traumasData && typeof traumasData === 'object') {
      // Foundry v13 may store arrays as objects with numeric keys
      traumas = Object.values(traumasData);
    } else {
      traumas = ["", "", "", ""];
    }
    
    let traumaDice = 0;
    for (let i = 0; i < traumas.length; i++) {
      const t = traumas[i];
      if (t && typeof t === "string" && t.trim() !== "") {
        traumaDice++;
      }
    }
    
    context.dangerDice = conditionDice + traumaDice;
    context.conditionDice = conditionDice;
    context.traumaDice = traumaDice;

    // Prepare gear items
    context.gearItems = this.actor.items.filter(i => i.type === "gear");
    
    // Prepare special gear items with filled tags - each tag in its own bracket
    context.specialGearItems = this.actor.items.filter(i => i.type === "special-gear").map(item => {
      const itemData = item.toObject(false);
      // Get tags and filter to only filled ones
      const tagsData = itemData.system?.tags;
      let tags = [];
      if (Array.isArray(tagsData)) {
        tags = tagsData;
      } else if (tagsData && typeof tagsData === 'object') {
        tags = Object.values(tagsData);
      }
      const filledTags = tags.filter(t => t && typeof t === 'string' && t.trim() !== '');
      // Each tag in its own bracket: [tag1] [tag2] [tag3]
      itemData.filledTags = filledTags.map(t => `[${t.trim()}]`).join(' ');
      itemData._id = item._id;
      itemData.img = item.img;
      itemData.name = item.name;
      return itemData;
    });
    
    // Can only add special gear if less than 4
    context.canAddSpecialGear = context.specialGearItems.length < 4;
    
    // Can only add basic gear if less than 20
    context.canAddGear = context.gearItems.length < 20;
    
    // Prepare gear roll counter
    const gearRolls = context.system.gearRolls || { value: 4, max: 4 };
    const gearRollsValue = parseInt(gearRolls.value) || 0;
    const gearRollsMax = parseInt(gearRolls.max) || 4;
    context.gearRollArray = [];
    for (let i = 0; i < gearRollsMax; i++) {
      context.gearRollArray.push({ index: i, checked: i < gearRollsValue });
    }

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Roll button
    html.find(".roll-button").click(this._onRoll.bind(this));

    // Hits checkboxes (only allow checking/taking damage, not unchecking)
    html.find(".hits-checkbox").click(this._onHitsClick.bind(this));

    // Rest button (recover 1 hit)
    html.find(".rest-btn").click(this._onRest.bind(this));

    // Condition checkboxes
    html.find(".condition-checkbox").change(this._onConditionChange.bind(this));

    // Stunt Points checkboxes
    html.find(".stunt-checkbox").click(this._onStuntClick.bind(this));

    // Stash buttons (stash checkboxes are display-only now)
    html.find(".gain-leverage-btn").click(this._onGainLeverage.bind(this));
    html.find(".bonus-leverage-btn").click(this._onBonusLeverage.bind(this));
    html.find(".spend-leverage-btn").click(this._onSpendLeverage.bind(this));

    // Drive tri-state checkboxes
    html.find(".drive-checkbox").click(this._onDriveClick.bind(this));

    // Experience buttons (checkboxes are now display-only)
    html.find(".mark-xp-btn").click(this._onMarkXP.bind(this));
    html.find(".advancement-btn").click(this._onAdvancement.bind(this));

    // Refresh Stunt Points button
    html.find(".refresh-stunt-btn").click(this._onRefreshStunt.bind(this));

    // Bonus Stunt button
    html.find(".bonus-stunt-btn").click(this._onBonusStunt.bind(this));

    // Trauma Roll button
    html.find(".trauma-roll-btn").click(this._onTraumaRoll.bind(this));

    // Recovery Roll button
    html.find(".recovery-roll-btn").click(this._onRecoveryRoll.bind(this));

    // Retire button
    html.find(".retire-btn").click(this._onRetire.bind(this));

    // Gear management
    html.find(".add-gear-btn").click(this._onAddGear.bind(this));
    html.find(".remove-gear-btn-compact").click(this._onRemoveGear.bind(this));
    html.find(".gear-icon-compact").click(this._onGearDescriptionToChat.bind(this));
    html.find(".gear-name-compact").click(this._onOpenGear.bind(this));
    
    // Special gear management
    html.find(".special-gear-icon-compact").click(this._onSpecialGearDescriptionToChat.bind(this));
    html.find(".special-gear-name-compact").click(this._onOpenGear.bind(this));
    
    // Gear roll system
    html.find(".gear-roll-btn").click(this._onGearRoll.bind(this));
    html.find(".reset-gear-roll-btn").click(this._onResetGearRoll.bind(this));
  }

  async _onRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Count danger dice from conditions (only count boolean true values)
      const conditions = this.actor.system.conditions || {};
      let conditionDice = 0;
      for (const key of Object.keys(conditions)) {
        if (conditions[key] === true) {
          conditionDice++;
        }
      }
      
      // Count danger dice from filled trauma lines
const traumasData = this.actor.system.traumas;
let traumas = [];
if (Array.isArray(traumasData)) {
  traumas = traumasData;
} else if (traumasData && typeof traumasData === 'object') {
  // Foundry v13 may store arrays as objects with numeric keys
  traumas = Object.values(traumasData);
} else {
  traumas = ["", "", "", ""];
}

let traumaDice = 0;
for (let i = 0; i < traumas.length; i++) {
  const t = traumas[i];
  if (t && typeof t === "string" && t.trim() !== "") {
    traumaDice++;
  }
}
      
      // Total danger dice
      const totalDangerDice = conditionDice + traumaDice;
    
    const content = `
      <div style="background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
        <div style="margin-bottom:15px">
          <label style="color:#00f5ff;font-weight:bold;display:block;margin-bottom:5px">Action Dice (d6)</label>
          <input type="number" id="nco-action" value="1" min="0" max="20" style="width:80px;padding:8px;background:#1a1a2e;border:2px solid #00f5ff;border-radius:4px;color:#00f5ff;font-size:1.1em;font-weight:bold"/>
        </div>
        <div style="margin-bottom:10px">
          <label style="color:#ff3366;font-weight:bold;display:block;margin-bottom:5px">Danger Dice (d6)</label>
          <input type="number" id="nco-danger" value="${totalDangerDice}" min="0" max="20" style="width:80px;padding:8px;background:#1a0a10;border:2px solid #ff3366;border-radius:4px;color:#ff3366;font-size:1.1em;font-weight:bold"/>
        </div>
        <div style="color:#888;font-size:0.8em;margin-top:10px;padding:8px;background:#111;border-radius:4px;border:1px solid #333">
          <div style="margin-bottom:4px"><span style="color:#ffd000">Conditions:</span> ${conditionDice} dice</div>
          <div><span style="color:#ff3366">Traumas:</span> ${traumaDice} dice</div>
        </div>
      </div>
    `;

    new Dialog({
      title: "Neon City Overdrive — Roll",
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice"></i>',
          label: "Roll",
          callback: async (html) => {
            const actionDice = Math.max(0, parseInt(html.find('#nco-action').val()) || 0);
            const dangerDice = Math.max(0, parseInt(html.find('#nco-danger').val()) || 0);
            await rollDice(actionDice, dangerDice);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "roll"
    }).render(true);
    
    } catch (error) {
      console.error("NCO | Error in _onRoll:", error);
      ui.notifications.error("Roll failed - see console for details");
    }
  }

  async _onHitsClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const idx = parseInt(event.currentTarget.dataset.index) || 0;
    const current = parseInt(this.actor.system.hits?.value) || 0;
    const max = parseInt(this.actor.system.hits?.max) || 3;
    
    // Only allow checking (taking damage), not unchecking
    // Unchecking is only possible via the Rest button
    if (idx >= current) {
      const newVal = idx + 1;
      await this.actor.update({ "system.hits.value": newVal });

      // Send chat message about taking a hit
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      
      // Check if all hit boxes are now full (suffered trauma)
      if (newVal >= max) {
        const html = `
          <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a10 0%,#2a0a15 100%);border:2px solid #ff0000;border-radius:8px;padding:12px;box-shadow:0 0 30px rgba(255,0,0,0.6)">
            <div style="font-size:1.2em;font-weight:bold;color:#ff0000;text-shadow:0 0 15px #ff0000;text-align:center;animation:pulse 1s infinite">
              <i class="fas fa-skull-crossbones" style="margin-right:8px"></i>TRAUMA SUFFERED!
            </div>
            <div style="color:#ff6666;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #ff6666">
              ${this.actor.name} has taken too many hits and suffered a trauma!
            </div>
            <div style="color:#ff3366;text-align:center;margin-top:8px;font-size:0.9em">
              Record a new trauma.
            </div>
          </div>
        `;
        await ChatMessage.create({ user: game.user.id, speaker, content: html });
      } else {
        const html = `
          <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a10 0%,#200a10 100%);border:2px solid #ff3366;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,51,102,0.4)">
            <div style="font-size:1em;font-weight:bold;color:#ff3366;text-shadow:0 0 10px #ff3366;text-align:center">
              <i class="fas fa-heart-broken" style="margin-right:8px"></i>HIT TAKEN!
            </div>
            <div style="color:#ff6666;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #ff6666">
              ${this.actor.name} took a hit!
            </div>
            <div style="color:#888;text-align:center;margin-top:4px;font-size:0.9em">
              Hits: ${newVal}/${max}
            </div>
          </div>
        `;
        await ChatMessage.create({ user: game.user.id, speaker, content: html });
      }
    }
  }

  async _onConditionChange(event) {
    const key = event.currentTarget.dataset.condition;
    const checked = event.currentTarget.checked;
    await this.actor.update({ [`system.conditions.${key}`]: checked });

    // If condition was ticked, send chat message
    if (checked) {
      // Get condition label
      let label = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === "custom") {
        label = this.actor.system.customCondition || "Custom Condition";
      }

      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      const html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a1a0d 0%,#20200a 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,208,0,0.4)">
          <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-align:center">
            <i class="fas fa-exclamation-circle" style="margin-right:8px"></i>CONDITION GAINED
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="color:#ffd000;text-align:center;margin-top:8px;font-size:1.2em;font-weight:bold;text-shadow:0 0 8px #ffd000">
            ${label}
          </div>
        </div>
      `;
      await ChatMessage.create({ user: game.user.id, speaker, content: html });
    }
  }

  async _onStuntClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const idx = parseInt(event.currentTarget.dataset.index) || 0;
    const current = parseInt(this.actor.system.stuntPoints?.value) || 0;
    
    // Only allow unchecking (using stunts), not checking
    // Checking is only possible via the Refresh button
    if (idx < current) {
      const newVal = idx;
      await this.actor.update({ "system.stuntPoints.value": newVal });

      // Send chat message about using a stunt
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      const html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a20 0%,#0d0d1a 100%);border:2px solid #ff00ff;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,0,255,0.4)">
          <div style="font-size:1em;font-weight:bold;color:#ff00ff;text-shadow:0 0 10px #ff00ff;text-align:center">
            <i class="fas fa-bolt" style="margin-right:8px"></i>STUNT USED!
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name} used a stunt!
          </div>
          <div style="color:#888;text-align:center;margin-top:4px;font-size:0.9em">
            Stunt points remaining: ${newVal}/${parseInt(this.actor.system.stuntPoints?.max) || 3}
          </div>
        </div>
      `;
      await ChatMessage.create({ user: game.user.id, speaker, content: html });
    }
  }

  async _onGainLeverage(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const current = parseInt(this.actor.system.stash?.value) || 0;
    const max = parseInt(this.actor.system.stash?.max) || 5;
    
    // Roll d3 (1d6: 1-2=1, 3-4=2, 5-6=3)
    const roll = await (new Roll("1d6")).evaluate({ allowInteractive: false });
    const d6Result = roll.dice[0].results[0].result;
    const d3Result = Math.ceil(d6Result / 2);
    
    // Dice So Nice animation
    if (game.dice3d) {
      roll.dice.forEach(die => {
        die.options.colorset = "nco-action";
        die.options.material = "chrome";
      });
      await game.dice3d.showForRoll(roll, game.user, true);
    }
    
    // Add leverage (cap at max)
    const gained = Math.min(d3Result, max - current);
    const newVal = current + gained;
    await this.actor.update({ "system.stash.value": newVal });
    
    // Send chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a1a0d 0%,#20200a 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,208,0,0.4)">
        <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-align:center">
          <i class="fas fa-dice-d6" style="margin-right:8px"></i>GAIN LEVERAGE
        </div>
        <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name}
        </div>
        <div style="text-align:center;margin-top:10px">
          <span style="display:inline-block;min-width:40px;padding:8px 12px;border-radius:6px;font-weight:700;font-size:1.3em;border:2px solid #ffd000;background:#1a1a0d;color:#ffd000">${d6Result}</span>
          <span style="color:#888;margin:0 8px">→ D3:</span>
          <span style="display:inline-block;min-width:40px;padding:8px 12px;border-radius:6px;font-weight:700;font-size:1.3em;border:2px solid #00ff88;background:#0a1a10;color:#00ff88">${d3Result}</span>
        </div>
        <div style="color:#00ff88;text-align:center;margin-top:10px;font-size:1.1em;font-weight:bold;text-shadow:0 0 8px #00ff88">
          +${gained} Leverage${gained !== d3Result ? ` (capped at max)` : ''}
        </div>
        <div style="color:#888;text-align:center;margin-top:6px;font-size:0.9em">
          Stash: ${newVal}/${max}
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onBonusLeverage(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const current = parseInt(this.actor.system.stash?.value) || 0;
    const max = parseInt(this.actor.system.stash?.max) || 5;
    
    if (current >= max) {
      ui.notifications.warn("Stash is already full!");
      return;
    }
    
    const newVal = current + 1;
    await this.actor.update({ "system.stash.value": newVal });
    
    // Send chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a1a0d 0%,#20200a 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,208,0,0.4)">
        <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-align:center">
          <i class="fas fa-plus" style="margin-right:8px"></i>BONUS LEVERAGE
        </div>
        <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name} received 1 bonus leverage!
        </div>
        <div style="color:#888;text-align:center;margin-top:6px;font-size:0.9em">
          Stash: ${newVal}/${max}
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onSpendLeverage(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const current = parseInt(this.actor.system.stash?.value) || 0;
    
    if (current < 1) {
      ui.notifications.warn("No leverage to spend!");
      return;
    }
    
    // Show dialog with options
    new Dialog({
      title: "Spend Leverage",
      content: `
        <div style="background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ffd000;font-weight:bold;font-size:1.1em;text-align:center;margin-bottom:15px;text-shadow:0 0 10px #ffd000">
            <i class="fas fa-coins" style="margin-right:8px"></i>SPEND LEVERAGE
          </div>
          <div style="color:#e0e0e0;text-align:center;margin-bottom:10px">
            Current Stash: <span style="color:#00f5ff;font-weight:bold">${current}</span>
          </div>
          <div style="color:#888;text-align:center;margin-bottom:15px;font-size:0.9em">
            Each action costs 1 leverage. Choose one:
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button type="button" class="spend-option" data-action="doc" style="padding:10px;background:#0a1a1a;border:1px solid #00f5ff;border-radius:4px;color:#00f5ff;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;height:65px;min-height:65px;max-height:65px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box">
              <div><i class="fas fa-medkit" style="margin-right:8px;color:#00ff88"></i><strong>VISIT A DOC</strong></div>
              <div style="font-size:0.85em;color:#888;margin-top:4px">Seek medical treatment and immediately heal one trauma.</div>
            </button>
            <button type="button" class="spend-option" data-action="dream" style="padding:10px;background:#0a1a1a;border:1px solid #9900ff;border-radius:4px;color:#9900ff;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;height:65px;min-height:65px;max-height:65px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box">
              <div><i class="fas fa-star" style="margin-right:8px;color:#ff00ff"></i><strong>CHASE A DREAM</strong></div>
              <div style="font-size:0.85em;color:#888;margin-top:4px">Work towards a drive. Tick one drive track box.</div>
            </button>
            <button type="button" class="spend-option" data-action="train" style="padding:10px;background:#0a1a1a;border:1px solid #ffd000;border-radius:4px;color:#ffd000;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;height:65px;min-height:65px;max-height:65px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box">
              <div><i class="fas fa-dumbbell" style="margin-right:8px;color:#ffd000"></i><strong>TRAIN</strong></div>
              <div style="font-size:0.85em;color:#888;margin-top:4px">Improve yourself. Mark +1 Experience!</div>
            </button>
          </div>
        </div>
      `,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      render: (html) => {
        html.find(".spend-option").click(async (ev) => {
          const action = ev.currentTarget.dataset.action;
          await this._executeSpendLeverage(action);
          // Close the dialog
          html.closest(".app").find(".header-button.close").click();
        });
      },
      default: "cancel"
    }).render(true);
  }

  async _executeSpendLeverage(action) {
    const current = parseInt(this.actor.system.stash?.value) || 0;
    const max = parseInt(this.actor.system.stash?.max) || 5;
    
    if (current < 1) {
      ui.notifications.warn("No leverage to spend!");
      return;
    }
    
    // Deduct 1 leverage
    const newStash = current - 1;
    await this.actor.update({ "system.stash.value": newStash });
    
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    let actionTitle, actionIcon, actionColor, actionDesc, additionalUpdate;
    
    switch (action) {
      case "doc":
        actionTitle = "VISIT A DOC";
        actionIcon = "fa-medkit";
        actionColor = "#00ff88";
        actionDesc = "seeks medical treatment and heals one trauma.";
        // Note: Player needs to manually clear a trauma line
        break;
      case "dream":
        actionTitle = "CHASE A DREAM";
        actionIcon = "fa-star";
        actionColor = "#ff00ff";
        actionDesc = "works towards their drive and ticks one drive track box.";
        // Note: Player needs to manually tick a drive box
        break;
      case "train":
        actionTitle = "TRAIN";
        actionIcon = "fa-dumbbell";
        actionColor = "#ffd000";
        actionDesc = "improves themselves and gains +1 experience point.";
        // Add 1 XP
        const currentExp = parseInt(this.actor.system.experience?.value) || 0;
        const maxExp = parseInt(this.actor.system.experience?.max) || 15;
        if (currentExp < maxExp) {
          await this.actor.update({ "system.experience.value": currentExp + 1 });
        }
        break;
    }
    
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid ${actionColor};border-radius:8px;padding:12px;box-shadow:0 0 20px ${actionColor}40">
        <div style="font-size:1em;font-weight:bold;color:${actionColor};text-shadow:0 0 10px ${actionColor};text-align:center">
          <i class="fas ${actionIcon}" style="margin-right:8px"></i>${actionTitle}
        </div>
        <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name}
        </div>
        <div style="color:#e0e0e0;text-align:center;margin-top:8px">
          ${this.actor.name} ${actionDesc}
        </div>
        <div style="color:#ffd000;text-align:center;margin-top:8px;font-size:0.9em">
          <i class="fas fa-coins" style="margin-right:4px"></i>-1 Leverage (Stash: ${newStash}/${max})
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onDriveClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const idx = parseInt(event.currentTarget.dataset.index) || 0;
    const drive = this.actor.system.drive || [0,0,0,0,0,0,0,0,0,0];
    const current = parseInt(drive[idx]) || 0;
    const newState = (current + 1) % 3;
    const newDrive = [...drive];
    newDrive[idx] = newState;
    await this.actor.update({ "system.drive": newDrive });
  }

  async _onMarkXP(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const current = parseInt(this.actor.system.experience?.value) || 0;
    const max = parseInt(this.actor.system.experience?.max) || 15;
    
    if (current >= max) {
      ui.notifications.warn("Experience is already at maximum!");
      return;
    }
    
    const newVal = current + 1;
    await this.actor.update({ "system.experience.value": newVal });
    
    // Send chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a1a0d 0%,#20200a 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,208,0,0.4)">
        <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-align:center">
          <i class="fas fa-plus" style="margin-right:8px"></i>EXPERIENCE GAINED
        </div>
        <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name} gained 1 experience point!
        </div>
        <div style="color:#888;text-align:center;margin-top:4px;font-size:0.9em">
          Experience: ${newVal}/${max}
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onAdvancement(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const currentXP = parseInt(this.actor.system.experience?.value) || 0;
    const currentHitsMax = parseInt(this.actor.system.hits?.max) || 3;
    const currentStuntMax = parseInt(this.actor.system.stuntPoints?.max) || 3;
    
    if (currentXP < 5) {
      ui.notifications.warn(`Not enough experience! Need 5 XP, have ${currentXP}.`);
      return;
    }
    
    // Build options list
    let optionsHtml = '';
    
    // Option 1: New trademark (max 5) - always available as player fills them
    optionsHtml += `
      <button type="button" class="advancement-option" data-choice="trademark" style="padding:10px;background:#0a1a1a;border:1px solid #00f5ff;border-radius:4px;color:#00f5ff;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;width:100%;margin-bottom:6px">
        <i class="fas fa-tag" style="margin-right:8px;color:#00f5ff"></i><strong>Write a new Trademark</strong><br>
        <span style="font-size:0.85em;color:#888">Add a new trademark (to a maximum of 5)</span>
      </button>
    `;
    
    // Option 2: New edge - always available
    optionsHtml += `
      <button type="button" class="advancement-option" data-choice="edge" style="padding:10px;background:#0a1a1a;border:1px solid #ffd000;border-radius:4px;color:#ffd000;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;width:100%;margin-bottom:6px">
        <i class="fas fa-plus-circle" style="margin-right:8px;color:#ffd000"></i><strong>Write a new Edge</strong><br>
        <span style="font-size:0.85em;color:#888">Add an edge to any trademark</span>
      </button>
    `;
    
    // Option 3: Increase hits (max 4)
    if (currentHitsMax < 4) {
      optionsHtml += `
        <button type="button" class="advancement-option" data-choice="hits" style="padding:10px;background:#0a1a1a;border:1px solid #ff3366;border-radius:4px;color:#ff3366;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;width:100%;margin-bottom:6px">
          <i class="fas fa-heart" style="margin-right:8px;color:#ff3366"></i><strong>Increase Hit Maximum</strong><br>
          <span style="font-size:0.85em;color:#888">Current: ${currentHitsMax}/4 - Unlock the 4th hit box</span>
        </button>
      `;
    } else {
      optionsHtml += `
        <button type="button" disabled style="padding:10px;background:#111;border:1px solid #444;border-radius:4px;color:#666;text-align:left;font-family:'Rajdhani',sans-serif;width:100%;margin-bottom:6px;cursor:not-allowed">
          <i class="fas fa-heart" style="margin-right:8px"></i><strong>Increase Hit Maximum</strong><br>
          <span style="font-size:0.85em;color:#555">Already at maximum (4/4)</span>
        </button>
      `;
    }
    
    // Option 4: Increase stunt points (max 5)
    if (currentStuntMax < 5) {
      optionsHtml += `
        <button type="button" class="advancement-option" data-choice="stunts" style="padding:10px;background:#0a1a1a;border:1px solid #00ff88;border-radius:4px;color:#00ff88;cursor:pointer;text-align:left;font-family:'Rajdhani',sans-serif;width:100%">
          <i class="fas fa-bolt" style="margin-right:8px;color:#00ff88"></i><strong>Increase Stunt Point Maximum</strong><br>
          <span style="font-size:0.85em;color:#888">Current: ${currentStuntMax}/5 - Unlock another stunt point</span>
        </button>
      `;
    } else {
      optionsHtml += `
        <button type="button" disabled style="padding:10px;background:#111;border:1px solid #444;border-radius:4px;color:#666;text-align:left;font-family:'Rajdhani',sans-serif;width:100%;cursor:not-allowed">
          <i class="fas fa-bolt" style="margin-right:8px"></i><strong>Increase Stunt Point Maximum</strong><br>
          <span style="font-size:0.85em;color:#555">Already at maximum (5/5)</span>
        </button>
      `;
    }
    
    new Dialog({
      title: "Advancement",
      content: `
        <div style="background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ff00ff;font-weight:bold;font-size:1.1em;text-align:center;margin-bottom:15px;text-shadow:0 0 10px #ff00ff">
            <i class="fas fa-arrow-up" style="margin-right:8px"></i>ADVANCEMENT
          </div>
          <div style="color:#e0e0e0;text-align:center;margin-bottom:10px">
            Spend <span style="color:#ffd000;font-weight:bold">5 XP</span> to advance.
          </div>
          <div style="color:#888;text-align:center;margin-bottom:15px;font-size:0.9em">
            Current XP: <span style="color:#00f5ff;font-weight:bold">${currentXP}</span>
          </div>
          <div style="display:flex;flex-direction:column">
            ${optionsHtml}
          </div>
        </div>
      `,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      render: (html) => {
        html.find(".advancement-option").click(async (ev) => {
          const choice = ev.currentTarget.dataset.choice;
          await this._executeAdvancement(choice);
          // Close the dialog
          html.closest(".app").find(".header-button.close").click();
        });
      },
      default: "cancel"
    }).render(true);
  }

  async _executeAdvancement(choice) {
    const currentXP = parseInt(this.actor.system.experience?.value) || 0;
    const currentHitsMax = parseInt(this.actor.system.hits?.max) || 3;
    const currentStuntMax = parseInt(this.actor.system.stuntPoints?.max) || 3;
    
    if (currentXP < 5) {
      ui.notifications.warn("Not enough experience!");
      return;
    }
    
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    let advancementTitle, advancementIcon, advancementColor, advancementDesc, updates;
    
    switch (choice) {
      case "trademark":
        advancementTitle = "NEW TRADEMARK";
        advancementIcon = "fa-tag";
        advancementColor = "#00f5ff";
        advancementDesc = "can now write a new trademark (max 5).";
        updates = { "system.experience.value": currentXP - 5 };
        break;
        
      case "edge":
        advancementTitle = "NEW EDGE";
        advancementIcon = "fa-plus-circle";
        advancementColor = "#ffd000";
        advancementDesc = "can now write a new edge for any trademark.";
        updates = { "system.experience.value": currentXP - 5 };
        break;
        
      case "hits":
        if (currentHitsMax >= 4) {
          ui.notifications.warn("Hit maximum is already at 4!");
          return;
        }
        advancementTitle = "HIT MAXIMUM INCREASED";
        advancementIcon = "fa-heart";
        advancementColor = "#ff3366";
        advancementDesc = `increased their hit maximum to ${currentHitsMax + 1}!`;
        updates = { 
          "system.experience.value": currentXP - 5,
          "system.hits.max": currentHitsMax + 1
        };
        break;
        
      case "stunts":
        if (currentStuntMax >= 5) {
          ui.notifications.warn("Stunt point maximum is already at 5!");
          return;
        }
        advancementTitle = "STUNT MAXIMUM INCREASED";
        advancementIcon = "fa-bolt";
        advancementColor = "#00ff88";
        advancementDesc = `increased their stunt point maximum to ${currentStuntMax + 1}!`;
        updates = { 
          "system.experience.value": currentXP - 5,
          "system.stuntPoints.max": currentStuntMax + 1
        };
        break;
        
      default:
        return;
    }
    
    await this.actor.update(updates);
    
    const newXP = currentXP - 5;
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a20 0%,#0d0d1a 100%);border:2px solid ${advancementColor};border-radius:8px;padding:12px;box-shadow:0 0 25px ${advancementColor}40">
        <div style="font-size:1.1em;font-weight:bold;color:#ff00ff;text-shadow:0 0 15px #ff00ff;text-align:center">
          <i class="fas fa-arrow-up" style="margin-right:8px"></i>ADVANCEMENT
        </div>
        <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name}
        </div>
        <div style="font-size:1em;font-weight:bold;color:${advancementColor};text-shadow:0 0 10px ${advancementColor};text-align:center;margin-top:12px">
          <i class="fas ${advancementIcon}" style="margin-right:8px"></i>${advancementTitle}
        </div>
        <div style="color:#e0e0e0;text-align:center;margin-top:8px">
          ${this.actor.name} ${advancementDesc}
        </div>
        <div style="color:#ffd000;text-align:center;margin-top:10px;font-size:0.9em">
          <i class="fas fa-minus" style="margin-right:4px"></i>-5 XP (Remaining: ${newXP})
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onRefreshStunt(event) {
    event.preventDefault();
    event.stopPropagation();
    const max = parseInt(this.actor.system.stuntPoints?.max) || 3;
    await this.actor.update({ "system.stuntPoints.value": max });

    // Send chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid #00f5ff;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(0,245,255,0.3)">
        <div style="font-size:1em;font-weight:bold;color:#00f5ff;text-shadow:0 0 10px #00f5ff;text-align:center">
          <i class="fas fa-sync-alt" style="margin-right:8px"></i>STUNT POOL REFRESHED
        </div>
        <div style="color:#00ff88;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00ff88">
          ${this.actor.name} refreshed their stunt points to ${max}!
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onBonusStunt(event) {
    event.preventDefault();
    event.stopPropagation();
    const current = parseInt(this.actor.system.stuntPoints?.value) || 0;
    const max = parseInt(this.actor.system.stuntPoints?.max) || 3;
    
    // Only add if not already at max
    if (current < max) {
      const newVal = current + 1;
      await this.actor.update({ "system.stuntPoints.value": newVal });

      // Send chat message
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      const html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a1a0d 0%,#20200a 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(255,208,0,0.4)">
          <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-align:center">
            <i class="fas fa-plus" style="margin-right:8px"></i>BONUS STUNT
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name} received a bonus stunt point!
          </div>
          <div style="color:#888;text-align:center;margin-top:4px;font-size:0.9em">
            Stunt points: ${newVal}/${max}
          </div>
        </div>
      `;
      await ChatMessage.create({ user: game.user.id, speaker, content: html });
    } else {
      ui.notifications.warn("Stunt points already at maximum!");
    }
  }

  async _onRest(event) {
    event.preventDefault();
    event.stopPropagation();
    const current = parseInt(this.actor.system.hits?.value) || 0;
    const max = parseInt(this.actor.system.hits?.max) || 3;
    
    // Only rest if there are hits to recover
    if (current > 0) {
      const newVal = current - 1;
      await this.actor.update({ "system.hits.value": newVal });

      // Send chat message about recovering
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      const html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d1a0d 0%,#0a200a 100%);border:2px solid #00ff88;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(0,255,136,0.4)">
          <div style="font-size:1em;font-weight:bold;color:#00ff88;text-shadow:0 0 10px #00ff88;text-align:center">
            <i class="fas fa-bed" style="margin-right:8px"></i>REST
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name} recovered from 1 hit!
          </div>
          <div style="color:#888;text-align:center;margin-top:4px;font-size:0.9em">
            Hits remaining: ${newVal}/${max}
          </div>
        </div>
      `;
      await ChatMessage.create({ user: game.user.id, speaker, content: html });
    }
  }

  async _onTraumaRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });

    // Roll the trauma die
    const traumaRoll = await (new Roll("1d6")).evaluate({ allowInteractive: false });
    const traumaResult = traumaRoll.dice[0].results[0].result;

    // Dice So Nice animation
    if (game.dice3d) {
      traumaRoll.dice.forEach(die => {
        die.options.colorset = "nco-danger";
        die.options.material = "chrome";
      });
      await game.dice3d.showForRoll(traumaRoll, game.user, true);
    }

    let html;
    if (traumaResult === 1) {
      // Deadly result - roll for turns until death
      const deathRoll = await (new Roll("1d6")).evaluate({ allowInteractive: false });
      const turnsUntilDeath = deathRoll.dice[0].results[0].result;

      // Dice So Nice animation for death roll
      if (game.dice3d) {
        deathRoll.dice.forEach(die => {
          die.options.colorset = "nco-danger";
          die.options.material = "chrome";
        });
        await game.dice3d.showForRoll(deathRoll, game.user, true);
      }

      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0000 0%,#2a0505 100%);border:3px solid #ff0000;border-radius:8px;padding:15px;box-shadow:0 0 40px rgba(255,0,0,0.8)">
          <div style="font-size:1.3em;font-weight:bold;color:#ff0000;text-shadow:0 0 20px #ff0000;text-align:center">
            <i class="fas fa-skull" style="margin-right:8px"></i>TRAUMA ROLL<i class="fas fa-skull" style="margin-left:8px"></i>
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:10px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:15px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:3px solid #ff0000;background:#1a0000;color:#ff0000;box-shadow:0 0 20px #ff0000">${traumaResult}</span>
          </div>
          <div style="color:#ff0000;text-align:center;margin-top:15px;font-size:1.4em;font-weight:bold;text-shadow:0 0 15px #ff0000">
            ☠️ DYING! ☠️
          </div>
          <div style="color:#ff6666;text-align:center;margin-top:10px;font-size:1.1em">
            ${this.actor.name} is dying in <span style="color:#ff0000;font-weight:bold;font-size:1.3em">${turnsUntilDeath}</span> turn${turnsUntilDeath === 1 ? '' : 's'}!
          </div>
          <div style="color:#888;text-align:center;margin-top:8px;font-size:0.85em">
            (Death timer roll: ${turnsUntilDeath})
          </div>
        </div>
      `;
    } else {
      // Survived this time
      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid #ff3366;border-radius:8px;padding:15px;box-shadow:0 0 20px rgba(255,51,102,0.4)">
          <div style="font-size:1.2em;font-weight:bold;color:#ff3366;text-shadow:0 0 10px #ff3366;text-align:center">
            <i class="fas fa-skull" style="margin-right:8px"></i>TRAUMA ROLL
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:12px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #ff3366;background:#1a0a10;color:#ff3366">${traumaResult}</span>
          </div>
          <div style="color:#00ff88;text-align:center;margin-top:12px;font-size:1.2em;font-weight:bold;text-shadow:0 0 10px #00ff88">
            ✓ Still standing...
          </div>
          <div style="color:#888;text-align:center;margin-top:6px;font-size:0.9em">
            Death awaits another day.
          </div>
        </div>
      `;
    }

    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onRecoveryRoll(event) {
    event.preventDefault();
    event.stopPropagation();

    // Combined confirmation and modifier dialog
    new Dialog({
      title: "Recovery Roll",
      content: `
        <div style="background:linear-gradient(135deg,#1a0a10 0%,#0d0d1a 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ff3366;font-weight:bold;font-size:1.1em;text-align:center;margin-bottom:15px;text-shadow:0 0 10px #ff3366">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>WARNING
          </div>
          <div style="color:#e0e0e0;text-align:center;margin-bottom:15px">
            Attempt trauma recovery for <span style="color:#00f5ff;font-weight:bold">${this.actor.name}</span>?
          </div>
          <div style="color:#ff6666;text-align:center;margin-bottom:15px;padding:10px;background:#1a0505;border-radius:6px;border:1px solid #ff3366">
            <i class="fas fa-times-circle" style="margin-right:6px"></i>
            This requires crossing out one drive box in exchange for the attempt!
          </div>
          <div style="color:#888;font-size:0.9em;text-align:center;margin-bottom:15px">
            Roll d6: On 4+ the trauma is healed. Otherwise, you've wasted time and resources.
          </div>
          <hr style="border:none;border-top:1px solid #444;margin:15px 0">
          <div style="margin-bottom:10px">
            <label style="color:#00f5ff;font-weight:bold;display:block;margin-bottom:5px">Modifier (+ or -):</label>
            <input type="number" id="nco-recovery-mod" value="0" style="width:80px;padding:8px;background:#1a1a2e;border:2px solid #00f5ff;border-radius:4px;color:#00f5ff;font-size:1.1em;font-weight:bold"/>
          </div>
          <div style="color:#666;font-size:0.8em;text-align:center">
            (Any applicable bonuses from edges, gear, etc.)
          </div>
        </div>
      `,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-dice-d6"></i>',
          label: "Roll Recovery",
          callback: async (html) => {
            const modifier = parseInt(html.find('#nco-recovery-mod').val()) || 0;
            await this._executeRecoveryRoll(modifier);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cancel"
    }).render(true);
  }

  async _executeRecoveryRoll(modifier) {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });

    // Roll the recovery die
    const roll = await (new Roll("1d6")).evaluate({ allowInteractive: false });
    const dieResult = roll.dice[0].results[0].result;
    const totalResult = dieResult + modifier;

    // Dice So Nice animation
    if (game.dice3d) {
      roll.dice.forEach(die => {
        die.options.colorset = "nco-action";
        die.options.material = "chrome";
      });
      await game.dice3d.showForRoll(roll, game.user, true);
    }

    const success = totalResult >= 4;
    let html;

    if (success) {
      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0a1a10 0%,#0d200d 100%);border:2px solid #00ff88;border-radius:8px;padding:15px;box-shadow:0 0 25px rgba(0,255,136,0.5)">
          <div style="font-size:1.2em;font-weight:bold;color:#00ff88;text-shadow:0 0 15px #00ff88;text-align:center">
            <i class="fas fa-heart" style="margin-right:8px"></i>RECOVERY ROLL
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:15px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #00ff88;background:#0a1a10;color:#00ff88;box-shadow:0 0 15px #00ff88">${dieResult}</span>
            ${modifier !== 0 ? `<span style="color:#888;margin:0 8px">${modifier >= 0 ? '+' : ''}${modifier} =</span><span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #00ff88;background:#0a1a10;color:#00ff88">${totalResult}</span>` : ''}
          </div>
          <div style="color:#00ff88;text-align:center;margin-top:15px;font-size:1.3em;font-weight:bold;text-shadow:0 0 15px #00ff88">
            ✓ TRAUMA HEALED!
          </div>
          <div style="color:#88ffaa;text-align:center;margin-top:8px">
            ${this.actor.name} has recovered from a trauma.
          </div>
          <div style="color:#ff6666;text-align:center;margin-top:10px;font-size:0.9em;padding:8px;background:#1a0505;border-radius:4px;border:1px solid #ff3366">
            <i class="fas fa-times-circle" style="margin-right:6px"></i>
            Cross out one drive box and clear a trauma line.
          </div>
        </div>
      `;
    } else {
      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a10 0%,#200a0a 100%);border:2px solid #ff3366;border-radius:8px;padding:15px;box-shadow:0 0 20px rgba(255,51,102,0.4)">
          <div style="font-size:1.2em;font-weight:bold;color:#ff3366;text-shadow:0 0 10px #ff3366;text-align:center">
            <i class="fas fa-heart-broken" style="margin-right:8px"></i>RECOVERY ROLL
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:15px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #ff3366;background:#1a0a10;color:#ff3366">${dieResult}</span>
            ${modifier !== 0 ? `<span style="color:#888;margin:0 8px">${modifier >= 0 ? '+' : ''}${modifier} =</span><span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #ff3366;background:#1a0a10;color:#ff3366">${totalResult}</span>` : ''}
          </div>
          <div style="color:#ff3366;text-align:center;margin-top:15px;font-size:1.3em;font-weight:bold;text-shadow:0 0 10px #ff3366">
            ✗ RECOVERY FAILED
          </div>
          <div style="color:#ff9999;text-align:center;margin-top:8px">
            ${this.actor.name} wasted time and resources trying to recover, but the trauma remains.
          </div>
          <div style="color:#ff6666;text-align:center;margin-top:10px;font-size:0.9em;padding:8px;background:#1a0505;border-radius:4px;border:1px solid #ff3366">
            <i class="fas fa-times-circle" style="margin-right:6px"></i>
            Cross out one drive box. The trauma is NOT healed.
          </div>
        </div>
      `;
    }

    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onRetire(event) {
    event.preventDefault();
    event.stopPropagation();

    // Count ticked drive boxes (state === 1)
    const drive = this.actor.system.drive || [0,0,0,0,0,0,0,0,0,0];
    let tickedDrive = 0;
    for (let i = 0; i < drive.length; i++) {
      if (drive[i] === 1) {
        tickedDrive++;
      }
    }
    
    const actionDice = tickedDrive;
    const dangerDice = 10 - tickedDrive;

    // Confirmation dialog
    new Dialog({
      title: "Retire Character",
      content: `
        <div style="background:linear-gradient(135deg,#1a0a20 0%,#0d0d1a 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ff3366;font-weight:bold;font-size:1.2em;text-align:center;margin-bottom:15px;text-shadow:0 0 10px #ff3366">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>WARNING
          </div>
          <div style="color:#e0e0e0;text-align:center;margin-bottom:15px">
            Are you sure you want to retire <span style="color:#00f5ff;font-weight:bold">${this.actor.name}</span>?
          </div>
          <div style="color:#888;font-size:0.9em;text-align:center;margin-bottom:10px">
            This will make a retirement roll with:
          </div>
          <div style="display:flex;justify-content:center;gap:20px;margin-bottom:10px">
            <div style="text-align:center">
              <div style="color:#00f5ff;font-size:1.5em;font-weight:bold">${actionDice}</div>
              <div style="color:#00f5ff;font-size:0.8em">Action Dice</div>
              <div style="color:#666;font-size:0.7em">(ticked drive)</div>
            </div>
            <div style="text-align:center">
              <div style="color:#ff3366;font-size:1.5em;font-weight:bold">${dangerDice}</div>
              <div style="color:#ff3366;font-size:0.8em">Danger Dice</div>
              <div style="color:#666;font-size:0.7em">(10 - ticked)</div>
            </div>
          </div>
        </div>
      `,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-door-open"></i>',
          label: "Retire",
          callback: async () => {
            await this._executeRetirement(actionDice, dangerDice);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cancel"
    }).render(true);
  }

  async _executeRetirement(actionDice, dangerDice) {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const a = Math.max(0, actionDice);
    const d = Math.max(0, dangerDice);

    // === Rolls ===
    const rA = a ? await (new Roll(`${a}d6`)).evaluate({ allowInteractive: false }) : null;
    const rD = d ? await (new Roll(`${d}d6`)).evaluate({ allowInteractive: false }) : null;

    // Dice So Nice - Chrome dice with neon glow
    if (game.dice3d) {
      const shows = [];
      if (rA) {
        rA.dice.forEach(die => {
          die.options.colorset = "nco-action";
          die.options.material = "chrome";
        });
        shows.push(game.dice3d.showForRoll(rA, game.user, true));
      }
      if (rD) {
        rD.dice.forEach(die => {
          die.options.colorset = "nco-danger";
          die.options.material = "chrome";
        });
        shows.push(game.dice3d.showForRoll(rD, game.user, true));
      }
      await Promise.all(shows);
    }

    const getResults = r => r?.dice?.[0]?.results?.map(r => r.result) ?? [];
    const A = getResults(rA), D = getResults(rD);
    const canc = [], Arem = [...A], Drem = [...D];

    // === Cancel matching dice ===
    for (const v of D) {
      const i = Arem.indexOf(v);
      if (i !== -1) {
        canc.push(v);
        Arem.splice(i, 1);
        Drem.splice(Drem.indexOf(v), 1);
      }
    }

    const high = Arem.length ? Math.max(...Arem) : null;
    const botch = !Arem.length || (Arem.length === 1 && Arem[0] === 1);
    const sixes = A.filter(x => x === 6).length;
    const boons = !botch && high === 6 ? Math.max(0, sixes - 1) : 0;

    // Determine retirement outcome
    let outcomeTitle, outcomeColor, outcomeText, outcomeDesc;
    
    if (botch) {
      outcomeTitle = "💥 CATASTROPHIC FAILURE";
      outcomeColor = "#ff0000";
      outcomeText = "You fail and make things worse for everyone who has ever known you.";
      outcomeDesc = `
        <div style="color:#ff6666;margin-top:10px;padding:10px;background:#1a0505;border-radius:6px;border:1px solid #ff3366">
          <p>Describe how things went so wrong and what becomes of the character.</p>
          <p style="color:#ff0000;font-weight:bold;margin-top:8px">⚠️ All other characters must cross off one drive box, representing time and resources wasted in the fallout from your failure.</p>
        </div>
      `;
    } else if (high <= 3) {
      outcomeTitle = "❌ FAILURE";
      outcomeColor = "#ff3366";
      outcomeText = "You try but fail, finding your goal just beyond your grasp.";
      outcomeDesc = `
        <div style="color:#ff9999;margin-top:10px;padding:10px;background:#1a0a10;border-radius:6px;border:1px solid #ff3366">
          <p>Describe what happens. What becomes of the character after this?</p>
          <p style="margin-top:8px">What about their family, friends and enemies?</p>
        </div>
      `;
    } else if (high <= 5) {
      outcomeTitle = "➖ BITTERSWEET SUCCESS";
      outcomeColor = "#ffd000";
      outcomeText = "You achieve your drive but it cost you something.";
      outcomeDesc = `
        <div style="color:#ffe066;margin-top:10px;padding:10px;background:#1a1500;border-radius:6px;border:1px solid #ffd000">
          <p>Describe the compromise you make or cost you pay to finally achieve your goal.</p>
          <p style="margin-top:8px">Describe what becomes of the character.</p>
        </div>
      `;
    } else {
      outcomeTitle = "✅ COMPLETE SUCCESS";
      outcomeColor = "#00ff88";
      outcomeText = "You complete your drive and get out of the life.";
      outcomeDesc = `
        <div style="color:#88ffaa;margin-top:10px;padding:10px;background:#0a1a10;border-radius:6px;border:1px solid #00ff88">
          <p>Describe how and what becomes of the character.</p>
          ${boons > 0 ? `
            <p style="color:#ff00ff;font-weight:bold;margin-top:8px;text-shadow:0 0 8px #ff00ff">
              ✨ Boons: ${boons}
            </p>
            <p style="color:#ff99ff;margin-top:4px">Boons represent unforeseen windfalls that you can bestow on allies. Each boon counts as a point of leverage that you can give to any player(s).</p>
          ` : ''}
        </div>
      `;
    }

    // === Chip helper for dice display ===
    const chip = (v, t, o = {}) => {
      const base = "display:inline-block;min-width:28px;padding:4px 8px;margin:2px;border-radius:6px;font-weight:700;text-align:center;font-family:'Orbitron',monospace;";
      if (o.cancel) {
        return `<span style="${base}opacity:.6;border:2px solid #ff3366;background:#1a0a10;color:#ff3366;text-decoration:line-through">${v}</span>`;
      }
      if (o.hl) {
        return `<span style="${base}border:2px solid #00f5ff;background:#0a1a1a;color:#00f5ff;box-shadow:0 0 10px #00f5ff">${v}</span>`;
      }
      const c = t === "a" ? "#00f5ff" : "#ff3366";
      const b = t === "a" ? "#00f5ff" : "#ff3366";
      const bg = t === "a" ? "#0a1a1a" : "#1a0a10";
      return `<span style="${base}border:1px solid ${b};background:${bg};color:${c}">${v}</span>`;
    };

    const block = (title, arr, t, hl) => `
      <div style="margin:6px 0">
        <strong style="color:#b0b0b0;font-size:0.85em">${title}</strong>
        <div style="margin-top:3px">${
          arr.length ? arr.map(v => chip(v, t, { hl: hl && v === high })).join("") : '<span style="color:#666">(none)</span>'
        }</div>
      </div>`;

    // === Build Chat Output ===
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a20 0%,#0d0d1a 100%);border:3px solid #9900ff;border-radius:8px;padding:15px;box-shadow:0 0 30px rgba(153,0,255,0.5)">
        <div style="font-size:1.3em;font-weight:bold;color:#9900ff;text-shadow:0 0 15px #9900ff;text-align:center;margin-bottom:8px">
          <i class="fas fa-door-open" style="margin-right:8px"></i>RETIREMENT ROLL
        </div>
        <div style="color:#00f5ff;text-align:center;font-size:1.1em;margin-bottom:10px;text-shadow:0 0 8px #00f5ff">
          ${this.actor.name}
        </div>
        <hr style="border:none;border-top:1px solid #444;margin:10px 0">
        ${block(`Action Dice (${a}d6)`, A, "a", true)}
        ${block(`Danger Dice (${d}d6)`, D, "d")}
        <hr style="border:none;border-top:1px solid #444;margin:8px 0">
        <div style="margin:6px 0">
          <strong style="color:#b0b0b0;font-size:0.85em">Cancelled:</strong>
          <div style="margin-top:3px">${canc.length ? canc.map(v => chip(v, "a", { cancel: true })).join("") : '<span style="color:#666">None</span>'}</div>
        </div>
        ${block("Remaining Action", Arem, "a", true)}
        ${block("Remaining Danger", Drem, "d")}
        <hr style="border:none;border-top:1px solid #444;margin:10px 0">
        <div style="font-size:1.3em;font-weight:bold;color:${outcomeColor};background:linear-gradient(135deg,#0a0a0a 0%,#1a0a1a 100%);border:2px solid ${outcomeColor};border-radius:6px;padding:12px;text-align:center;text-shadow:0 0 15px ${outcomeColor}">
          ${outcomeTitle}
          ${high ? `<div style="font-size:0.7em;color:#888;margin-top:4px">(highest remaining = ${high})</div>` : ''}
        </div>
        <div style="color:#e0e0e0;text-align:center;margin-top:12px;font-size:1em">
          ${outcomeText}
        </div>
        ${outcomeDesc}
      </div>
    `;

    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onAddGear(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const type = event.currentTarget.dataset.type;
    
    // Check basic gear limit (max 20)
    if (type === "gear") {
      const gearCount = this.actor.items.filter(i => i.type === "gear").length;
      if (gearCount >= 20) {
        ui.notifications.warn("Maximum 20 basic gear items allowed!");
        return;
      }
    }
    
    // Check special gear limit (max 4)
    if (type === "special-gear") {
      const specialGearCount = this.actor.items.filter(i => i.type === "special-gear").length;
      if (specialGearCount >= 4) {
        ui.notifications.warn("Maximum 4 special gear items allowed!");
        return;
      }
    }
    
    const itemData = {
      name: type === "gear" ? "New Gear" : "New Special Gear",
      type: type,
      img: "icons/svg/item-bag.svg"
    };
    
    const created = await Item.create(itemData, { parent: this.actor });
    if (created) {
      created.sheet.render(true);
    }
  }

  async _onRemoveGear(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    // Confirmation dialog
    new Dialog({
      title: "Remove Item",
      content: `
        <div style="background:linear-gradient(135deg,#1a0a10 0%,#0d0d1a 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ff3366;font-weight:bold;text-align:center;margin-bottom:10px">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>CONFIRM REMOVAL
          </div>
          <div style="color:#e0e0e0;text-align:center">
            Remove <span style="color:#00f5ff;font-weight:bold">${item.name}</span>?
          </div>
        </div>
      `,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Remove",
          callback: async () => {
            await item.delete();
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cancel"
    }).render(true);
  }

  async _onOpenGear(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (item) {
      item.sheet.render(true);
    }
  }

  async _onGearDescriptionToChat(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    const description = item.system.description || "No description.";
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a1a25 100%);border:2px solid #00f5ff;border-radius:8px;padding:12px;box-shadow:0 0 15px rgba(0,245,255,0.3)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #333">
          <img src="${item.img}" style="width:36px;height:36px;border:2px solid #00f5ff;object-fit:cover"/>
          <div>
            <div style="font-size:1em;font-weight:bold;color:#00f5ff;text-shadow:0 0 10px #00f5ff;text-transform:uppercase;letter-spacing:2px">
              ${item.name}
            </div>
            <div style="font-size:0.75em;color:#888;text-transform:uppercase">Gear</div>
          </div>
        </div>
        <div style="color:#e0e0e0;font-family:'Rajdhani',sans-serif;font-size:0.95em;line-height:1.5">
          ${description}
        </div>
        <div style="color:#666;font-size:0.8em;margin-top:8px;font-style:italic">
          — ${this.actor.name}
        </div>
      </div>
    `;
    
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onSpecialGearDescriptionToChat(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    const description = item.system.description || "No description.";
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    
    // Get filled tags
    const tagsData = item.system.tags;
    let tags = [];
    if (Array.isArray(tagsData)) {
      tags = tagsData;
    } else if (tagsData && typeof tagsData === 'object') {
      tags = Object.values(tagsData);
    }
    const filledTags = tags.filter(t => t && typeof t === 'string' && t.trim() !== '');
    
    // Build tags display
    let tagsHtml = '';
    if (filledTags.length > 0) {
      tagsHtml = `
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #333">
          <div style="color:#9900ff;font-size:0.8em;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Tags</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${filledTags.map(tag => `<span style="display:inline-block;padding:3px 8px;background:#1a0a20;border:1px solid #9900ff;border-radius:4px;color:#cc66ff;font-size:0.85em">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid #ffd000;border-radius:8px;padding:12px;box-shadow:0 0 15px rgba(255,208,0,0.3)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #333">
          <img src="${item.img}" style="width:36px;height:36px;border:2px solid #ffd000;object-fit:cover"/>
          <div>
            <div style="font-size:1em;font-weight:bold;color:#ffd000;text-shadow:0 0 10px #ffd000;text-transform:uppercase;letter-spacing:2px">
              ${item.name}
            </div>
            <div style="font-size:0.75em;color:#888;text-transform:uppercase">Special Gear</div>
          </div>
        </div>
        <div style="color:#e0e0e0;font-family:'Rajdhani',sans-serif;font-size:0.95em;line-height:1.5">
          ${description}
        </div>
        ${tagsHtml}
        <div style="color:#666;font-size:0.8em;margin-top:8px;font-style:italic">
          — ${this.actor.name}
        </div>
      </div>
    `;
    
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onGearRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const currentRolls = parseInt(this.actor.system.gearRolls?.value) || 0;
    const currentStash = parseInt(this.actor.system.stash?.value) || 0;
    
    if (currentRolls < 1) {
      ui.notifications.warn("No gear rolls remaining! Reset the counter first.");
      return;
    }
    
    // Build tags selection buttons (1-6)
    let tagsButtonsHtml = '';
    for (let i = 1; i <= 6; i++) {
      tagsButtonsHtml += `
        <button type="button" class="tag-choice" data-tags="${i}" style="width:36px;height:36px;padding:4px;background:#1a0a20;border:2px solid #ffd000;border-radius:6px;color:#ffd000;cursor:pointer;font-size:1.1em;font-weight:bold;font-family:'Orbitron',sans-serif">
          ${i}
        </button>
      `;
    }
    
    new Dialog({
      title: "Gear Roll",
      content: `
        <div style="background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);padding:12px;border-radius:8px;font-family:'Orbitron',sans-serif">
          <div style="color:#ffd000;font-weight:bold;font-size:1em;text-align:center;margin-bottom:8px;text-shadow:0 0 10px #ffd000">
            <i class="fas fa-dice-d6" style="margin-right:8px"></i>GEAR ROLL
          </div>
          <div style="color:#e0e0e0;text-align:center;margin-bottom:8px;font-size:0.9em">
            Gear Rolls Remaining: <span style="color:#00f5ff;font-weight:bold">${currentRolls}</span>
          </div>
          
          <div style="color:#888;font-size:0.85em;text-align:center;margin-bottom:6px">
            Choose target tags (roll target):
          </div>
          <div style="display:flex;justify-content:center;gap:6px;margin-bottom:10px">
            ${tagsButtonsHtml}
          </div>
          
          <div style="color:#00f5ff;font-weight:bold;margin-bottom:8px;text-align:center;font-size:0.9em">
            Selected Target: <span id="gear-roll-target" style="font-size:1.2em">-</span>
          </div>
          
          <div style="background:#1a0505;border:1px solid #ff3366;border-radius:4px;padding:6px;margin-bottom:8px">
            <div style="color:#ff3366;font-size:0.8em;text-align:center">
              <i class="fas fa-exclamation-triangle" style="margin-right:4px"></i>
              <strong>WARNING:</strong> Each +1 modifier uses 1 extra gear roll!
            </div>
          </div>
          
          <div id="gear-roll-cost-warning" style="background:#1a1a0d;border:1px solid #ffd000;border-radius:4px;padding:6px;margin-bottom:8px">
            <div style="color:#ffd000;font-size:0.85em;text-align:center">
              <i class="fas fa-info-circle" style="margin-right:4px"></i>
              Total Cost: <span id="total-cost">1</span> gear roll(s)
            </div>
          </div>
          
          <div style="display:flex;justify-content:center;align-items:flex-start;gap:20px;margin-bottom:10px">
            <div style="text-align:center">
              <label style="color:#ff6666;font-size:0.8em;display:block;margin-bottom:4px;font-weight:bold">Modifier (costs rolls)</label>
              <input type="number" id="gear-roll-mod" value="0" style="width:60px;padding:6px;background:#1a1a2e;border:2px solid #00f5ff;border-radius:4px;color:#00f5ff;font-size:1em;font-weight:bold;text-align:center"/>
            </div>
            <div style="text-align:center">
              <label style="color:#ffd000;font-size:0.8em;display:block;margin-bottom:4px;font-weight:bold">Stash Bonus (free)</label>
              <input type="number" id="gear-roll-leverage" value="0" min="0" max="${currentStash}" style="width:45px;padding:4px;background:#1a1a0d;border:2px solid #ffd000;border-radius:4px;color:#ffd000;font-size:1em;font-weight:bold;text-align:center"/>
              <div style="color:#888;font-size:0.65em;margin-top:2px">Available: ${currentStash}</div>
            </div>
          </div>
          
          <div style="text-align:center;margin-top:10px">
            <button type="button" id="gear-roll-execute" disabled style="padding:8px 24px;background:#333;border:2px solid #666;border-radius:6px;color:#666;cursor:not-allowed;font-family:'Orbitron',sans-serif;font-weight:bold;font-size:0.9em">
              <i class="fas fa-dice-d6" style="margin-right:6px"></i>SELECT TARGET FIRST
            </button>
          </div>
        </div>
      `,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      render: (html) => {
        let selectedTags = 0;
        const maxModifier = currentRolls - 1; // Reserve 1 for the base roll
        
        const updateCostWarning = () => {
          const mod = Math.abs(parseInt(html.find("#gear-roll-mod").val()) || 0);
          const totalCost = 1 + mod;
          const currentRollsNow = parseInt(this.actor.system.gearRolls?.value) || 0;
          
          // Always show cost warning (show initial cost of 1)
          html.find("#total-cost").text(totalCost);
          
          if (totalCost > currentRollsNow) {
            html.find("#gear-roll-cost-warning").css({ "border-color": "#ff3366", "background": "#1a0505" });
            html.find("#total-cost").css("color", "#ff3366");
          } else {
            html.find("#gear-roll-cost-warning").css({ "border-color": "#ffd000", "background": "#1a1a0d" });
            html.find("#total-cost").css("color", "#ffd000");
          }
          
          // Modifier is now an editable text field, no button state updates needed
        };
        
        const updateRollButton = () => {
          const btn = html.find("#gear-roll-execute");
          if (selectedTags > 0) {
            btn.prop("disabled", false);
            btn.css({ "background": "#0a1a10", "border-color": "#00ff88", "color": "#00ff88", "cursor": "pointer" });
            btn.html('<i class="fas fa-dice-d6" style="margin-right:8px"></i>ROLL');
          } else {
            btn.prop("disabled", true);
            btn.css({ "background": "#333", "border-color": "#666", "color": "#666", "cursor": "not-allowed" });
            btn.html('<i class="fas fa-dice-d6" style="margin-right:8px"></i>SELECT TARGET FIRST');
          }
        };
        
        // Initialize button states
        updateCostWarning();
        updateRollButton();
        
        // Tag choice buttons
        html.find(".tag-choice").click((ev) => {
          selectedTags = parseInt(ev.currentTarget.dataset.tags);
          html.find(".tag-choice").css({ "background": "#1a0a20", "box-shadow": "none" });
          $(ev.currentTarget).css({ "background": "#2a1a30", "box-shadow": "0 0 10px #ffd000" });
          html.find("#gear-roll-target").text(selectedTags);
          updateRollButton();
        });
        
        // When modifier input changes, update the cost warning
        html.find("#gear-roll-mod").change(() => {
          updateCostWarning();
        });
        
        // Execute roll button
        html.find("#gear-roll-execute").click(async () => {
          if (selectedTags <= 0) {
            ui.notifications.warn("Please select a target first!");
            return;
          }
          const modifier = parseInt(html.find("#gear-roll-mod").val()) || 0;
          const leverage = parseInt(html.find("#gear-roll-leverage").val()) || 0;
          await this._executeGearRoll(selectedTags, modifier, leverage);
          html.closest(".app").find(".header-button.close").click();
        });
      },
      default: "cancel"
    }).render(true);
  }

  async _executeGearRoll(targetTags, modifier, leverageSpent) {
    const currentRolls = parseInt(this.actor.system.gearRolls?.value) || 0;
    const maxRolls = parseInt(this.actor.system.gearRolls?.max) || 4;
    const currentStash = parseInt(this.actor.system.stash?.value) || 0;
    
    // Calculate total gear roll cost (1 base + modifier cost)
    const modifierCost = Math.abs(modifier);
    const totalGearRollCost = 1 + modifierCost;
    
    if (currentRolls < totalGearRollCost) {
      ui.notifications.warn(`Not enough gear rolls! Need ${totalGearRollCost}, have ${currentRolls}.`);
      return;
    }
    
    // Check if enough leverage
    if (leverageSpent > currentStash) {
      ui.notifications.warn(`Not enough leverage! Have ${currentStash}, trying to spend ${leverageSpent}.`);
      return;
    }
    
    // Deduct gear rolls (1 base + modifier cost)
    await this.actor.update({ "system.gearRolls.value": currentRolls - totalGearRollCost });
    
    // Deduct leverage if spent
    if (leverageSpent > 0) {
      await this.actor.update({ "system.stash.value": currentStash - leverageSpent });
    }
    
    // Roll the d6
    const roll = await (new Roll("1d6")).evaluate({ allowInteractive: false });
    const dieResult = roll.dice[0].results[0].result;
    const totalResult = dieResult + modifier + leverageSpent;
    
    // Dice So Nice animation
    if (game.dice3d) {
      roll.dice.forEach(die => {
        die.options.colorset = "nco-action";
        die.options.material = "chrome";
      });
      await game.dice3d.showForRoll(roll, game.user, true);
    }
    
    const success = totalResult >= targetTags;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const newRollsRemaining = currentRolls - totalGearRollCost;
    
    let modifierText = '';
    if (modifier !== 0 || leverageSpent > 0) {
      const parts = [];
      if (modifier !== 0) parts.push(`${modifier >= 0 ? '+' : ''}${modifier} mod (cost: ${modifierCost} roll${modifierCost > 1 ? 's' : ''})`);
      if (leverageSpent > 0) parts.push(`+${leverageSpent} stash bonus`);
      modifierText = ` (${parts.join(', ')})`;
    }
    
    let html;
    if (success) {
      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0a1a10 0%,#0d200d 100%);border:2px solid #00ff88;border-radius:8px;padding:15px;box-shadow:0 0 25px rgba(0,255,136,0.5)">
          <div style="font-size:1.2em;font-weight:bold;color:#00ff88;text-shadow:0 0 15px #00ff88;text-align:center">
            <i class="fas fa-tools" style="margin-right:8px"></i>GEAR ROLL
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:15px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #00ff88;background:#0a1a10;color:#00ff88;box-shadow:0 0 15px #00ff88">${dieResult}</span>
            ${(modifier !== 0 || leverageSpent > 0) ? `<span style="color:#888;margin:0 8px">+${modifier + leverageSpent} =</span><span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #00ff88;background:#0a1a10;color:#00ff88">${totalResult}</span>` : ''}
          </div>
          <div style="color:#888;text-align:center;margin-top:8px;font-size:0.9em">
            Target: ${targetTags}${modifierText}
          </div>
          <div style="color:#00ff88;text-align:center;margin-top:15px;font-size:1.3em;font-weight:bold;text-shadow:0 0 15px #00ff88">
            ✓ SUCCESS!
          </div>
          <div style="color:#88ffaa;text-align:center;margin-top:8px">
            ${this.actor.name} acquired specialised gear with <span style="color:#ffd000;font-weight:bold">${targetTags}</span> tag${targetTags > 1 ? 's' : ''}!
          </div>
          <div style="color:#888;text-align:center;margin-top:10px;font-size:0.85em;padding:8px;background:#111;border-radius:4px">
            Gear Rolls Spent: ${totalGearRollCost} • Remaining: ${newRollsRemaining}/${maxRolls}
            ${leverageSpent > 0 ? ` • Stash Bonus: ${leverageSpent}` : ''}
          </div>
        </div>
      `;
    } else {
      html = `
        <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#1a0a10 0%,#200a0a 100%);border:2px solid #ff3366;border-radius:8px;padding:15px;box-shadow:0 0 20px rgba(255,51,102,0.4)">
          <div style="font-size:1.2em;font-weight:bold;color:#ff3366;text-shadow:0 0 10px #ff3366;text-align:center">
            <i class="fas fa-tools" style="margin-right:8px"></i>GEAR ROLL
          </div>
          <div style="color:#00f5ff;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00f5ff">
            ${this.actor.name}
          </div>
          <div style="text-align:center;margin-top:15px">
            <span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #ff3366;background:#1a0a10;color:#ff3366">${dieResult}</span>
            ${(modifier !== 0 || leverageSpent > 0) ? `<span style="color:#888;margin:0 8px">+${modifier + leverageSpent} =</span><span style="display:inline-block;min-width:50px;padding:10px 15px;border-radius:8px;font-weight:700;font-size:1.5em;border:2px solid #ff3366;background:#1a0a10;color:#ff3366">${totalResult}</span>` : ''}
          </div>
          <div style="color:#888;text-align:center;margin-top:8px;font-size:0.9em">
            Target: ${targetTags}${modifierText}
          </div>
          <div style="color:#ff3366;text-align:center;margin-top:15px;font-size:1.3em;font-weight:bold;text-shadow:0 0 10px #ff3366">
            ✗ FAILED
          </div>
          <div style="color:#ff9999;text-align:center;margin-top:8px">
            ${this.actor.name} wasted ${totalGearRollCost} gear roll${totalGearRollCost > 1 ? 's' : ''} trying to acquire specialised gear.
          </div>
          <div style="color:#888;text-align:center;margin-top:10px;font-size:0.85em;padding:8px;background:#111;border-radius:4px">
            Gear Rolls Spent: ${totalGearRollCost} • Remaining: ${newRollsRemaining}/${maxRolls}
            ${leverageSpent > 0 ? ` • Stash Bonus: ${leverageSpent} (wasted)` : ''}
          </div>
        </div>
      `;
    }
    
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }

  async _onResetGearRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const max = parseInt(this.actor.system.gearRolls?.max) || 4;
    await this.actor.update({ "system.gearRolls.value": max });
    
    // Send chat message
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const html = `
      <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid #00f5ff;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(0,245,255,0.3)">
        <div style="font-size:1em;font-weight:bold;color:#00f5ff;text-shadow:0 0 10px #00f5ff;text-align:center">
          <i class="fas fa-redo" style="margin-right:8px"></i>GEAR ROLLS RESET
        </div>
        <div style="color:#00ff88;text-align:center;margin-top:8px;font-size:1.1em;text-shadow:0 0 8px #00ff88">
          ${this.actor.name} reset their gear rolls to ${max}!
        </div>
      </div>
    `;
    await ChatMessage.create({ user: game.user.id, speaker, content: html });
  }
}

/* -------------------------------------------- */
/*  Threat Sheet                                */
/* -------------------------------------------- */

class NCOThreatSheet extends ActorSheet {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nco", "sheet", "actor", "threat"],
      template: "systems/NCO/templates/threat-sheet.hbs",
      width: 550,
      height: 450,
      resizable: false,
      tabs: [],
      scrollY: [".sheet-body"]
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    const actorData = this.actor.toObject(false);
    
    context.system = actorData.system;
    context.flags = actorData.flags;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Portrait click
    html.find('.portrait-container').click(ev => {
      const fp = new FilePicker({
        type: "image",
        current: this.actor.img,
        callback: path => this.actor.update({ img: path })
      });
      fp.browse();
    });
  }
}

/* -------------------------------------------- */
/*  Item Sheets                                 */
/* -------------------------------------------- */

class NCOGearSheet extends ItemSheet {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nco", "sheet", "item", "gear"],
      template: "systems/NCO/templates/gear-sheet.hbs",
      width: 400,
      height: 300,
      resizable: false,
      tabs: []
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    const itemData = this.item.toObject(false);
    
    context.system = itemData.system;
    context.flags = itemData.flags;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Icon click to change image
    html.find('.icon-container').click(ev => {
      const fp = new FilePicker({
        type: "image",
        current: this.item.img,
        callback: path => this.item.update({ img: path })
      });
      fp.browse();
    });
  }
}

class NCOSpecialGearSheet extends ItemSheet {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["nco", "sheet", "item", "special-gear"],
      template: "systems/NCO/templates/special-gear-sheet.hbs",
      width: 450,
      height: 480,
      resizable: false,
      tabs: []
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    const itemData = this.item.toObject(false);
    
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Prepare tags array
    const tagsData = context.system.tags;
    let tags = [];
    if (Array.isArray(tagsData)) {
      tags = tagsData;
    } else if (tagsData && typeof tagsData === 'object') {
      tags = Object.values(tagsData);
    } else {
      tags = ["", "", "", "", "", ""];
    }
    
    context.tagsArray = [];
    for (let i = 0; i < 6; i++) {
      context.tagsArray.push({ index: i, value: tags[i] || "" });
    }

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Icon click to change image
    html.find('.icon-container').click(ev => {
      const fp = new FilePicker({
        type: "image",
        current: this.item.img,
        callback: path => this.item.update({ img: path })
      });
      fp.browse();
    });
  }
}

/* -------------------------------------------- */
/*  Dice Rolling                                */
/* -------------------------------------------- */

async function rollDice(actionDice = 1, dangerDice = 0) {
  const a = Math.max(0, actionDice);
  const d = Math.max(0, dangerDice);
  const speaker = ChatMessage.getSpeaker();

  // === Rolls ===
  const rA = a ? await (new Roll(`${a}d6`)).evaluate({ allowInteractive: false }) : null;
  const rD = d ? await (new Roll(`${d}d6`)).evaluate({ allowInteractive: false }) : null;

  // Dice So Nice - Chrome dice with neon glow
  if (game.dice3d) {
    const shows = [];
    if (rA) {
      rA.dice.forEach(die => {
        die.options.colorset = "nco-action";
        die.options.material = "chrome";
      });
      shows.push(game.dice3d.showForRoll(rA, game.user, true));
    }
    if (rD) {
      rD.dice.forEach(die => {
        die.options.colorset = "nco-danger";
        die.options.material = "chrome";
      });
      shows.push(game.dice3d.showForRoll(rD, game.user, true));
    }
    await Promise.all(shows);
  }

  const getResults = r => r?.dice?.[0]?.results?.map(r => r.result) ?? [];
  const A = getResults(rA), D = getResults(rD);
  const canc = [], Arem = [...A], Drem = [...D];

  // === Cancel matching dice ===
  for (const v of D) {
    const i = Arem.indexOf(v);
    if (i !== -1) {
      canc.push(v);
      Arem.splice(i, 1);
      Drem.splice(Drem.indexOf(v), 1);
    }
  }

  const high = Arem.length ? Math.max(...Arem) : null;
  const botch = !Arem.length || (Arem.length === 1 && Arem[0] === 1);
  const sixes = A.filter(x => x === 6).length;
  const boons = !botch && high === 6 ? Math.max(0, sixes - 1) : 0;

  const outcome = botch ? ["💥 Botch!", "#ff3366", "#1a0a10"]
    : high <= 3 ? ["❌ Fail", "#ff3366", "#1a0a10"]
    : high <= 5 ? ["➖ Partial Success", "#ffd000", "#1a1500"]
    : ["✅ Success", "#00ff88", "#0a1a10"];

  // === Chip helper for dice display ===
  const chip = (v, t, o = {}) => {
    const base = "display:inline-block;min-width:28px;padding:4px 8px;margin:2px;border-radius:6px;font-weight:700;text-align:center;font-family:'Orbitron',monospace;";
    if (o.cancel) {
      return `<span style="${base}opacity:.6;border:2px solid #ff3366;background:#1a0a10;color:#ff3366;text-decoration:line-through">${v}</span>`;
    }
    if (o.hl) {
      return `<span style="${base}border:2px solid #00f5ff;background:#0a1a1a;color:#00f5ff;box-shadow:0 0 10px #00f5ff">${v}</span>`;
    }
    const c = t === "a" ? "#00f5ff" : "#ff3366";
    const b = t === "a" ? "#00f5ff" : "#ff3366";
    const bg = t === "a" ? "#0a1a1a" : "#1a0a10";
    return `<span style="${base}border:1px solid ${b};background:${bg};color:${c}">${v}</span>`;
  };

  const block = (title, arr, t, hl) => `
    <div style="margin:8px 0">
      <strong style="color:#b0b0b0;font-size:0.9em">${title}</strong>
      <div style="margin-top:4px">${
        arr.length ? arr.map(v => chip(v, t, { hl: hl && v === high })).join("") : '<span style="color:#666">(none)</span>'
      }</div>
    </div>`;

  // === Build Chat Output ===
  let html = `
    <div style="font-family:'Orbitron',sans-serif;background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);border:2px solid #00f5ff;border-radius:8px;padding:12px;box-shadow:0 0 20px rgba(0,245,255,0.3)">
      <div style="font-size:1.2em;font-weight:bold;color:#00f5ff;text-shadow:0 0 10px #00f5ff;text-align:center;margin-bottom:8px">NEON CITY OVERDRIVE</div>
      <hr style="border:none;border-top:1px solid #333;margin:8px 0">
      ${block(`Action Dice (${a}d6)`, A, "a", true)}
      ${block(`Danger Dice (${d}d6)`, D, "d")}
      <hr style="border:none;border-top:1px solid #333;margin:8px 0">
      <div style="margin:8px 0">
        <strong style="color:#b0b0b0;font-size:0.9em">Cancelled:</strong>
        <div style="margin-top:4px">${canc.length ? canc.map(v => chip(v, "a", { cancel: true })).join("") : '<span style="color:#666">None</span>'}</div>
      </div>
      ${block("Remaining Action", Arem, "a", true)}
      ${block("Remaining Danger", Drem, "d")}
      ${boons ? `<div style="color:#ff00ff;font-weight:bold;text-shadow:0 0 10px #ff00ff;margin:8px 0">✨ Boon! x${boons}</div>` : ""}
      <hr style="border:none;border-top:1px solid #333;margin:8px 0">
      <div style="font-size:1.3em;font-weight:bold;color:${outcome[0].includes('Success') ? '#00ff88' : outcome[1]};background:${outcome[2]};border:2px solid ${outcome[1]};border-radius:6px;padding:10px;text-align:center;text-shadow:0 0 10px ${outcome[1]}">${outcome[0]}${high ? ` (highest = ${high})` : ""}</div>
    </div>`;

  await ChatMessage.create({ user: game.user.id, speaker, content: html });

  return { actionRolls: A, dangerRolls: D, result: outcome[0] };
}

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  console.log("NCO | Neon City Overdrive System Ready");
});

/* -------------------------------------------- */
/*  Dice So Nice Integration                    */
/* -------------------------------------------- */

Hooks.once("diceSoNiceReady", (dice3d) => {
  console.log("NCO | Registering Dice So Nice customizations");

  // Register custom colorsets for NCO - Action dice (white chrome, cyan numbers)
  dice3d.addColorset({
    name: "nco-action",
    description: "NCO Action Dice",
    category: "Neon City Overdrive",
    foreground: "#00ffff",
    background: "#f0f0f0",
    outline: "#00cccc",
    edge: "#e0e0e0",
    material: "chrome",
    font: "Orbitron",
    visibility: "visible"
  }, "no");

  // Register custom colorsets for NCO - Danger dice (black chrome, red numbers)
  dice3d.addColorset({
    name: "nco-danger",
    description: "NCO Danger Dice",
    category: "Neon City Overdrive",
    foreground: "#ff3366",
    background: "#1a1a1a",
    outline: "#cc0033",
    edge: "#333333",
    material: "chrome",
    font: "Orbitron",
    visibility: "visible"
  }, "no");

  // Register custom dice preset with Orbitron font
  dice3d.addDicePreset({
    type: "d6",
    labels: ["1", "2", "3", "4", "5", "6"],
    font: "Orbitron",
    fontScale: 1.0,
    system: "NCO"
  }, "d6");

  // Add glow effect via custom CSS
  const glowStyle = document.createElement("style");
  glowStyle.textContent = `
    /* NCO Dice Glow Effect */
    #dice-box-canvas {
      filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.4)) drop-shadow(0 0 15px rgba(255, 51, 102, 0.3));
    }
    
    .dice-so-nice-container {
      filter: drop-shadow(0 0 5px rgba(0, 245, 255, 0.5));
    }
  `;
  document.head.appendChild(glowStyle);
  
  console.log("NCO | Dice So Nice customizations registered");
});
