import { applyTemplate } from './template';

// Note to future developers, it's useful to take a clone (through structuredClone)
// as frequently as possible when copying something.

function variadic(value: any): any[] {
    if (Array.isArray(value)) return value;
    return [value];
}

function addMod_replaceArr(copy: any, key: string, entry: any): void {
    copy[key] = structuredClone(copy[key]) || [];

    const items = variadic(entry.items);
    for (let i = 0; i < copy[key].length; i++) {
        // If replace is given by name
        if (typeof entry.replace === 'string') {
            if (copy[key][i].name === entry.replace) {
                copy[key].splice(i, 1, ...items);
                return;
            }
        }
        // If replace is given by advanced object
        else if (typeof entry.replace === 'object') {
            // if replace index in object form {index: _}
            if (entry.replace.index !== undefined) {
                copy[key].splice(entry.replace.index, 1, ...items);
                return;
            } else {
                throw `addMod_replaceArr: Invalid replace type '${JSON.stringify(entry.replace)}'`;
            }
        }
    }

    throw `addMod_replaceArr: Could not find '${entry.replace}' in ${copy.name}[${key}]`;
}

function addMod_removeArr(copy: any, key: string, entry: any): void {
    copy[key] = structuredClone(copy[key]) || [];

    for (let i = 0; i < copy[key].length; i++) {
        if (copy[key][i].name === entry.names) {
            copy[key].splice(i, 1);
            return;
        }
    }

    throw `addMod_removeArr: Could not find '${entry.replace}' in ${copy.name}[${key}]`;
}

function addMod_appendArr(copy: any, key: string, entry: any): void {
    copy[key] = structuredClone(copy[key]) || [];
    copy[key].push(...variadic(entry.items));
}

function addMod_prependArr(copy: any, key: string, entry: any): void {
    copy[key] = structuredClone(copy[key]) || [];
    copy[key].splice(0, 0, ...variadic(entry.items));
}

function addMod_insertArr(copy: any, key: string, entry: any): void {
    copy[key] = structuredClone(copy[key]) || [];
    copy[key].splice(entry.index, 0, ...variadic(entry.items));
}

function addMod(copy: any, mod: any): void {
    for (const key of Object.keys(mod)) {
        const entries = variadic(mod[key]);
        for (const entry of entries) {
            if (entry.mode === 'replaceArr') {
                addMod_replaceArr(copy, key, entry);
            } else if (entry.mode === 'appendArr') {
                addMod_appendArr(copy, key, entry);
            } else if (entry.mode === 'prependArr') {
                addMod_prependArr(copy, key, entry);
            } else if (entry.mode === 'removeArr') {
                addMod_removeArr(copy, key, entry);
            } else if (entry.mode === 'insertArr') {
                addMod_insertArr(copy, key, entry);
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

export function handleVersions(base: any): any[] {
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

            delete version._versions;
            version.name = abstract.name || version.name;
            version.source = abstract.source || version.source;

            addMod(version, abstract._mod || {});
            versions.push(version);
        }
    }

    return versions;
}
