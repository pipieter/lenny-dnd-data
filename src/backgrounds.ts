import { handleCopy } from './5etools-conversion/copy';
import { Description, parseAbilityScore, parseDescriptions } from './parser';
import { getBackgroundsUrl } from './urls';

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
    const raw: any[] = data.background.map((e: any) => handleCopy(e, data.background));

    return raw.map((background: any) => ({
        name: background.name,
        source: background.source,
        url: getBackgroundsUrl(background.name, background.source),
        abilities: parseBackgroundAbilities(background),
        description: parseDescriptions('', background.entries),
    }));
}
