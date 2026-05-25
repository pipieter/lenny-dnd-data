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

function parseBackgroundDescription(background: any): Description[] {
    // The first entry of the background is a formatted re-cap of the
    // abilities, feats, and items of the background, and should thus
    // be removed
    const entries = background.entries.slice(1);
    return parseDescriptions('', entries);
}

function getPreformattedBackgroundValue(background: any, name: string): string | null {
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
        if (item.name.trim() === name.trim()) {
            if (item.entry) {
                return cleanDNDText(item.entry, true) || null;
            }
            if (item.entries) {
                return cleanDNDText(item.entries[0], true) || null;
            }
            throw `Unsupported getPreformattedBackgroundValue entry '${JSON.stringify(item)}'`;
        }
    }
    return null;
}

function parseBackgroundAbilities(background: any): string[] {
    if (!background.ability) return [];
    const abilities = background.ability[0].choose.weighted.from;
    return abilities.map(parseAbilityScore);
}

function parseBackgroundFeats(background: any): string | null {
    return getPreformattedBackgroundValue(background, 'Feat:');
}

function parseSkillProficiencies(background: any): string | null {
    return getPreformattedBackgroundValue(background, 'Skill Proficiencies:');
}

function parseToolProficiencies(background: any): string | null {
    return (
        getPreformattedBackgroundValue(background, 'Tool Proficiencies:') ||
        getPreformattedBackgroundValue(background, 'Tool Proficiency:')
    );
}

function parseLanguages(background: any): string | null {
    return getPreformattedBackgroundValue(background, 'Languages:');
}

function parseEquipment(background: any): string | null {
    return getPreformattedBackgroundValue(background, 'Equipment:');
}

function parseBackgroundFluff(fluff: any | null): Description[] {
    if (!fluff || !fluff.entries) return [];

    return parseDescriptions('', fluff.entries);
}

export function getBackgrounds(databank: Databank): ParsedBackground[] {
    const raw: any[] = databank.background.map((e: any) => handleCopy(e, databank.background));

    const excluded = ['Custom Background']; // These backgrounds will not be added to the databank, as they don't represent actual backgrounds
    const filtered = raw.filter((background) => !excluded.includes(background.name));

    return filtered.map((background: any) => {
        const fluff = databank.search('backgroundFluff', background.name, background.source);
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
