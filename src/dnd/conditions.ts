import { Condition } from '../../5etools-collector/types/condition';
import { Disease } from '../../5etools-collector/types/disease';
import { Fluff } from '../../5etools-collector/types/fluff';
import { Status } from '../../5etools-collector/types/status';
import { Databank } from '../data';
import { Description, ReprintData, parseDescriptions, parseImageUrl, parseReprint } from '../parser';
import { getConditionsDiseasesUrl } from '../urls';
import { findFluff } from '../util';

// Note, statuses and diseases also follow the same structure as Condition
export interface ParsedCondition {
    name: string;
    source: string;
    url: string;
    description: Description[];
    image: string | null;
    reprint: ReprintData | null;
}

function getConditions(conditions: (Condition | Disease | Status)[], fluffs: Fluff[]): ParsedCondition[] {
    return conditions.map((condition) => {
        const fluff = findFluff(condition, fluffs);
        return {
            name: condition.name,
            source: condition.source,
            url: getConditionsDiseasesUrl(condition.name, condition.source),
            description: parseDescriptions('', condition.entries),
            image: parseImageUrl(fluff?.images ?? []),
            reprint: parseReprint(condition),
        };
    });
}

export function getConditionsStatusesAndDiseases(data: Databank): {
    conditions: ParsedCondition[];
    diseases: ParsedCondition[];
} {
    const conditions: ParsedCondition[] = [
        ...getConditions(data.condition, data.conditionFluff),
        ...getConditions(data.status, data.statusFluff),
    ];
    const diseases = getConditions(data.disease, data.diseaseFluff);

    return { conditions, diseases };
}
