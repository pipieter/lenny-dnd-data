import { handleCopy } from '../5etools-conversion/copy';
import { Background } from '../interfaces';
import { Description, parseAbilityScore, parseDescriptions } from '../parser';
import { getBackgroundsUrl } from '../urls';
import { BackgroundValidator } from '../validate';

interface ParsedBackground {
    name: string;
    source: string;
    url: string;
    abilities: string[] | null;
    description: Description[] | null;
}

function parseBackgroundAbilities(background: any): string[] | null {
    if (!background.ability) return null;
    const abilities = background.ability[0].choose.weighted.from;
    return abilities.map(parseAbilityScore);
}

export function getBackgrounds(data: any): ParsedBackground[] {
    const backgrounds = BackgroundValidator.validate(data.background);
    const raw: Background[] = backgrounds.map((e: any) => handleCopy(e, backgrounds));

    return raw.map((background: any) => ({
        name: background.name,
        source: background.source,
        url: getBackgroundsUrl(background.name, background.source),
        abilities: parseBackgroundAbilities(background),
        description: parseDescriptions('', background.entries),
    }));
}
