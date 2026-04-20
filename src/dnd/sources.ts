import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    id: string;
    name: string;
    source: string;
    published: string;
    author: string | null;
    group: string;
}

export function getSources(data: Databank): ParsedSource[] {
    const books = [...data.book, ...data.adventure];
    const unseenSources = data.getAllSources();

    const result = books.map((book: any) => {
        if (book.id in unseenSources) unseenSources.delete(book.id);

        return {
            id: book.id,
            name: book.name,
            source: book.source || book.id,
            published: book.published,
            author: book.author ?? null,
            group: book.group ?? null,
        };
    });

    for (const source of unseenSources) {
        result.push({
            id: source,
            name: source,
            source,
            published: null,
            author: null,
            group: 'no-detail',
        })
    }

    return result.sort(entrySort);
}
