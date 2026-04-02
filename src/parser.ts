import { getNumberSign, joinStringsWithAnd, joinStringsWithOr } from './util';
import { get5eToolsUrl, getBestiaryUrl, getFeatsUrl, getImageUrl, getItemsUrl, getTablesUrl } from './urls';
import { AbilityScores, Advantages, Alignments, SpellSchools } from './5etools-conversion/data';
import { ColLabelRows } from './dnd/tables';
import { cleanDNDText } from './clean';

export interface Range {
    type: 'range';
    min: number;
    max: number;
}

export interface Table {
    type: 'table';
    title: string;
    headers: string[] | null;
    rows: (string | Range | null | number)[][];
}

export interface List {
    type: 'list';
    caption: string;
    entries: (string | List)[];
}

export enum DescriptionType {
    text = 'text',
    table = 'table',
    hr = 'hr',
    list = 'list',
}

export interface DescriptionHr {
    name: string;
    type: DescriptionType.hr;
}

export interface DescriptionText {
    name: string;
    type: DescriptionType.text;
    value: string;
}

export interface DescriptionTable {
    name: string;
    type: DescriptionType.table;
    table: Table;
}

export interface DescriptionList {
    name: string;
    type: DescriptionType.list;
    list: List;
}

export type Description = DescriptionHr | DescriptionText | DescriptionTable | DescriptionList;

const disallowedSymbols = ['{', '}', '|', '[object Object]'];

export function containsDisallowedSymbols(value: string | List) {
    // String
    if (typeof value === 'string') {
        return disallowedSymbols.some((s) => value.includes(s));
    }
    // List
    else {
        return value.entries.some(containsDisallowedSymbols);
    }
}

export function checkForDisallowedSymbols(value: string | List) {
    if (containsDisallowedSymbols(value)) {
        throw `Disallowed symbols found in '${JSON.stringify(value)}'`;
    }
}

const AttackAbbrMap = new Map([
    ['mw', 'Melee Weapon Attacks'],
    ['rw', 'Ranged Weapon Attacks'],
    ['m', 'Melee Attacks'],
    ['r', 'Ranged Attacks'],
    ['a', 'Area Attacks'],
    ['aw', 'Area Weapon Attacks'],
    ['ms', 'Melee Spell Attacks'],
    ['mw,rw', 'Melee or Ranged Weapon Attacsk'],
    ['rs', 'Ranged Spell Attsack'],
    ['ms,rs', 'Melee or Ranged Spell Attasck'],
    ['m,r', 'Melee or Ranged sAttack'],
    ['mp', 'Melee Power Attack'],
    ['rp', 'Ranged Power Atstack'],
    ['mp,rp', 'Melee ors Rasnged Power Attack'],
    ['m', 'Melee Attack Roll'],
    ['r', 'Ranged Attack sRoll'],
    ['m,r', 'Melee or Rsanged Attack Roll'],
    ['g', 'Magical Attasck'],
]);
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

