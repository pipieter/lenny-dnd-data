import * as fs from 'fs';
import * as path from 'path';

function combineContents(a: any, b: any): any {
    const combined: any = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
        if (key === '_meta') continue; // ignore meta key, as it is irrelevant
        const ca = a[key] || [];
        const cb = b[key] || [];

        if (!Array.isArray(ca))
            throw new Error(
                `Object '${JSON.stringify(ca)}' is not an array of objects (key '${key}')`
            );
        if (!Array.isArray(cb))
            throw new Error(
                `Object '${JSON.stringify(cb)}' is not an array of objects (key '${key}')`
            );

        combined[key] = [...ca, ...cb];
    }

    return combined;
}

function readJsonFile(filepath: string): any {
    return JSON.parse(fs.readFileSync(filepath).toString());
}

// In case of an index file, read the contents of the file
// and go over all files listen in there
function readIndexFile(filepath: string): object {
    let data: object = {};
    const directory = path.dirname(filepath);
    const contents = readJsonFile(filepath);
    const files: string[] = Object.values(contents);

    for (const file of files) {
        const contentsPath = path.join(directory, file);
        const contents = readJsonFile(contentsPath);
        data = combineContents(data, contents);
    }

    return data;
}

// In case of a raw directory, load all files in that directory
function readDirectoryFiles(directory: string) {
    let data = {};
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const contents = readJsonFile(file);
        data = combineContents(data, contents);
    }

    return data;
}

/**
 * Function that aggregates the data from a file or directory path
 * into a single object. Three scenarios are handled:
 * - If the file is a single .json file (e.g. actions.json), the contents of that file are returned
 *   directly.
 * - If the file is an index.json file (any file that ends with index.json, such that fluff-index.json
 *   is also supported). In this case, all the files in the index.json file are read and the data is
 *   returned, such as with spells/index.json
 * - A pure directory path. In this case, all files in the directory are considered and aggregated,
 *   such as is the case for partnered content.
 *
 * @param filepath The file or directory path
 * @returns An object that aggregates all data from the files
 */
export function read(filepath: string): any {
    // Check if file is an index file
    if (filepath.endsWith('index.json')) {
        return readIndexFile(filepath);
    }

    if (filepath.endsWith('.json')) {
        return readJsonFile(filepath);
    }

    const stats = fs.lstatSync(filepath);
    if (stats.isDirectory()) {
        return readDirectoryFiles(filepath);
    }

    throw new Error(`Unsupported filepath type: ${filepath}`);
}
