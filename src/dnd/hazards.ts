import { Hazard } from '../../5etools-collector/types/hazard';
import { Databank } from '../data';
import { ReprintData, parseReprint } from '../parse/base';
import { Description, parseDescriptions } from '../parse/description';
import { getTrapsUrl } from '../parse/urls';
import { Variables } from '../parse/variables';
import { capitalize } from '../util';

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

    const type = Variables.getTrapType(hazard.trapHazType);
    if (type) {
        return type;
    }

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
            description: parseDescriptions('', trap.entries ?? []),
            reprint: parseReprint(trap),
        };
    });

    const hazards = data.hazard.map((hazard) => {
        return {
            name: hazard.name,
            source: hazard.source,
            subtitle: getTrapHazardSubtitle(hazard, 'hazard'),
            url: getTrapsUrl(hazard.name, hazard.source),
            description: parseDescriptions('', hazard.entries ?? []),
            reprint: parseReprint(hazard),
        };
    });

    return { traps, hazards };
}
