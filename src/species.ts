// Note: in the files this is still referred to as 'race'

import { capitalize, Description, parseDescriptions, parseImageUrl } from './parser';
import { getSpeciesUrl } from './urls';
import { joinStringsWithOr } from './util';
import { handleCopy, handleVersions } from './5etools-conversion/copy';
import { CreatureSizes } from './5etools-conversion/data';

const SpecialSpeedTypes = [/*'walk,'*/ 'burrow', 'climb', 'fly', 'swim']; // parser.js:333

interface Species {
    name: string;
    source: string;
    url: string;
    image: string | null;
    sizes: string[];
    speed: string;
    creatureType: string;
    entries: Description[];
    info: Description[];
}

function speciesSort(a: Species, b: Species): number {
    if (a.name === b.name) {
        return a.source.localeCompare(b.source);
    }
    return a.name.localeCompare(b.name);
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
        if (CreatureSizes.has(size)) {
            results.push(CreatureSizes.get(size)!);
        }
    }
    return results;
}

function getSpeciesSpeed(speed: any): string {
    if (!speed) {
        return '-';
    }

    if (typeof speed === 'number') {
        return `${speed} feet`;
    }

    const speeds = [];
    if (speed.walk) {
        speeds.push(`${speed.walk} feet`);
    }

    for (const type of SpecialSpeedTypes) {
        if (speed[type] === true) {
            speeds.push(`${capitalize(type)} equal to your walking speed`);
        } else if (speed[type]) {
            speeds.push(`${capitalize(type)} ${speed[type]} feet`);
        }
    }

    return speeds.join(', ');
}

function getSpeciesCreatureType(creatureTypes: string[]): string {
    return joinStringsWithOr(creatureTypes, true) || '-';
}

export function getSpecies(data: any): Species[] {
    // Get raw entries, handling _copy and _versions
    const raw: any[] = [];
    for (const entry of data.race) {
        const copy = handleCopy(entry, data.race);
        const versions = [];

        if (copy._versions) {
            versions.push(...handleVersions(copy));
            delete copy._versions;
        }

        raw.push(entry, ...versions);
    }

    // Parse raw entries, at this point every raw entry *should* have all the required data
    const species: Species[] = [];

    for (const entry of raw) {
        let name = entry.name;
        if (entry.raceName) {
            name = `${entry.raceName} (${entry.name})`;
        }
        const source = entry.source;
        const url = getSpeciesUrl(name, source);
        const image = getSpeciesImage(data, name, source);
        const sizes = getSpeciesSizes(entry.size || []);
        const speed = getSpeciesSpeed(entry.speed);
        const creatureType = getSpeciesCreatureType(entry.creatureTypes || []);
        const entries = parseDescriptions('', entry.entries || []);
        const info = getSpeciesInfo(data, name, source);

        species.push({
            name,
            source,
            url,
            image,
            sizes,
            speed,
            creatureType,
            entries,
            info,
        });
    }

    return species;
}
