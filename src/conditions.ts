import { Description, parseDescriptions, parseImageUrl } from './parser';
import { getConditionsDiseasesUrl } from './urls';

// Note, statuses and diseases also follow the same structure as Condition
interface Condition {
    name: string;
    source: string;
    url: string;
    description: Description[];
    image: string | null;
}

function getConditions(type: string, data: any): Condition[] {
    const results: Condition[] = [];

    const entries = data[type] || [];
    const fluffs = data[`${type}Fluff`] || [];
    for (const entry of entries) {
        const url = getConditionsDiseasesUrl(entry.name, entry.source);
        const result: Condition = {
            name: entry.name,
            source: entry.source,
            url: url,
            description: parseDescriptions('Description', entry.entries),
            image: null,
        };

        for (const fluff of fluffs) {
            if (fluff.name == entry.name && fluff.source == entry.source) {
                if (fluff.images) {
                    result.image = parseImageUrl(fluff.images);
                }
            }
        }

        results.push(result);
    }

    return results;
}

export function getConditionsStatusesAndDiseases(data: any): {
    conditions: Condition[];
    diseases: Condition[];
} {
    const conditions: Condition[] = [];
    conditions.push(...getConditions('condition', data));
    conditions.push(...getConditions('status', data));
    const diseases = getConditions('disease', data);

    return { conditions, diseases };
}
