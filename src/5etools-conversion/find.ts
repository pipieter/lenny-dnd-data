export function findEntry(entries: any[], name: string, source: string): any | null {
    for (const entry of entries) {
        if (entry.name === name && entry.source === source) {
            return entry;
        }
    }
    return null;
}
