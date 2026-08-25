const MODULE_ID = "magias-e-skills";
const MAGIC_FLAG = "magicSpectrum";
const SKILLS_FLAG = "extraSkills";
const MAX_CIRCLE = 13;
const MAX_MASTERY = 6;

const MAGIC_SPECTRA = [
  group("afflict", "MES.Spectra.Afflict", ["body", "movement", "senses", "magical", "fear", "elemental"]),
  group("damage", "MES.Spectra.Damage", [
    "complete", "segmented", "slashing", "piercing", "bludgeoning", "fire", "cold", "lightning", "acid",
    "poison", "positiveForce", "negativeForce", "sonic", "radiant", "necrotic", "psychic"
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
  ]),
  group("red", "MES.Spectra.Red", ["explosion", "emanate", "spread"], "red"),
  group("orange", "MES.Spectra.Orange", ["nullify", "repel", "amplify", "identify", "connect"], "orange"),
  group("yellow", "MES.Spectra.Yellow", ["time", "future", "present", "past", "fast", "stop", "slow"], "yellow"),
  group("green", "MES.Spectra.Green", [
    "protect", "barrier", "resistance", "increase", "reduce", "alter", "bind", "repair", "field", "animals", "plants"
  ], "green"),
  group("blue", "MES.Spectra.Blue", ["thought", "memory", "control", "dream", "perception", "language", "senses"], "blue"),
  group("indigo", "MES.Spectra.Indigo", ["portal", "banish", "conjure", "gravity", "teleport", "sound", "weather"], "indigo"),
  group("violet", "MES.Spectra.Violet", [
    "wound", "healing", "restore", "damage", "body", "soul", "undead", "curse"
  ], "violet")
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

  CharacterSheet.TABS.push(
    { tab: "magicSpectrum", label: "MES.Tabs.MagicSpectrum", icon: "fa-solid fa-wand-sparkles" },
    { tab: "extraSkills", label: "MES.Tabs.ExtraSkills", icon: "fa-solid fa-graduation-cap" }
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
      entries: spectrumGroup.entries.map(entry => {
        const storedEntry = getSpectrumEntry(entries, entry.id);
        const magic = normalizeProgress(storedEntry?.circle, storedEntry?.progress, MAX_CIRCLE);
        return {
          ...entry,
          circle: magic.level,
          progress: magic.progress,
          complete: magic.level === MAX_CIRCLE && magic.progress === 100
        };
      })
    }));
  }

  if ( partId === "extraSkills" ) {
    const stored = sheet.actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? [];
    context.extraSkills = stored.map(skill => {
      const value = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY);
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
        complete: value.level === MAX_MASTERY && value.progress === 100
      };
    });
  }
});

Hooks.on("renderActorSheetV2", (sheet, element) => {
  if ( sheet.actor?.type !== "character" ) return;

  const magicTab = element.querySelector("[data-mes-magic]");
  const magicSearch = magicTab?.querySelector("[data-mes-search-magic]");
  magicSearch?.addEventListener("input", () => filterMagicSpectra(magicTab, magicSearch.value));
  sheet._mesOpenSpectrumGroups ??= new Set();
  for ( const accordion of magicTab?.querySelectorAll("[data-mes-spectrum-group]") ?? [] ) {
    accordion.addEventListener("toggle", () => {
      if ( accordion.open ) sheet._mesOpenSpectrumGroups.add(accordion.dataset.mesSpectrumGroup);
      else sheet._mesOpenSpectrumGroups.delete(accordion.dataset.mesSpectrumGroup);
    });
  }
  magicTab?.addEventListener("change", event => saveMagic(sheet.actor, event));
  magicTab?.addEventListener("click", event => {
    const deltaButton = event.target.closest("[data-mes-apply-delta]");
    const deltaRow = deltaButton?.closest("[data-mes-spectrum-id]");
    if ( deltaButton && deltaRow ) {
      return applyMagicProgressDelta(sheet.actor, deltaRow.dataset.mesSpectrumId, deltaRow);
    }

    const button = event.target.closest("[data-mes-adjust]");
    const row = button?.closest("[data-mes-spectrum-id]");
    if ( button && row ) adjustMagic(sheet.actor, row.dataset.mesSpectrumId, button);
  });
  for ( const row of magicTab?.querySelectorAll("[data-mes-spectrum-id]") ?? [] ) {
    row.querySelector("[data-mes-progress-delta]")?.addEventListener("keydown", event => {
      if ( event.key !== "Enter" ) return;
      event.preventDefault();
      applyMagicProgressDelta(sheet.actor, row.dataset.mesSpectrumId, row);
    });
  }

  const addButton = element.querySelector("[data-mes-add-skill]");
  const newSkillInput = element.querySelector("[data-mes-new-skill]");
  const skillSearch = element.querySelector("[data-mes-search-skills]");
  skillSearch?.addEventListener("input", () => filterExtraSkills(element, skillSearch.value));
  addButton?.addEventListener("click", () => addSkill(sheet.actor, element));
  newSkillInput?.addEventListener("keydown", event => {
    if ( event.key !== "Enter" ) return;
    event.preventDefault();
    addSkill(sheet.actor, element);
  });

  for ( const row of element.querySelectorAll("[data-mes-skill-id]") ) {
    row.addEventListener("change", event => saveSkill(sheet.actor, row.dataset.mesSkillId, event));
    row.addEventListener("click", event => {
      const deleteButton = event.target.closest("[data-mes-delete-skill]");
      if ( deleteButton ) return deleteSkill(sheet.actor, row.dataset.mesSkillId);

      const iconButton = event.target.closest("[data-mes-pick-icon]");
      if ( iconButton ) return pickSkillIcon(sheet.actor, row.dataset.mesSkillId);

      const starButton = event.target.closest("[data-mes-set-mastery]");
      if ( starButton ) return setSkillMastery(sheet.actor, row.dataset.mesSkillId, starButton.dataset.mesSetMastery);

      const deltaButton = event.target.closest("[data-mes-apply-delta]");
      if ( deltaButton ) return applySkillProgressDelta(sheet.actor, row.dataset.mesSkillId, row);

      const adjustButton = event.target.closest("[data-mes-adjust]");
      if ( adjustButton ) adjustSkill(sheet.actor, row.dataset.mesSkillId, adjustButton);
    });
    row.querySelector("[data-mes-progress-delta]")?.addEventListener("keydown", event => {
      if ( event.key !== "Enter" ) return;
      event.preventDefault();
      applySkillProgressDelta(sheet.actor, row.dataset.mesSkillId, row);
    });
  }
});

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
  const normalized = normalizeProgress(next.circle, next.progress, MAX_CIRCLE);
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

  const normalized = normalizeProgress(entry.circle, entry.progress, MAX_CIRCLE);
  current.entries[spectrumStorageKey(id)] = { circle: normalized.level, progress: normalized.progress };
  await actor.setFlag(MODULE_ID, MAGIC_FLAG, current);
}

