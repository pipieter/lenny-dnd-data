import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    name: string;
    source: string;
    abbreviation: string;
    published: string | null;
    category: string;
    legacy: boolean;
}

export function getSources(data: Databank): ParsedSource[] {
    return data.source
        .map((source) => ({
            name: source.name,
            source: source.source,
            abbreviation: source.abbreviation,
            published: source.published,
            category: source.category,
            legacy: source.legacy,
        }))
        .sort(entrySort);
}
