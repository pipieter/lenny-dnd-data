import { applyTemplate } from './template';

function variadic(value: any): any[] {
    if (Array.isArray(value)) return value;
    return [value];
}

function addMod_replaceArr(copy: any, key: string, entry: any): void {
    const items = variadic(entry.items);
    for (let i = 0; i < copy[key].length; i++) {
        if (copy[key][i].name === entry.replace) {
            copy[key].splice(i, 1, ...items);
            return;
        }
    }
    throw `addMod_replaceArr: Could not find '${entry.name}' in ${copy.name}`;
}

function addMod_removeArr(copy: any, key: string, entry: any): void {
    for (let i = 0; i < copy[key].length; i++) {
        if (copy[key][i].name === entry.names) {
            copy[key].splice(i, 1);
            return;
        }
    }
    throw `addMod_removeArr: Could not find '${entry.name}' in ${copy.name}`;
}

function addMod_appendArr(copy: any, key: string, entry: any): void {
    copy[key].push(...variadic(entry.items));
}

function addMod(copy: any, mod: any): void {
    for (const key of Object.keys(mod)) {
        const entries = variadic(mod[key]);
        for (const entry of entries) {
            if (entry.mode === 'replaceArr') {
                addMod_replaceArr(copy, key, entry);
            } else if (entry.mode === 'appendArr') {
                addMod_appendArr(copy, key, entry);
            } else if (entry.mode === 'removeArr') {
                addMod_removeArr(copy, key, entry);
            } else {
                throw `addMod: unknown entry mode '${entry.mode}'`;
            }
        }
    }
}

function addPreserve(copy: any, preserve: any): void {
    for (const key of Object.keys(preserve)) {
        copy[key] = preserve[key];
    }
}

export function handleCopy(base: any, entries: any[]): any {
    let copy = structuredClone(base); // Fields will be changed, so making a deep clone is important for future usages

    if (!copy._copy) return copy;

    let parent = entries.find((e) => e.name === copy._copy.name && e.source === copy._copy.source);
    if (!parent) {
        throw `Could not find parent for ${copy.name} ${copy.source}`;
    }

    // Handle parent being a copy itself
    if (parent._copy) {
        parent = handleCopy(parent, entries);
    }

    const mod = copy._copy._mod || {};
    const preserve = copy._copy._preserve || {};

    copy = Object.assign({}, parent, copy);
    addMod(copy, mod);
    addPreserve(copy, preserve);

    delete copy._copy;

    return copy;
}

export function handleVersions(base: any, entries: any): any[] {
    base = structuredClone(base);
    if (!base._versions) return [];

    const versions = [];
    for (const baseVersion of base._versions) {
        for (const implementation of baseVersion._implementations || []) {
            let version = structuredClone(base);
            let abstract = structuredClone(baseVersion._abstract) || {};


            for (const variable of Object.keys(implementation._variables)) {
                version = applyTemplate(version, variable, implementation._variables[variable]);
                abstract = applyTemplate(abstract, variable, implementation._variables[variable]);
            }

            delete version._versions
            console.log(abstract)
            version.name = abstract.name || version.name;
            version.source = abstract.source || version.source;

            addMod(version, abstract._mod || {});
            versions.push(version);
        }
    }

    return versions;
}
