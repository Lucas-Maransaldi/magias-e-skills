const MODULE_ID = "magias-e-skills";
const MAGIC_FLAG = "magicSpectrum";
const SKILLS_FLAG = "extraSkills";
const WEAPONS_FLAG = "weaponMasteries";
const TRAIT_CATEGORY_FLAG = "traitCategory";
const REPUTATION_FLAG = "reputation";
const MAX_CIRCLE = 13;
const MAX_MASTERY = 6;

const TRAIT_GROUPS = [
  { id: "natures", label: "MES.Traits.Groups.Natures", icon: "fa-solid fa-leaf", color: "nature" },
  { id: "specializations", label: "MES.Traits.Groups.Specializations", icon: "fa-solid fa-bullseye", color: "specialization" },
  { id: "backgrounds", label: "MES.Traits.Groups.Backgrounds", icon: "fa-solid fa-scroll", color: "background" },
  { id: "bonuses", label: "MES.Traits.Groups.Bonuses", icon: "fa-solid fa-circle-plus", color: "bonus" },
  { id: "burdens", label: "MES.Traits.Groups.Burdens", icon: "fa-solid fa-circle-minus", color: "burden" }
];

const MAGIC_SPECTRA = [
  group("red", "MES.Spectra.Red", ["explosion", "emanate", "spread", "breath"], "red"),
  group("orange", "MES.Spectra.Orange", [
    "nullify", "repel", "amplify", "identify", "connect", "mitigate", "damageReduction", "immunity"
  ], "orange"),
  group("yellow", "MES.Spectra.Yellow", ["time", "future", "present", "past", "fast", "stop", "slow"], "yellow"),
  group("green", "MES.Spectra.Green", [
    "protect", "barrier", "resistance", "increase", "reduce", "alter", "bind", "repair", "field", "animals", "plants"
  ], "green"),
  group("blue", "MES.Spectra.Blue", ["thought", "memory", "control", "dream", "perception", "language", "senses"], "blue"),
  group("indigo", "MES.Spectra.Indigo", ["portal", "banish", "conjure", "gravity", "teleport", "sound", "weather"], "indigo"),
  group("violet", "MES.Spectra.Violet", [
    "wound", "healing", "restore", "damage", "body", "soul", "undead", "curse", "blood"
  ], "violet"),
  subgroup("afflict", "MES.Spectra.Afflict", [
    ["body", ["damagedAttribute", "drainedAttribute", "drainedEnergy", "vulnerable", "helpless", "exposed", "condemned", "bloodiedAndBloody"]],
    ["movement", ["grappled", "paralyzed", "prone", "incapacitated", "stunned"]],
    ["senses", ["fascinated", "blinded", "confused", "deafened"]],
    ["magical", ["cursed", "poisoned", "enchanted", "exhaustion", "incorporeal", "invisible", "petrified"]],
    ["fear", ["shaken", "frightened", "panic"]],
    ["elemental", ["scorched", "wet", "electrified", "chilled", "frozen"]]
  ]),
  group("damage", "MES.Spectra.Damage", [
    "complete", "segmented", "slashing", "piercing", "bludgeoning", "fire", "cold", "lightning", "acid",
    "poison", "positiveForce", "negativeForce", "pureForce", "sonic", "radiant", "necrotic", "psychic"
  ]),
  group("attack", "MES.Spectra.Attack", ["melee", "ranged"]),
  group("save", "MES.Spectra.Save", [
    "strength", "dexterity", "constitution", "intelligence", "reasoning", "wisdom", "charisma", "manipulation",
    "appearance"
  ]),
  group("range", "MES.Spectra.Range", ["self", "touch", "near", "medium", "long", "unlimited"]),
  group("area", "MES.Spectra.Area", ["target", "cone", "cylinder", "sphere", "line"]),
  group("castingTime", "MES.Spectra.CastingTime", ["action", "bonusAction", "reaction", "ceremony"]),
  group("duration", "MES.Spectra.Duration", [
    "instantaneous", "round", "minute", "hour", "day", "concentration", "perpetual"
  ])
];

