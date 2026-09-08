import { Fluff } from '../../5etools-collector/types/fluff';
import { Language } from '../../5etools-collector/types/language';
import { cleanDNDText } from '../clean';
import { Databank } from '../data';
import { Description, ReprintData, capitalize, parseDescriptions, parseReprint } from '../parser';
import { getHrefUrl, getLanguagesUrl } from '../urls';
import { findFluff, joinStringsWithAnd } from '../util';

export interface ParsedLanguage {
    name: string;
    source: string;
    url: string;
    type: string;
    typicalSpeakers: string | null;
    script: string | null;
    description: Description[] | null;
    image: string | null;
    reprint: ReprintData | null;
}

function getTypicalSpeakers(language: Language): string | null {
    const typicalSpeakers = language.typicalSpeakers;
    if (!typicalSpeakers) return null;

    const speakers: string[] = [];
    for (const speaker of typicalSpeakers) {
        const cleanSpeaker = cleanDNDText(speaker, true);
        speakers.push(cleanSpeaker);
    }

    return joinStringsWithAnd(speakers);
}

function getLanguageType(language: Language): string {
    const type = language.type ? capitalize(language.type) : 'Uncategorized';
    return `${type} language`;
}

function getLanguageImage(fluff?: Fluff): string | null {
    if (!fluff || !fluff.images) return null;
    return getHrefUrl(fluff.images[0].href);
}

export function getLanguages(data: Databank): ParsedLanguage[] {
    return data.language.map((language) => {
        const fluff = findFluff(language, data.languageFluff);

        return {
            name: language.name,
            source: language.source,
            url: getLanguagesUrl(language.name, language.source),
            type: getLanguageType(language),
            typicalSpeakers: getTypicalSpeakers(language),
            script: language.script ?? null,
            description: language.entries ? parseDescriptions('', language.entries) : null,
            image: getLanguageImage(fluff),
            reprint: parseReprint(language),
        };
    });
}
