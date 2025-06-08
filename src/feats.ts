import { capitalize, Description, parseAbilityScore, parseDescriptions } from './parser';
import { getFeatsUrl } from './urls';
import { joinStringsWithOr } from './util';

interface Feat {
    name: string;
    source: string;
    page: number;
    srd52?: boolean;
    basicRules2024?: boolean;

    reprintedAs?: string[];
    category?: string;
    prerequisite?: any[];
    optionalfeatureProgression?: any[];
    repeatable?: boolean;
    repeatableHidden?: boolean;

    additionalSpells?: any[];
    toolProficiencies?: any[];
    weaponProficiencies?: any[];
    armorProficiencies?: any[];
    skillProficiencies?: any[];
    languageProficiencies?: any[];

    ability?: any[];
    resist?: any[];
    senses?: any[];
    expertise?: any[];

    entries: (string | any)[];
    hasFluffImages?: boolean;
}

interface ParsedFeat {
    name: string;
    source: string;
    url: string;
    type: string;
    prerequisite: string | null;
    abilityIncrease: string | null;
    description: Description[];
}

function getFeatAbilityIncrease(feat: Feat): string | null {
    if (!feat.ability) return null;

    const result: string[] = [];

    for (const ability of feat.ability) {
        if (ability.hidden) continue;

        if (ability.choose) {
            // Prefer explicit entry if present
            if (ability.choose.entry) {
                result.push(ability.choose.entry);
                continue;
            }

            const { from = [], amount = 1, max = 20 } = ability.choose;

            const options = from.map(parseAbilityScore);
            const optionText =
                options.length === 6
                    ? 'one ability score of your choice'
                    : `your ${joinStringsWithOr(options)} score`;

            result.push(`Increase ${optionText} by ${amount}, to a maximum of ${max}.`);
        }
    }

    return result.length ? result.join('\n') : null;
}

function getFeatPrerequisites(feat: Feat): string | null {
    if (!feat.prerequisite) return null;
    return '';
}

function getFeatType(feat: Feat): string {
    if (!feat.category) return 'Uncategorized Feat';

    const categoryMap: Record<string, string> = {
        G: 'General Feat',
        O: 'Origin Feat',
        FS: 'Fighting Style Feat',
        'FS:P': 'Fighting Style Replacement Feat (Paladin)',
        'FS:R': 'Fighting Style Replacement Feat (Ranger)',
        EB: 'Epic Boon Feat',
    };

    if (feat.category in categoryMap) {
        return categoryMap[feat.category];
    }

    throw `Unsupported feat-type ${feat.category}`;
}

export function getFeats(data: any): ParsedFeat[] {
    return (data.feat as Feat[]).map((feat) => {
        return {
            name: feat.name,
            source: feat.source,
            url: getFeatsUrl(feat.name, feat.source),
            type: getFeatType(feat),
            prerequisite: getFeatPrerequisites(feat),
            abilityIncrease: getFeatAbilityIncrease(feat),
            description: parseDescriptions('', feat.entries),
        };
    });
}
