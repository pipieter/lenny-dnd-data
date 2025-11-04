import { DNDData, ParsedDNDData } from '../interfaces';
import { capitalize, cleanDNDText, parseDescriptions } from '../parser';
import { getLanguagesUrl } from '../urls';
import { joinStringsWithAnd } from '../util';

interface Language extends DNDData {
    type?: string;
    typicalSpeakers?: string[];
    script?: string;
}

interface ParsedLanguage extends ParsedDNDData {
    type: string;
    typicalSpeakers: string | null;
    script: string | null;
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
    const type = language.type ? capitalize(language.type) : 'Uncategorized';
    return `${type} language`;
}

export function getLanguages(data: any): ParsedLanguage[] {
    return (data.language as Language[]).map((language) => {
        return {
            name: language.name,
            source: language.source,
            url: getLanguagesUrl(language.name, language.source),
            type: getLanguageType(language),
            typicalSpeakers: getTypicalSpeakers(language),
            script: language.script ?? null,
            description: language.entries ? parseDescriptions('', language.entries) : [],
        };
    });
}
