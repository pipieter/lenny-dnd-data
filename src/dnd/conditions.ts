import { Fluff } from '../../5etools-collector/types/fluff';
import { Databank } from '../data';
import { Description, parseDescriptions, parseImageUrl, parseReprint, ReprintData } from '../parser';
import { getConditionsDiseasesUrl } from '../urls';

// Note, statuses and diseases also follow the same structure as Condition
export interface ParsedCondition {
    name: string;
    source: string;
    url: string;
    description: Description[];
    image: string | null;
    reprint: ReprintData | null;
}

function getConditions(type: string, data: Databank): ParsedCondition[] {
    const entries = data.get(type);
    const results: ParsedCondition[] = entries.map((entry) => {
        const result: ParsedCondition = {
            name: entry.name,
            source: entry.source,
            url: getConditionsDiseasesUrl(entry.name, entry.source),
            description: parseDescriptions('Description', entry.entries),
            image: null,
            reprint: parseReprint(entry),
        };

        const fluff = data.search<Fluff>(`${type}Fluff`, entry.name, entry.source);
        if (fluff?.images) {
            result.image = parseImageUrl(fluff.images);
        }

        return result;
    });

    return results;
}

export function getConditionsStatusesAndDiseases(data: Databank): {
    conditions: ParsedCondition[];
    diseases: ParsedCondition[];
} {
    const conditions: ParsedCondition[] = [];
    conditions.push(...getConditions('condition', data));
    conditions.push(...getConditions('status', data));
    const diseases = getConditions('disease', data);

    return { conditions, diseases };
}