Hooks.once("init", () => {
  const CharacterSheet = globalThis.dnd5e?.applications?.actor?.CharacterActorSheet;
  if ( !CharacterSheet ) {
    console.error(`${MODULE_ID} | A ficha de personagem do D&D5e não foi encontrada.`);
    return;
  }

  CharacterSheet.PARTS.magicSpectrum = {
    container: { classes: ["tab-body"], id: "tabs" },
    template: `modules/${MODULE_ID}/templates/magic-spectrum.hbs`,
    scrollable: [""]
  };
  CharacterSheet.PARTS.extraSkills = {
    container: { classes: ["tab-body"], id: "tabs" },
    template: `modules/${MODULE_ID}/templates/extra-skills.hbs`,
    scrollable: [""]
  };
  CharacterSheet.PARTS.weapons = {
    container: { classes: ["tab-body"], id: "tabs" },
    template: `modules/${MODULE_ID}/templates/weapons.hbs`,
    scrollable: [""]
  };
  CharacterSheet.PARTS.traits = {
    container: { classes: ["tab-body"], id: "tabs" },
    template: `modules/${MODULE_ID}/templates/traits.hbs`,
    scrollable: [""]
  };
  CharacterSheet.PARTS.reputation = {
    container: { classes: ["tab-body"], id: "tabs" },
    template: `modules/${MODULE_ID}/templates/reputation.hbs`,
    scrollable: [""]
  };

  CharacterSheet.TABS.push(
    { tab: "magicSpectrum", label: "MES.Tabs.MagicSpectrum", icon: "fa-solid fa-wand-sparkles" },
    { tab: "extraSkills", label: "MES.Tabs.ExtraSkills", icon: "fa-solid fa-graduation-cap" },
    { tab: "weapons", label: "MES.Tabs.Weapons", icon: "fa-solid fa-swords" },
    { tab: "traits", label: "MES.Tabs.Traits", icon: "fa-solid fa-list-check" },
    { tab: "reputation", label: "MES.Tabs.Reputation", icon: "fa-solid fa-ranking-star" }
  );

  console.info(`${MODULE_ID} | Inicializado para Foundry VTT 13 e D&D5e 5.2.4.`);
});

Hooks.on("dnd5e.prepareSheetContext", (sheet, partId, context) => {
  if ( sheet.actor?.type !== "character" ) return;

  if ( partId === "magicSpectrum" ) {
    const stored = sheet.actor.getFlag(MODULE_ID, MAGIC_FLAG) ?? {};
    const entries = stored.entries ?? {};
    context.magicSpectrumGroups = MAGIC_SPECTRA.map(spectrumGroup => ({
      ...spectrumGroup,
      open: sheet._mesOpenSpectrumGroups?.has(spectrumGroup.id) ?? false,
      entries: (spectrumGroup.entries ?? [])
        .map(entry => prepareSpectrumEntry(entries, entry))
        .sort(compareSpectrumEntries),
      categories: spectrumGroup.categories?.map(category => ({
        ...category,
        open: sheet._mesOpenAfflictCategories?.has(category.id) ?? false,
        entries: category.entries
          .map(entry => prepareSpectrumEntry(entries, entry))
          .sort(compareSpectrumEntries)
      }))
    }));

    function prepareSpectrumEntry(storedEntries, entry) {
      const storedEntry = getSpectrumEntry(storedEntries, entry.id);
      const magic = normalizeProgress(storedEntry?.circle, storedEntry?.progress, MAX_CIRCLE, false);
      return {
        ...entry,
        circle: magic.level,
        progress: magic.progress,
        complete: magic.level === MAX_CIRCLE
      };
    }
  }

  if ( partId === "extraSkills" ) {
    const stored = sheet.actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? [];
    context.extraSkills = stored.map(skill => {
      const value = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY, false);
      return {
        id: skill.id,
        name: skill.name,
        icon: skill.icon || "icons/svg/book.svg",
        description: skill.description ?? "",
        mastery: value.level,
        progress: value.progress,
        stars: Array.from({ length: MAX_MASTERY }, (_, index) => ({
          value: index + 1,
          filled: index < value.level
        })),
        maximum: MAX_MASTERY,
        complete: value.level === MAX_MASTERY
      };
    });
  }

  if ( partId === "weapons" ) {
    const stored = sheet.actor.getFlag(MODULE_ID, WEAPONS_FLAG) ?? [];
    context.weapons = stored.map(prepareMasteryEntry);
  }

  if ( partId === "traits" ) {
    sheet._mesOpenTraitGroups ??= new Set(TRAIT_GROUPS.map(group => group.id));
    context.traitGroups = TRAIT_GROUPS.map(group => ({
      ...group,
      open: sheet._mesOpenTraitGroups?.has(group.id) ?? false,
      features: sheet.actor.items
        .filter(item => (item.type === "feat") && (item.getFlag(MODULE_ID, TRAIT_CATEGORY_FLAG) === group.id))
        .sort((left, right) => left.name.localeCompare(right.name, game.i18n.lang))
        .map(item => ({ id: item.id, name: item.name, img: item.img, uuid: item.uuid }))
    }));
  }

  if ( partId === "reputation" ) {
    const stored = sheet.actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {};
    sheet._mesOpenReputationGroups ??= new Set(["academy", "devotion", "reputations"]);
    const devotion = stored.devotion ?? {};
    const devotionPoints = Math.trunc(numberValue(devotion.points));
    const devotionFeature = sheet.actor.items.get(devotion.itemId);
    context.reputation = {
      credit: Math.trunc(numberValue(stored.credit)),
      academyOpen: sheet._mesOpenReputationGroups.has("academy"),
      devotionOpen: sheet._mesOpenReputationGroups.has("devotion"),
      reputationsOpen: sheet._mesOpenReputationGroups.has("reputations"),
      devotion: {
        points: devotionPoints,
        devote: (devotionPoints >= 100) && (devotionPoints < 200),
        follower: devotionPoints >= 200,
        feature: devotionFeature && {
          id: devotionFeature.id,
          name: devotionFeature.name,
          img: devotionFeature.img
        }
      },
      entries: (stored.entries ?? []).map(entry => ({
        id: entry.id,
        name: entry.name,
        value: Math.trunc(numberValue(entry.value))
      }))
    };
  }
});

