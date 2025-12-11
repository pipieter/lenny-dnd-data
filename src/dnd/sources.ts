import { Databank, getKey } from '../data';

interface Source {
    id: string;
    name: string;
    source: string;
    published: string;
    author: string | null;
    group: string;
}

export function getSources(data: Databank): Source[] {
    const books = [...data.book, ...data.adventure];
    return books.map((book: any) => ({
        id: book.id,
        name: book.name,
        source: book.source || book.id,
        published: book.published,
        author: book.author ?? null,
        group: book.group ?? null,
    })).sort((a, b) => getKey(a.name, a.source).localeCompare(getKey(b.name, b.source)));
}
