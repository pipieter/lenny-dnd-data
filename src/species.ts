// Note: in the files this is still referred to as 'race'

import { capitalize, Description, parseImageUrl } from './parser';
import { getSpeciesUrl } from './urls';
import { joinStringsWithOr } from './util';

const Sizes = new Map<string, string>([
    ['F', 'Fine'],
    ['D', 'Diminutive'],
    ['T', 'Tiny'],
    ['S', 'Small'],
    ['M', 'Medium'],
    ['L', 'Large'],
    ['H', 'Huge'],
    ['G', 'Gargantuan'],
    ['C', 'Colossal'],
    ['V', 'Varies'],
]); // parser.js:2947

const SpecialSpeedTypes = [/*'walk,'*/ 'burrow', 'climb', 'fly', 'swim']; // parser.js:333

interface Species {
    name: string;
    source: string;
    url: string;
    image: string | null;
    sizes: string[];
    speed: string;
    creatureType: string;
    abilityScores: string[] | null;
    languages: string[];
    pronunciation: string | null;
    entries: Description[];
    info: Description[];
}


function speciesSort(a: Species, b: Species): number {
    if (a.name === b.name) {
        return a.source.localeCompare(b.source);
    }
    return a.name.localeCompare(b.name);
}

function getSpeciesImage(data: any, name: string, source: string): string | null {
    for (const fluff of data.raceFluff) {
        if (fluff.name === name && fluff.source === source && fluff.images) {
            return parseImageUrl(fluff.images);
        }
    }
    return null;
}

function getSpeciesSizes(sizes: string[]) {
    return sizes.map(Sizes.get).filter((s) => s !== undefined);
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
    const species: Species[] = [];

    for (const entry of data.race) {
        let name = entry.name;
        if (entry.raceName) {
            name = `${entry.raceName} (${entry.name})`;
        }
        const source = entry.source;
        const url = getSpeciesUrl(name, source);
        const image = getSpeciesImage(data, name, source);
        const sizes = getSpeciesSizes(entry.size);
        const speed = getSpeciesSpeed(entry.speed);
        const creatureType = getSpeciesCreatureType(entry.creatureTypes);
        // TODO abilityScores: string[] | null;
        // TODO languages: string[];
        // TODO pronunciation: string | null;
        // TODO entries: Description[];
        // TODO info: Description[];
        // TODO _copy
    }

    return [];
}
