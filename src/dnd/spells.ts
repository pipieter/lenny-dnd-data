import {
    Description,
    parseCastingTime,
    parseComponents,
    parseDescriptionFromTable,
    parseDescriptions,
    parseDurationTime,
    parseImageUrl,
    parseRange,
    parseReprint,
    parseSpellLevel,
    parseSpellSchool,
    ReprintData,
} from '../parser';
import { getSpellsUrl } from '../urls';
import { Databank } from '../data';

interface Caster {
    name: string;
    source: string;
}

interface SpellDamage {
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

function getSpellDamage(spell: any): SpellDamage[] | null {
    if (spell.scalingLevelDice) {
        const results: SpellDamage[] = [];
        const scalingList = Array.isArray(spell.scalingLevelDice) ? spell.scalingLevelDice : [spell.scalingLevelDice];

        for (const scaleObj of scalingList) {
            if (scaleObj && scaleObj.scaling) {
                const scaling: { [key: string]: string } = {};
                for (const [key, value] of Object.entries(scaleObj.scaling)) {
                    scaling[String(key)] = String(value);
                }
                results.push({ type: 'level', scaling });
            }
        }

        return results;
    }

    const raw = [...(spell.entries || [])];
    if (spell.entriesHigherLevel) {
        raw.push(...spell.entriesHigherLevel);
    }

    const entriesText: string[] = [];
    function pushEntryTexts(entries: any) {
        for (const entry of entries) {
            if (typeof entry === 'string') {
                entriesText.push(entry);
            } else if (entry && entry.entries) {
                pushEntryTexts(entry.entries);
            }
        }
    }
    pushEntryTexts(raw);

    const scaleDamageRegex = /{@scaledamage\s+([^}]+)}/;
    for (const entry of entriesText) {
        const match = entry.match(scaleDamageRegex);
        if (!match) continue;

        const tagContent = match[1];
        const [baseDamage, levels, scalingDice] = tagContent.split('|');

        const baseLevel = parseInt(levels.split('-')[0]);
        const baseDiceMatch = baseDamage.match(/^(\d+)(d\d+)/);
        const scaleDiceMatch = scalingDice.match(/^(\d+)/);

        if (!baseDiceMatch || !scaleDiceMatch) continue;

        const baseDiceCount = parseInt(baseDiceMatch[1]);
        const diceFaces = baseDiceMatch[2];
        const scaleDiceCount = parseInt(scaleDiceMatch[1]);

        const scaling: { [key: string]: string } = {};

        for (let lvl = baseLevel; lvl <= 9; lvl++) {
            if (lvl === baseLevel) {
                scaling[String(lvl)] = baseDamage;
            } else {
                const levelDiff = lvl - baseLevel;
                const currentDiceCount = baseDiceCount + levelDiff * scaleDiceCount;
                scaling[String(lvl)] = `${currentDiceCount}${diceFaces}`;
            }
        }

        return [{ type: 'upcast', scaling }];
    }

    return null;
}

function getSpellMaterial(spell: any): string | null {
    if (!spell.components.m) return null;
    const material = spell.components.m;
    if (typeof material === 'string') return material;
    return material.text;
}

function getSpell(spell: any, fluffs: any[], sources: any): ParsedSpell {
    return {
        name: spell.name,
        source: spell.source,
        level: parseSpellLevel(spell.level),
        school: parseSpellSchool(spell.school),
        castingTime: parseCastingTime(spell.time, spell.meta),
        range: parseRange(spell.range),
        components: parseComponents(spell.components),
        material: getSpellMaterial(spell),
        duration: parseDurationTime(spell.duration),
        url: getSpellsUrl(spell.name, spell.source),
        image: getSpellImage(fluffs, spell.name, spell.source),
        description: getSpellDescription(spell),
        classes: getCasters(spell, sources),
        reprint: parseReprint(spell),
        damageInflict: spell.damageInflict ?? [],
        damageResist: spell.damageResist ?? [],
        damageVulnerable: spell.damageVulnerable ?? [],
        damageImmune: spell.damageImmune ?? [],
        conditionInflict: spell.conditionInflict ?? [],
        conditionImmune: spell.conditionImmune ?? [],
        savingThrow: spell.savingThrow ?? [],
        affectsCreatureType: spell.affectsCreatureType ?? [],
        scaledDamage: getSpellDamage(spell),
    };
}

export function getSpells(databank: Databank): ParsedSpell[] {
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
