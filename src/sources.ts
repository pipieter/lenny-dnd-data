interface Source {
    id: string;
    name: string;
    source: string;
    published: string;
    author: string;
    group: string;
}

export function getSources(data: any): Source[] {
    return data.book.map((source: any) => {
        return {
            id: source.id,
            name: source.name,
            source: source.source || source.id,
            published: source.published,
            author: source.author,
            group: source.group,
        };
    });
}
