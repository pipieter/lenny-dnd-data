import { Feat } from '../../5etools-collector/types/feat';
import { Databank } from '../data';
import {
    Description,
    ReprintData,
    parseAbilityScore,
    parseDescriptions,
    parseFeatCategory,
    parsePrerequisite,
    parseReprint,
} from '../parser';
import { getFeatsUrl } from '../urls';
import { joinStringsWithOr, variadic } from '../util';

export interface ParsedFeat {
    name: string;
    source: string;
    url: string;
    type: string;
    prerequisite: string | null;
    abilityIncrease: string | null;
    description: Description[];
    reprint: ReprintData | null;
}

function getFeatAbilityIncrease(feat: Feat): string | null {
    if (!feat.ability) return null;

    const result: string[] = [];

    for (const ability of feat.ability) {
        if (ability.hidden) continue;

        const max = ability.max || 20;
        if (ability.choose) {
            // Prefer explicit entry if present
            const choose = variadic(ability.choose);
            if (choose.length === 0) continue;
            if (choose.length === 1 && choose[0].entry) {
                result.push(choose[0].entry);
                continue;
            }
            const from = choose?.[0].from ?? [];
            const amount = choose?.[0].amount ?? 1;
            const chooseMax = choose?.[0].max ?? 20;
            const options = from.map(parseAbilityScore);
            const optionText =
                options.length === 6 ? 'one ability score of your choice' : `your ${joinStringsWithOr(options)} score`;

            result.push(`Increase ${optionText} by ${amount}, to a maximum of ${chooseMax}.`);
            continue;
        }

        const skipKeys = ['max']; // List of keys to skip, as they are either unimportant or already handled
        if (Object.keys(ability).length > 0) {
            for (const [key, amount] of Object.entries(ability)) {
                if (skipKeys.includes(key)) continue;

                const score = parseAbilityScore(key);
                if (score === key) throw `Unsupported feat-ability key ${key}`;

                result.push(`Increase your ${score} score by ${amount}, to a maximum of ${max}.`);
            }
            continue;
        }
    }

    return result.length ? result.join('\n') : null;
}

function getFeatType(feat: Feat, data: Databank): string {
    if (!feat.category) return 'Uncategorized Feat';
    return parseFeatCategory(feat.category, feat.source, data);
}

export function getFeats(data: Databank): ParsedFeat[] {
    return data.feat.map((feat) => {
        return {
            name: feat.name,
            source: feat.source,
            url: getFeatsUrl(feat.name, feat.source),
            type: getFeatType(feat, data),
            prerequisite: parsePrerequisite(feat.prerequisite, feat, data),
            abilityIncrease: getFeatAbilityIncrease(feat),
            description: parseDescriptions('', feat.entries),
            reprint: parseReprint(feat),
        };
    });
}
