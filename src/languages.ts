import { capitalize, cleanDNDText, Description, parseDescriptions } from './parser';
import { joinStringsWithAnd } from './util';

interface Language {
    name: string;
    source: string;
    type?: string;
    typicalSpeakers?: string[];
    script?: string;
    entries: (string | any)[];
}

interface ParsedLanguage {
    name: string;
    source: string;
    type: string;
    typicalSpeakers: string | null;
    script: string | null;
    description: Description[] | null;
}

function getTypicalSpeakers(language: Language): string | null {
    const typicalSpeakers = language.typicalSpeakers;
    if (!typicalSpeakers) return null;

    let speakers: string[] = [];
    for (const speaker of typicalSpeakers) {
        const cleanSpeaker = cleanDNDText(speaker, true);
        speakers.push(cleanSpeaker);
    }

    return joinStringsWithAnd(speakers);
}

function getLanguageType(language: Language): string {
    const type = language.type ? capitalize(language.type) : 'Undefined';
    return `${type} language`;
}

export function getLanguages(data: any): ParsedLanguage[] {
    return (data.language as Language[]).map((language) => {
        return {
            name: language.name,
            source: language.source,
            type: getLanguageType(language),
            typicalSpeakers: getTypicalSpeakers(language),
            script: language.script ?? null,
            description: language.entries ? parseDescriptions('', language.entries) : null,
        };
    });
}
