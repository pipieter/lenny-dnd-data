import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    id: string;
    name: string;
    displayName: string;
    source: string;
    // TODO - Do we wish to retain this information or not?
    published: string | null;
    // author: string | null;
    // group: string;
}

export function getSources(data: Databank): ParsedSource[] {
    const unseenSources = data.getAllSources();
    const sources: ParsedSource[] = [];

    for (const source of unseenSources) {
        const info = data.getSourceData(source);

        sources.push({
            id: source,
            name: info.name,
            displayName: info.displayName,
            source,
            published: info.published,
            // author: null,
            // group: 'no-detail',
        });
    }

    return sources.sort(entrySort);
}
