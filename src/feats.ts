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
    description: Description[];
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
            // TODO: Prerequisites parsing
            description: parseDescriptions('', feat.entries),
        };
    });
}
