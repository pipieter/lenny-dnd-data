function isPrimitive(obj: any) {
    return ['string', 'number', 'bigint', 'boolean'].includes(typeof obj);
}

// Recursively walk through an object or an array, and apply a function to each field and element
function recursiveObjectApply(obj: any, applyFn: (value: string | number | boolean) => any): any {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map((entry) => recursiveObjectApply(entry, applyFn));
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) obj[key] = recursiveObjectApply(obj[key], applyFn);
        return obj;
    }

    return applyFn(obj);
}

/**
 * Iterate over an object and replace within all fields a template with a given replacement.
 * For example, consider a patter {{prop_name}} that needs to be replaced with value 'X'. The
 * function call `applySingleTemplate(obj, 'prop_name', 'X')` will replace all occurrences
 * within the object to fit the templating.
 *
 * If replacement is not a string or array of strings, templating will be ignored. If replacement
 * is an array of strings, the first element of the array will be used as replacement.
 *
 * @param obj The base object which fields will be changed.
 * @param template The pattern of the template, without the '{{' and '}}' symbols.
 * @param replacement The replacement string.
 * @returns A copy of obj with the replaced templates.
 */
export function applySingleTemplate(obj: any, template: string, replacement: string): any {
    obj = structuredClone(obj);

    // Sometimes the value can be an array, in which case we iterate over the first value
    if (Array.isArray(replacement)) replacement = replacement[0];
    if (!['string', 'number', 'bigint', 'boolean'].includes(typeof replacement)) return obj;
    if (!obj) return obj;

    return recursiveObjectApply(obj, (value) => {
        if (typeof value === 'string') {
            return value.replaceAll(`{{${template}}}`, replacement);
        }

        if (isPrimitive(value)) {
            return value;
        }

        throw `applySingleTemplate: Unknown obj type '${typeof value}'`;
    });
}

// Variant, where {=variable} is replaced directly
export function applyDirectSingleTemplate(base: any, obj: any): any {
    obj = structuredClone(obj);
    if (!obj) return obj;

    return recursiveObjectApply(obj, (value) => {
        if (typeof value === 'string') {
            const pattern = /\{=([A-Za-z]+)\}/;
            while (pattern.test(value)) {
                const matches: any[] = pattern.exec(value) || [];
                for (const match of matches) {
                    value = value.replaceAll(`{=${match}}`, base[match]);
                }
            }
            return value;
        }

        if (isPrimitive(value)) {
            return value;
        }

        throw `applyDirectSingleTemplate: Unknown obj type '${typeof obj}'`;
    });
}

export function applyTemplatingFromParent(obj: any, parent: any, prefix: string = ''): any {
    // Somewhat based on render.js:4778 applyTemplate
    obj = structuredClone(obj);
    parent = structuredClone(parent);

    for (const key of Object.keys(parent)) {
        obj = applySingleTemplate(obj, `${prefix}${key}`, parent[key]);
    }

    obj = applyDirectSingleTemplate(obj, obj);

    return obj;
}

export function applyTemplating(obj: any, prefix: string = ''): any {
    return applyTemplatingFromParent(obj, obj, prefix);
}
