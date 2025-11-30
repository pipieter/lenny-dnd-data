import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { title } from './parser';
import { read } from './read';

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

export function loadData(dataPath: string): any {
    const databank: object = {};
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

    return databank;
}

export class Databank {
    public readonly spell: any[] = [];
    public readonly spellFluff: any[] = [];
    public readonly spellSource: any[] = [];

    public add(paths: string | string[]) {
        const data = read(paths);
        for (const key of Object.keys(data)) {
            if (key === '_meta') continue;

            if ((this as any)[key] === undefined) {
                throw new Error(`Databank error: key '${key}' not found!`);
            }
            (this as any)[key].push(...data[key]);
        }
    }

    /**
     * Spell sources are stored in a very special way, and thus need to be
     * handled separately.
     * @param source The source path of the spellcasters
     */
    public addSpellSource(path: string) {
        const data = read(path);
        for (const source of Object.keys(data)) {
            for (const spell of Object.keys(data[source])) {
                const classes = [
                    ...(data[source][spell].class || []),
                    ...(data[source][spell].classVariant || []),
                ];
                const parsed = classes.map((class$) => ({
                    spellName: spell,
                    spellSource: source,
                    casterName: class$.name,
                    casterSource: class$.source,
                }));
                this.spellSource.push(...parsed);
            }
        }
    }
}
