import { Link } from '../../5etools-collector/types/internal/base';
import {
    Entry,
    EntryInline,
    EntryInset,
    EntryItem,
    EntryItemSpell,
    EntryList,
    EntryQuote,
} from '../../5etools-collector/types/internal/entry';
import { joinStringsWithOr } from '../util';
import { parseAbilityScore } from './base';
import { cleanDNDText, containsDisallowedSymbols } from './clean';
import {
    get5eToolsUrl,
    getActionsUrl,
    getBestiaryUrl,
    getCharCreationOptionUrl,
    getConditionsDiseasesUrl,
    getFeatsUrl,
    getImageUrl,
    getItemsUrl,
    getTablesUrl,
    getTrapsUrl,
} from './urls';

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

export function flattenListEntries(list: List): string[] {
    return list.entries.flatMap((entry) => {
        if (typeof entry === 'string') {
            return entry;
        } else {
            return flattenListEntries(entry);
        }
    });
}

export function containsUnresolvedReferences(description: Description): boolean {
    if (description.type === DescriptionType.text) return containsDisallowedSymbols(description.value);
    if (description.type === DescriptionType.table) return false; // For now, tables don't have any references.
    if (description.type === DescriptionType.list)
        return containsDisallowedSymbols(flattenListEntries(description.list));

    throw `Unsupported unresolved description references type '${description.type}'`;
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

function parseEntryQuote(entry: EntryQuote): string[] {
    const quote = parseDescriptionBlockFromBlocks(entry.entries);
    if (entry.by) return [`*${quote}* - ${entry.by}`];
    return [`*${quote}*`];
}

function parseEntryList(entry: EntryList) {
    function isTable(description: string | List | Table): description is Table {
        return typeof description !== 'string' && description.type === 'table';
    }

    const entries = entry.items.flatMap(parseDescriptionBlock);
    // Remove tables and append them afterwards
    const tables = entries.filter((entry) => isTable(entry));
    const nontables = entries.filter((entry) => !isTable(entry)) as (string | List)[];
    const list: List = { type: 'list', caption: '', entries: nontables };
    return [list, ...tables];
}

function parseEntryInset(entry: EntryInset) {
    const entries = entry.entries.flatMap(parseDescriptionBlock);
    const { strings, tables, lists } = splitDescriptionTypes(entries);
    const string = strings.map((str) => `*${str}*`).join('\n');
    return [string, ...lists, ...tables];
}

function parseEntryItem(entry: EntryItem) {
    const entries: (string | Table | List)[] = [];
    if (entry.entries) {
        entries.push(...entry.entries.flatMap(parseDescriptionBlock));
    } else if (entry.entry) {
        entries.push(...parseDescriptionBlock(entry.entry));
    } else {
        throw "Could not find entry in description block with type 'item'";
    }

    const { strings, tables, lists } = splitDescriptionTypes(entries);
    const string = strings.join('\n');
    if (entry.name) {
        const name = entry.name.replace(/:$/, '');
        return [cleanDNDText(`**${name}**: ${string}`), ...lists, ...tables];
    } else {
        return [cleanDNDText(string), ...lists, ...tables];
    }
}

function parseEntryItemSpell(entry: EntryItemSpell) {
    const name = cleanDNDText(entry.name);
    const text = cleanDNDText(entry.entry);
    return [`${name} ${text}`];
}

function parseEntryInline(entry: EntryInline) {
    const text = entry.entries.flatMap(parseDescriptionBlock).join('');
    if (entry.name) return [cleanDNDText(`**${entry.name}**: ${text}`)];
    return [cleanDNDText(text)];
}

function parseLink(link: Link) {
    let url: string;
    const text = link.text;
    const href = link.href;

    if (href.type === 'internal') {
        url = get5eToolsUrl(href.path);
        if (href.hash) {
            url = url + '#' + href.hash;
        }
    } else {
        url = href.url;
    }
    return [`[${text}](${url})`];
}

function parseDescriptionBlock(description: Entry | Link): (string | Table | List)[] {
    if (typeof description == 'string') {
        return [cleanDNDText(description)];
    }

    // Specific scenario encountered once
    if (!description.type && description.entries) {
        return description.entries.flatMap(parseDescriptionBlock);
    }

    const type = description.type;
    switch (type) {
        case 'link':
            return parseLink(description);

        case 'quote':
            return parseEntryQuote(description);

        case 'list':
            return parseEntryList(description);

        case 'inset':
        case 'insetReadaloud':
            return parseEntryInset(description);

        case 'item':
            return parseEntryItem(description);

        case 'itemSpell':
            return parseEntryItemSpell(description);

        case 'inline':
            return parseEntryInline(description);

        case 'section':
        case 'entries': {
            const entries = description.entries.flatMap(parseDescriptionBlock);
            const { strings, tables, lists } = splitDescriptionTypes(entries);
            const entry = strings.join('\n');

            if (!description.name) return [cleanDNDText(entry), ...tables];
            const name = description.name.replace(/:$/, '');

            // Fix partnered species formatting (e.g. Dhampir GrimHollow '24)
            // This data uses the 'entries' type to give a caption to lists, instead of using the caption field.
            if (entries.length == 1 && typeof entries[0] !== 'string' && entries[0].type === 'list') {
                const list = entries[0];
                list.caption = name;
                return entries;
            }

            return [cleanDNDText(`**${name}**: ${entry}`), ...lists, ...tables];
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
                case 'action':
                    link = getActionsUrl(name, source);
                    break;
                case 'charoption':
                    link = getCharCreationOptionUrl(name, source);
                    break;
                case 'condition':
                    link = getConditionsDiseasesUrl(name, source);
                    break;
                case 'creature':
                    link = getBestiaryUrl(name, source);
                    break;
                case 'hazard':
                    link = getTrapsUrl(name, source);
                    break;
                case 'item':
                    link = getItemsUrl(name, source);
                    break;
                case 'optfeature':
                    link = getFeatsUrl(name, source);
                    break;
                case 'table':
                    link = getTablesUrl(name, source);
                    break;
            }

            if (!link) throw `Unsupported statblock ${tag} - ${description.name} (${description.source})`;
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

        case 'abilityGeneric': {
            return [`**${description.name}** = ${description.text}`];
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
        } else if (values.type === 'list') {
            return values.items.map((item: string) => {
                return `- ${cleanDNDText(item)}`;
            });
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
                const name = value.name ? cleanDNDText(value.name, true) : '';
                if (value.entry) {
                    // Frontier Style (FoEQuickstone)
                    cells.push(`**${name}**. ${cleanDNDText(value.entry)}`);
                    continue;
                }

                const entries = value.entries.map((entry: string) => {
                    if (typeof entry === 'string') return cleanDNDText(entry, true);
                    return parseTableRow(entry);
                });

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
            } else if (value.type == 'list') {
                // list is generally a few stacked values, kind of the same as having multiple rows.
                if (value.items && Array.isArray(value.items)) {
                    const listItems = value.items.map((item: any) =>
                        typeof item === 'string' ? cleanDNDText(item, true) : String(item)
                    );
                    cells.push(listItems.join('\n'));
                } else {
                    cells.push('');
                }
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

export function parseDescriptionFromTable(table: any): DescriptionTable {
    const title: string = table.caption || '';

    if (table.type === 'tableGroup') {
        const tables = table.tables.map((table: any) => parseDescriptionFromTable(table).table);
        return {
            name: title,
            type: DescriptionType.table,
            table: { type: 'table', title, headers: null, rows: tables as any },
        };
    }

    let headers: string[] | null = null;
    if (table.colLabels) {
        headers = table.colLabels.map(cleanDNDText);
    } else if (table.colLabelRows) {
        // TODO Table typing
        const colLabelRows = table.colLabelRows;
        const expandedRows: string[][] = colLabelRows.map((row: any) =>
            row.flatMap((cell: any) => {
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

    const rows: string[][] = table.rows.map(parseTableRow);
    return { name: title, type: DescriptionType.table, table: { type: 'table', title, headers, rows } };
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