function prepareMasteryEntry(entry) {
  const value = normalizeProgress(entry.mastery, entry.progress, MAX_MASTERY, false);
  return {
    id: entry.id,
    name: entry.name,
    icon: entry.icon || "icons/svg/sword.svg",
    description: entry.description ?? "",
    mastery: value.level,
    progress: value.progress,
    stars: Array.from({ length: MAX_MASTERY }, (_, index) => ({ value: index + 1, filled: index < value.level })),
    maximum: MAX_MASTERY,
    complete: value.level === MAX_MASTERY
  };
}

Hooks.on("renderActorSheetV2", (sheet, element) => {
  if ( sheet.actor?.type !== "character" ) return;

  const magicTab = element.querySelector("[data-mes-magic]");
  const magicSearch = magicTab?.querySelector("[data-mes-search-magic]");
  sheet._mesMagicSearch ??= "";
  sheet._mesMagicDeltaDrafts ??= new Map();
  if ( magicSearch ) {
    magicSearch.value = sheet._mesMagicSearch;
    filterMagicSpectra(magicTab, magicSearch.value);
    magicSearch.addEventListener("input", () => {
      sheet._mesMagicSearch = magicSearch.value;
      filterMagicSpectra(magicTab, magicSearch.value);
    });
  }
  sheet._mesOpenSpectrumGroups ??= new Set();
  sheet._mesOpenAfflictCategories ??= new Set();
  for ( const accordion of magicTab?.querySelectorAll("[data-mes-spectrum-group]") ?? [] ) {
    accordion.addEventListener("toggle", () => {
      if ( accordion.open ) sheet._mesOpenSpectrumGroups.add(accordion.dataset.mesSpectrumGroup);
      else sheet._mesOpenSpectrumGroups.delete(accordion.dataset.mesSpectrumGroup);
    });
  }
  for ( const category of magicTab?.querySelectorAll("[data-mes-afflict-category]") ?? [] ) {
    category.addEventListener("toggle", event => {
      event.stopPropagation();
      if ( category.open ) sheet._mesOpenAfflictCategories.add(category.dataset.mesAfflictCategory);
      else sheet._mesOpenAfflictCategories.delete(category.dataset.mesAfflictCategory);
    });
  }
  magicTab?.addEventListener("change", event => {
    if ( event.target.matches("[data-mes-progress-delta]") ) {
      event.stopPropagation();
      return;
    }
    saveMagic(sheet.actor, event);
  });
  for ( const button of magicTab?.querySelectorAll("[data-mes-apply-delta]") ?? [] ) {
    button.addEventListener("pointerdown", event => event.preventDefault());
  }
  magicTab?.addEventListener("click", event => {
    const deltaButton = event.target.closest("[data-mes-apply-delta]");
    const deltaRow = deltaButton?.closest("[data-mes-spectrum-id]");
    if ( deltaButton && deltaRow ) {
      const deltaValue = deltaRow.querySelector("[data-mes-progress-delta]")?.value;
      if ( parseProgressDelta(deltaValue) !== null ) {
        resetMagicViewAfterApply(sheet, magicTab, deltaRow.dataset.mesSpectrumId);
      }
      return applyMagicProgressDelta(sheet.actor, deltaRow.dataset.mesSpectrumId, deltaRow);
    }

    const button = event.target.closest("[data-mes-adjust]");
    const row = button?.closest("[data-mes-spectrum-id]");
    if ( button && row ) adjustMagic(sheet.actor, row.dataset.mesSpectrumId, button);
  });
  for ( const row of magicTab?.querySelectorAll("[data-mes-spectrum-id]") ?? [] ) {
    const deltaInput = row.querySelector("[data-mes-progress-delta]");
    if ( !deltaInput ) continue;
    const entryId = row.dataset.mesSpectrumId;
    deltaInput.value = sheet._mesMagicDeltaDrafts.get(entryId) ?? "";
    deltaInput.addEventListener("input", event => {
      event.stopPropagation();
      sheet._mesMagicDeltaDrafts.set(entryId, deltaInput.value);
      sheet._mesFocusedMagicDelta = entryId;
    });
    deltaInput.addEventListener("focus", () => {
      sheet._mesFocusedMagicDelta = entryId;
    });
    deltaInput.addEventListener("focusout", event => {
      if ( event.relatedTarget ) sheet._mesFocusedMagicDelta = null;
    });
    deltaInput.addEventListener("keydown", event => {
      if ( event.key !== "Enter" ) return;
      event.preventDefault();
      if ( parseProgressDelta(deltaInput.value) !== null ) resetMagicViewAfterApply(sheet, magicTab, entryId);
      applyMagicProgressDelta(sheet.actor, row.dataset.mesSpectrumId, row);
    });
  }

  if ( sheet._mesFocusedMagicDelta && magicTab?.classList.contains("active") ) {
    const focusedRow = [...magicTab.querySelectorAll("[data-mes-spectrum-id]")]
      .find(row => row.dataset.mesSpectrumId === sheet._mesFocusedMagicDelta);
    const focusedInput = focusedRow?.querySelector("[data-mes-progress-delta]");
    requestAnimationFrame(() => {
      focusedInput?.focus();
      focusedInput?.setSelectionRange(focusedInput.value.length, focusedInput.value.length);
    });
  }

  setupMasteryCollection(sheet.actor, element.querySelector('[data-tab="extraSkills"]'), SKILLS_FLAG, "MES.Delete.Title");
  setupMasteryCollection(sheet.actor, element.querySelector('[data-tab="weapons"]'), WEAPONS_FLAG, "MES.Weapons.DeleteTitle");
  setupTraits(sheet, element.querySelector('[data-tab="traits"]'));
  setupReputation(sheet, element.querySelector('[data-tab="reputation"]'));
});

