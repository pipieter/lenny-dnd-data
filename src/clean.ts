import { AbilityScores } from './5etools-conversion/data';
import { checkForDisallowedSymbols } from './parser';
import { getTablesUrl, get5eToolsUrl, getBackgroundsUrl, getTrapsUrl } from './urls';

declare global {
    interface String {
        clean(func: (text: string, noFormat: boolean) => string, noFormat: boolean): string;
    }
}

String.prototype.clean = function (func: (text: string, noFormat: boolean) => string, noFormat: boolean): string {
    return func(this.toString(), noFormat);
};

// Cache to store already created regular expressions
const PatternCache: Record<string, RegExp> = {};

/**
 * Creates a regular expression to match the 5e.tools patterns. For example, the pattern
 * `{@item spellbook|PHB}` would be generated using `pattern('item', 2)`, as the expression
 *  classifier is `item` and and the contents contains two sections.
 *
 * This method is slower than using global regular expressions, as the regular expressions
 * are constructed each time. This method of working should be more readable however.
 *
 * @param name The classifier of the 5e.tools pattern.
 * @param count The amount of components in the 5e.tools pattern.
 * @returns A regular expression which would match the requested 5e.tools expression.
 */
function pattern(name: string, count: number) {
    const cacheKey = `${name}-${count}`;
    const cacheEntry = PatternCache[cacheKey];
    if (cacheEntry) {
        return cacheEntry;
    }

    let expression = `\\{@${name}\\}`;
    if (count > 0) {
        const single = '([^\\}]*?)'; // A greedy regex that catches as many letters as possible, that aren't '}'
        const elements = Array.from({ length: count }, () => single).flat();

        // This regular expression would catch {@name *|*|...}, based on the number of components
        expression = `\\{@${name} ${elements.join('\\|')}\\}`;
    }

    const regexp = new RegExp(expression, 'g');
    PatternCache[cacheKey] = regexp;
    return regexp;
}

/* =========================================================
 * Format functions
 * ========================================================= */

function styles(text: string, noFormat: boolean): string {
    text = text.replaceAll(/\{@style ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    if (noFormat) {
        text = text.replaceAll(pattern('i', 1), '$1');
        text = text.replaceAll(pattern('b', 1), '$1');
        text = text.replaceAll(pattern('bold', 1), '$1');
        text = text.replaceAll(pattern('italic', 1), '$1');
    } else {
        text = text.replaceAll(pattern('i', 1), '*$1*');
        text = text.replaceAll(pattern('b', 1), '**$1**');
        text = text.replaceAll(pattern('bold', 1), '**$1**');
        text = text.replaceAll(pattern('italic', 1), '*$1*');
    }

    return text;
}

function $5etools(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('5etools', 2), `$1`);
    } else {
        text = text.replaceAll(pattern('5etools', 2), (_, p1, p2) => `[${p1}](${get5eToolsUrl(p2)})`);
    }
    return text;
}

function actSave(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('actSave', 1), (_, p1) => `${AbilityScores.get(p1)} Saving Throw:`);
    } else {
        text = text.replaceAll(pattern('actSave', 1), (_, p1) => `*${AbilityScores.get(p1)} Saving Throw:*`);
    }
    return text;
}

function actSaveFail(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('actSaveFail 3', 0), 'Third Failure:');
        text = text.replaceAll(pattern('actSaveFail 2', 0), 'Second Failure:');
        text = text.replaceAll(pattern('actSaveFail 1', 0), 'First Failure:');
        text = text.replaceAll(pattern('actSaveFail', 0), 'Failure:');
    } else {
        text = text.replaceAll(pattern('actSaveFail 3', 0), '*Third Failure:*');
        text = text.replaceAll(pattern('actSaveFail 2', 0), '*Second Failure:*');
        text = text.replaceAll(pattern('actSaveFail 1', 0), '*First Failure:*');
        text = text.replaceAll(pattern('actSaveFail', 0), '*Failure:*');
    }
    return text;
}

