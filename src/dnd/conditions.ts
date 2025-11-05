import { Condition, ConditionFluff, Disease, Status } from '../interfaces';
import { Description, parseDescriptions, parseImageUrl } from '../parser';
import { getConditionsDiseasesUrl } from '../urls';
import {
    ConditionFluffValidator,
    ConditionValidator,
    DiseaseValidator,
    StatusValidator,
} from '../validate';

interface ParsedCondition {
    name: string;
    source: string;
    url: string;
    description: Description[];
    image: string | null;
}

function getConditions(
    conditions: (Condition | Disease | Status)[],
    fluffs: ConditionFluff[]
): ParsedCondition[] {
    const parsed: ParsedCondition[] = [];

    for (const condition of conditions) {
        let image = null;
        for (const fluff of fluffs) {
            if (fluff.name === condition.name && fluff.source === condition.source) {
                image = parseImageUrl(fluff.images);
            }
        }

        parsed.push({
            name: condition.name,
            source: condition.source,
            url: getConditionsDiseasesUrl(condition),
            description: parseDescriptions('Description', condition.entries),
            image,
        });
    }

    return parsed;
}

export function getConditionsStatusesAndDiseases(data: any): {
    conditions: ParsedCondition[];
    diseases: ParsedCondition[];
} {
    const conditions = ConditionValidator.validate(data.condition);
    const conditionFluffs = ConditionFluffValidator.validate(data.conditionFluff);
    const diseases = DiseaseValidator.validate(data.disease);
    const statuses = StatusValidator.validate(data.status);

    const parsedConditions = [
        ...getConditions(conditions, conditionFluffs),
        ...getConditions(statuses, []),
    ];
    const parsedDiseases = getConditions(diseases, []);

    return { conditions: parsedConditions, diseases: parsedDiseases };
}