function setupReputation(sheet, tab) {
  if ( !tab ) return;
  sheet._mesOpenReputationGroups ??= new Set(["academy", "devotion", "reputations"]);
  for ( const group of tab.querySelectorAll("[data-mes-reputation-group]") ) {
    group.addEventListener("toggle", () => {
      const id = group.dataset.mesReputationGroup;
      if ( group.open ) sheet._mesOpenReputationGroups.add(id);
      else sheet._mesOpenReputationGroups.delete(id);
    });
  }

  tab.addEventListener("change", event => {
    const field = event.target.dataset.mesReputationField;
    if ( !field ) return;
    event.stopPropagation();
    saveReputation(sheet.actor, event.target.closest("[data-mes-reputation-id]")?.dataset.mesReputationId, field, event.target.value);
  });

  const addButton = tab.querySelector("[data-mes-add-reputation]");
  const newInput = tab.querySelector("[data-mes-new-reputation]");
  newInput?.addEventListener("change", event => event.stopPropagation());
  addButton?.addEventListener("pointerdown", event => event.preventDefault());
  addButton?.addEventListener("click", () => addReputation(sheet.actor, tab));
  newInput?.addEventListener("keydown", event => {
    if ( event.key !== "Enter" ) return;
    event.preventDefault();
    addReputation(sheet.actor, tab);
  });

  for ( const button of tab.querySelectorAll("[data-mes-delete-reputation]") ) {
    button.addEventListener("click", () => {
      const row = button.closest("[data-mes-reputation-id]");
      deleteReputation(sheet.actor, row?.dataset.mesReputationId);
    });
  }

  const devotionDrop = tab.querySelector("[data-mes-devotion-drop]");
  devotionDrop?.addEventListener("dragover", event => {
    event.preventDefault();
    if ( event.dataTransfer ) event.dataTransfer.dropEffect = "copy";
    devotionDrop.classList.add("mes-drop-active");
  });
  devotionDrop?.addEventListener("dragleave", event => {
    if ( !devotionDrop.contains(event.relatedTarget) ) devotionDrop.classList.remove("mes-drop-active");
  });
  devotionDrop?.addEventListener("drop", event => {
    event.preventDefault();
    event.stopPropagation();
    devotionDrop.classList.remove("mes-drop-active");
    dropDevotionFeature(sheet.actor, event);
  });
  tab.querySelector("[data-mes-open-devotion]")?.addEventListener("click", () => {
    const id = actorDevotion(sheet.actor).itemId;
    sheet.actor.items.get(id)?.sheet.render({ force: true });
  });
  tab.querySelector("[data-mes-chat-devotion]")?.addEventListener("click", () => {
    const id = actorDevotion(sheet.actor).itemId;
    sheet.actor.items.get(id)?.displayCard();
  });
  tab.querySelector("[data-mes-remove-devotion]")?.addEventListener("click", () => removeDevotionFeature(sheet.actor));
}

function actorDevotion(actor) {
  return actor.getFlag(MODULE_ID, REPUTATION_FLAG)?.devotion ?? {};
}

async function dropDevotionFeature(actor, event) {
  if ( !actor.isOwner ) return;
  const data = TextEditor.getDragEventData(event);
  let item;
  try {
    item = await Item.implementation.fromDropData(data);
  }
  catch ( error ) {
    console.warn(`${MODULE_ID} | Falha ao interpretar Feature de Devoção.`, error);
    return;
  }
  if ( !item || item.type !== "feat" ) {
    ui.notifications.warn(game.i18n.localize("MES.Traits.FeatureOnly"));
    return;
  }

  let itemId = item.id;
  if ( item.parent?.uuid !== actor.uuid ) {
    const source = item.toObject();
    delete source._id;
    [item] = await actor.createEmbeddedDocuments("Item", [source]);
    itemId = item.id;
  }

  const stored = foundry.utils.deepClone(actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {});
  stored.devotion = { ...(stored.devotion ?? {}), itemId };
  await actor.setFlag(MODULE_ID, REPUTATION_FLAG, stored);
}

