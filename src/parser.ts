import { BulletPoint, getNumberSign, joinStringsWithAnd, joinStringsWithOr } from './util';
import {
    get5eToolsUrl,
    getBackgroundsUrl,
    getBestiaryUrl,
    getFeatsUrl,
    getImageUrl,
    getItemsUrl,
    getObjectsUrl,
    getTablesUrl,
    getTrapsUrl,
} from './urls';
import { AbilityScores, SpellSchools } from './5etools-conversion/data';
import { ColLabelRows } from './dnd/tables';

export enum DescriptionType {
    text = 'text',
    table = 'table',
    hr = 'hr',
}

export interface Description {
    name: string;
    type: DescriptionType;
    value: string | Table;
}

export interface Range {
    type: 'range';
    min: number;
    max: number;
}

export interface Table {
    title: string;
    headers: string[] | null;
    rows: (string | Range)[][];
}

export function checkForDisallowedSymbols(text: string) {
    const disallowedSymbols = ['{', '}', '|', '[object Object]'];
    const foundSymbols = disallowedSymbols.filter((s) => text.includes(s)).map((s) => `'${s}'`);
    if (foundSymbols.length > 0) {
        throw `Unmatched symbol${foundSymbols.length > 1 ? 's' : ''} ${joinStringsWithAnd(foundSymbols)} found in '${text}'`;
    }
}

const AttackAbbrMap = new Map([
    ['mw', 'Melee Weapon Attack'],
    ['rw', 'Ranged Weapon Attack'],
    ['m', 'Melee Attack'],
    ['r', 'Ranged Attack'],
    ['a', 'Area Attack'],
    ['aw', 'Area Weapon Attack'],
    ['ms', 'Melee Spell Attack'],
    ['mw,rw', 'Melee or Ranged Weapon Attack'],
    ['rs', 'Ranged Spell Attack'],
    ['ms,rs', 'Melee or Ranged Spell Attack'],
    ['m,r', 'Melee or Ranged Attack'],
    ['mp', 'Melee Power Attack'],
    ['rp', 'Ranged Power Attack'],
    ['mp,rp', 'Melee or Ranged Power Attack'],
    ['m', 'Melee Attack Roll'],
    ['r', 'Ranged Attack Roll'],
    ['m,r', 'Melee or Ranged Attack Roll'],
    ['g', 'Magical Attack'],
]);

