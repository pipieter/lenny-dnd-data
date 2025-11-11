import { Dirent, existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { title } from './parser';

export interface Databank {
    [key: string]: object[];
}

export function readJsonFile(path: string): any {
    const contents = readFileSync(path, 'utf8');
    return JSON.parse(contents);
}

export function getKey(name: string, source: string): string {
    return `${title(name)} (${source.toUpperCase()})`;
}

function isHomebrewDataDirectory(entry: Dirent<string>) {
    return entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.');
}

function ignoreJsonFile(path: string): boolean {
    if (!existsSync(path)) return true;
    if (!lstatSync(path).isFile()) return true;
    if (!path.endsWith('.json')) return true;
    if (path.includes('foundry-')) return true;
    if (path.endsWith('changelog.json')) return true;
    return false;
}

export function mergeDatabanks(a: Databank, b: Databank): Databank {
    const result: Databank = {};

    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
        const arrA = a[key] ?? [];
        const arrB = b[key] ?? [];
        result[key] = [...arrA, ...arrB];
    }

    return result;
}

export function loadHomebrewData(dataPath: string): Databank {
    const databank: Databank = {};

    const folders = readdirSync(dataPath, { withFileTypes: true })
        .filter((entry) => isHomebrewDataDirectory(entry))
        .map((entry) => entry.name)
        .sort();

    for (const folder of folders) {
        const folderPath = `${dataPath}/${folder}`;
        const files = readdirSync(folderPath);
        const jsonPaths = files
            .filter((file) => file.endsWith('.json'))
            .map((file) => `${folderPath}/${file}`)
            .sort();

        for (const filePath of jsonPaths) {
            if (ignoreJsonFile(filePath)) continue;
            const data = readJsonFile(filePath);

            for (const key in data) {
                if (key == '_meta') {
                    const source = data['_meta']['sources'][0]; // Only ever one source
                    if (!source.partnered) break; // Filter out homebrew content
                    continue;
                }

                if (!Array.isArray(data[key])) continue;
                if (!databank[key]) databank[key] = [];
                databank[key].push(...data[key]);
            }
        }
    }

    return databank;
}

export function loadData(dataPath: string): Databank {
    const databank: Databank = {};

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

    return databank;
}
