import { Databank } from '../data';
import { capitalize, Description, parseDescriptions, parseReprint, ReprintData } from '../parser';
import { getTrapsUrl } from '../urls';

export interface Hazard {
    name: string;
    source: string;
    trapHazType?: string;
    entries: (string | any)[];
}

export interface ParsedHazard {
    name: string;
    source: string;
    subtitle: string;
    url: string;
    description: Description[];
    reprint: ReprintData | null;
}

function getTrapHazardSubtitle(hazard: Hazard, suffix: string): string {
    if (!hazard.trapHazType) return capitalize(suffix);

    const typeMap: Record<string, string> = {
        MECH: 'Mechanical',
        SMPL: 'Simple',
        TRP: ' ', // Must have a space, to register in the return check.
        HAUNT: 'Haunted',
        MAG: 'Magic',
        CMPX: 'Complex',
        WLD: 'Wilderness',
        WTH: 'Weather',
        ENV: 'Environmental',
        EST: 'Eldritch',
        GEN: 'General',
    };
    const type = typeMap[hazard.trapHazType];
    if (type) return capitalize(`${type} ${suffix}`.trim());

    throw `Unsupported trap/hazard type in ${hazard.name}: ${hazard.trapHazType}`;
}

export function getTrapsAndHazards(data: Databank): {
    traps: ParsedHazard[];
    hazards: ParsedHazard[];
} {
    const traps = data.trap.map((trap) => {
        return {
            name: trap.name,
            source: trap.source,
            subtitle: getTrapHazardSubtitle(trap, 'trap'),
            url: getTrapsUrl(trap.name, trap.source),
            description: trap.entries ? parseDescriptions('', trap.entries) : [],
            reprint: parseReprint(trap),
        };
    });

    const hazards = data.hazard.map((hazard) => {
        return {
            name: hazard.name,
            source: hazard.source,
            subtitle: getTrapHazardSubtitle(hazard, 'hazard'),
            url: getTrapsUrl(hazard.name, hazard.source),
            description: hazard.entries ? parseDescriptions('', hazard.entries) : [],
            reprint: parseReprint(hazard),
        };
    });

    return { traps, hazards };
}
