import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';

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

        const contents = readFileSync(path, 'utf8');
        const data = JSON.parse(contents);

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