async function removeDevotionFeature(actor) {
  if ( !actor.isOwner ) return;
  const stored = foundry.utils.deepClone(actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {});
  if ( !stored.devotion ) return;
  delete stored.devotion.itemId;
  await actor.setFlag(MODULE_ID, REPUTATION_FLAG, stored);
}

async function saveReputation(actor, id, field, value) {
  if ( !actor.isOwner ) return;
  const stored = foundry.utils.deepClone(actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {});
  stored.entries ??= [];
  if ( field === "credit" ) stored.credit = Math.trunc(numberValue(value));
  else if ( field === "devotion" ) {
    stored.devotion ??= {};
    stored.devotion.points = Math.max(0, Math.trunc(numberValue(value)));
  }
  else {
    const entry = stored.entries.find(entry => entry.id === id);
    if ( !entry ) return;
    if ( field === "name" ) entry.name = String(value).trim();
    else if ( field === "value" ) entry.value = Math.trunc(numberValue(value));
    else return;
  }
  await actor.setFlag(MODULE_ID, REPUTATION_FLAG, stored);
}

async function addReputation(actor, tab) {
  if ( !actor.isOwner ) return;
  const input = tab.querySelector("[data-mes-new-reputation]");
  const name = input?.value.trim();
  if ( !name ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.ReputationNameRequired"));
    input?.focus();
    return;
  }
  const stored = foundry.utils.deepClone(actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {});
  stored.entries ??= [];
  stored.entries.push({ id: foundry.utils.randomID(), name, value: 0 });
  await actor.setFlag(MODULE_ID, REPUTATION_FLAG, stored);
}

async function deleteReputation(actor, id) {
  if ( !actor.isOwner || !id ) return;
  const stored = foundry.utils.deepClone(actor.getFlag(MODULE_ID, REPUTATION_FLAG) ?? {});
  const entry = (stored.entries ?? []).find(entry => entry.id === id);
  if ( !entry ) return;
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("MES.Reputation.DeleteTitle") },
    content: `<p>${game.i18n.format("MES.Reputation.DeleteContent", { name: foundry.utils.escapeHTML(entry.name) })}</p>`,
    modal: true
  });
  if ( confirmed ) {
    stored.entries = stored.entries.filter(entry => entry.id !== id);
    await actor.setFlag(MODULE_ID, REPUTATION_FLAG, stored);
  }
}

function setupTraits(sheet, tab) {
  if ( !tab ) return;
  sheet._mesOpenTraitGroups ??= new Set();

  for ( const group of tab.querySelectorAll("[data-mes-trait-group]") ) {
    const category = group.dataset.mesTraitGroup;
    group.addEventListener("toggle", () => {
      if ( group.open ) sheet._mesOpenTraitGroups.add(category);
      else sheet._mesOpenTraitGroups.delete(category);
    });

    group.querySelector("[data-mes-add-feature]")?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      createTraitFeature(sheet.actor, category);
    });

    group.addEventListener("dragover", event => {
      event.preventDefault();
      if ( event.dataTransfer ) event.dataTransfer.dropEffect = "copy";
      group.classList.add("mes-drop-active");
    });
    group.addEventListener("dragleave", event => {
      if ( !group.contains(event.relatedTarget) ) group.classList.remove("mes-drop-active");
    });
    group.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();
      group.classList.remove("mes-drop-active");
      dropTraitFeature(sheet.actor, category, event);
    });
  }

  for ( const feature of tab.querySelectorAll("[data-mes-feature-id]") ) {
    feature.addEventListener("dragstart", event => {
      const item = sheet.actor.items.get(feature.dataset.mesFeatureId);
      if ( !item || !event.dataTransfer ) return;
      event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: item.uuid }));
    });
    feature.querySelector("[data-mes-open-feature]")?.addEventListener("click", () => {
      sheet.actor.items.get(feature.dataset.mesFeatureId)?.sheet.render({ force: true });
    });
    feature.querySelector("[data-mes-chat-feature]")?.addEventListener("click", () => {
      sheet.actor.items.get(feature.dataset.mesFeatureId)?.displayCard();
    });
    feature.querySelector("[data-mes-delete-feature]")?.addEventListener("click", () => {
      deleteTraitFeature(sheet.actor, feature.dataset.mesFeatureId);
    });
  }
}

async function createTraitFeature(actor, category) {
  if ( !actor.isOwner ) return;
  const [item] = await actor.createEmbeddedDocuments("Item", [{
    name: game.i18n.localize("MES.Traits.NewFeature"),
    type: "feat",
    img: "icons/svg/book.svg",
    flags: { [MODULE_ID]: { [TRAIT_CATEGORY_FLAG]: category } }
  }]);
  item?.sheet.render({ force: true });
}