function actSaveFailBy(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('actSaveFailBy', 1), 'Failure by $1 or More:');
    } else {
        text = text.replaceAll(pattern('actSaveFailBy', 1), '*Failure by $1 or More:*');
    }
    return text;
}

function actSaveSuccess(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('actSaveSuccess', 0), 'Success');
    } else {
        text = text.replaceAll(pattern('actSaveSuccess', 0), '*Success*');
    }
    return text;
}

function actSaveSuccessOrFail(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('actSaveSuccessOrFail', 0), 'Failure or Success:');
    } else {
        text = text.replaceAll(pattern('actSaveSuccessOrFail', 0), '*Failure or Success*:');
    }
    return text;
}

function atk(text: string, noFormat: boolean): string {
    // converterutils-creature.js:584
    const replacements = new Map<string, string>([
        ['{@atk mw}', 'Melee Weapon Attack:'],
        ['{@atk rw}', 'Ranged Weapon Attack:'],
        ['{@atk m}', 'Melee Attack:'],
        ['{@atk r}', 'Ranged Attack:'],
        ['{@atk a}', 'Area Attack:'],
        ['{@atk aw}', 'Area Weapon Attack:'],
        ['{@atk ms}', 'Melee Spell Attack:'],
        ['{@atk mw,rw}', 'Melee or Ranged Weapon Attack:'],
        ['{@atk rs}', 'Ranged Spell Attack:'],
        ['{@atk ms,rs}', 'Melee or Ranged Spell Attack:'],
        ['{@atk m,r}', 'Melee or Ranged Attack:'],
        ['{@atk mp}', 'Melee Power Attack:'],
        ['{@atk rp}', 'Ranged Power Attack:'],
        ['{@atk mp,rp}', 'Melee or Ranged Power Attack:'],
        ['{@atkr m}', 'Melee Attack Roll:'],
        ['{@atkr mw}', 'Melee Weapon Attack Roll:'],
        ['{@atkr ms}', 'Melee Spell Attack Roll:'],
        ['{@atkr r}', 'Ranged Attack Roll:'],
        ['{@atkr m,r}', 'Melee or Ranged Attack Roll:'],
        ['{@atk g}', 'Magical Attack:'],
    ]);

    if (!noFormat) {
        // if formatted, surround the replacements with italics
        for (const [pattern, replace] of replacements.entries()) {
            replacements.set(pattern, `*${replace}*`);
        }
    }

    for (const [pattern, replace] of replacements.entries()) {
        text = text.replaceAll(pattern, replace);
    }

    return text;
}

function action(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('action', 3), '$3');
    text = text.replaceAll(pattern('action', 2), '$1');
    text = text.replaceAll(pattern('action', 1), '$1');
    return text;
}

function adventure(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('adventure', 3), '$1 ($2)');
    text = text.replaceAll(pattern('adventure', 2), '$1');
    text = text.replaceAll(pattern('adventure', 1), '$1');
    return text;
}

function area(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('area', 2), '$1');
    return text;
}

function background(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('background', 3), `$3`);
        text = text.replaceAll(pattern('background', 2), `$1`);
        text = text.replaceAll(pattern('background', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('background', 3), (_, p1, p2, p3) => `[${p3}](${getBackgroundsUrl(p1, p2)})`);
        text = text.replaceAll(pattern('background', 2), (_, p1, __) => `[${p1}](${getBackgroundsUrl(p1)})`);
        text = text.replaceAll(pattern('background', 1), (_, p1) => `[${p1}](${getBackgroundsUrl(p1)})`);
    }

    return text;
}

function book(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('book', 4), '$1');
    text = text.replaceAll(pattern('book', 2), '$1');
    return text;
}

function card(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('card', 2), '$1');
    return text;
}

