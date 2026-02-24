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
    const result = books.map((book: any) => ({
        id: book.id,
        name: book.name,
        source: book.source || book.id,
        published: book.published,
        author: book.author ?? null,
        group: book.group ?? null,
    }));

    return result.sort(entrySort);
}
