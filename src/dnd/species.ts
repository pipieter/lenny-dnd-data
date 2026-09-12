// Note: in the 5e.tools files this is still referred to as 'race'
import { handleCopy, resolveToBase } from '../5etools-conversion/copy';
import { Copyable } from '../../5etools-collector/types/internal/copy';
import { SpeciesFluffBase } from '../../5etools-collector/types/species';
import { Databank } from '../data';
import {
    Description,
    ProficiencyOptions,
    ReprintData,
    parseDescriptions,
    parseImageUrl,
    parseReprint,
    parseSizes,
    parseSkillProficiency,
    parseSpeed,
} from '../parser';
import { getSpeciesUrl } from '../urls';
import { findFluff, joinStringsWithOr } from '../util';

export interface ParsedSpecies {
    name: string;
    source: string;
    url: string;
    image: string | null;
    sizes: string;
    speed: string | null;
    creatureType: string | null;
    description: Description[];
    info: Description[];
    skillProficiencies: null | ProficiencyOptions;
    reprint: ReprintData | null;
}

export function getSpecies(data: Databank): ParsedSpecies[] {
    return data.race.flatMap((race) => {
        return resolveToBase(race, data.race).map((entry) => {
            const name = entry.name;
            const source = entry.source;
            let fluff = findFluff(entry, data.raceFluff) as SpeciesFluffBase | Copyable<SpeciesFluffBase> | undefined;
            if (fluff) fluff = handleCopy(fluff, data.raceFluff);

            return {
                name,
                source,
                url: getSpeciesUrl(name, source),
                image: parseImageUrl(fluff?.images ?? []) ?? null,
                sizes: parseSizes(entry.size ?? []),
                speed: parseSpeed(entry.speed),
                creatureType: entry.creatureTypes ? joinStringsWithOr(entry.creatureTypes, true) : null,
                description: parseDescriptions('', entry.entries || []),
                info: parseDescriptions('', fluff?.entries ?? []),
                skillProficiencies: parseSkillProficiency(entry.skillProficiencies),
                reprint: parseReprint(entry),
            };
        });
    });
}