function chance(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('chance', 5), '$1 percent');
    text = text.replaceAll(pattern('chance', 4), '$2');
    text = text.replaceAll(pattern('chance', 3), '$2');
    text = text.replaceAll(pattern('chance', 1), '$1 percent');
    return text;
}

function charoption(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('charoption', 3), '$3');
    text = text.replaceAll(pattern('charoption', 2), '$1');
    text = text.replaceAll(pattern('charoption', 1), '$1');
    return text;
}

function class$(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('class', 5), `$3`);
        text = text.replaceAll(pattern('class', 4), `$3`);
        text = text.replaceAll(pattern('class', 3), `$3`);
        text = text.replaceAll(pattern('class', 2), `$1`);
        text = text.replaceAll(pattern('class', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('class', 5), `__$3__`);
        text = text.replaceAll(pattern('class', 4), `__$3__`);
        text = text.replaceAll(pattern('class', 3), `__$3__`);
        text = text.replaceAll(pattern('class', 2), `__$1__`);
        text = text.replaceAll(pattern('class', 1), `__$1__`);
    }

    return text;
}

function classFeature(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('classFeature', 4), '$1');
    return text;
}

function color(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('color', 2), '$1');
    return text;
}

function comic(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('comic', 1), '$1');
    return text;
}

function condition(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('condition', 2), '$1');
    text = text.replaceAll(pattern('condition', 1), '$1');
    return text;
}

function creature(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('creature', 3), '$3');
        text = text.replaceAll(pattern('creature', 2), '$1');
        text = text.replaceAll(pattern('creature', 1), '$1');
    } else {
        text = text.replaceAll(pattern('creature', 3), '__$3__');
        text = text.replaceAll(pattern('creature', 2), '__$1__');
        text = text.replaceAll(pattern('creature', 1), '__$1__');
    }
    return text;
}

function d20(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('d20', 1), (_, p1) => {
        if (p1.startsWith('-')) return p1;
        // If text doesn't start with a minus, explicitly add a plus
        else return `+${p1}`;
    });
    return text;
}

function damage(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('damage', 2), '$2');
        text = text.replaceAll(pattern('damage', 1), '$1');
    } else {
        text = text.replaceAll(pattern('damage', 2), '**$2**');
        text = text.replaceAll(pattern('damage', 1), '**$1**');
    }
    return text;
}

function dc(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('dc', 1), 'DC $1');
    return text;
}

function dcYourSpellSave(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('dcYourSpellSave', 0), 'your spell save DC');
    return text;
}

function deck(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('deck', 2), '$1');
    text = text.replaceAll(pattern('deck', 1), '$1');
    return text;
}

function deity(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('deity', 3), `$1`);
        text = text.replaceAll(pattern('deity', 2), `$1`);
        text = text.replaceAll(pattern('deity', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('deity', 3), `__$1__`);
        text = text.replaceAll(pattern('deity', 2), `__$1__`);
        text = text.replaceAll(pattern('deity', 1), `__$1__`);
    }
    return text;
}

function dice(text: string, _noFormat: boolean): string {
    text = text.replaceAll(/\{@dice #\$prompt([^\}]*?)\|([^\}]*?)\}/g, '$2'); // See rule Carrying Capacity
    text = text.replaceAll(pattern('dice', 3), '$1 ($3)');
    text = text.replaceAll(pattern('dice', 2), '$1 ($2)');
    text = text.replaceAll(pattern('dice', 1), '$1');
    return text;
}

function disease(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('disease', 3), '$3');
        text = text.replaceAll(pattern('disease', 2), '$1');
        text = text.replaceAll(pattern('disease', 1), '$1');
    } else {
        text = text.replaceAll(pattern('disease', 3), '__$3__');
        text = text.replaceAll(pattern('disease', 2), '__$1__');
        text = text.replaceAll(pattern('disease', 1), '__$1__');
    }
    return text;
}

function facility(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('facility', 2), '$1');
    } else {
        text = text.replaceAll(pattern('facility', 2), '__$1__');
    }
    return text;
}

