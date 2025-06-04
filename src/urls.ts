export const cleanUrl = encodeURI;

/*
 * ##### BASIC URLS #####
 */

export function get5eToolsUrl(page: string): string {
    page = page.toLowerCase();
    return cleanUrl(`https://5e.tools/${page}`);
}

export function getImageUrl(path: string): string {
    return cleanUrl(`https://5e.tools/img/${path}`);
}

/**
 * The generated URL is case-sensitive. Do not change the casing of `name`; use the original creature-name casing.
 */
export function getCreatureTokenUrl(name: string, source: string) {
    source = source.toUpperCase(); // Can be enforced, is always uppercase
    const url = `https://5e.tools/img/bestiary/tokens/${source}/${name}.webp`;
    return cleanUrl(url);
}

/*
 * ##### URLS WITH NAME-SOURCE QUERIES #####
 */

function buildNameSourceUrl(baseUrl: string, name: string | null, source: string | null): string {
    if (name && !source)
        throw 'Must provide both "name" and "source", or neither. Only "name" was provided.';

    if (!name && source)
        throw 'Must provide both "name" and "source", or neither. Only "source" was provided.';

    const query = name && source ? `#${name}_${source}`.toLowerCase() : '';
    return cleanUrl(baseUrl + query);
}

export function getBackgroundsUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/backgrounds.html`, name, source);
}

export function getBestiaryUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/bestiary.html`, name, source);
}

export function getClassesUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/classes.html`, name, source);
}

export function getConditionsDiseasesUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/conditionsdiseases.html`, name, source);
}

export function getFeatsUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/feats.html`, name, source);
}

export function getItemsUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/items.html`, name, source);
}

export function getObjectsUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/objects.html`, name, source);
}

export function getSpellsUrl(name: string | null = null, source: string | null = null) {
    return buildNameSourceUrl(`https://5e.tools/spells.html`, name, source);
}
