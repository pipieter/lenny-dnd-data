import { Databank } from '../data';
import { Description, parseDescriptions, parseImageUrl } from '../parser';
import { getConditionsDiseasesUrl } from '../urls';

// Note, statuses and diseases also follow the same structure as Condition
interface Condition {
    name: string;
    source: string;
    url: string;
    description: Description[];
    image: string | null;
}

function getConditions(type: string, data: Databank): Condition[] {
    const entries = data.get(type);
    const results: Condition[] = entries.map((entry) => {
        const result: Condition = {
            name: entry.name,
            source: entry.source,
            url: getConditionsDiseasesUrl(entry.name, entry.source),
            description: parseDescriptions('Description', entry.entries),
            image: null,
        };

        const fluff = data.search(`${type}Fluff`, entry.name, entry.source);
        if (fluff && fluff.images) {
            result.image = parseImageUrl(fluff.images);
        }

        return result;
    });

    return results;
}

export function getConditionsStatusesAndDiseases(data: Databank): {
    conditions: Condition[];
    diseases: Condition[];
} {
    const conditions: Condition[] = [];
    conditions.push(...getConditions('condition', data));
    conditions.push(...getConditions('status', data));
    const diseases = getConditions('disease', data);

    return { conditions, diseases };
}
