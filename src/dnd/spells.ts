import {
    Description,
    parseCastingTime,
    parseComponents,
    parseDescriptionFromTable,
    parseDescriptions,
    parseDurationTime,
    parseImageUrl,
    parseRange,
    parseSpellLevel,
    parseSpellSchool,
} from '../parser';
import { getSpellsUrl } from '../urls';
import { Databank } from '../data';

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

function getSpellImage(fluffs: any[], name: string, source: string): string | null {
    for (const fluff of fluffs) {
        if (fluff.name === name && fluff.source === source && fluff.images) {
            return parseImageUrl(fluff.images);
        }
    }
    return null;
}

function getSpellDescription(spell: any): Description[] {
    const descriptions = parseDescriptions('', spell.entries);
    if (spell.entriesHigherLevel) {
        for (const entry of spell.entriesHigherLevel) {
            // Specific case for LasterLlama's Conjure Aberration
            // TODO create a parseDescription function that handles a description immediately
            // Without relying on entry.name and entry.entries
            if (entry.type === 'table') {
                descriptions.push(parseDescriptionFromTable(entry));
            } else {
                descriptions.push(...parseDescriptions(entry.name, entry.entries));
            }
        }
    }
    return descriptions;
}

function getCasters(spell: any, sources: any[]): any[] {
    const fromSpell = spell.classes?.fromClassList || [];
    const fromSource = sources
        .filter((source) => source.spellName === spell.name && source.spellSource === spell.source)
        .map((source) => ({ name: source.casterName, source: source.casterSource }));

    const casters = [...fromSpell, ...fromSource].map((caster) => ({
        name: caster.name,
        source: caster.source,
    }));

    // Sort casters alphabetically
    casters.sort((a, b) => {
        if (a.name === b.name) {
            return a.source.localeCompare(b.source);
        } else {
            return a.name.localeCompare(b.name);
        }
    });

    return casters;
}

function getSpell(spell: any, fluffs: any[], sources: any): Spell {
    return {
        name: spell.name,
        source: spell.source,
        level: parseSpellLevel(spell.level),
        school: parseSpellSchool(spell.school),
        casting_time: parseCastingTime(spell.time, spell.meta),
        range: parseRange(spell.range),
        components: parseComponents(spell.components),
        duration: parseDurationTime(spell.duration),
        url: getSpellsUrl(spell.name, spell.source),
        image: getSpellImage(fluffs, spell.name, spell.source),
        description: getSpellDescription(spell),
        classes: getCasters(spell, sources),
    };
}

interface GetSpellsArgs {
    paths: string[];
    fluffPaths?: string[];
    sourcesPaths?: string[];
}

export function getSpells(databank: Databank): Spell[] {
    const spells = databank.spell;
    const fluffs = databank.spellFluff;
    const sources = databank.spellSource;

    const result = [];
    for (const spell of spells) {
        result.push(getSpell(spell, fluffs, sources));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
}
