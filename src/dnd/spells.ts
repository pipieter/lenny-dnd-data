import {
    Description,
    DescriptionType,
    parseCastingTime,
    parseComponents,
    parseDescriptionFromTable,
    parseDescriptions,
    parseDurationTime,
    parseImageUrl,
    parseMaterialComponents,
    parseRange,
    parseReprint,
    parseResist,
    parseSpellDamage,
    parseSpellLevel,
    parseSpellSchool,
    ReprintData,
} from '../parser';
import { getSpellsUrl } from '../urls';
import { Databank } from '../data';
import { Spell, SpellSource } from '../../5etools-collector/types/spell';
import { Fluff } from '../../5etools-collector/types/fluff';

interface Caster {
    name: string;
    source: string;
}

export interface SpellDamage {
    type: 'level' | 'upcast';
    scaling: { [key: number]: string };
}

export interface ParsedSpell {
    name: string;
    source: string;
    level: string;
    school: string;
    castingTime: string;
    range: string;
    components: string;
    material: string | null;
    duration: string;
    url: string;
    image: string | null;
    description: Description[];
    classes: Caster[];
    reprint: ReprintData | null;

    damageInflict: string[];
    damageResist: string[];
    damageVulnerable: string[];
    damageImmune: string[];
    conditionInflict: string[];
    conditionImmune: string[];
    savingThrow: string[];
    affectsCreatureType: string[];

    scaledDamage: SpellDamage[] | null;
}

function getSpellImage(fluffs: Fluff[], name: string, source: string): string | null {
    for (const fluff of fluffs) {
        if (fluff.name === name && fluff.source === source && fluff.images) {
            return parseImageUrl(fluff.images);
        }
    }
    return null;
}

function getSpellDescription(spell: Spell): Description[] {
    const descriptions = parseDescriptions('', spell.entries ?? []);
    if (spell.entriesHigherLevel) {
        for (const entry of spell.entriesHigherLevel) {
            // Specific case for LasterLlama's Conjure Aberration
            // TODO create a parseDescription function that handles a description immediately
            // Without relying on entry.name and entry.entries
            if (typeof entry === 'string') {
                descriptions.push({ name: '', type: DescriptionType.text, value: entry });
            } else if (entry.type === 'table') {
                descriptions.push(parseDescriptionFromTable(entry));
            } else if ('entries' in entry) {
                descriptions.push(...parseDescriptions(entry.name ?? '', entry.entries ?? []));
            }
        }
    }
    return descriptions;
}

function getCasters(spell: Spell, sources: SpellSource[]): Caster[] {
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

function getSpell(spell: Spell, fluffs: Fluff[], sources: SpellSource[], data: Databank): ParsedSpell {
    return {
        name: spell.name,
        source: spell.source,
        level: parseSpellLevel(spell.level),
        school: parseSpellSchool(spell.school ?? 'UNKNOWN', data),
        castingTime: parseCastingTime(spell.time, spell.meta),
        range: parseRange(spell.range),
        components: parseComponents(spell.components),
        material: parseMaterialComponents(spell.components),
        duration: parseDurationTime(spell.duration),
        url: getSpellsUrl(spell.name, spell.source),
        image: getSpellImage(fluffs, spell.name, spell.source),
        description: getSpellDescription(spell),
        classes: getCasters(spell, sources),
        reprint: parseReprint(spell),
        damageInflict: spell.damageInflict ?? [],
        damageResist: (spell.damageResist ?? []).map(parseResist),
        damageVulnerable: (spell.damageVulnerable ?? []).map(parseResist),
        damageImmune: (spell.damageImmune ?? []).map(parseResist),
        conditionInflict: spell.conditionInflict ?? [],
        conditionImmune: spell.conditionImmune ?? [],
        savingThrow: spell.savingThrow ?? [],
        affectsCreatureType: spell.affectsCreatureType ?? [],
        scaledDamage: parseSpellDamage(spell),
    };
}

export function getSpells(databank: Databank): ParsedSpell[] {
    const spells = databank.spell;
    const fluffs = databank.spellFluff;
    const sources = databank.spellSource;

    const result = [];
    for (const spell of spells) {
        result.push(getSpell(spell, fluffs, sources, databank));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
}
