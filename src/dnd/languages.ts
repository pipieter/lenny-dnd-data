import { Databank } from '../data';
import { capitalize, cleanDNDText, Description, parseDescriptions } from '../parser';
import { getImageUrl, getLanguagesUrl } from '../urls';
import { joinStringsWithAnd } from '../util';

interface Language {
    name: string;
    source: string;
    type?: string;
    typicalSpeakers?: string[];
    script?: string;
    entries: any[];
}

interface LanguageFluff {
    name: string;
    source: string;
    images: any[];
}

interface ParsedLanguage {
    name: string;
    source: string;
    url: string;
    type: string;
    typicalSpeakers: string | null;
    script: string | null;
    description: Description[] | null;
    image: string | null;
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

function getLanguageImage(language: Language, data: Databank): string | null {
    const fluff = data.search('languageFluff', language.name, language.source);
    if (fluff && fluff.images.length) {
        return getImageUrl(fluff.images[0].href.path);
    }
    return null;
}

export function getLanguages(data: Databank): ParsedLanguage[] {
    const languages: Language[] = data.language;
    return languages.map((language) => {
        return {
            name: language.name,
            source: language.source,
            url: getLanguagesUrl(language.name, language.source),
            type: getLanguageType(language),
            typicalSpeakers: getTypicalSpeakers(language),
            script: language.script ?? null,
            description: language.entries ? parseDescriptions('', language.entries) : null,
            image: getLanguageImage(language, data),
        };
    });
}
