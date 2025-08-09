import { Description, parseAbilityScore, parseDescriptions } from './parser';
import { getBackgroundsUrl } from './urls';

interface Background {
    name: string;
    source: string;
    _copy?: any;
    feats?: string[] | null;
    skillProficiencies?: string[];
    toolProficiencies?: string[];
    startingEquipment?: string[];
    ability?: string[];
    entries: (string | any)[];
}

interface ParsedBackground {
    name: string;
    source: string;
    url: string;
    abilities: string[] | null;
    description: Description[] | null;
}

function parseBackgroundAbilities(background: any): string[] | null {
    if (!background.ability) return null;
    let abilities = background.ability[0].choose.weighted.from;
    return abilities.map(parseAbilityScore);
}

export function getBackgrounds(data: any): ParsedBackground[] {
    let needInheritance: Background[] = [];
    let backgrounds: ParsedBackground[] = [];

    (data.background as Background[]).map((background: Background) => {
        if (background._copy) {
            needInheritance.push(background);
            return;
        }

        backgrounds.push({
            name: background.name,
            source: background.source,
            url: getBackgroundsUrl(background.name, background.source),
            abilities: parseBackgroundAbilities(background),
            description: parseDescriptions('', background.entries),
        });
    });

    // Handle _copy
    for (const child of needInheritance) {
        const parentName = child._copy.name;
        const parent = backgrounds.filter(
            (background) => background.name.toLowerCase() === parentName.toLowerCase()
        )[0];

        if (!parent) continue;
        // TODO Handle copy modifiers
        backgrounds.push({
            name: child.name,
            source: child.source,
            url: getBackgroundsUrl(child.name, child.source),
            abilities: parent.abilities,
            description: parent.description,
        });
    }

    return backgrounds;
}
