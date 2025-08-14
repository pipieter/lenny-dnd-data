import { handleCopy } from './5etools-conversion/copy';
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
    const raw: any[] = [];

    for (const entry of data.background) {
        if (entry._copy) {
            raw.push(handleCopy(entry, data.background));
        } else {
            raw.push(entry);
        }
    }

    const backgrounds: ParsedBackground[] = raw.map((background: Background) => ({
        name: background.name,
        source: background.source,
        url: getBackgroundsUrl(background.name, background.source),
        abilities: parseBackgroundAbilities(background),
        description: parseDescriptions('', background.entries),
    }));

    return backgrounds;
}
