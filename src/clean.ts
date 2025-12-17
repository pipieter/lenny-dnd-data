import { AbilityScores } from './5etools-conversion/data';
import { checkForDisallowedSymbols } from './parser';
import {
    getTablesUrl,
    get5eToolsUrl,
    getBackgroundsUrl,
    getObjectsUrl,
    getFeatsUrl,
    getTrapsUrl,
} from './urls';

declare global {
    interface String {
        clean(func: (text: string, noFormat: boolean) => string, noFormat: boolean): string;
    }
}

String.prototype.clean = function (
    func: (text: string, noFormat: boolean) => string,
    noFormat: boolean
): string {
    return func(this.toString(), noFormat);
};

function atk(text: string, _noFormat: boolean): string {
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

    text = text.replaceAll(/\{@atk rw\} /g, '+');
    text = text.replaceAll(/\{@atk rw\}/g, '+');

    return text;
}

function action(text: string, _noFormat: boolean): string {
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@action ([^\}]*?)\}/g, '$1');
    return text;
}

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // Styles are handled the earliest as possible, these often appear within other brackets so should be handled first.
    text = text.replaceAll(/\{@style ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    if (noFormat) {
        // Very specific case for Keith Baker's Frontiers of Eberron Quickstone, where
        // A nested object with @i is used that completely surrounds another object.
        // TODO a better solution would be to adapt the function to handle recursive styling
        text = text.replaceAll(/^\{@i (.*)\}$/g, '$1');

        text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@bold ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '$1');
    } else {
        // Idem Keith baker
        text = text.replaceAll(/^\{@i (.*)\}$/g, '*$1*');

        text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@bold ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '*$1*');
    }

    text = text.clean(atk, noFormat);
    text = text.clean(action, noFormat);

    // Note: all regexes should end with a g, which stands for "global"
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
    text = text.replaceAll(/\{@homebrew ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@homebrew ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@skillCheck [^\s]+ (-?\d+)\}/g, '$1');

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
