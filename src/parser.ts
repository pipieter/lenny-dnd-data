import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { BulletPoint, getNumberSign, getPythonInstallation } from './util';
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

export interface Description {
    name: string;
    text: string;
}

const SpellSchools = new Map([
    ['A', 'Abjuration'],
    ['C', 'Conjuration'],
    ['D', 'Divination'],
    ['E', 'Enchantment'],
    ['V', 'Evocation'],
    ['I', 'Illusion'],
    ['N', 'Necromancy'],
    ['P', 'Psionic'],
    ['T', 'Transmutation'],
]);

const AbilityScores = new Map<string, string>([
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
]);

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // Styles are handled the earliest as possible, these often appear within other brackets so should be handled first.
    text = text.replaceAll(/\{@style ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    if (noFormat) {
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '$1');
    } else {
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '*$1*');
    }

    // Note: all regexes should end with a g, which stands for "global"
    text = text.replaceAll(/\{@atk rw\} /g, '+');
    text = text.replaceAll(/\{@atk rw\}/g, '+');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@action ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@area ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '**$1**');
    text = text.replaceAll(/\{@bold ([^\}]*?)\}/g, '**$1**');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@card ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@chance ([^\}]*?)\|\|\|([^\}]*?)\|([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@chance ([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@classFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@color ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@condition ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@condition ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@d20 -([^\}]*?)\}/g, '-$1');
    text = text.replaceAll(/\{@d20 ([^\}]*?)\}/g, '+$1');
    text = text.replaceAll(/\{@dc ([^\}]*?)\}/g, 'DC $1');
    text = text.replaceAll(/\{@deck ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@deck ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@dice ([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@dice ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@filter ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hazard ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hazard ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@hit ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@item ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@item ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@item ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@itemProperty ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@language ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@link ([^\}]*?)\|([^\}]*?)\}/g, '[$1]($2)');
    text = text.replaceAll(/\{@loader ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@optfeature ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@optfeature ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@quickref ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@race ([^\}]*?)\|\|([^\}]*?)\}/g, '$2');
    text = text.replaceAll(/\{@race ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@race ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@sense ([^\}]*?)\|[^\}]*?\}/g, '$1');
    text = text.replaceAll(/\{@sense ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@table ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
    text = text.replaceAll(/\{@table ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@variantrule ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@variantrule ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@reward ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@recharge}/g, '');
    text = text.replaceAll(/\{@recharge ([^\}]*?)}/g, '');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@class ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);

    if (noFormat) {
        text = text.replaceAll(/\{@h\}/g, 'Hit: ');
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '$1');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@damage ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@scaledice ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@skill ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@skill ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@spell ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@spell ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@status ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@background ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@5etools ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@object ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@feat ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@feat ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(
            /\{@subclassFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            `$1`
        );
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@table ([^\}|]*?)\|([^\}]*?)\|([^\}]*?)\}/g, `$3`);
        text = text.replaceAll(/\{@table ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@trap ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@class ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\}/g, `$1`);
        text = text.replaceAll(/\{@vehupgrade ([^\}]*?)\|([^\}]*?)\}/g, `$1`);
    } else {
        text = text.replaceAll(/\{@h\}/g, '*Hit:* ');
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '__$3__');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '__$1__');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@damage ([^\}]*?)\}/g, '**$1**');
        text = text.replaceAll(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '**$3**');
        text = text.replaceAll(/\{@scaledice ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '**$3**');
        text = text.replaceAll(/\{@skill ([^\}]*?)\|([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@skill ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@spell ([^\}]*?)\|([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@spell ([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '*$3*');
        text = text.replaceAll(/\{@status ([^\}]*?)\|([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@status ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@5etools ([^\}]*?)\|([^\}]*?)\}/g, (_, p1, p2) => `[${p1}](${get5eToolsUrl(p2)})`);
        text = text.replaceAll(
            /\{@background ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getBackgroundsUrl(p1, p2)})`
        );
        text = text.replaceAll(
            /\{@object ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getObjectsUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@feat ([^\}]*?)\|([^\}]*?)\}/g, (_, p1, p2) => `[${p1}](${getFeatsUrl(p1, p2)})`);
        text = text.replaceAll(/\{@feat ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(
            /\{@subclassFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            `__$1__`
        );
        text = text.replaceAll(/\{@itemMastery ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@deity ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(
            /\{@table ([^\}|]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) => `[${p3}](${getTablesUrl(p1, p2)})`
        );
        text = text.replaceAll(/\{@table ([^\}]*?)\}/g, (_, p1) => `[${p1}](${getTablesUrl(p1)})`);
        text = text.replaceAll(/\{@trap ([^\}]*?)\|([^\}]*?)\}/g, (_, p1, p2) => `[${p1}](${getTrapsUrl(p1, p2)})`);
        text = text.replaceAll(/\{@class ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@vehicle ([^\}]*?)\}/g, `__$1__`);
        text = text.replaceAll(/\{@vehupgrade ([^\}]*?)\|([^\}]*?)\}/g, `__$1__`);
    }

    // Note: notes should be parsed at the end, because they might contain subqueries
    text = text.replaceAll(/\{@note ([^\}]*?)\}/g, '\($1\)');

    // Fix Bree-Yarking (normalizes discord italic/bold formatting)
    text = text.replace(/\*{4}([^\*]*?)\*{3}/g, '***$1**');

    // Check if any remaining patterns of {@...} exist
    if (/^.*\{@.*\}.*$/g.test(text)) {
        throw `{@...} pattern found in '${text}'`;
    }

    if (text.includes('#itemEntry')) {
        // Currently, {#itemEntry Item|Source} still remains in the text
        // TODO this should be fixed in items.ts, but it is currently not a priority
        // as such, ignore checking for remaining '{' and '}' for now
        return text;
    }
    if (text.includes('{')) {
        throw `Unmatched '{' character found in '${text}'`;
    }
    if (text.includes('}')) {
        throw `Unmatched '}' character found in '${text}'`;
    }

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

function parseSingleCastingTime(time: any): string {
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

    if (time.note) {
        result = `${result} (${time.note})`;
    }

    return result;
}

export function parseCastingTime(time: any): string {
    if (Array.isArray(time)) {
        const castingTimes = time.map(parseSingleCastingTime);
        return castingTimes.join(' or ');
    } else {
        return parseSingleCastingTime(time);
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

function parseDescriptionBlock(description: any): string {
    if (typeof description == 'string') {
        return cleanDNDText(description);
    }

    switch (description.type) {
        case 'quote': {
            const quote = parseDescriptionBlockFromBlocks(description.entries);
            if (description.by) return `*${quote}* - ${description.by}`;
            return `*${quote}*`;
        }
        case 'list': {
            const points: string[] = [];
            for (const item of description.items) points.push(`${BulletPoint} ${parseDescriptionBlock(item)}`);
            return points.join('\n');
        }
        case 'inset':
        case 'insetReadaloud': {
            let text = `*${parseDescriptionBlockFromBlocks(description.entries)}*`;
            return cleanDNDText(text);
        }
        case 'item': {
            const entries: string[] = [];
            if (description.entries) {
                entries.push(...description.entries.map(parseDescriptionBlock));
            } else if (description.entry) {
                entries.push(parseDescriptionBlock(description.entry));
            } else {
                throw "Could not find entry in description block with type 'item'";
            }
            const entry = entries.join('\n');
            return cleanDNDText(`**${description.name}**: ${entry}`);
        }
        case 'inline': {
            const entries = description.entries.map(parseDescriptionBlock);
            let entry = entries.join('');
            if (description.name) return cleanDNDText(`**${description.name}**: ${entry}`);
            return cleanDNDText(entry);
        }
        case 'section':
        case 'entries': {
            const entries = description.entries.map(parseDescriptionBlock);
            let entry = entries.join('\n');
            if (description.name) return cleanDNDText(`**${description.name}**: ${entry}`);
            return cleanDNDText(entry);
        }
        case 'entry': {
            return cleanDNDText(description.entry);
        }
        case 'table': {
            const table = parseDescriptionFromTable(description, '');
            if (!table.name.trim()) return table.text;
            return `**${table.name}**:\n${table.text}`;
        }
        case 'image': {
            return ''; // Images will not be handled within descriptions
        }
        case 'abilityAttackMod':
        case 'abilityDc': {
            const titleDesc = description.type === 'abilityDc' ? 'Save DC' : 'Attack modifier';

            const abilityScores = description.attributes.map(parseAbilityScore);
            const text = `${BulletPoint} *${description.name} ${titleDesc}:* ${formatWordList(abilityScores)} modifier + Proficiency Bonus`;
            return text;
        }
        case 'refClassFeature': {
            // classFeature is a string like "Sorcery Points|Sorcerer||2"
            const classFeature = description.classFeature;
            if (typeof classFeature === 'string') {
                const parts = classFeature.split('|');
                if (parts.length >= 4) {
                    const name = parts[0];
                    const value = parts[3];
                    if (value && name) return `${BulletPoint} **${value}** ${name}`;
                    if (name) return name;
                }
            }

            throw `Unsupported refClassFeature ${classFeature}`;
        }
        case 'refSubclassFeature': {
            const classFeature = description.subclassFeature;
            if (typeof classFeature === 'string') {
                const [name, , , , , value] = classFeature.split('|');
                if (value && name) {
                    return `${BulletPoint} **${value}** ${name}`;
                }
                return name || classFeature;
            }
            throw `Unsupported refSubclassFeature ${classFeature}`;
        }
        case 'refOptionalfeature': {
            let optionalFeature = description.optionalfeature;

            if (optionalFeature.includes('|')) {
                const [name, source] = optionalFeature.split('|');
                optionalFeature = `${name} (${source})`;
            }

            return optionalFeature;
        }
        case 'options': {
            const entries: string[] = [];
            const count = description.count;
            if (description.entries) {
                entries.push(...description.entries.map(parseDescriptionBlock));
            }

            const title = count ? `Choose **${count}:**\n` : '';
            return `${title}${entries.join('\n ')}`;
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
            }

            if (!link) throw `Unsupported statblock ${tag}`;
            return `[See ${name}'s stats here](${link})`;
        }
        case 'refFeat': {
            const feat = description.feat;
            const [name, source] = feat.split('|');
            const link = getFeatsUrl(name, source);
            return `${BulletPoint} [${name}](${link})`;
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

            if (!url) throw `Unsupported link ${description}`;
            return `[${text}](${url})`;
        }
        default: {
            throw `Unsupported description type: '${description.type}'`;
        }
    }
}

function parseTableValue(value: any): string {
    if (typeof value == 'string') {
        return cleanDNDText(value, true);
    } else if (typeof value == 'object') {
        if (value.type == 'cell') {
            if (value.roll) {
                if (value.roll.exact != undefined) {
                    return value.roll.exact as string;
                } else if (value.roll.min != undefined && value.roll.max != undefined) {
                    return `${value.roll.min}-${value.roll.max}`;
                }
            }
            throw `Unsupported table value cell-type ${value.type}`;
        }

        if (value.type == 'entries') {
            if (value.name) return `__${value.name}__`; // Also has value.entries, but that's too much information to display within a table.
            throw `Unsupported table value entries-type ${JSON.stringify(value)}`;
        }

        throw `Unsupported table value-type: '${value.type}'`;
    } else {
        // Primitive value
        return value as string;
    }
}

export function buildTable(headers: string[], rows: string[][], width: number): string {
    const table = {
        headers: headers,
        rows: rows,
    };
    const python = getPythonInstallation();
    const input = 'table.in.temp';
    const output = 'table.out.temp';
    const command = `${python} scripts/table.py ${input} ${output} ${width}`;
    writeFileSync(input, JSON.stringify(table, null, 2));
    const result = execSync(command).toString();
    if (result) {
        console.log(result);
    }
    return readFileSync(output).toString('utf-8');
}

function buildDescriptionTable(title: string, headers: string[], rows: string[][], fallbackUrl: string): string {
    const failure = `The table for [${title} can be found here](${fallbackUrl}).`;

    const table = buildTable(headers, rows, 56);
    if (table.length > 1018) {
        return failure;
    }
    return '```' + table + '```';
}

function parseDescriptionFromTable(description: any, fallbackUrl: string): Description {
    const title = description.caption || '';
    const headers = description.colLabels.map(cleanDNDText);
    const rows = description.rows.map((row: string[]) => row.map(parseTableValue));

    const table = buildDescriptionTable(title, headers, rows, fallbackUrl);

    return { name: title, text: table };
}

export function parseDescriptions(name: string, descriptions: any[], fallbackUrl: string): Description[] {
    const subdescriptions: Description[] = [];
    const blocks: string[] = [];

    for (const desc of descriptions) {
        // Special case scenario where an entry is a description on its own
        // These will be handled separately
        if (typeof desc == 'string') blocks.push(cleanDNDText(desc as string));
        else {
            if (desc.type == 'entries') {
                const descName = cleanDNDText(desc.name || '', true);
                subdescriptions.push(...parseDescriptions(descName, desc.entries, fallbackUrl));
            } else if (desc.type == 'table') {
                subdescriptions.push(parseDescriptionFromTable(desc, fallbackUrl));
            } else {
                blocks.push(parseDescriptionBlock(desc));
            }
        }
    }

    const results: Description[] = [];
    if (blocks.length > 0) {
        results.push({ name: name, text: blocks[0] });
    }
    for (let i = 1; i < blocks.length; i++) {
        results.push({ name: '', text: blocks[i] });
    }
    results.push(...subdescriptions);

    // Unsupported types may append empty strings, these are removed here.
    const cleaned: Description[] = results.filter((desc) => desc.text.trim());
    return cleaned;
}

/**
 * Formats an array of strings into a human-readable list.
 * Example: ['A', 'B'] => "A or B", ['A', 'B', 'C'] => "A, B, or C"
 */
export function formatWordList(words: string[], useAndInsteadOfOr: boolean = false): string {
    const concat = useAndInsteadOfOr ? 'and' : 'or';
    const capitalized = words.map((word) => title(word));
    const length = capitalized.length;

    if (length > 2) {
        return capitalized.slice(0, -1).join(', ') + `, ${concat} ` + capitalized[capitalized.length - 1];
    } else if (length === 2) {
        return capitalized.join(` ${concat} `);
    } else if (length === 1) {
        return capitalized[0];
    } else {
        return '';
    }
}
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function title(text: string): string {
    return text.split(' ').map(capitalize).join(' ');
}

export function parseSizes(sizes: string[]): string {
    const sizeMap = new Map<string, string>([
        ['T', 'Tiny'],
        ['S', 'Small'],
        ['M', 'Medium'],
        ['L', 'Large'],
        ['H', 'Huge'],
        ['G', 'Gargantuan'],
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

    return formatWordList(words);
}

export function parseCreatureTypes(creature_type: string | any): string {
    while (typeof creature_type === 'object' && creature_type?.type) {
        creature_type = creature_type.type;
    }

    if (typeof creature_type === 'string') return creature_type;

    if (creature_type?.choose) {
        const types = formatWordList(creature_type.choose);
        if (creature_type.tags?.length) {
            const tagText = creature_type.tags.join(' ');
            return `${types} (${tagText})`;
        }
        return types;
    }

    throw `parseCreatureTypes: Unrecognized format: ${JSON.stringify(creature_type)}`;
}

export function parseCreatureSummonSpell(spell: string): string {
    if (!spell) return '';
    return spell.split('|', 1)[0];
}

export function parseClassResourceValue(value: any) {
    if (typeof value === 'number' || typeof value === 'string') {
        return value;
    }

    switch (value.type) {
        case 'bonus': {
            const sign = getNumberSign(value.value, true);
            value = `${sign}${value.value}`;
            break;
        }
        case 'dice': {
            const number = value.toRoll[0].number;
            const faces = value.toRoll[0].faces;
            value = `${number}d${faces}`;
            break;
        }
        case 'bonusSpeed': {
            const sign = getNumberSign(value.value, true);
            value = `${sign}${value.value} ft.`;
            break;
        }
        default: {
            throw `Unsupported classTableGroups row-type ${value.type}`;
        }
    }

    return value;
}

export function parseItemValue(value: number | null): string | null {
    if (value === null || value === 0) return null;

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

export function parseItemWeight(weight: number | null): string | null {
    if (weight === null || weight === 0) {
        return null;
    }
    if (weight < 1) {
        return `${weight * 16} oz.`;
    }
    return `${weight} lb.`;
}
