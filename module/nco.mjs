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
    label: "NCO.ActorSheet"
  });

  // Preload Handlebars templates
  await loadTemplates([
    "systems/NCO/templates/actor-sheet.hbs"
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
      tabs: [],
      scrollY: [".sheet-body"]
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    const actorData = this.actor.toObject(false);
    
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Prepare conditions list
    context.conditionsList = [
      { key: "angry", label: "Angry", checked: context.system.conditions.angry },
      { key: "dazed", label: "Dazed", checked: context.system.conditions.dazed },
      { key: "exhausted", label: "Exhausted", checked: context.system.conditions.exhausted },
      { key: "restrained", label: "Restrained", checked: context.system.conditions.restrained },
      { key: "scared", label: "Scared", checked: context.system.conditions.scared },
      { key: "weakened", label: "Weakened", checked: context.system.conditions.weakened }
    ];

    // Prepare checkbox arrays for hits
    context.hitsArray = [];
    for (let i = 0; i < context.system.hits.max; i++) {
      context.hitsArray.push({ index: i, checked: i < context.system.hits.value });
    }

    // Prepare checkbox arrays for stunt points
    context.stuntArray = [];
    for (let i = 0; i < context.system.stuntPoints.max; i++) {
      context.stuntArray.push({ index: i, checked: i < context.system.stuntPoints.value });
    }

    // Prepare checkbox arrays for stash
    context.stashArray = [];
    for (let i = 0; i < context.system.stash.max; i++) {
      context.stashArray.push({ index: i, checked: i < context.system.stash.value });
    }

    // Prepare drive array
    context.driveArray = [];
    for (let i = 0; i < context.system.drive.length; i++) {
      context.driveArray.push({ index: i, state: context.system.drive[i] });
    }

    // Prepare experience blocks (3 blocks of 5)
    context.expBlocks = [];
    for (let block = 0; block < 3; block++) {
      const blockData = { checkboxes: [] };
      for (let i = 0; i < 5; i++) {
        const idx = block * 5 + i;
        blockData.checkboxes.push({ index: idx, checked: idx < context.system.experience.value });
      }
      context.expBlocks.push(blockData);
    }

    // Count danger dice from conditions
    context.dangerDice = Object.values(context.system.conditions).filter(c => c).length;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Roll button
    html.find(".roll-button").click(this._onRoll.bind(this));

    // Hits checkboxes
    html.find(".hits-checkbox").click(this._onHitsClick.bind(this));

    // Condition checkboxes
    html.find(".condition-checkbox").change(this._onConditionChange.bind(this));

    // Stunt Points checkboxes
    html.find(".stunt-checkbox").click(this._onStuntClick.bind(this));

    // Stash checkboxes
    html.find(".stash-checkbox").click(this._onStashClick.bind(this));

    // Drive tri-state checkboxes
    html.find(".drive-checkbox").click(this._onDriveClick.bind(this));

    // Experience checkboxes
    html.find(".exp-checkbox").click(this._onExpClick.bind(this));
  }

  async _onRoll(event) {
    event.preventDefault();
    const dangerDice = Object.values(this.actor.system.conditions).filter(c => c).length;
    
    const content = `
      <div style="background:linear-gradient(135deg,#0d0d1a 0%,#1a0a20 100%);padding:15px;border-radius:8px;font-family:'Orbitron',sans-serif">
        <div style="margin-bottom:15px">
          <label style="color:#00f5ff;font-weight:bold;display:block;margin-bottom:5px">Action Dice (d6)</label>
          <input type="number" id="nco-action" value="1" min="0" max="20" style="width:80px;padding:8px;background:#1a1a2e;border:2px solid #00f5ff;border-radius:4px;color:#00f5ff;font-size:1.1em;font-weight:bold"/>
        </div>
        <div>
          <label style="color:#ff3366;font-weight:bold;display:block;margin-bottom:5px">Danger Dice (d6) <span style="color:#888;font-size:0.8em">(${dangerDice} from conditions)</span></label>
          <input type="number" id="nco-danger" value="${dangerDice}" min="0" max="20" style="width:80px;padding:8px;background:#1a0a10;border:2px solid #ff3366;border-radius:4px;color:#ff3366;font-size:1.1em;font-weight:bold"/>
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
  }

  async _onHitsClick(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.hits.value;
    const newVal = (idx < current) ? idx : idx + 1;
    await this.actor.update({ "system.hits.value": newVal });
  }

  async _onConditionChange(event) {
    const key = event.currentTarget.dataset.condition;
    const checked = event.currentTarget.checked;
    await this.actor.update({ [`system.conditions.${key}`]: checked });
  }

  async _onStuntClick(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.stuntPoints.value;
    const newVal = (idx < current) ? idx : idx + 1;
    await this.actor.update({ "system.stuntPoints.value": newVal });
  }

  async _onStashClick(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.stash.value;
    const newVal = (idx < current) ? idx : idx + 1;
    await this.actor.update({ "system.stash.value": newVal });
  }

  async _onDriveClick(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.drive[idx];
    const newState = (current + 1) % 3;
    const newDrive = [...this.actor.system.drive];
    newDrive[idx] = newState;
    await this.actor.update({ "system.drive": newDrive });
  }

  async _onExpClick(event) {
    event.preventDefault();
    const idx = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.experience.value;
    const newVal = (idx < current) ? idx : idx + 1;
    await this.actor.update({ "system.experience.value": newVal });
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

  // Dice So Nice colors
  if (game.dice3d) {
    const shows = [];
    if (rA) {
      rA.dice.forEach(die => die.options.colorset = "white");
      shows.push(game.dice3d.showForRoll(rA, game.user, true));
    }
    if (rD) {
      rD.dice.forEach(die => die.options.colorset = "black");
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