async function dropTraitFeature(actor, category, event) {
  if ( !actor.isOwner ) return;
  const data = TextEditor.getDragEventData(event);
  let item;
  try {
    item = await Item.implementation.fromDropData(data);
  }
  catch ( error ) {
    console.warn(`${MODULE_ID} | Falha ao interpretar Feature arrastada.`, error);
    return;
  }
  if ( !item || item.type !== "feat" ) {
    ui.notifications.warn(game.i18n.localize("MES.Traits.FeatureOnly"));
    return;
  }

  if ( item.parent?.uuid === actor.uuid ) {
    await item.setFlag(MODULE_ID, TRAIT_CATEGORY_FLAG, category);
    return;
  }

  const source = item.toObject();
  delete source._id;
  foundry.utils.setProperty(source, `flags.${MODULE_ID}.${TRAIT_CATEGORY_FLAG}`, category);
  await actor.createEmbeddedDocuments("Item", [source]);
}

async function deleteTraitFeature(actor, id) {
  if ( !actor.isOwner ) return;
  const item = actor.items.get(id);
  if ( !item ) return;
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("MES.Traits.DeleteTitle") },
    content: `<p>${game.i18n.format("MES.Traits.DeleteContent", { name: foundry.utils.escapeHTML(item.name) })}</p>`,
    modal: true
  });
  if ( confirmed ) await item.delete();
}

function resetMagicViewAfterApply(sheet, magicTab, entryId) {
  sheet._mesMagicSearch = "";
  sheet._mesMagicDeltaDrafts.delete(entryId);
  sheet._mesFocusedMagicDelta = null;
  sheet._mesOpenSpectrumGroups.clear();
  sheet._mesOpenAfflictCategories.clear();

  const search = magicTab?.querySelector("[data-mes-search-magic]");
  if ( search ) search.value = "";
  if ( magicTab ) filterMagicSpectra(magicTab, "");
  for ( const accordion of magicTab?.querySelectorAll("[data-mes-spectrum-group], [data-mes-afflict-category]") ?? [] ) {
    accordion.open = false;
    delete accordion.dataset.mesOpenBeforeSearch;
  }
}

function setupMasteryCollection(actor, tab, flag, deleteTitle) {
  if ( !tab ) return;
  const addButton = tab.querySelector("[data-mes-add-skill]");
  const newSkillInput = tab.querySelector("[data-mes-new-skill]");
  const skillSearch = tab.querySelector("[data-mes-search-skills]");
  skillSearch?.addEventListener("input", () => filterExtraSkills(tab, skillSearch.value));
  newSkillInput?.addEventListener("change", event => event.stopPropagation());
  addButton?.addEventListener("pointerdown", event => event.preventDefault());
  addButton?.addEventListener("click", () => addSkill(actor, tab, flag));
  newSkillInput?.addEventListener("keydown", event => {
    if ( event.key !== "Enter" ) return;
    event.preventDefault();
    addSkill(actor, tab, flag);
  });

  for ( const row of tab.querySelectorAll("[data-mes-skill-id]") ) {
    row.addEventListener("change", event => {
      if ( event.target.matches("[data-mes-progress-delta]") ) {
        event.stopPropagation();
        return;
      }
      saveSkill(actor, row.dataset.mesSkillId, event, flag);
    });
    row.querySelector("[data-mes-apply-delta]")?.addEventListener("pointerdown", event => event.preventDefault());
    row.addEventListener("click", event => {
      const deleteButton = event.target.closest("[data-mes-delete-skill]");
      if ( deleteButton ) return deleteSkill(actor, row.dataset.mesSkillId, flag, deleteTitle);

      const iconButton = event.target.closest("[data-mes-pick-icon]");
      if ( iconButton ) return pickSkillIcon(actor, row.dataset.mesSkillId, flag);

      const starButton = event.target.closest("[data-mes-set-mastery]");
      if ( starButton ) return setSkillMastery(actor, row.dataset.mesSkillId, starButton.dataset.mesSetMastery, flag);

      const deltaButton = event.target.closest("[data-mes-apply-delta]");
      if ( deltaButton ) return applySkillProgressDelta(actor, row.dataset.mesSkillId, row, flag);

      const adjustButton = event.target.closest("[data-mes-adjust]");
      if ( adjustButton ) adjustSkill(actor, row.dataset.mesSkillId, adjustButton, flag);
    });
    row.querySelector("[data-mes-progress-delta]")?.addEventListener("keydown", event => {
      if ( event.key !== "Enter" ) return;
      event.preventDefault();
      applySkillProgressDelta(actor, row.dataset.mesSkillId, row, flag);
    });
  }
}

async function saveMagic(actor, event) {
  if ( !actor.isOwner ) return;
  const row = event.target.closest("[data-mes-spectrum-id]");
  const id = row?.dataset.mesSpectrumId;
  const field = event.target.dataset.mesField;
  if ( !id || !field ) return;

  const current = foundry.utils.deepClone(actor.getFlag(MODULE_ID, MAGIC_FLAG) ?? {});
  current.entries ??= {};
  const entry = getSpectrumEntry(current.entries, id) ?? { circle: 0, progress: 0 };
  const next = { ...entry, [field]: numberValue(event.target.value) };
  const normalized = normalizeProgress(next.circle, next.progress, MAX_CIRCLE, false);
  current.entries[spectrumStorageKey(id)] = { circle: normalized.level, progress: normalized.progress };
  await actor.setFlag(MODULE_ID, MAGIC_FLAG, current);
}

