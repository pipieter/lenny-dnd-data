import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    name: string;
    source: string;
    abbreviation: string;
    published: string | null;
    category: string;
}

export function getSources(data: Databank): ParsedSource[] {
    const unseenSources = data.getAllSources();
    const sources: ParsedSource[] = [];

    for (const source of unseenSources) {
        const info = data.getSourceData(source);

        sources.push({
            name: info.name,
            source,
            abbreviation: info.abbreviation,
            published: info.published,
            category: info.category,
        });
    }

    return sources.sort(entrySort);
}