export function parseAdvantage(adv: string): string {
    const key = adv.toLowerCase();
    const value = Advantages.get(key);
    if (!value) throw `Unknown advantage-type: ${adv}`;
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
        case 'special': {
            result = `Special`;
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

export function parseCastingTime(time: any, meta: any): string {
    const is_ritual = meta != undefined && meta.ritual;
    if (Array.isArray(time)) {
        const castingTimes = time.map(parseSingleTime);
        if (is_ritual) castingTimes.push('Ritual');
        return joinStringsWithOr(castingTimes, false);
    }

    if (is_ritual) return `${parseSingleTime(time)} or Ritual`;
    return parseSingleTime(time);
}

export function parseDurationTime(durations: any[] | any): string {
    if (!Array.isArray(durations)) durations = [durations];

    const results: string[] = durations.map(
        (d: { type: any; duration: { amount: any; type: any }; concentration: any }) => {
            switch (d.type) {
                case 'instant':
                    return 'Instantaneous';

                case 'special':
                    return 'Special';

                case 'permanent':
                    return 'Until dispelled';

                case 'timed': {
                    const amount = d.duration.amount;
                    const unit = d.duration.type;
                    const time = amount > 1 ? `${amount} ${unit}s` : `${amount} ${unit}`;

                    return d.concentration ? `Concentration, up to ${time}` : time;
                }

                default:
                    throw new Error(`Unsupported duration type: ${d.type}`);
            }
        }
    );

    if (durations.length > 1) return `${joinStringsWithOr(results, false)} (see below)`; // If there's more than one duration, there's always an explanation as to why.
    return joinStringsWithOr(results, false);
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
        case 'mile':
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

        if (material) result.push(`M (${material})`);
        else result.push('M');
    }

    return result.join(', ');
}

export function parseAlignments(alignments: string[]): string[] {
    const result: string[] = [];
    for (const alignment of alignments) {
        const parsed = Alignments.get(alignment);
        if (!parsed) throw `Unsupported Alignment: '${alignment}'`;
        result.push(parsed);
    }
    return result;
}

function parseDescriptionBlockFromBlocks(descriptions: any[]): string {
    const blocks = descriptions.map(parseDescriptionBlock);
    return blocks.join('\n\n');
}

function splitDescriptionTypes(values: (string | Table | List)[]): {
    strings: string[];
    tables: Table[];
    lists: List[];
} {
    const strings: string[] = [];
    const tables: Table[] = [];
    const lists: List[] = [];
    for (const value of values) {
        if (typeof value === 'string') strings.push(value);
        else if (value.type === 'list') lists.push(value);
        else tables.push(value);
    }
    return { strings, tables, lists };
}

function parseDescriptionBlock(description: string | any): (string | Table | List)[] {
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
            // Remove tables and append them afterwards
            const tables = entries.filter((entry: any) => entry.type === 'table');
            const nontables = entries.filter((entry: any) => entry.type !== 'table');
            const list: List = { type: 'list', caption: '', entries: nontables };
            return [list, ...tables];
        }
        case 'inset':
        case 'insetReadaloud': {
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const { strings, tables, lists } = splitDescriptionTypes(entries);
            const entry = strings.map((str) => `*${str}*`).join('\n');
            return [entry, ...lists, ...tables];
        }
        case 'item': {
            const entries: (string | Table | List)[] = [];
            if (description.entries) {
                entries.push(...description.entries.flatMap(parseDescriptionBlock));
            } else if (description.entry) {
                entries.push(...parseDescriptionBlock(description.entry));
            } else {
                throw "Could not find entry in description block with type 'item'";
            }

            const { strings, tables, lists } = splitDescriptionTypes(entries);
            const entry = strings.join('\n');
            if (description.name) {
                const name = description.name.replace(/:$/, '');
                return [cleanDNDText(`**${name}**: ${entry}`), ...lists, ...tables];
            } else {
                return [cleanDNDText(entry), ...lists, ...tables];
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
            const { strings, tables, lists } = splitDescriptionTypes(entries);
            const entry = strings.join('\n');
            if (description.name) {
                const name = description.name.replace(/:$/, '');
                return [cleanDNDText(`**${name}**: ${entry}`), ...lists, ...tables];
            }
            return [cleanDNDText(entry), ...tables];
        }
        case 'entry': {
            return [cleanDNDText(description.entry)];
        }
        case 'table': {
            const table = parseDescriptionFromTable(description);
            return [table.table];
        }
        case 'image': {
            return []; // Images will not be handled within descriptions
        }
        case 'abilityAttackMod':
        case 'abilityDc': {
            const titleDesc = description.type === 'abilityDc' ? 'Save DC' : 'Attack modifier';

            const abilityScores = description.attributes.map(parseAbilityScore);
            const text = `*${description.name} ${titleDesc}*: ${joinStringsWithOr(abilityScores)} modifier + Proficiency Bonus`;
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
                entries.push(...description.entries.flatMap(parseDescriptionBlock));
            }

            const title = count ? `Choose **${count}**:` : '';
            const list: List = { type: 'list', caption: title, entries: entries };
            return [list];
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
            return [
                {
                    type: 'list',
                    caption: '',
                    entries: [`[${name}](${link})`],
                },
            ];
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

        case 'itemSub': {
            const entry = description.entries ? description.entries.join('\n') : description.entry;
            const itemSub = description.name ? `*${description.name}*. ${entry}` : entry;
            return [cleanDNDText(itemSub)];
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
            } else if (value.type === 'item') {
                // Item is similar to entries, except it has both the name and entries, and entries is more parseable
                const name = cleanDNDText(value.name, true);
                const entries = value.entries.map((entry: string) => cleanDNDText(entry, true));
                const entry = entries.join('\n');
                const combined = `${name}. ${entry}`;
                cells.push(combined);
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

export function parseDescriptionFromTable(description: any): DescriptionTable {
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
    const table: Table = { type: 'table', title, headers, rows };

    return { name: title, type: DescriptionType.table, table: table };
}

export function parseDescriptions(name: string, descriptions: any[]): Description[] {
    const subdescriptions: Description[] = [];
    const blocks: (string | Table | List)[] = [];
    if (name.trim() !== '') name = cleanDNDText(name).trim();

    for (const desc of descriptions) {
        // Special case scenario where an entry is a description on its own
        // These will be handled separately
        if (typeof desc == 'string') blocks.push(cleanDNDText(desc as string));
        else {
            if (desc.type === 'entries' || desc.type === 'section') {
                const descName = cleanDNDText(desc.name || '', true);
                subdescriptions.push(...parseDescriptions(descName, desc.entries));
            } else if (desc.type === 'table') {
                subdescriptions.push(parseDescriptionFromTable(desc));
            } else {
                blocks.push(...parseDescriptionBlock(desc));
            }
        }
    }

    function toDescription(name: string, value: string | Table | List): Description {
        if (typeof value === 'string') {
            return {
                name,
                type: DescriptionType.text,
                value,
            };
        } else if (value.type === 'table') {
            return {
                name,
                type: DescriptionType.table,
                table: value,
            };
        } else if (value.type === 'list') {
            return {
                name,
                type: DescriptionType.list,
                list: value,
            };
        } else {
            throw `toDescription: Unknown description type ${value}`;
        }
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
        if (desc.type === DescriptionType.text) {
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

export function parsePrerequisite(prerequisite: any): string | null {
    if (!prerequisite) return null;

    const prerequisites: string[] = [];

    for (const key of Object.keys(prerequisite)) {
        switch (key) {
            case 'campaign': {
                const campaigns = prerequisite.campaign;
                prerequisites.push(`${joinStringsWithOr(campaigns)} campaign`);
                break;
            }
            case 'level': {
                const lvl = prerequisite.level.level;
                const classname = prerequisite.level.class.name;
                prerequisites.push(`Lv. ${lvl} ${classname}`);
                break;
            }
            default: {
                throw `parsePrerequisite: Unknown key '${key}'!`;
            }
        }
    }

    if (prerequisites.length === 0) return null;
    return joinStringsWithAnd(prerequisites, false);
}
