import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { title } from './parser';

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

function appendHomebrewData(databank: object, homebrewPath: string): object {
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
        // 'feat',
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
        // 'table', // UNMATCHED SYMB
        // 'trap', // UNMATCHED SYMB
        'variantrule',
        // 'vehicle'
    ];

    for (const folder of folders) {
        const folderPath = `${homebrewPath}/${folder}`;
        const files = readdirSync(folderPath);
        const jsonPaths = files
            .filter((file) => file.endsWith('.json'))
            .map((file) => `${folderPath}/${file}`);

        for (const filePath of jsonPaths) {
            if (ignoreJsonFile(filePath)) continue;
            const data = readJsonFile(filePath);

            for (const key in data) {
                if (key === '_meta') continue;

                if (!Array.isArray(data[key])) continue;
                // @ts-expect-error: databank typing is explicitly any and has index signature of type string.
                if (!databank[key]) {
                    // @ts-expect-error: databank typing is explicitly any and has index signature of type string.
                    databank[key] = [];
                }
                // @ts-expect-error: databank typing is explicitly any and has index signature of type string.
                databank[key].push(...data[key]);
            }
        }
    }

    return databank;
}

export function loadData(dataPath: string, homebrewPath: string): any {
    let databank: object = {};
    const files = readdirSync(dataPath);

    for (const file of files) {
        const path = `${dataPath}/${file}`;
        if (ignoreJsonFile(path)) continue;

        const data = readJsonFile(path);

        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(databank, key)) {
                // @ts-expect-error: databank typing is explicitly any and has index signature of type string.
                databank[key] = [];
            }
            const entries = data[key];
            if (Array.isArray(entries)) {
                // @ts-expect-error: databank typing is explicitly any and has index signature of type string.
                databank[key].push(...entries);
            }
        }
    }

    databank = appendHomebrewData(databank, homebrewPath);
    return databank;
}
