import { Background } from '../../5etools-collector/types/background';
import { Fluff } from '../../5etools-collector/types/fluff';
import { handleCopy } from '../5etools-conversion/copy';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import {
    Description,
    parseAbilityScore,
    parseDescriptions,
    parsePrerequisite,
    parseReprint,
    parseSkillProficiency,
    ProficiencyOptions,
    ReprintData,
} from '../parser';
import { getBackgroundsUrl } from '../urls';

export interface ParsedBackground {
    name: string;
    source: string;
    url: string;
    abilities: string[];
    feat: string | null;
    skills: string | null;
    tools: string | null;
    languages: string | null;
    equipment: string | null;
    prerequisite: string | null;
    description: Description[];
    fluff: Description[];
    skillProficiencies: ProficiencyOptions | null;
    reprint: ReprintData | null;
}

function parseBackgroundDescription(background: Background): Description[] {
    if (!background.entries) return [];

    // The first entry of the background is a formatted re-cap of the
    // abilities, feats, and items of the background, and should thus
    // be removed
    const entries = background.entries.slice(1);
    return parseDescriptions('', entries);
}

function getPreformattedBackgroundValue(background: Background, name: string): string | null {
    if (!background.entries) return null;

    // The first entry of the background is a formatted re-cap of the
    // abilities, feats, and items of the background. Because 5e.tools
    // already formatted everything into a nice format, these can be
    // taken for a nice result without having to do any manual parsing.
    // Sometimes it is possible that the first entry is a string instead, usually comments about the class and how to use it.

    const entries = typeof background.entries[0] !== 'string' ? background.entries[0] : background.entries[1];
    if (typeof entries === 'string' || entries.type !== 'list') {
        throw `getPreformattedBackgroundValue: The first entry is required to be a list, instead received a ${entries}: ${JSON.stringify(background)}`;
    }

    for (const item of entries.items) {
        if (typeof item === 'string') {
            return cleanDNDText(item);
        }

        if (!('name' in item) || item.name?.trim() !== name.trim()) {
            continue;
        }

        let entry: string | null = null;
        if ('entry' in item && item.entry && typeof item.entry === 'string') {
            entry = item.entry;
        }
        if ('entries' in item && typeof item.entries?.[0] === 'string') {
            entry = item.entries[0];
        }

        if (entry) {
            return cleanDNDText(entry, true) || null;
        }

        throw `Unsupported getPreformattedBackgroundValue entry '${JSON.stringify(item)}'`;
    }
    return null;
}

function parseBackgroundAbilities(background: Background): string[] {
    if (!background.ability) return [];

    const abilities = background.ability.flatMap((ability) => ability.choose).filter((ability) => !!ability);
    const names = abilities[0].from ?? abilities[0].weighted?.from ?? [];
    return names.map(parseAbilityScore);
}

function parseBackgroundFeats(background: Background): string | null {
    return getPreformattedBackgroundValue(background, 'Feat:');
}

function parseSkillProficiencies(background: Background): string | null {
    return getPreformattedBackgroundValue(background, 'Skill Proficiencies:');
}

function parseToolProficiencies(background: Background): string | null {
    return (
        getPreformattedBackgroundValue(background, 'Tool Proficiencies:') ||
        getPreformattedBackgroundValue(background, 'Tool Proficiency:')
    );
}

function parseLanguages(background: Background): string | null {
    return getPreformattedBackgroundValue(background, 'Languages:');
}

function parseEquipment(background: Background): string | null {
    return getPreformattedBackgroundValue(background, 'Equipment:');
}

function parseBackgroundFluff(fluff: Fluff | null | undefined): Description[] {
    if (!fluff || !fluff.entries) return [];

    return parseDescriptions('', fluff.entries);
}

export function getBackgrounds(databank: Databank): ParsedBackground[] {
    const backgrounds = databank.background.map((e: any) => handleCopy(e, databank.background));

    const excluded = ['Custom Background']; // These backgrounds will not be added to the databank, as they don't represent actual backgrounds
    const filtered = backgrounds.filter((background) => !excluded.includes(background.name));

    return filtered.map((background: any) => {
        const fluff = databank.search<Fluff>('backgroundFluff', background.name, background.source);
        return {
            name: background.name,
            source: background.source,
            url: getBackgroundsUrl(background.name, background.source),
            abilities: parseBackgroundAbilities(background),
            feat: parseBackgroundFeats(background),
            skills: parseSkillProficiencies(background),
            tools: parseToolProficiencies(background),
            languages: parseLanguages(background),
            equipment: parseEquipment(background),
            description: parseBackgroundDescription(background),
            prerequisite: parsePrerequisite((background.prerequisite ?? [])[0]),
            fluff: parseBackgroundFluff(fluff),
            skillProficiencies: parseSkillProficiency(background.skillProficiencies),
            reprint: parseReprint(background),
        };
    });
}