async function applyMagicProgressDelta(actor, id, row) {
  if ( !actor.isOwner ) return;
  const input = row.querySelector("[data-mes-progress-delta]");
  const raw = input?.value.trim() ?? "";
  if ( !/^[+-]?\d+$/.test(raw) ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.InvalidProgressDelta"));
    input?.focus();
    return;
  }

  await adjustMagic(actor, id, { dataset: { mesAdjust: "progress", mesDelta: raw } });
}

async function addSkill(actor, element) {
  if ( !actor.isOwner ) return;
  const input = element.querySelector("[data-mes-new-skill]");
  const name = input?.value.trim();
  if ( !name ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.NameRequired"));
    input?.focus();
    return;
  }

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
  skills.push({
    id: foundry.utils.randomID(),
    name,
    icon: "icons/svg/book.svg",
    description: "",
    mastery: 0,
    progress: 0
  });
  await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills);
}

async function saveSkill(actor, id, event) {
  if ( !actor.isOwner ) return;
  const field = event.target.dataset.mesField;
  if ( !field ) return;

  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  if ( ["name", "icon", "description"].includes(field) ) skill[field] = event.target.value.trim();
  else skill[field] = numberValue(event.target.value);
  const normalized = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY);
  skill.mastery = normalized.level;
  skill.progress = normalized.progress;
  await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills);
}

async function setSkillMastery(actor, id, mastery) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const selected = Math.clamp(Math.trunc(numberValue(mastery)), 1, MAX_MASTERY);
  skill.mastery = numberValue(skill.mastery) === selected ? selected - 1 : selected;
  if ( skill.mastery < MAX_MASTERY ) skill.progress = Math.min(numberValue(skill.progress), 99);
  await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills);
}

async function applySkillProgressDelta(actor, id, row) {
  if ( !actor.isOwner ) return;
  const input = row.querySelector("[data-mes-progress-delta]");
  const raw = input?.value.trim() ?? "";
  if ( !/^[+-]?\d+$/.test(raw) ) {
    ui.notifications.warn(game.i18n.localize("MES.Notifications.InvalidProgressDelta"));
    input?.focus();
    return;
  }

  await adjustSkill(actor, id, { dataset: { mesAdjust: "progress", mesDelta: raw } });
}

async function pickSkillIcon(actor, id) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const picker = new foundry.applications.apps.FilePicker.implementation({
    current: skill.icon || "icons/svg/book.svg",
    type: "image",
    callback: async path => {
      skill.icon = path;
      await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills);
    }
  });
  picker.render({ force: true });
}

async function adjustSkill(actor, id, button) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
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

  const normalized = normalizeProgress(skill.mastery, skill.progress, MAX_MASTERY);
  skill.mastery = normalized.level;
  skill.progress = normalized.progress;
  await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills);
}

async function deleteSkill(actor, id) {
  if ( !actor.isOwner ) return;
  const skills = foundry.utils.deepClone(actor.getFlag(MODULE_ID, SKILLS_FLAG) ?? []);
  const skill = skills.find(entry => entry.id === id);
  if ( !skill ) return;

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("MES.Delete.Title") },
    content: `<p>${game.i18n.format("MES.Delete.Content", { name: foundry.utils.escapeHTML(skill.name) })}</p>`,
    modal: true
  });
  if ( confirmed ) await actor.setFlag(MODULE_ID, SKILLS_FLAG, skills.filter(entry => entry.id !== id));
}

function normalizeProgress(level, progress, maximum) {
  level = Math.clamp(Math.trunc(numberValue(level)), 0, maximum);
  progress = Math.trunc(numberValue(progress));

  const maximumTotal = (maximum + 1) * 100;
  const total = Math.clamp((level * 100) + progress, 0, maximumTotal);
  if ( total === maximumTotal ) return { level: maximum, progress: 100 };

  level = Math.floor(total / 100);
  progress = total % 100;

  return { level, progress };
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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
      const matches = !query || groupMatches || entryName.includes(query);
      row.hidden = !matches;
      if ( matches ) visibleEntries += 1;
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
