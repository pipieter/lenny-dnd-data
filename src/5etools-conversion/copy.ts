import { SkillAbilities } from './data';
import { applySingleTemplate } from './template';
import { crToProficiencyBonus } from './parser';
import { ascSortLower } from './sort';

// TODO _templates (e.g. Zox Clammersham). This will most likely require data going global

// Note to future developers, it's useful to take a clone (through structuredClone)
// as frequently as possible when copying something.

function variadic(value: any): any[] {
    if (Array.isArray(value)) return value;
    return [value];
}

function addMod_replaceArr(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];

    const items = variadic(entry.items);
    for (let i = 0; i < base[key].length; i++) {
        // If replace is given by name
        if (typeof entry.replace === 'string') {
            if (base[key][i].name === entry.replace) {
                base[key].splice(i, 1, ...items);
                return;
            }
        }
        // If replace is given by advanced object
        else if (typeof entry.replace === 'object') {
            // if replace index in object form {index: _}
            if (entry.replace.index !== undefined) {
                base[key].splice(entry.replace.index, 1, ...items);
                return;
            } else {
                throw `addMod_replaceArr: Invalid replace type '${JSON.stringify(entry.replace)}'`;
            }
        }
    }

    throw `addMod_replaceArr: Could not find '${entry.replace}' in ${base.name}[${key}]`;
}

function addMod_removeArr(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];
    const names = variadic(entry.names);

    for (const name of names) {
        for (let i = 0; i < base[key].length; i++) {
            if (base[key][i].name === name) {
                base[key].splice(i, 1);
            }
        }
    }
}

function addMod_appendArr(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];
    base[key].push(...variadic(entry.items));
}

function addMod_prependArr(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];
    base[key].splice(0, 0, ...variadic(entry.items));
}

function addMod_insertArr(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];
    base[key].splice(entry.index, 0, ...variadic(entry.items));
}

function addMod_replaceTxt(base: any, key: string, entry: any): void {
    base[key] = structuredClone(base[key]) || [];

    const replace = entry.replace.slice(1);
    const to = entry.with;

    if (typeof base[key] === 'string') {
        base[key] = base[key].replaceAll(replace, to);
        return;
    }

    if (typeof base[key] === 'object') {
        for (const subkey of Object.keys(base[key])) {
            addMod_replaceTxt(base[key], subkey, entry);
        }
        return;
    }

    throw `addMod_replaceTxt: Unsupported replace type '${typeof base[key]}'`;
}

// utils.js:5468 _doMod_addSkills
function addMod_addSkills(base: any, skills: any) {
    base.skills = structuredClone(base.skills || {});

    for (const [skill, mode] of Object.entries(skills)) {
        // mode: 1 = proficient; 2 = expert
        const ability = SkillAbilities.get(skill)!;
        const abilityScore = base[ability];
        const proficiency = crToProficiencyBonus(base.cr);
        const total = proficiency * (mode as number) + abilityScore;

        // Only update if total is higher than already there
        if (!base.skills[skill] || base.skills[skill] < total) {
            base.skills[skill] = total;
        }
    }
}

// utils.js:5557 _doMod_replaceSpells
function addMod_replaceSpells(base: any, entry: any) {
    if (!base.spellcasting) {
        throw `addMod_replaceSpells: creature '${base.name}' does not have spellcasting`;
    }

    base.spellcasting = structuredClone(base.spellcasting);
    const spellcasting = base.spellcasting[0];

    function replaceSpell(spellList: any[], replace: string, to: string) {
        if (!Array.isArray(spellList))
            throw `addMod_replaceSpells: spell list is not an array, got ${JSON.stringify(spellList, null, 2)}`;

        for (let i = 0; i < spellList.length; i++) {
            if (spellList[i] === replace) {
                spellList[i] = to;
            }
        }
    }

    if (entry.spells) {
        for (const [level, list] of Object.entries(entry.spells)) {
            for (const replace of list as any[]) {
                replaceSpell(spellcasting.spells[level].spells, replace.replace, replace.with);
            }
        }
    }

    if (entry.daily) {
        for (const [level, list] of Object.entries(entry.daily)) {
            for (const replace of list as any[]) {
                replaceSpell(spellcasting.daily[level], replace.replace, replace.with);
            }
        }
    }
}

// utils.js:5600 _doMod_removeSpells
function addMod_removeSpells(base: any, mod: any) {
    if (!base.spellcasting) {
        throw `addMod_removeSpells: creature '${base.name}' does not have spellcasting`;
    }

    base.spellcasting = structuredClone(base.spellcasting);
    const spellcasting = base.spellcasting[0];

    if (mod.spells) {
        for (const level of Object.keys(mod.spells)) {
            const list: any[] = mod.spells[level];
            spellcasting.spells[level].spells = spellcasting.spells[level].filter(
                (spell: any) => !list.includes(spell)
            );
        }
    }

    if (mod.daily) {
        for (const level of Object.keys(mod.daily)) {
            const list: any[] = mod.daily[level];
            spellcasting.daily[level].spells = spellcasting.daily[level].filter(
                (spell: any) => !list.includes(spell)
            );
        }
    }
}