function cleanDNDatk(text: string): string {
    // converterutils-creature.js:584
    const replacements = new Map<string, string>([
        ['{@atk mw}', 'Melee Weapon Attack'],
        ['{@atk rw}', 'Ranged Weapon Attack'],
        ['{@atk m}', 'Melee Attack'],
        ['{@atk r}', 'Ranged Attack'],
        ['{@atk a}', 'Area Attack'],
        ['{@atk aw}', 'Area Weapon Attack'],
        ['{@atk ms}', 'Melee Spell Attack'],
        ['{@atk mw,rw}', 'Melee or Ranged Weapon Attack'],
        ['{@atk rs}', 'Ranged Spell Attack'],
        ['{@atk ms,rs}', 'Melee or Ranged Spell Attack'],
        ['{@atk m,r}', 'Melee or Ranged Attack'],
        ['{@atk mp}', 'Melee Power Attack'],
        ['{@atk rp}', 'Ranged Power Attack'],
        ['{@atk mp,rp}', 'Melee or Ranged Power Attack'],
        ['{@atkr m}', 'Melee Attack Roll'],
        ['{@atkr r}', 'Ranged Attack Roll'],
        ['{@atkr m,r}', 'Melee or Ranged Attack Roll'],
        ['{@atk g}', 'Magical Attack'],
    ]);

    for (const pattern of replacements.keys()) {
        text = text.replaceAll(pattern + ' ', '+');
    }

    return text;
}

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // Styles are handled the earliest as possible, these often appear within other brackets so should be handled first.
    text = text.replaceAll(/\{@style ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    if (noFormat) {
        text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@bold ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '$1');
    } else {
        text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@bold ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '*$1*');
    }

    // Attacks are done separately, as they have a fixed pattern
    text = cleanDNDatk(text);

    // Note: all regexes should end with a g, which stands for "global"
    text = text.replaceAll(/\{@atk rw\} /g, '+');
    text = text.replaceAll(/\{@atk rw\}/g, '+');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@action ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@area ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@card ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@chance ([^\}]*?)\|\|\|([^\}]*?)\|([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@chance ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$2');
    text = text.replaceAll(/\{@chance ([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@classFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@color ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@comic ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@condition ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@condition ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@d20 -([^\}]*?)\}/g, '-$1');
    text = text.replaceAll(/\{@d20 ([^\}]*?)\}/g, '+$1');
    text = text.replaceAll(/\{@dc ([^\}]*?)\}/g, 'DC $1');
    text = text.replaceAll(/\{@deck ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@deck ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@dice #\$prompt([^\}]*?)\|([^\}]*?)\}/g, '$2'); // See rule Carrying Capacity
    text = text.replaceAll(/\{@dice ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1 ($3)');
    text = text.replaceAll(/\{@dice ([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@dice ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hazard ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hazard ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hit ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@item ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@item ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@item ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@item ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@itemProperty ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@itemProperty ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@language ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@language ([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@language ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@link ([^\}]*?)\|([^\}]*?)\}/g, '[$1]($2)');
    text = text.replaceAll(/\{@loader ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@optfeature ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@optfeature ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@quickref ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@quickref ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@race ([^\}]*?)\|\|([^\}]*?)\}/g, '$2');
    text = text.replaceAll(/\{@race ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@race ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@sense ([^\}]*?)\|[^\}]*?\}/g, '$1');
    text = text.replaceAll(/\{@sense ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@table ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@table ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@variantrule ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@variantrule ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@variantrule ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@reward ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@recharge}/g, '');
    text = text.replaceAll(/\{@recharge ([^\}]*?)}/g, '');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(
        /\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
        `$3`
    );
    text = text.replaceAll(/\{@dcYourSpellSave\}/g, 'your spell save DC');
    text = text.replaceAll(/\{@color ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@sup ([^\}]*?)\}/g, '[$1]');

    if (noFormat) {
        text = text.replaceAll(/\{@h\}/g, 'Hit: ');
        text = text.replaceAll(/\{@background ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@background ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@background ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@class ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '$1');
        text = text.replaceAll(/\{@disease ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@disease ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@damage ([^\}]*?)\|([^\}]*?)\}/g, '$2');
        text = text.replaceAll(/\{@damage ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@facility ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(
            /\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            '$5'
        );
        text = text.replaceAll(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@scaledice ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@skill ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@skill ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@spell ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@spell ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@status ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@table ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@trap ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@trap ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@5etools ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@object ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@object ([^\}]*?)\| ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@object ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@feat ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@feat ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(
            /\{@subclassFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            `$1`
        );
        text = text.replaceAll(/\{@subclass ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehupgrade ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@actSaveSuccess\}/g, 'Success');
        text = text.replaceAll(/\{@actSaveFail\}/g, 'Failure');
        text = text.replaceAll(
            /\{@actSave ([^\}]*?)\}/g,
            (_, p1) => `${AbilityScores.get(p1)} Saving Throw:`
        );
    } else {
        text = text.replaceAll(/\{@h\}/g, '*Hit:* ');
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `__$3__`);
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `__$3__`);
        text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@class ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '__$3__');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '__$1__');
        text = text.replaceAll(/\{@disease ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '__$3__');
        text = text.replaceAll(/\{@disease ([^\}]*?)\|([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@damage ([^\}]*?)\|([^\}]*?)\}/g, '**$2**');
        text = text.replaceAll(/\{@damage ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@facility ([^\}]*?)\|([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(
            /\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            '**$5**'
        );
        text = text.replaceAll(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '**$3**');
        text = text.replaceAll(/\{@scaledice ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '**$3**');
        text = text.replaceAll(/\{@skill ([^\}]*?)\|([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@skill ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@spell ([^\}]*?)\|([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@spell ([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '*$3*');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@status ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@table ([^\}]*?)\}/g, (_, p1) => `[${p1}](${getTablesUrl(p1)})`);
        text = text.replaceAll(
            /\{@5etools ([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2) => `[${p1}](${get5eToolsUrl(p2)})`
        );
        text = text.replaceAll(
            /\{@background ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getBackgroundsUrl(p1, p2)})`
        );
        text = text.replaceAll(
            /\{@background ([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, __) => `[${p1}](${getBackgroundsUrl(p1)})`
        );
        text = text.replaceAll(
            /\{@background ([^\}]*?)\}/g,
            (_, p1) => `[${p1}](${getBackgroundsUrl(p1)})`
        );
        text = text.replaceAll(
            /\{@object ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getObjectsUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@object ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@object ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(
            /\{@feat ([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2) => `[${p1}](${getFeatsUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@feat ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(
            /\{@subclassFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            `__$1__`
        );
        text = text.replaceAll(
            /\{@subclass ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            `__$1__`
        );
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(
            /\{@table ([^\}|]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getTablesUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@table ([^\}]*?)\}/g, (_, p1) => `[${p1}](${getTablesUrl(p1)})`);
        text = text.replaceAll(
            /\{@trap ([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2) => `[${p1}](${getTrapsUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@vehupgrade ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@actSaveSuccess\}/g, '*Success*');
        text = text.replaceAll(/\{@actSaveFail\}/g, '*Failure*');
        text = text.replaceAll(
            /\{@actSave ([^\}]*?)\}/g,
            (_, p1) => `*${AbilityScores.get(p1)} Saving Throw:*`
        );
    }

    // Note: notes should be parsed at the end, because they might contain subqueries
    text = text.replaceAll(/\{@note ([^\}]*?)\}/g, '\($1\)');

    // Fix Bree-Yarking (normalizes discord italic/bold formatting)
    text = text.replace(/\*{4}([^\*]*?)\*{3}/g, '***$1**');

    // Check if any remaining patterns of {@...} exist
    if (/^.*\{@.*\}.*$/g.test(text)) {
        throw `{@...} pattern found in '${text}'`;
    }

    if (text.includes('{#')) {
        // Currently, {#itemEntry Item|Source} still remains in the text
        // TODO this should be fixed in items.ts, but it is currently not a priority
        // as such, ignore checking for remaining '{' and '}' for now
        return text;
    }

    checkForDisallowedSymbols(text);
    return text;
}

export function parseImageUrl(data: any[]): string | null {
    for (const datum of data) {
        if (datum.type != 'image') continue;

        const href = datum.href;
        if (href.type == 'internal') return getImageUrl(href.path);
        else if (href.type == 'external') return href.path as string;
        else throw `Unknown image href type '${href.type}'`;
    }

    return null;
}

export function parseSpellLevel(level: number): string {
    if (level == 0) return 'Cantrip';
    return `Level ${level}`;
}

export function parseSpellSchool(school: string): string {
    const parsed = SpellSchools.get(school);
    if (!parsed) {
        throw `Unsupported spell school: '${school}'`;
    }
    return parsed;
}

export function parseAbilityScore(score: string): string {
    const key = score.toLowerCase();
    const value = AbilityScores.get(key);
    if (!value) {
        return score;
    }
    return value;
}

export function parseSingleTime(time: any): string {
    const amount = time.number;
    const unit = time.unit;

    let result: string | null = null;
    switch (unit) {
        case 'action': {
            if (amount == 1) result = 'Action';
            else result = `${amount} actions`;
            break;
        }
        case 'bonus': {
            if (amount == 1) result = 'Bonus action';
            else result = `${amount} bonus actions`;
            break;
        }
        default: {
            if (amount == 1) result = `${amount} ${unit}`;
            else result = `${amount} ${unit}s`;
        }
    }

    if (time.condition) {
        result = `${result}, ${cleanDNDText(time.condition)}`;
    }

    if (time.note) {
        result = `${result} (${cleanDNDText(time.note)})`;
    }

    return result;
}

export function parseCastingTime(time: any): string {
    if (Array.isArray(time)) {
        const castingTimes = time.map(parseSingleTime);
        return castingTimes.join(' or ');
    } else {
        return parseSingleTime(time);
    }
}

export function parseDurationTime(duration: any): string {
    if (Array.isArray(duration)) {
        // TODO if (duration.length > 1)
        duration = duration[0];
    }

    switch (duration.type) {
        case 'instant':
            return 'Instantaneous';
        case 'special':
            return 'Special';
        case 'permanent':
            return 'Permanent';
        case 'timed': {
            const amount = duration.duration.amount;
            const unit = duration.duration.type;
            if (amount > 1) return `${amount} ${unit}s`;
            return `${amount} ${unit}`;
        }
        default: {
            throw `Unsupported duration type: ${duration.type}`;
        }
    }
}

export function parseDistance(distance: any): string {
    switch (distance.type) {
        case 'touch':
            return 'Touch';
        case 'self':
            return 'Self';
        case 'sight':
            return 'Sight';
        case 'unlimited':
            return 'Unlimited';
        case 'feet':
            return `${distance.amount} feet`;
        case 'miles': {
            if (distance.amount == 1) return '1 mile';
            return `${distance.amount} miles`;
        }
        default: {
            throw `Unsupported distance type: '${distance.type}'`;
        }
    }
}

export function parseRange(range: any): string {
    switch (range.type) {
        case 'point':
            return parseDistance(range.distance);
        case 'cube':
            return `Cube (${parseDistance(range.distance)})`;
        case 'emanation':
            return `Emanation (${parseDistance(range.distance)})`;
        case 'radius':
            return `Radius (${parseDistance(range.distance)})`;
        case 'cone':
            return `Cone (${parseDistance(range.distance)})`;
        case 'line':
            return `Line (${parseDistance(range.distance)})`;
        case 'sphere':
            return `Sphere (${parseDistance(range.distance)})`;
        case 'hemisphere':
            return `Hemisphere (${parseDistance(range.distance)})`;
        case 'special':
            return 'Special';
        case 'cylinder':
            return `Cylinder (${parseDistance(range.distance)})`;
        default: {
            throw `Unsupported range type: '${range.type}`;
        }
    }
}

export function parseComponents(components: any): string {
    const result = [];

    if ('v' in components) result.push('V');
    if ('s' in components) result.push('S');
    if ('m' in components) {
        let material = components.m;
        if (typeof material != 'string') {
            material = material.text;
        }
        result.push(`M (${material})`);
    }

    return result.join(', ');
}

function parseDescriptionBlockFromBlocks(descriptions: any[]): string {
    const blocks = descriptions.map(parseDescriptionBlock);
    return blocks.join('\n\n');
}

function splitDescriptionTypes(values: (string | Table)[]): { strings: string[]; tables: Table[] } {
    const strings = [];
    const tables = [];
    for (const value of values) {
        if (typeof value === 'string') strings.push(value);
        else tables.push(value);
    }
    return { strings, tables };
}

function parseDescriptionBlock(description: string | any): (string | Table)[] {
    if (typeof description == 'string') {
        return [cleanDNDText(description)];
    }

    // Specific scenario encountered once
    if (!description.type && description.entries) {
        return description.entries.flatMap(parseDescriptionBlock);
    }

    const type = description.type;
    switch (type) {
        case 'quote': {
            const quote = parseDescriptionBlockFromBlocks(description.entries);
            if (description.by) return [`*${quote}* - ${description.by}`];
            return [`*${quote}*`];
        }
        case 'list': {
            const entries = description.items.flatMap(parseDescriptionBlock);
            const { strings, tables } = splitDescriptionTypes(entries);
            const points = strings.map((str) => `${BulletPoint} ${str}`).join('\n');
            return [points, ...tables];
        }
        case 'inset':
        case 'insetReadaloud': {
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const { strings, tables } = splitDescriptionTypes(entries);
            const entry = strings.map((str) => `*${str}*`).join('\n');
            return [entry, ...tables];
        }
        case 'item': {
            const entries: (string | Table)[] = [];
            if (description.entries) {
                entries.push(...description.entries.flatMap(parseDescriptionBlock));
            } else if (description.entry) {
                entries.push(...parseDescriptionBlock(description.entry));
            } else {
                throw "Could not find entry in description block with type 'item'";
            }

            const { strings, tables } = splitDescriptionTypes(entries);
            const entry = strings.join('\n');
            if (description.name) {
                const name = description.name.replace(/:$/, '');
                return [cleanDNDText(`**${name}**: ${entry}`), ...tables];
            } else {
                return [cleanDNDText(entry), ...tables];
            }
        }
        case 'itemSpell': {
            const name = cleanDNDText(description.name);
            const entry = cleanDNDText(description.entry);
            return [`${name} ${entry}`];
        }
        case 'inline': {
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const entry = entries.join('');
            if (description.name) return [cleanDNDText(`**${description.name}**: ${entry}`)];
            return [cleanDNDText(entry)];
        }
        case 'section':
        case 'entries': {
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const { strings, tables } = splitDescriptionTypes(entries);
            const entry = strings.join('\n');
            if (description.name) {
                const name = description.name.replace(/:$/, '');
                return [cleanDNDText(`**${name}**: ${entry}`), ...tables];
            }
            return [cleanDNDText(entry), ...tables];
        }
        case 'entry': {
            return [cleanDNDText(description.entry)];
        }
        case 'table': {
            const table = parseDescriptionFromTable(description);
            return [table.value];
        }
        case 'image': {
            return []; // Images will not be handled within descriptions
        }
        case 'abilityAttackMod':
        case 'abilityDc': {
            const titleDesc = description.type === 'abilityDc' ? 'Save DC' : 'Attack modifier';

            const abilityScores = description.attributes.map(parseAbilityScore);
            const text = `${BulletPoint} *${description.name} ${titleDesc}*: ${joinStringsWithOr(abilityScores)} modifier + Proficiency Bonus`;
            return [text];
        }
        case 'refClassFeature': {
            const classFeature = description.classFeature;
            if (typeof classFeature === 'string') {
                // Has to be resolved later
                return [`{#${type} ${classFeature}}`];
            }
            throw `Unsupported ${type} ${classFeature}`;
        }
        case 'refSubclassFeature': {
            const subclassFeat = description.subclassFeature;
            if (typeof subclassFeat === 'string') {
                // Has to be resolved later
                return [`{#${type} ${subclassFeat}}`];
            }
            throw `Unsupported ${type} ${subclassFeat}`;
        }
        case 'refOptionalfeature': {
            const optionalFeature: string = description.optionalfeature;
            if (typeof optionalFeature === 'string') {
                // Has to be resolved later
                return [`{#${type} ${optionalFeature}}`];
            }
            throw `Unsupported ${type} ${optionalFeature}`;
        }
        case 'options': {
            const entries: string[] = [];
            const count = description.count;
            if (description.entries) {
                entries.push(...description.entries.map(parseDescriptionBlock));
            }

            const title = count ? `Choose **${count}**:\n` : '';
            return [`${title}${BulletPoint} ${entries.join(`\n${BulletPoint} `)}`];
        }
        case 'statblock': {
            const tag = description.tag;
            const name = description.name;
            const source = description.source;
            let link = null;
            switch (tag) {
                case 'item':
                    link = getItemsUrl(name, source);
                    break;
                case 'creature':
                    link = getBestiaryUrl(name, source);
                    break;
                case 'table':
                    link = getTablesUrl(name, source);
                    break;
                case 'optfeature':
                    link = getFeatsUrl(name, source);
            }

            if (!link) throw `Unsupported statblock ${tag}`;
            return [`[See ${name}'s stats here](${link})`];
        }
        case 'refFeat': {
            const feat = description.feat;
            const [name, source] = feat.split('|');
            const link = getFeatsUrl(name, source);
            return [`${BulletPoint} [${name}](${link})`];
        }
        case 'link': {
            const text = description.text;
            const href = description.href;
            let url = null;

            switch (href.type) {
                case 'internal':
                    url = get5eToolsUrl(href.path);
                    if (href.hash) url = url + '#' + href.hash;
                    break;

                case 'external':
                    url = href.url;
                    break;
            }

            if (!url) throw `Unsupported ${type} ${description}`;
            return [`[${text}](${url})`];
        }
        case 'hr': {
            const hrRepeats = 2;
            return Array(hrRepeats).fill('');
        }
        case 'actions': {
            const name = description.name;
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const entry = entries.join('');

            return [`**${name}**: ${entry}`];
        }

        case 'attack': {
            const type = AttackAbbrMap.get(description.attackType.toLocaleLowerCase()) ?? 'Unknown';
            const entries = joinStringsWithOr(description.attackEntries.map(cleanDNDText), false);
            const hitEntries = joinStringsWithOr(description.hitEntries.map(cleanDNDText), false);
            return [`*${type}:* ${entries} **Hit:** ${hitEntries}`];
        }

        default: {
            throw `Unsupported description type: '${type}'`;
        }
    }
}

function parseTableRow(values: any[] | any): string[] {
    if (typeof values === 'object' && !Array.isArray(values)) {
        if (values.type === 'row') {
            values = values.row;
        } else {
            throw `Unsupported row type ${values.type}`;
        }
    }
    const cells: string[] = [];
    for (const value of values) {
        if (typeof value == 'string') {
            cells.push(cleanDNDText(value, true));
        } else if (typeof value == 'object') {
            if (value.type == 'cell') {
                // If cell contains a roll number
                if (value.roll) {
                    if (value.roll.exact != undefined) {
                        cells.push(value.roll.exact as string);
                    } else if (value.roll.min != undefined && value.roll.max != undefined) {
                        cells.push(`${value.roll.min}-${value.roll.max}`);
                    } else {
                        throw `Unsupported table value cell roll ${value}`;
                    }
                }
                // If cell contains a width, meaning a single value spans multiple roles
                else if (value.width) {
                    cells.push(cleanDNDText(value.entry, true));
                    for (let i = 0; i < value.width - 1; i++) {
                        cells.push('');
                    }
                } else {
                    throw `Unsupported table value cell-type ${value.type}`;
                }
            } else if (value.type == 'entries') {
                if (value.name)
                    cells.push(`__${value.name}__`); // Also has value.entries, but that's too much information to display within a table.
                else if (value.entries) {
                    const entryNames = value.entries.map((entry: any) => entry.name);
                    const text = entryNames.join('__ & __');
                    cells.push(`__${text}__`);
                } else {
                    throw `Unsupported table value entries-type ${value}`;
                }
            } else if (value.type == 'table') {
                // TODO: Handle tables within tables, these tables should be parsed and added to tables.json
                let text = '';
                if (value.colLabels) {
                    const diceroll = value.colLabels[0];
                    text = `Roll 1${diceroll} on '${value.caption}' table`;
                } else {
                    text = `'${value.caption}' table`;
                }
                cells.push(text);
            } else if (value.type == 'image') {
                cells.push(`[image](${getImageUrl(value.href.path)})`);
            } else {
                throw `Unsupported table value-type: '${value.type}' in ${JSON.stringify(value)}`;
            }
        } else {
            // Primitive value
            cells.push(value as string);
        }
    }

    return cells;
}

export function parseDescriptionFromTable(description: any): Description {
    const title: string = description.caption || '';

    let headers: string[] | null = null;
    if (description.colLabels) {
        headers = description.colLabels.map(cleanDNDText);
    } else if (description.colLabelRows) {
        const colLabelRows: ColLabelRows = description.colLabelRows;
        const expandedRows: string[][] = colLabelRows.map((row) =>
            row.flatMap((cell) => {
                if (typeof cell === 'string') return [cell];
                if (cell && typeof cell === 'object' && 'entry' in cell) {
                    const value = cell.entry.replace('...', '');
                    return Array(cell.width).fill(value);
                }
                return [''];
            })
        );

        headers = expandedRows[0].map((_, colIndex) =>
            cleanDNDText(
                expandedRows
                    .map((row) => row[colIndex] || '')
                    .join('\n')
                    .trim()
            )
        );
    }

    const rows: string[][] = description.rows.map(parseTableRow);
    const table: Table = { title, headers, rows };

    return { name: title, type: DescriptionType.table, value: table };
}

export function parseDescriptions(name: string, descriptions: any[]): Description[] {
    const subdescriptions: Description[] = [];
    const blocks: (string | Table)[] = [];

    for (const desc of descriptions) {
        // Special case scenario where an entry is a description on its own
        // These will be handled separately
        if (typeof desc == 'string') blocks.push(cleanDNDText(desc as string));
        else {
            if (desc.type == 'entries') {
                const descName = cleanDNDText(desc.name || '', true);
                subdescriptions.push(...parseDescriptions(descName, desc.entries));
            } else if (desc.type == 'table') {
                subdescriptions.push(parseDescriptionFromTable(desc));
            } else {
                blocks.push(...parseDescriptionBlock(desc));
            }
        }
    }

    function toDescription(name: string, value: string | Table): Description {
        name = typeof value === 'string' ? name : name || value.title;
        return {
            name,
            type: typeof value === 'string' ? DescriptionType.text : DescriptionType.table,
            value,
        };
    }

    const results: Description[] = [];
    if (blocks.length > 0) {
        results.push(toDescription(name, blocks[0]));
    }
    for (let i = 1; i < blocks.length; i++) {
        results.push(toDescription('', blocks[i]));
    }
    results.push(...subdescriptions);

    // Unsupported types may append empty strings, these are removed here.
    const cleaned: Description[] = results.filter((desc) => {
        if (typeof desc.value === 'string') {
            return desc.value.trim();
        }
        return true; // Keep non-string values
    });
    return cleaned;
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function title(text: string): string {
    return text.split(' ').map(capitalize).join(' ');
}

export function parseSizes(sizes: string | string[]): string {
    if (typeof sizes === 'string') sizes = [sizes];
    const sizeMap = new Map<string, string>([
        ['F', 'Fine'],
        ['D', 'Diminutive'],
        ['T', 'Tiny'],
        ['S', 'Small'],
        ['M', 'Medium'],
        ['L', 'Large'],
        ['H', 'Huge'],
        ['G', 'Gargantuan'],
        ['V', 'Variable size'],
        ['C', 'Colossal'],
    ]);

    const words: string[] = [];
    for (const size of sizes) {
        const word = sizeMap.get(size);
        if (word) {
            words.push(word);
        } else {
            throw `parseSizes: Could not parse size '${size}'`;
        }
    }

    return joinStringsWithOr(words);
}

export function parseCreatureTypes(creature_type: string | any): string {
    while (typeof creature_type === 'object' && creature_type?.type) {
        creature_type = creature_type.type;
    }

    if (typeof creature_type === 'string') return creature_type;

    if (creature_type?.choose) {
        const types = joinStringsWithOr(creature_type.choose);
        if (creature_type.tags?.length) {
            const tagText = creature_type.tags.join(' ');
            return `${types} (${tagText})`;
        }
        return types;
    }

    throw `parseCreatureTypes: Unrecognized format: ${JSON.stringify(creature_type)}`;
}

export function parseCreatureSummonSpell(spell: string | null): string | null {
    if (!spell) return null;
    return spell.split('|', 1)[0];
}

export function parseClassResourceValue(value: any): string {
    if (typeof value === 'number') return `${value}`;
    if (typeof value === 'string') return value;

    switch (value.type) {
        case 'bonus': {
            const sign = getNumberSign(value.value, true);
            return `${sign}${value.value}`;
        }
        case 'dice': {
            const number = value.toRoll[0].number;
            const faces = value.toRoll[0].faces;
            return `${number}d${faces}`;
        }
        case 'bonusSpeed': {
            const sign = getNumberSign(value.value, true);
            return `${sign}${value.value} ft.`;
        }
        default: {
            throw `Unsupported classTableGroups row-type ${value.type}`;
        }
    }
}

export function parseItemValue(value: number | undefined): string | null {
    if (!value) return null;

    const gp = Math.floor(value / 100);
    const sp = Math.floor((value % 100) / 10);
    const cp = value % 10;

    const values = [];
    if (gp > 0) {
        // Add thousands separators, https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
        const formatted = gp.toLocaleString().replace(',', '.');
        values.push(`${formatted} gp`);
    }
    if (sp > 0) {
        values.push(`${sp} sp`);
    }
    if (cp > 0) {
        values.push(`${cp} cp`);
    }

    if (values.length === 0) {
        return null;
    }
    return values.join(' ');
}

export function parseItemWeight(weight: number | undefined): string | null {
    if (weight === undefined || weight === 0) {
        return null;
    }
    if (weight < 1) {
        return `${weight * 16} oz.`;
    }
    return `${weight} lb.`;
}