function feat(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('feat', 2), `$1`);
        text = text.replaceAll(pattern('feat', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('feat', 2), `__$1__`);
        text = text.replaceAll(pattern('feat', 1), `__$1__`);
    }
    return text;
}

function filter(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('filter', 4), '$1');
    text = text.replaceAll(pattern('filter', 3), '$1');
    text = text.replaceAll(pattern('filter', 2), '$1');
    text = text.replaceAll(pattern('filter', 1), '$1');
    return text;
}

function footnote(text: string, noFormat: boolean): string {
    // Footnote allows people to hover over and see extra information in 5e.tools, we can't do this in discord.
    text = text.replaceAll(pattern('footnote', 2), `$1 ($2)`);
    return text;
}

function hazard(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('hazard', 2), '$1');
    text = text.replaceAll(pattern('hazard', 1), '$1');
    return text;
}

function hit(text: string, noFormat: boolean): string {
    text = text.replaceAll(pattern('hit', 1), (_, p1) => {
        if (!p1.startsWith('+') && !p1.startsWith('-')) {
            // Add missing plus symbol in cases like {@hit 10} (should become +10)
            p1 = '+' + p1;
        }
        return p1;
    });

    if (noFormat) {
        text = text.replaceAll(pattern('h', 0), 'Hit:');
    } else {
        text = text.replaceAll(pattern('h', 0), '*Hit:*');
    }

    return text;
}

function hitYourSpellAttack(text: string, noFormat: boolean): string {
    // hitYourSpellAttack is used for 5e-tools rolling functionality, we don't need to format it.
    text = text.replaceAll(pattern('hitYourSpellAttack', 1), '$1');
    text = text.replaceAll(pattern('hitYourSpellAttack', 0), 'your spell attack modifier');
    return text;
}

function hom(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('hom', 0), 'Hit or Miss:');
    } else {
        text = text.replaceAll(pattern('hom', 0), '*Hit or Miss:*');
    }

    return text;
}

function homebrew(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('homebrew', 2), '$1');
    text = text.replaceAll(pattern('homebrew', 1), '$1');
    return text;
}

function item(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('item', 4), '$3');
    text = text.replaceAll(pattern('item', 3), '$3');
    text = text.replaceAll(pattern('item', 2), '$1');
    text = text.replaceAll(pattern('item', 1), '$1');
    return text;
}

function itemMastery(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('itemMastery', 2), `$1`);
        text = text.replaceAll(pattern('itemMastery', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('itemMastery', 2), `__$1__`);
        text = text.replaceAll(pattern('itemMastery', 1), `__$1__`);
    }
    return text;
}

function itemProperty(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('itemProperty', 3), '$3');
    text = text.replaceAll(pattern('itemProperty', 2), '$1');
    return text;
}

function language(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('language', 3), '$3');
    text = text.replaceAll(pattern('language', 2), '$1 ($2)');
    text = text.replaceAll(pattern('language', 1), '$1');
    return text;
}

function link(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('link', 2), '[$1]($2)');
    return text;
}

function loader(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('loader', 2), '$1');
    return text;
}

function note(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('note', 1), '\($1\)');
    return text;
}

function object(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('object', 3), `$3`);
        text = text.replaceAll(pattern('object', 2), '$1');
        text = text.replaceAll(pattern('object', 1), '$1');
    } else {
        text = text.replaceAll(pattern('object', 3), `__$3__`);
        text = text.replaceAll(pattern('object', 2), '__$1__');
        text = text.replaceAll(pattern('object', 1), '__$1__');
    }
    return text;
}

function optfeature(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('optfeature', 2), '$1');
    text = text.replaceAll(pattern('optfeature', 1), '$1');
    return text;
}

function quickref(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('quickref', 3), '$1');
    text = text.replaceAll(pattern('quickref', 1), '$1');
    return text;
}

