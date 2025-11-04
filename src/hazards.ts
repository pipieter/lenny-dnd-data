import { subscribe } from "diagnostics_channel";
import { Description, parseDescriptions } from "./parser";
import { getTrapsUrl } from "./urls";

interface Hazard {
    name: string;
    source: string;
    trapHazType: string;
    entries: (string | any)[];
}

interface ParsedHazard {
    name: string;
    source: string;
    // subtitle: string;
    url: string;
    description: Description[];
}

function getTrapHazardSubtitle(hazard: Hazard, suffix: string): string {
    const typeMap: Record<string, string> = {
        MECH: 'Mechanical',
        SMPL: 'Simple',
        TRP: '',
        HAUNT: 'Haunted',
        MAG: 'Magic',
        CMPX: 'Complex',
        WLD: 'Wilderness'
    };
    const type = typeMap[hazard.trapHazType];
    if (type) return `${type} ${suffix}`;

    throw `Unsupported trap/hazard type in ${hazard.name}: ${hazard.trapHazType}`;
}

export function getTrapsAndHazards(data: any): {
    traps: ParsedHazard[];
    hazards: ParsedHazard[];
} {
    const traps = (data.trap as Hazard[]).map((trap) => {
            return {
                name: trap.name,
                source: trap.source,
                // subtitle: getTrapHazardSubtitle(trap, 'trap'),
                url: getTrapsUrl(trap.name, trap.source),
                description: trap.entries ? parseDescriptions('', trap.entries) : [],
            };
        });

    const hazards = (data.hazard as Hazard[]).map((hazard) => {
            return {
                name: hazard.name,
                source: hazard.source,
                // subtitle: getTrapHazardSubtitle(hazard, 'hazard'),
                url: getTrapsUrl(hazard.name, hazard.source),
                description: hazard.entries ? parseDescriptions('', hazard.entries) : [],
            };
        });

    return {traps, hazards};
}