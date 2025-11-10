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
    // TODO: REMOVE HARDCODED LIST
    const folders = [
        'action',
        // 'adventure',
        'background',
        'baseitem',
        // 'book',
        'boon',
        // 'charoption', // Doesn't add anything
        // 'class',
        // 'collection',
        'condition',
        // 'creature',
        'cult',
        // 'deck', // Doesn't add anything
        'deity',
        'disease',
        'facility',
        'feat',
        'hazard',
        // 'item',
        'language',
        'magicvariant',
        // 'makebrew', // Doesn't add anything
        'object',
        // 'optionalfeature',
        'psionic',
        // 'race',
        // 'recipe', // Doesn't add anything
        // 'reward', // Doesn't add anything
        'spell',
        // 'subclass',
        // 'subrace', // Doesn't add anyting
        'table',
        'trap',
        'variantrule',
        // 'vehicle'
    ];
    // TODO: Use the below code instead of hardcoded folders-list. Hardcode is only for testing.
    // const folders = readdirSync(homebrewPath, { withFileTypes: true })
    //     .filter(entry => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
    //     .map(entry => entry.name);

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

            const keyBlacklist = new Set(['_meta', 'adventure', 'book']);
            for (const key in data) {
                if (key == '_meta') {
                    const source = data['_meta']['sources'][0]; // Only ever one source
                    if (!source.partnered) break; // Filter out homebrew content

                    const hasSourceAuthors =
                        source.authors != null ? source.authors[0] != '' : false;
                    const authors = hasSourceAuthors ? source.authors : source.convertedBy;
                    const parsedSource: Source = {
                        id: source.abbreviation,
                        name: source.full,
                        source: source.json,
                        published: source.dateReleased,
                        author: joinStringsWithAnd(authors),
                        group: source.partnered ? 'partnered' : 'homebrew',
                    };

                    if (!existingSourceIds.has(parsedSource.source)) {
                        databank.homebrewSources.push(parsedSource);
                        existingSourceIds.add(parsedSource.source);
                    }
                }

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
