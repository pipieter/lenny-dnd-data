import { EntryImage } from '../5etools-collector/types/internal/entry';
import { Fluff } from '../5etools-collector/types/fluff';

function removeAccents(str: string): string {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replaceAll('"', '');
    const replacements: Record<string, string> = {
        æ: 'ae',
        Æ: 'Ae',
        œ: 'oe',
        Œ: 'Oe',
        ß: 'ss',
        ø: 'o',
        Ø: 'O',
        ñ: 'n',
        Ñ: 'N',
    };

    return str.replace(/[^A-Za-z0-9._-]/g, (c) => replacements[c] || c);
}

/*
 * ##### BASIC URLS #####
 */

export function get5eToolsUrl(page: string): string {
    page = page.toLowerCase();
    return encodeURI(`https://5e.tools/${page}`);
}

export function getImageUrl(path: string): string {
    return encodeURI(`https://5e.tools/img/${path}`);
}

export function getImageUrlFromFluff(fluff: Fluff): string | null {
    if (!fluff.images) return null;
    return getImageUrlFromEntryImage(fluff.images[0]);
}

export function getImageUrlFromEntryImage(image: EntryImage) {
    if (image.href.type === 'internal') {
        return getImageUrl(image.href.path);
    } else {
        return encodeURI(image.href.url);
    }
}

export function getAudioUrl(path: string): string {
    return encodeURI(`https://5e.tools/audio/${path}`);
}

export function getCreatureTokenUrl(name: string, source: string) {
    name = removeAccents(name);
    const url = `https://5e.tools/img/bestiary/tokens/${source}/${name}.webp`;
    return encodeURI(url);
}

export function getObjectTokenUrl(name: string, source: string) {
    const url = `https://5e.tools/img/objects/tokens/${source}/${name}.webp`;
    return encodeURI(url);
}

export function getVehicleTokenUrl(name: string, source: string) {
    const url = `https://5e.tools/img/vehicles/tokens/${source}/${name}.webp`;
    return encodeURI(url);
}

/*
 * ##### URLS WITH NAME-SOURCE QUERIES #####
 */

function cleanNameSourceUrlComponent(comp: string): string {
    comp = comp.toLowerCase();
    comp = encodeURIComponent(comp);
    comp = comp.replaceAll(',', '%2c');
    return comp;
}

function buildNameSourceUrl(baseUrl: string, name: string, source: string): string {
    // Clean special symbols from the name and source
    name = cleanNameSourceUrlComponent(name);
    source = cleanNameSourceUrlComponent(source);

    const query = name && source ? `#${name}_${source}` : '';
    return baseUrl + query;
}

export function getActionsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/actions.html`, name, source);
}

export function getBackgroundsUrl(name: string, source: string = 'PHB') {
    return buildNameSourceUrl(`https://5e.tools/backgrounds.html`, name, source);
}

export function getBestiaryUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/bestiary.html`, name, source);
}

export function getCharCreationOptionUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/charcreationoptions.html`, name, source);
}

export function getClassesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/classes.html`, name, source);
}

export function getConditionsDiseasesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/conditionsdiseases.html`, name, source);
}

export function getDeitiesUrl(name: string, source: string, pantheon: string) {
    return buildNameSourceUrl('https://5e.tools/deities.html', `${name}_${pantheon}`, source);
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

export function getOptionalFeaturesUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/optionalfeatures.html`, name, source);
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
    subclassName = cleanNameSourceUrlComponent(subclassName);
    subclassSource = cleanNameSourceUrlComponent(subclassSource);
    const subclassQuery = `sub_${subclassName.toLowerCase()}_${subclassSource.toLowerCase()}=b1`;

    if (!level) return `${classUrl},state:${subclassQuery}`;

    const levelInfoQuery = `feature=s${level - 1}-0`; // Level 1 = 0
    return `${classUrl},state:${levelInfoQuery}~${subclassQuery}`;
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

export function getCultsBoonsUrl(name: string, source: string) {
    return buildNameSourceUrl(`https://5e.tools/cultsboons.html`, name, source);
}
