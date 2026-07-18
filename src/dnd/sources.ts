import { readFileSync } from 'fs';
import { join } from 'path';
import * as vm from 'vm';
import { Databank } from '../data';
import { entrySort } from '../util';

export interface ParsedSource {
    id: string;
    name: string;
    displayName: string;
    source: string;
    published: string | null;
    author: string | null;
    group: string;
}

function loadParser(): void {
    if ((globalThis as any).Parser) return;

    const parserPath = join(__dirname, '..', '..', '5etools-src', 'js', 'parser.js');
    const parserCode = readFileSync(parserPath, 'utf8');
    const sandbox = {
        globalThis: {} as any,
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Parser: undefined as any,
    };

    sandbox.globalThis = sandbox;
    vm.runInNewContext(parserCode, sandbox, { filename: parserPath });

    (globalThis as any).Parser = sandbox.Parser;
}

/**
 * Resolves the display name or abbreviation for a given source.
 * This function relies on the global `Parser` object from the **5e-tools** submodule.
 * If the source could not be resolved, this returns the backend source instead.
 */
function getDisplayName(source: string): string {
    loadParser();
    const parser = (globalThis as any).Parser;
    return parser?.SOURCE_JSON_TO_ABV?.[source] || source;
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
            displayName: getDisplayName(book.source),
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
            displayName: getDisplayName(source),
            source,
            published: null,
            author: null,
            group: 'no-detail',
        });
    }

    return sources.sort(entrySort);
}
