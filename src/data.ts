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
    if (path.startsWith('foundry')) return true;
    if (path.endsWith('changelog.json')) return true;
    return false;
}

export function loadData(dataPath: string): any {
    const databank: object = {};
    const files = readdirSync(dataPath);

    for (const file of files) {
        const path = `${dataPath}/${file}`;
        if (ignoreJsonFile(path)) continue;

        const data = readJsonFile(path);

        for (const key in data) {
            if (!databank.hasOwnProperty(key)) {
                // @ts-ignore next-line
                databank[key] = [];
            }
            const entries = data[key];
            if (Array.isArray(entries)) {
                // @ts-ignore
                databank[key].push(...entries);
            }
        }
    }

    return databank;
}
