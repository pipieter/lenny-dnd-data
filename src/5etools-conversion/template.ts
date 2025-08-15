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
    // Sometimes the value can be an array, in which case we iterate over the first value
    if (Array.isArray(replacement)) replacement = replacement[0];

    if (!['string', 'number', 'bigint', 'boolean'].includes(typeof replacement)) return obj;

    obj = structuredClone(obj);

    if (!obj) return obj;
    if (['number', 'boolean', 'bigint'].includes(typeof obj)) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((entry) => applySingleTemplate(entry, template, replacement));
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj))
            obj[key] = applySingleTemplate(obj[key], template, replacement);
        return obj;
    }

    if (typeof obj === 'string') {
        return obj.replaceAll(`{{${template}}}`, replacement);
    }

    throw `applySingleTemplate: Unknown obj type '${typeof obj}'`;
}

export function applyTemplatingFromParent(obj: any, parent: any, prefix: string = ''): any {
    // Somewhat based on render.js:4778 applyTemplate
    obj = structuredClone(obj);
    parent = structuredClone(parent);

    for (const key of Object.keys(parent)) {
        obj = applySingleTemplate(obj, `${prefix}${key}`, parent[key]);
    }

    return obj;
}

export function applyTemplating(obj: any, prefix: string = ''): any {
    return applyTemplatingFromParent(obj, obj, prefix);
}
