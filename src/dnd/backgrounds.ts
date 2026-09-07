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
import { findEntryFluff, variadic } from '../util';

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

function parseBackgroundDescription(background: any): Description[] {
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
    if (entries.type !== 'list') {
        throw `getPreformattedBackgroundValue: The first entry is required to be a list, instead received a ${entries.type}: ${JSON.stringify(background)}`;
    }

    for (const item of entries.items) {
        if (item.name.trim() !== name.trim()) continue;
        if (item.entry) return cleanDNDText(item.entry, true) || null;
        if (item.entries) return cleanDNDText(item.entries[0], true) || null;
        throw `Unsupported getPreformattedBackgroundValue entry '${JSON.stringify(item)}'`;
    }
    return null;
}

function parseBackgroundAbilities(background: Background): string[] {
    if (!background.ability || !background.ability[0].choose) return [];
    const choose = variadic(background.ability[0].choose)[0];

    if (!choose.weighted) return [];
    const abilities = choose.weighted.from;
    return abilities.map(parseAbilityScore);
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

function parseBackgroundFluff(fluff?: Fluff): Description[] {
    if (!fluff || !fluff.entries) return [];
    return parseDescriptions('', fluff.entries);
}

export function getBackgrounds(data: Databank): ParsedBackground[] {
    return data.background.map((background: any) => {
        background = handleCopy(background, data.background);
        const fluff = findEntryFluff(background, data.backgroundFluff);

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