function race(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('race', 3), '$3');
    text = text.replaceAll(pattern('race', 2), '$1');
    text = text.replaceAll(pattern('race', 1), '$1');
    return text;
}

function sense(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('sense', 2), '$1');
    text = text.replaceAll(pattern('sense', 1), '$1');
    return text;
}

function variantrule(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('variantrule', 3), '$3');
    text = text.replaceAll(pattern('variantrule', 2), '$1');
    text = text.replaceAll(pattern('variantrule', 1), '$1');
    return text;
}

function recharge(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('recharge', 1), (_, p1) => {
        const parts = p1.split('|');
        const recharge = parts[0] !== '6' ? `Recharge ${parts[0]}-6` : `Recharge 6`;
        if (parts[1] === 'm') return `${recharge}`;
        return `(${recharge})`;
    });
    text = text.replaceAll(pattern('recharge', 0), '(Recharge 5-6)');
    return text;
}

function reward(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('reward', 2), '$1');
    return text;
}

function scaledamage(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('scaledamage', 5), '$5');
        text = text.replaceAll(pattern('scaledamage', 3), '$3');
    } else {
        text = text.replaceAll(pattern('scaledamage', 5), '**$5**');
        text = text.replaceAll(pattern('scaledamage', 3), '**$3**');
    }
    return text;
}

function scaledice(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('scaledice', 3), '$3');
    } else {
        text = text.replaceAll(pattern('scaledice', 3), '**$3**');
    }
    return text;
}

function skill(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('skill', 2), '$1');
        text = text.replaceAll(pattern('skill', 1), '$1');
    } else {
        text = text.replaceAll(pattern('skill', 2), '*$1*');
        text = text.replaceAll(pattern('skill', 1), '*$1*');
    }
    return text;
}

function skillCheck(text: string, _noFormat: boolean): string {
    // Special case
    text = text.replaceAll(/\{@skillCheck [^\s]+ (-?\d+)\}/g, '$1');
    return text;
}

function spell(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('spell', 2), '$1');
        text = text.replaceAll(pattern('spell', 1), '$1');
    } else {
        text = text.replaceAll(pattern('spell', 2), '__$1__');
        text = text.replaceAll(pattern('spell', 1), '__$1__');
    }
    return text;
}

function status(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('status', 3), '$3');
        text = text.replaceAll(pattern('status', 2), '$1');
        text = text.replaceAll(pattern('status', 1), '$1');
    } else {
        text = text.replaceAll(pattern('status', 3), '*$3*');
        text = text.replaceAll(pattern('status', 2), '*$1*');
        text = text.replaceAll(pattern('status', 1), '*$1*');
    }
    return text;
}

function subclass(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('subclass', 4), `$1`);
    } else {
        text = text.replaceAll(pattern('subclass', 4), `__$1__`);
    }
    return text;
}

function subclassFeature(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('subclassFeature', 6), `$1`);
    } else {
        text = text.replaceAll(pattern('subclassFeature', 6), `__$1__`);
    }
    return text;
}

function sup(text: string, _noFormat: boolean): string {
    text = text.replaceAll(pattern('sup', 1), '[$1]');
    return text;
}

function table(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('table', 3), '$3');
        text = text.replaceAll(pattern('table', 2), '$1');
        text = text.replaceAll(pattern('table', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('table', 3), (_, p1, p2, p3) => `[${p3}](${getTablesUrl(p1, p2)})`);
        text = text.replaceAll(pattern('table', 2), (_, p1, p2) => `[${p1}](${getTablesUrl(p1, p2)})`);
        text = text.replaceAll(pattern('table', 1), (_, p1) => `[${p1}](${getTablesUrl(p1)})`);
    }
    return text;
}