async function adjustMagic(actor, id, button) {
  if ( !actor.isOwner ) return;
  const current = foundry.utils.deepClone(actor.getFlag(MODULE_ID, MAGIC_FLAG) ?? {});
  current.entries ??= {};
  const entry = getSpectrumEntry(current.entries, id) ?? { circle: 0, progress: 0 };
  const field = button.dataset.mesAdjust;
  const delta = numberValue(button.dataset.mesDelta);
  if ( field === "circle" ) {
    entry.circle = numberValue(entry.circle) + delta;
    if ( entry.circle < MAX_CIRCLE ) entry.progress = Math.min(numberValue(entry.progress), 99);
  }
  else if ( field === "progress" ) entry.progress = numberValue(entry.progress) + delta;
  else return;

  const normalized = normalizeProgress(entry.circle, entry.progress, MAX_CIRCLE, false);
  current.entries[spectrumStorageKey(id)] = { circle: normalized.level, progress: normalized.progress };
  await actor.setFlag(MODULE_ID, MAGIC_FLAG, current);
}

async function applyMagicProgressDelta(actor, id, row) {
  if ( !actor.isOwner ) return;
  const input = row.querySelector("[data-mes-progress-delta]");
  const raw = input?.value.trim() ?? "";
  const delta = parseProgressDelta(raw);
  if ( delta === null ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.InvalidProgressDelta"));
    input?.focus();
    return;
  }

  await adjustMagic(actor, id, { dataset: { mesAdjust: "progress", mesDelta: delta } });
}

async function addSkill(actor, element, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const input = element.querySelector("[data-mes-new-skill]");
  const name = input?.value.trim();
  if ( !name ) {
    const notification = flag === WEAPONS_FLAG
      ? "MES.Notifications.WeaponNameRequired"
      : "MES.Notifications.NameRequired";
    ui.notifications.warn(game.i18n.localize(notification));
    input?.focus();
    return;
  }

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  skills.push({
    id: foundry.utils.randomID(),
    name,
    icon: flag === WEAPONS_FLAG ? "icons/svg/sword.svg" : "icons/svg/book.svg",
    description: "",
    mastery: 0,
    progress: 0
  });
  await actor.setFlag(MODULE_ID, flag, skills);
}

async function saveSkill(actor, id, event, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const field = event.target.dataset.mesField;
  if ( !field ) return;

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  if ( ["name", "icon", "description"].includes(field) ) skill[field] = event.target.value.trim();
  else skill[field] = numberValue(event.target.value);
  const normalized = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY, false);
  skill.mastery = normalized.level;
  skill.progress = normalized.progress;
  await actor.setFlag(MODULE_ID, flag, skills);
}

async function setSkillMastery(actor, id, mastery, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const selected = Math.clamp(Math.trunc(numberValue(mastery)), 1, MAX_MASTERY);
  skill.mastery = numberValue(skill.mastery) === selected ? selected - 1 : selected;
  if ( skill.mastery < MAX_MASTERY ) skill.progress = Math.min(numberValue(skill.progress), 99);
  else skill.progress = 0;
  await actor.setFlag(MODULE_ID, flag, skills);
}

async function applySkillProgressDelta(actor, id, row, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const input = row.querySelector("[data-mes-progress-delta]");
  const raw = input?.value.trim() ?? "";
  const delta = parseProgressDelta(raw);
  if ( delta === null ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.InvalidProgressDelta"));
    input?.focus();
    return;
  }

  await adjustSkill(actor, id, { dataset: { mesAdjust: "progress", mesDelta: delta } }, flag);
}

async function pickSkillIcon(actor, id, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const picker = new foundry.applications.apps.FilePicker.implementation({
    current: skill.icon || "icons/svg/book.svg",
    type: "image",
    callback: async path => {
      skill.icon = path;
      await actor.setFlag(MODULE_ID, flag, skills);
    }
  });
  picker.render({ force: true });
}

async function adjustSkill(actor, id, button, flag = SKILLS_FLAG) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const field = button.dataset.mesAdjust;
  const delta = numberValue(button.dataset.mesDelta);
  if ( field === "mastery" ) {
    skill.mastery = numberValue(skill.mastery) + delta;
    if ( skill.mastery < MAX_MASTERY ) skill.progress = Math.min(numberValue(skill.progress), 99);
  }
  else if ( field === "progress" ) skill.progress = numberValue(skill.progress) + delta;
  else return;

  const normalized = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY, false);
  skill.mastery = normalized.level;
  skill.progress = normalized.progress;
  await actor.setFlag(MODULE_ID, flag, skills);
}

