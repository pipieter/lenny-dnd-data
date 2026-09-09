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
    title,
} from '../parser';
import { getFeatsUrl } from '../urls';
import { joinStringsWithAnd, joinStringsWithOr } from '../util';

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
            if (ability.choose.entry) {
                result.push(ability.choose.entry);
                continue;
            }

            const { from = [], amount = 1, max = 20 } = ability.choose;

            const options = from.map(parseAbilityScore);
            const optionText =
                options.length === 6 ? 'one ability score of your choice' : `your ${joinStringsWithOr(options)} score`;

            result.push(`Increase ${optionText} by ${amount}, to a maximum of ${max}.`);
            continue;
        }

        const skipKeys = ['max']; // List of keys to skip, as they are either unimportant or already handled
        const keys = Object.keys(ability);
        if (keys.length > 0) {
            for (const key of keys) {
                const score = parseAbilityScore(key);
                const amount = ability[key];

                if (skipKeys.includes(key)) continue;
                if (score === key) throw `Unsupported feat-ability key ${key}`;
                result.push(`Increase your ${score} score by ${amount}, to a maximum of ${max}.`);
            }
            continue;
        }
    }

    return result.length ? result.join('\n') : null;
}

function getFeatPrerequisites(feat: Feat, data: Databank): string | null {
    if (!feat.prerequisite) return null;

    const prerequisites: string[][] = feat.prerequisite.map((p) => {
        const parsed = parsePrerequisite(p, feat, data);
        if (!parsed) return [];
        return parsed;
    });

    // Count how many times each prerequisite entry appears across all groups
    const entryCounts: Record<string, number> = {};
    for (const group of prerequisites) {
        for (const entry of group) {
            entryCounts[entry] = (entryCounts[entry] || 0) + 1;
        }
    }

    const groupCount = prerequisites.length;
    const commonEntries = Object.keys(entryCounts).filter((entry) => entryCounts[entry] === groupCount);
    const filteredGroups = prerequisites.map((group) => group.filter((entry) => !commonEntries.includes(entry)));
    const joinedGroups = filteredGroups.map((group) => joinStringsWithAnd(group, false));

    if (commonEntries.length === 0) return joinStringsWithOr(joinedGroups, false);
    if (groupCount === 1) return joinStringsWithAnd(prerequisites[0], false);

    // Combine common entries with the rest
    return joinStringsWithAnd(
        [joinStringsWithAnd(commonEntries, false), joinStringsWithOr(joinedGroups, false)],
        false
    );
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
            prerequisite: getFeatPrerequisites(feat, data),
            abilityIncrease: getFeatAbilityIncrease(feat),
            description: parseDescriptions('', feat.entries),
            reprint: parseReprint(feat),
        };
    });
}
