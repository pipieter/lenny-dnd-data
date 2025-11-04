import { Action } from "./interfaces";

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

export function getAudioUrl(path: string): string {
    return cleanUrl(`https://5e.tools/audio/${path}`);
}

/**
 * The generated URL is case-sensitive. Do not change the casing of `name`; use the original creature-name casing.
 */
export function getCreatureTokenUrl(name: string, source: string) {
    source = source.toUpperCase(); // Can be enforced, is always uppercase
    const url = `https://5e.tools/img/bestiary/tokens/${source}/${name}.webp`;
    return cleanUrl(url);
}

// Unlike creature tokens, the source may not be enforced to be uppercase on other token-urls.
export function getObjectTokenUrl(name: string, source: string) {
    const url = `https://5e.tools/img/objects/tokens/${source}/${name}.webp`;
    return cleanUrl(url);
}

export function getVehicleTokenUrl(name: string, source: string) {
    const url = `https://5e.tools/img/vehicles/tokens/${source}/${name}.webp`;
    return cleanUrl(url);
}

/*
 * ##### URLS WITH NAME-SOURCE QUERIES #####
 */

function buildNameSourceUrl(baseUrl: string, name: string, source: string): string {
    const query = name && source ? `#${name}_${source}`.toLowerCase() : '';
    return cleanUrl(baseUrl + query);
}

export function getActionsUrl(action: Action) {
    return buildNameSourceUrl(`https://5e.tools/actions.html`, action.name, action.source);
}

export function getBackgroundsUrl(name: string, source: string = 'PHB') {
    return buildNameSourceUrl(`https://5e.tools/backgrounds.html`, name, source);
}

export function getBestiaryUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/bestiary.html`, name, source);
}

export function getClassesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/classes.html`, name, source);
}

export function getConditionsDiseasesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/conditionsdiseases.html`, name, source);
}

export function getFeatsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/feats.html`, name, source);
}

export function getItemsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/items.html`, name, source);
}

export function getLanguagesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/languages.html`, name, source);
}

export function getObjectsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/objects.html`, name, source);
}

export function getRulesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/variantrules.html`, name, source);
}

export function getSpellsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/spells.html`, name, source);
}

export function getSpeciesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/races.html`, name, source);
}

export function getSubclassUrl(
    className: string,
    classSource: string,
    subclassName: string,
    subclassSource: string,
    level: number | null = null
) {
    const classUrl = getClassesUrl(className, classSource);
    const subclassQuery = `sub_${subclassName.toLowerCase()}_${subclassSource.toLowerCase()}=b1`;

    if (!level) return cleanUrl(`${classUrl},state:${subclassQuery}`);

    const levelInfoQuery = `feature=s${level - 1}-0`; // Level 1 = 0
    return cleanUrl(`${classUrl},state:${levelInfoQuery}~${subclassQuery}`);
}

export function getTablesUrl(name: string, source: string | null = null) {
    if (!source) source = 'dmg'; // defaults to dmg
    return buildNameSourceUrl(`https://5e.tools/tables.html`, name, source);
}

export function getTrapsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/trapshazards.html`, name, source);
}

export function getVehiclesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/vehicles.html`, name, source);
}