async function deleteSkill(actor, id, flag = SKILLS_FLAG, deleteTitle = "MES.Delete.Title") {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, flag) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize(deleteTitle) },
    content: `<p>${game.i18n.format("MES.Delete.Content", { name: foundry.utils.escapeHTML(skill.name) })}</p>`,
    modal: true
  });
  if ( confirmed ) await actor.setFlag(MODULE_ID, flag, skills.filter(entry => entry.id !== id));
}

function normalizeProgress(level, progress, maximum, allowMaximumProgress = true) {
  level = Math.clamp(Math.trunc(numberValue(level)), 0, maximum);
  progress = Math.trunc(numberValue(progress));

  const maximumTotal = (maximum * 100) + (allowMaximumProgress ? 100 : 0);
  const total = Math.clamp((level * 100) + progress, 0, maximumTotal);
  if ( total === maximumTotal ) {
    return { level: maximum, progress: allowMaximumProgress ? 100 : 0 };
  }

  level = Math.floor(total / 100);
  progress = total % 100;

  return { level, progress };
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function compareSpectrumEntries(left, right) {
  return (right.circle - left.circle) || (right.progress - left.progress);
}

function parseProgressDelta(value) {
  const normalized = String(value ?? "").replace(/\s*%\s*$/, "").trim();
  return /^[+-]?\d+$/.test(normalized) ? normalized : null;
}

function filterMagicSpectra(tab, search) {
  const query = normalizeSearch(search);
  let visibleGroups = 0;

  for ( const accordion of tab.querySelectorAll("[data-mes-spectrum-group]") ) {
    const groupName = normalizeSearch(accordion.querySelector(":scope > summary span")?.textContent);
    const groupMatches = query && groupName.includes(query);
    let visibleEntries = 0;

    for ( const row of accordion.querySelectorAll("[data-mes-spectrum-id]") ) {
      const entryName = normalizeSearch(row.querySelector(".mes-spectrum-name strong")?.textContent);
      const categoryName = normalizeSearch(row.closest("[data-mes-afflict-category]")?.querySelector(":scope > summary span")?.textContent);
      const matches = !query || groupMatches || categoryName.includes(query) || entryName.includes(query);
      row.hidden = !matches;
      if ( matches ) visibleEntries += 1;
    }

    for ( const category of accordion.querySelectorAll("[data-mes-afflict-category]") ) {
      const hasVisibleEntry = [...category.querySelectorAll("[data-mes-spectrum-id]")].some(row => !row.hidden);
      category.hidden = !hasVisibleEntry;
      if ( query ) category.open = hasVisibleEntry;
    }

    accordion.hidden = visibleEntries === 0;
    if ( !accordion.hidden ) visibleGroups += 1;

    if ( query ) {
      if ( accordion.dataset.mesOpenBeforeSearch === undefined ) {
        accordion.dataset.mesOpenBeforeSearch = String(accordion.open);
      }
      accordion.open = visibleEntries > 0;
    }
    else if ( accordion.dataset.mesOpenBeforeSearch !== undefined ) {
      accordion.open = accordion.dataset.mesOpenBeforeSearch === "true";
      delete accordion.dataset.mesOpenBeforeSearch;
    }
  }

  tab.querySelector("[data-mes-search-empty]")?.toggleAttribute("hidden", visibleGroups > 0);
}

function filterExtraSkills(tab, search) {
  const query = normalizeSearch(search);
  let visibleSkills = 0;

  for ( const card of tab.querySelectorAll("[data-mes-skill-id]") ) {
    const nameElement = card.querySelector(".mes-skill-name, .mes-skill-identity h3");
    const name = normalizeSearch(nameElement?.value ?? nameElement?.textContent);
    const matches = !query || name.includes(query);
    card.hidden = !matches;
    if ( matches ) visibleSkills += 1;
  }

  tab.querySelector("[data-mes-skills-empty]")?.toggleAttribute("hidden", Boolean(query));
  tab.querySelector("[data-mes-filter-empty]")?.toggleAttribute("hidden", visibleSkills > 0 || !query);
}

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase(game.i18n.lang);
}

function getSpectrumEntry(entries, id) {
  return entries[spectrumStorageKey(id)] ?? entries[id] ?? foundry.utils.getProperty(entries, id);
}

function spectrumStorageKey(id) {
  return id.replaceAll(".", "--");
}

function group(id, label, entryIds, color = "foundation") {
  return {
    id,
    label,
    color,
    entries: entryIds.map(entryId => ({ id: `${id}.${entryId}`, label: `MES.Spectra.${id}.${entryId}` }))
  };
}

function subgroup(id, label, categories, color = "foundation") {
  return {
    id,
    label,
    color,
    categories: categories.map(([categoryId, entryIds]) => ({
      id: `${id}.${categoryId}`,
      label: `MES.Spectra.${id}.${categoryId}.Label`,
      entries: entryIds.map(entryId => ({
        id: `${id}.${categoryId}.${entryId}`,
        label: `MES.Spectra.${id}.${categoryId}.${entryId}`
      }))
    }))
  };
}
