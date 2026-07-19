import { Databank } from '../data';
import { entrySort } from '../util';
import { rawData } from '../5etools-conversion/rawdata';

export interface ParsedSource {
    id: string;
    name: string;
    displayName: string;
    source: string;
    published: string | null;
    author: string | null;
    group: string;
}

export function getSources(data: Databank): ParsedSource[] {
    const books = [...data.book, ...data.adventure];
    const unseenSources = data.getAllSources();
    const sources: ParsedSource[] = [];

    for (const book of books) {
        unseenSources.delete(book.id);

        sources.push({
            id: book.id,
            name: book.name,
            displayName: rawData.getSourceDisplayName(book.source),
            source: book.source || book.id,
            published: book.published,
            author: book.author ?? null,
            group: book.group ?? null,
        });
    }

    // Some sources aren't documented in books or adventures and are even hard-coded in 5e.tools code.
    // We have to append sources with less detailed data, as they are still of importance.
    for (const source of unseenSources) {
        sources.push({
            id: source,
            name: source,
            displayName: rawData.getSourceDisplayName(source),
            source,
            published: null,
            author: null,
            group: 'no-detail',
        });
    }

    return sources.sort(entrySort);
}
