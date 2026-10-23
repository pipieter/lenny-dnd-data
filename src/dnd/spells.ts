import { handleCopy } from '../5etools-conversion/copy';
import { SpellBase, SpellSource } from '../../5etools-collector/types/spell';
import { Databank } from '../data';
import {
    ReprintData,
    parseCastingTime,
    parseComponents,
    parseDuration,
    parseMaterialComponents,
    parseRange,
    parseReprint,
    parseResists,
    parseSpellLevel,
    parseSpellSchool,
} from '../parse/base';
import { Description, DescriptionType, parseDescriptionFromTable, parseDescriptions } from '../parse/description';
import { getEntryImageUrl, getSpellsUrl } from '../parse/urls';
import { entrySort, findFluff } from '../util';

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

export function parseSpellDamage(spell: any): SpellDamage[] | null {
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

function getSpellDescription(spell: SpellBase): Description[] {
    const descriptions = parseDescriptions('', spell.entries ?? []);
    if (spell.entriesHigherLevel) {
        for (const entry of spell.entriesHigherLevel) {
            if (typeof entry === 'string') {
                descriptions.push({ name: '', type: DescriptionType.text, value: entry });
            }
            // Specific case for LasterLlama's Conjure Aberration
            // TODO create a parseDescription function that handles a description immediately
            // Without relying on entry.name and entry.entries
            else if (entry.type === 'table') {
                descriptions.push(parseDescriptionFromTable(entry));
            } else if ('name' in entry && 'entries' in entry) {
                descriptions.push(...parseDescriptions(entry.name ?? '', entry.entries ?? []));
            } else {
                throw new Error(`Unsupported spell.entriesHigherLevel entry: ${JSON.stringify(entry)}`);
            }
        }
    }
    return descriptions;
}

function getCasters(spell: SpellBase, sources: SpellSource[]): any[] {
    const fromSpell = spell.classes?.fromClassList || [];
    const fromSource = sources
        .filter((source) => source.spellName === spell.name && source.spellSource === spell.source)
        .map((source) => ({ name: source.casterName, source: source.casterSource }));

    const casters = [...fromSpell, ...fromSource].map((caster) => ({
        name: caster.name,
        source: caster.source,
    }));

    // Sort casters alphabetically
    casters.sort(entrySort);

    return casters;
}

function getSpell(spell: SpellBase, fluffs: any[], sources: any, data: Databank): ParsedSpell {
    const fluff = findFluff(spell, fluffs);
    const fluffImage = fluff?.images?.[0];

    return {
        name: spell.name,
        source: spell.source,
        level: parseSpellLevel(spell.level),
        school: parseSpellSchool(spell.school, spell.source, data),
        castingTime: parseCastingTime(spell.time, spell.meta),
        range: parseRange(spell.range),
        components: parseComponents(spell.components),
        material: parseMaterialComponents(spell.components),
        duration: parseDuration(spell.duration),
        url: getSpellsUrl(spell.name, spell.source),
        image: getEntryImageUrl(fluffImage),
        description: getSpellDescription(spell),
        classes: getCasters(spell, sources),
        reprint: parseReprint(spell),
        damageInflict: spell.damageInflict ?? [],
        damageResist: parseResists(spell.damageResist),
        damageVulnerable: parseResists(spell.damageVulnerable),
        damageImmune: parseResists(spell.damageImmune),
        conditionInflict: spell.conditionInflict ?? [],
        conditionImmune: spell.conditionImmune ?? [],
        savingThrow: spell.savingThrow ?? [],
        affectsCreatureType: spell.affectsCreatureType ?? [],
        scaledDamage: parseSpellDamage(spell),
    };
}

export function getSpells(data: Databank): ParsedSpell[] {
    return data.spell.map((base) => {
        const spell = handleCopy(base, data.spell);
        return getSpell(spell, data.spellFluff, data.spellSource, data);
    });
}
