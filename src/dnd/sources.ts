import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    source: string;
    name: string;
    displayName: string;
    published: string | null;
    category: string;
}

export function getSources(data: Databank): ParsedSource[] {
    const unseenSources = data.getAllSources();
    const sources: ParsedSource[] = [];

    for (const source of unseenSources) {
        const info = data.getSourceData(source);

        sources.push({
            source,
            name: info.name,
            displayName: info.displayName,
            published: info.published,
            category: info.category,
        });
    }

    return sources.sort(entrySort);
}
