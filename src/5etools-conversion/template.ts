// TODO it's possible that value is NOT a string, e.g. see item templating
// This should be expanded, and applyItemTemplate should be replaced
function applyTemplateToString(str: string, name: string, value: string): string {
    let result = structuredClone(str);
    result = result.replaceAll(`{{${name}}}`, value);
    result = result.replaceAll(`{{${name}_lower}}`, value.toLocaleLowerCase());
    return result;
}

export function applyTemplate(obj: any, name: string, value: string): any {
    obj = structuredClone(obj);

    // Sometimes the value can be an array, in which case we iterate over the first value
    // TODO check if this is correct or not
    if (Array.isArray(value)) {
        value = value[0];
    }

    if (typeof obj === 'string') {
        return applyTemplateToString(obj, name, value);
    }

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = applyTemplate(obj[i], name, value);
        }
        return obj;
    }
    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            obj[key] = applyTemplate(obj[key], name, value);
        }
        return obj;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean' || obj === undefined) {
        return obj;
    }

    throw `applyTemplate: Unsupported obj type '${typeof obj}'`;
}
