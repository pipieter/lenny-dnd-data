// Note: in the 5e.tools files this is still referred to as 'race'
import { handleCopy, resolveToBase } from '../5etools-conversion/copy';
import { Databank } from '../data';
import {
    Description,
    ProficiencyOptions,
    ReprintData,
    capitalize,
    parseDescriptions,
    parseImageUrl,
    parseReprint,
    parseSkillProficiency,
} from '../parser';
import { getSpeciesUrl } from '../urls';
import { joinStringsWithOr } from '../util';
import { Variables } from '../variables';

export interface ParsedSpecies {
    name: string;
    source: string;
    url: string;
    image: string | null;
    sizes: string[];
    speed: string[];
    creatureType: string | null;
    description: Description[];
    info: Description[];
    skillProficiencies: null | ProficiencyOptions;
    reprint: ReprintData | null;
}

function getSpeciesFluff(data: any, name: string, source: string): any | null {
    let found: any | null = null;
    for (const fluff of data.raceFluff) {
        if (fluff.name === name && fluff.source === source) {
            found = fluff;
            break;
        }
    }

    if (!found) return null;
    return handleCopy(found, data.raceFluff);
}

function getSpeciesImage(data: any, name: string, source: string): string | null {
    const fluff = getSpeciesFluff(data, name, source);
    if (fluff?.images) {
        return parseImageUrl(fluff.images);
    }
    return null;
}

function getSpeciesInfo(data: any, name: string, source: string): Description[] {
    const fluff = getSpeciesFluff(data, name, source);
    if (fluff?.entries) {
        return parseDescriptions('', fluff.entries);
    }
    return [];
}

function getSpeciesSizes(sizes: string[]) {
    const results: string[] = [];
    for (const size of sizes) {
        const name = Variables.getSizeName(size);
        if (name) {
            results.push(name);
        }
    }
    return results;
}

function getSpeciesSpeed(speed: any): string[] {
    if (!speed) {
        return [];
    }

    if (typeof speed === 'number') {
        return [`${speed} feet`];
    }

    const speeds = [];
    if (speed.walk) {
        speeds.push(`${speed.walk} feet`);
    }

    for (const type of Variables.getSpecialSpeedTypes()) {
        if (speed[type] === true) {
            speeds.push(`${capitalize(type)} equal to your walking speed`);
        } else if (speed[type]) {
            speeds.push(`${capitalize(type)} ${speed[type]} feet`);
        }
    }

    return speeds;
}

function getSpeciesCreatureType(creatureTypes: string[]): string | null {
    return joinStringsWithOr(creatureTypes, true) || null;
}

export function getSpecies(data: Databank): ParsedSpecies[] {
    return data.race.flatMap((race) => {
        return resolveToBase(race, data.race).map((entry) => {
            const name = entry.name;
            const source = entry.source;

            return{
                name,
                source,
                url: getSpeciesUrl(name, source),
                image: getSpeciesImage(data, name, source) ?? null,
                sizes: getSpeciesSizes(entry.size || []),
                speed: getSpeciesSpeed(entry.speed),
                creatureType: getSpeciesCreatureType(entry.creatureTypes || []),
                description: parseDescriptions('', entry.entries || []),
                info: getSpeciesInfo(data, name, source),
                skillProficiencies: parseSkillProficiency(entry.skillProficiencies),
                reprint: parseReprint(entry),
            };
        })
    })
}