function trap(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('trap', 3), `$3`);
        text = text.replaceAll(pattern('trap', 2), `$1`);
    } else {
        text = text.replaceAll(pattern('trap', 3), (_, p1, p2, p3) => `[${p3}](${getTrapsUrl(p1, p2)})`);
        text = text.replaceAll(pattern('trap', 2), (_, p1, p2) => `[${p1}](${getTrapsUrl(p1, p2)})`);
    }
    return text;
}

function vehicle(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('vehicle', 2), `$1`);
        text = text.replaceAll(pattern('vehicle', 1), `$1`);
    } else {
        text = text.replaceAll(pattern('vehicle', 2), `__$1__`);
        text = text.replaceAll(pattern('vehicle', 1), `__$1__`);
    }
    return text;
}

function vehupgrade(text: string, noFormat: boolean): string {
    if (noFormat) {
        text = text.replaceAll(pattern('vehupgrade', 2), `$1`);
    } else {
        text = text.replaceAll(pattern('vehupgrade', 2), `__$1__`);
    }
    return text;
}

/* =========================================================
 * Main function
 * ========================================================= */

function cleanSingleText(text: string, noFormat: boolean): string {
    const originalText = text;

    const functions = [
        styles,
        $5etools,
        actSave,
        actSaveFail,
        actSaveFailBy,
        actSaveSuccess,
        actSaveSuccessOrFail,
        atk,
        action,
        adventure,
        area,
        background,
        book,
        card,
        chance,
        charoption,
        class$,
        classFeature,
        color,
        comic,
        condition,
        creature,
        d20,
        damage,
        dc,
        dcYourSpellSave,
        deck,
        deity,
        dice,
        disease,
        facility,
        feat,
        filter,
        footnote,
        hazard,
        hit,
        hitYourSpellAttack,
        hom,
        homebrew,
        item,
        itemProperty,
        itemMastery,
        language,
        link,
        loader,
        object,
        optfeature,
        quickref,
        race,
        sense,
        table,
        variantrule,
        recharge,
        reward,
        scaledamage,
        scaledice,
        skill,
        skillCheck,
        spell,
        status,
        subclass,
        subclassFeature,
        sup,
        table,
        trap,
        vehicle,
        vehupgrade,
        note,
    ];

    for (const func of functions) {
        text = text.clean(func, noFormat);
    }

    // cleanSingleText is only called when a '}' symbol is encountered, and thus
    // a change should always be made. If no change is made however, it means that
    // we have an unsupported expression and an error should be thrown to notify
    // the developers.
    if (originalText === text) {
        throw `Unsupported cleaning expression found in '${text}'`;
    }

    return text;
}

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // It is possible for text to contain nested tags (e.g. {@ bold {@i ...}}).
    // The nested values should be handled first. In order to do so, a stack is
    // used to keep track of the most recently found '{', which is then cleaned
    // first.
    const original = text; // Keep track of the original for debugging

    const stack: number[] = [];
    let i = 0;
    while (i < text.length) {
        if (text[i] === '{') {
            stack.push(i);
            i++;
        } else if (text[i] === '}') {
            const start = stack.pop();
            if (start === undefined) {
                throw new Error(`String '${text}' in '${original}' contains unclosed '}'`);
            }

            const substring = text.slice(start, i + 1);
            const cleaned = cleanSingleText(substring, noFormat);
            text = text.replaceAll(substring, cleaned);
            i = Math.max(i - substring.length, 0);
        } else {
            i++;
        }
    }

    if (stack.length > 0) {
        throw new Error(
            `String '${text}' contains an unresolved tag at index ${stack[stack.length - 1]} in '${original}'`
        );
    }

    // Fix Bree-Yarking (normalizes discord italic/bold formatting)
    text = text.replace(/\*{4}([^\*]*?)\*{3}/g, '***$1**');

    // Check if any remaining patterns of {@...} exist
    if (/^.*\{@.*\}.*$/g.test(text)) {
        throw `{@...} pattern found in '${text}'`;
    }

    checkForDisallowedSymbols(text);
    return text;
}
