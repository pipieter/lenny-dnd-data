import { accessSync, readFileSync } from 'fs';
import {
    Description,
    parseCastingTime,
    parseComponents,
    parseDescriptions,
    parseDurationTime,
    parseImageUrl,
    parseRange,
    parseSpellLevel,
    parseSpellSchool,
} from '../parser';
import { getImageUrl, getSpellsUrl } from '../urls';

interface Caster {
    name: string;
    source: string;
}

interface Spell {
    name: string;
    source: string;
    level: string;
    school: string;
    casting_time: string;
    range: string;
    components: string;
    duration: string;
    url: string;
    image: string | null;
    description: Description[];
    classes: Caster[];
}

function spellKey(name: string, source: string): string {
    return `${name} (${source})`;
}

function spellCmp(a: Caster | Spell, b: Caster | Spell): number {
    if (a.name == b.name) {
        return a.source.localeCompare(b.source);
    }
    return a.name.localeCompare(b.name);
}

function getSpellImage(fluffs: any[], name: string, source: string): string | null {
    for (const fluff of fluffs) {
        if (fluff.name === name && fluff.source === source && fluff.images) {
            return parseImageUrl(fluff.images);
        }
    }
    return null;
}

function loadSpellsFromFile(path: string, fluffPath: string): Spell[] {
    const data = JSON.parse(readFileSync(path).toString());

    let fluffs: any[] = [];
    try {
        fluffs = JSON.parse(readFileSync(fluffPath).toString())?.spellFluff || [];
    } catch {
        // Fluffs could not be loaded, most likely the file does not exist.
    }

    const results: Spell[] = [];

    for (const spell of data.spell) {
        const url = getSpellsUrl(spell.name, spell.source);
        const result: Spell = {
            name: spell.name,
            source: spell.source,
            level: parseSpellLevel(spell.level),
            school: parseSpellSchool(spell.school),
            casting_time: parseCastingTime(spell.time),
            range: parseRange(spell.range),
            components: parseComponents(spell.components),
            duration: parseDurationTime(spell.duration),
            url: url,
            image: getSpellImage(fluffs, spell.name, spell.source),
            description: parseDescriptions('', spell.entries),
            classes: [],
        };

        if (spell.entriesHigherLevel) {
            for (const entry of spell.entriesHigherLevel) {
                result.description.push(...parseDescriptions(entry.name, entry.entries));
            }
        }

        results.push(result);
    }

    return results;
}

function loadSpells(path: string): Spell[] {
    const results: Spell[] = [];
    const index = `${path}/index.json`;
    const sources = JSON.parse(readFileSync(index).toString());

    for (const [_, file] of Object.entries(sources)) {
        const spells = loadSpellsFromFile(`${path}/${file}`, `${path}/fluff-${file}`);
        results.push(...spells);
    }

    results.sort(spellCmp);

    return results;
}

function loadCasters(path: string): Map<string, Caster[]> {
    path = `${path}/sources.json`;
    const contents = JSON.parse(readFileSync(path).toString());
    const map: Map<string, Caster[]> = new Map();

    for (const [source, spells] of Object.entries(contents)) {
        for (const [spell, classes] of Object.entries(spells as any)) {
            const key = spellKey(spell, source);
            const casters: Caster[] = [];

            // Base classes
            for (const clazz of (classes as any).class || []) {
                casters.push({ name: clazz.name, source: clazz.source });
            }
            for (const clazz of (classes as any).classVariant || []) {
                casters.push({ name: clazz.name, source: clazz.source });
            }

            casters.sort(spellCmp);
            map.set(key, casters);
        }
    }

    return map;
}

export function getSpells(path: string): Spell[] {
    const spells = loadSpells(path);
    const casters = loadCasters(path);

    for (let i = 0; i < spells.length; i++) {
        const spellCasters = casters.get(spellKey(spells[i].name, spells[i].source)) || [];
        spells[i].classes.push(...spellCasters);
    }

    return spells;
}