// utils.js:5505 _doMod_replaceSpells
function addMod_addSpells(base: any, mod: any) {
    if (!base.spellcasting) {
        throw `addMod_addSpells: creature '${base.name}' does not have spellcasting`;
    }

    base.spellcasting = structuredClone(base.spellcasting);
    const spellcasting = base.spellcasting[0];

    if (mod.spells) {
        const spells = spellcasting.spells;

        Object.keys(mod.spells).forEach((k) => {
            if (!spells[k]) spells[k] = mod.spells[k];
            else {
                // merge the objects
                const spellCategoryNu = mod.spells[k];
                const spellCategoryOld = spells[k];
                Object.keys(spellCategoryNu).forEach((kk) => {
                    if (!spellCategoryOld[kk]) spellCategoryOld[kk] = spellCategoryNu[kk];
                    else {
                        if (typeof spellCategoryOld[kk] === 'object') {
                            if (spellCategoryOld[kk] instanceof Array)
                                spellCategoryOld[kk] = spellCategoryOld[kk]
                                    .concat(spellCategoryNu[kk])
                                    .sort(ascSortLower);
                            else throw `addMod_addSpells: object at key ${kk} not an array!`;
                        } else spellCategoryOld[kk] = spellCategoryNu[kk];
                    }
                });
            }
        });
    }

    ['constant', 'will', 'ritual'].forEach((prop) => {
        if (!mod[prop]) return;
        mod[prop].forEach((sp: any) => (spellcasting[prop] = spellcasting[prop] || []).push(sp));
    });

    [
        'recharge',
        'legendary',
        'charges',
        'rest',
        'restLong',
        'daily',
        'weekly',
        'monthly',
        'yearly',
    ].forEach((prop) => {
        if (!mod[prop]) return;

        for (let i = 1; i <= 9; ++i) {
            const e = `${i}e`;

            spellcasting[prop] = spellcasting[prop] || {};

            if (mod[prop][i]) {
                mod[prop][i].forEach((sp: any) =>
                    (spellcasting[prop][i] = spellcasting[prop][i] || []).push(sp)
                );
            }

            if (mod[prop][e]) {
                mod[prop][e].forEach((sp: any) =>
                    (spellcasting[prop][e] = spellcasting[prop][e] || []).push(sp)
                );
            }
        }
    });
}

function addMod_Single(base: any, key: any, mod: any): void {
    switch (mod.mode) {
        case 'replaceArr':
            return addMod_replaceArr(base, key, mod);
        case 'appendIfNotExistsArr':
        case 'appendArr':
            return addMod_appendArr(base, key, mod);
        case 'prependArr':
            return addMod_prependArr(base, key, mod);
        case 'removeArr':
            return addMod_removeArr(base, key, mod);
        case 'insertArr':
            return addMod_insertArr(base, key, mod);
        case 'replaceTxt':
            return addMod_replaceTxt(base, key, mod);
        case 'addSkills':
            return addMod_addSkills(base, mod.skills);
        case 'replaceSpells':
            return addMod_replaceSpells(base, mod);
        case 'addSpells':
            return addMod_addSpells(base, mod);
        case 'removeSpells':
            return addMod_removeSpells(base, mod);
        default:
            throw `addMod_Single: unknown entry mode '${mod.mode}'`;
    }
}

function addMod(base: any, mods: any): void {
    for (const [key, modEntries_] of Object.entries(mods)) {
        const modEntries = variadic(modEntries_);
        for (const mod of modEntries) {
            if (typeof mod === 'string') {
                if (mod === 'remove') {
                    delete base[key];
                } else {
                    throw `addMod: unknown mod interaction' ${mod}'`;
                }
            } else {
                addMod_Single(base, key, mod);
            }
        }
    }
}

function addPreserve(copy: any, preserve: any): void {
    for (const key of Object.keys(preserve)) {
        copy[key] = preserve[key];
    }
}

export function handleCopy(base: any, entries: any[]): any {
    let copy = structuredClone(base); // Fields will be changed, so making a deep clone is important for future usages

    if (!copy._copy) return copy;

    let parent = entries.find((entry) => {
        const entryName = entry.name.trim().toLowerCase();
        const entrySource = entry.source.trim().toLowerCase();

        const copyName = copy._copy.name.trim().toLowerCase();
        const copySource = copy._copy.source.trim().toLowerCase();

        return entryName === copyName && entrySource === copySource;
    });
    if (!parent) {
        throw `Could not find parent for ${copy.name}|${copy.source}`;
    }

    // Handle parent being a copy itself
    if (parent._copy) {
        parent = handleCopy(parent, entries);
    }

    const mod = copy._copy._mod || {};
    const preserve = copy._copy._preserve || {};

    copy = Object.assign({}, parent, copy);
    addMod(copy, mod);
    addPreserve(copy, preserve);

    delete copy._copy;

    return copy;
}

export function handleVersions(base: any): any[] {
    base = structuredClone(base);
    if (!base._versions) return [];

    const versions = [];
    for (const baseVersion of base._versions) {
        for (const implementation of baseVersion._implementations || []) {
            let version = structuredClone(base);
            let abstract = structuredClone(baseVersion._abstract) || {};

            for (const variable of Object.keys(implementation._variables)) {
                version = applySingleTemplate(
                    version,
                    variable,
                    implementation._variables[variable]
                );
                abstract = applySingleTemplate(
                    abstract,
                    variable,
                    implementation._variables[variable]
                );
            }

            delete version._versions;
            version.name = abstract.name || version.name;
            version.source = abstract.source || version.source;

            addMod(version, abstract._mod || {});
            versions.push(version);
        }
    }

    return versions;
}
