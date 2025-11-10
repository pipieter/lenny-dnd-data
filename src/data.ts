import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { title } from './parser';
import { Source } from './dnd/sources';
import { joinStringsWithAnd } from './util';

export type DatabankBase = {
    [key: string]: object[];
};

export type Databank = DatabankBase & {
    homebrewSources?: Source[];
};

export function readJsonFile(path: string): any {
    const contents = readFileSync(path, 'utf8');
    return JSON.parse(contents);
}

export function getKey(name: string, source: string): string {
    return `${title(name)} (${source.toUpperCase()})`;
}

function ignoreJsonFile(path: string): boolean {
    if (!existsSync(path)) return true;
    if (!lstatSync(path).isFile()) return true;
    if (!path.endsWith('.json')) return true;
    if (path.includes('foundry-')) return true;
    if (path.endsWith('changelog.json')) return true;
    return false;
}

function appendHomebrewData(databank: Databank, homebrewPath: string): Databank {
    const folders = [
        // 'book',
        'boon',
        // 'class',
        'condition',
        // 'creature',
        'cult',
        'deity',
        'disease',
        'facility',
        'feat',
        'hazard',
        // 'item',
        'language',
        // 'magicvariant',
        'object',
        // 'optionalfeature',
        'psionic',
        // 'race',
        'spell',
        // 'subclass',
        'table',
        'trap',
        'variantrule',
        // 'vehicle'
    ];

    databank.homebrewSources = [];
    const existingSourceIds = new Set(databank.homebrewSources.map((s) => s.id));

    for (const folder of folders) {
        const folderPath = `${homebrewPath}/${folder}`;
        const files = readdirSync(folderPath);
        const jsonPaths = files
            .filter((file) => file.endsWith('.json'))
            .map((file) => `${folderPath}/${file}`);

        for (const filePath of jsonPaths) {
            if (ignoreJsonFile(filePath)) continue;
            const data = readJsonFile(filePath);

            for (const source of data['_meta']['sources']) {
                const authors = source.authors[0] ? source.authors : source.convertedBy;
                const parsedSource: Source = {
                    id: source.abbreviation,
                    name: source.full,
                    source: source.json,
                    published: source.dateReleased,
                    author: joinStringsWithAnd(authors),
                    group: source.partnered ? 'partnered' : 'homebrew',
                };

                if (!existingSourceIds.has(parsedSource.id)) {
                    databank.homebrewSources.push(parsedSource);
                    existingSourceIds.add(parsedSource.id);
                }
            }

            const keyBlacklist = new Set(['_meta', 'adventure', 'book']);
            for (const key in data) {
                if (keyBlacklist.has(key)) continue;

                if (!Array.isArray(data[key])) continue;
                if (!databank[key]) databank[key] = [];
                databank[key].push(...data[key]);
            }
        }
    }

    return databank;
}

export function loadData(dataPath: string, homebrewPath: string): Databank {
    let databank: Databank = {
        homebrewSources: [],
    };
    const files = readdirSync(dataPath);

    for (const file of files) {
        const path = `${dataPath}/${file}`;
        if (ignoreJsonFile(path)) continue;

        const data = readJsonFile(path);

        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(databank, key)) {
                databank[key] = [];
            }
            const entries = data[key];
            if (Array.isArray(entries)) {
                databank[key].push(...entries);
            }
        }
    }

    databank = appendHomebrewData(databank, homebrewPath);
    return databank;
}
