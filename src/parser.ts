import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { getPythonInstallation } from './util';

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

export function getImageUrl(path: string): string {
    return `https://5e.tools/img/${path}`;
}

export const cleanUrl = encodeURI;

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // Note: all regexes should end with a g, which stands for "global"

    text = text.replaceAll(/\{@atk rw\} /g, '+');
    text = text.replaceAll(/\{@atk rw\}/g, '+');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@action ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
    text = text.replaceAll(/\{@style ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@b ([^\}]*?)\}/g, '**$1**');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@book ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@card ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@chance ([^\}]*?)\|\|\|([^\}]*?)\|([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@chance ([^\}]*?)\}/g, '$1 percent');
    text = text.replaceAll(/\{@classFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1');
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
    text = text.replaceAll(/\{@adventure ([^\}]*?)}/g, '$1');

    if (noFormat) {
        text = text.replaceAll(/\{@h\}/g, 'Hit: ');
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$3');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '$1');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '$1');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '$1');
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
    } else {
        text = text.replaceAll(/\{@h\}/g, '*Hit:* ');
        text = text.replaceAll(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '__$3__');
        text = text.replaceAll(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/g, '__$1__');
        text = text.replaceAll(/\{@disease ([^\}]*?)\}/g, '__$1__');
        text = text.replaceAll(/\{@i ([^\}]*?)\}/g, '*$1*');
        text = text.replaceAll(/\{@italic ([^\}]*?)\}/g, '*$1*');
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
        text = text.replaceAll(
            /\{@background ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g,
            (_, p1, p2, p3) =>
                `[${p3}](${cleanUrl(`https://5e.tools/backgrounds.html#${p1}_${p2}`)})`
        );
    }

    // Note: notes should be parsed at the end, because they might contain subqueries
    text = text.replaceAll(/\{@note ([^\}]*?)\}/g, '\($1\)');

    // Check if any remaining patterns of {@...} exist
    if (/^.*\{@.*\}.*$/g.test(text)) {
        throw `{@...} pattern found in '${text}'`;
    }

    return text;
}

export function parseImageUrl(data: any[]): string | null {
    for (const datum of data) {
        if (datum.type != 'image') continue;

        const href = datum.href;
        if (href.type == 'internal') return getImageUrl(href.path);
        else if (href.type == 'external') return href.path as string;
        else throw `Unknown image href type '${href['type']}'`;
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
        let material = components['m'];
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
            const bullet = '\u2022'; // U+2022 •
            const points: string[] = [];
            for (const item of description.items)
                points.push(`${bullet} ${parseDescriptionBlock(item)}`);
            return points.join('\n');
        }
        case 'inset':
        case 'insetReadaloud': {
            return `*${parseDescriptionBlockFromBlocks(description.entries)}*`;
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
            return `**${description.name}**: ${entry}`;
        }
        case 'section':
        case 'entries': {
            const entries = description.entries.map(parseDescriptionBlock);
            const entry = entries.join('\n');
            if (description.name) return `**${description.name}**: ${entry}`;
            return entry;
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
        case 'abilityDc': {
            return ''; // Not handled yet
        }
        case 'abilityAttackMod': {
            return ''; // Not handled yet
        }
        case 'refClassFeature': {
            return ''; // Not handled yet
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
            return 'TODO - ADD TABLE ENTRIES SUPPORT';
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

function buildDescriptionTable(
    title: string,
    headers: string[],
    rows: string[][],
    fallbackUrl: string
): string {
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

export function parseDescriptions(
    name: string,
    descriptions: any[],
    fallbackUrl: string
): Description[] {
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
    const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    const length = capitalized.length;

    if (length > 2) {
        return (
            capitalized.slice(0, -1).join(', ') +
            `, ${concat} ` +
            capitalized[capitalized.length - 1]
        );
    } else if (length === 2) {
        return capitalized.join(` ${concat} `);
    } else if (length === 1) {
        return capitalized[0];
    } else {
        return '';
    }
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

/*
def parse_item_value(value: int) -> str | None:
    if value == 0:
        return None

    gp = (value) // 100
    sp = (value % 100) // 10
    cp = value % 10

    values = []
    if gp > 0:
        # Adds thousands separators
        gp_formatted = "{:,}".format(gp).replace(",", ".")
        values.append(f"{gp_formatted} gp")
    if sp > 0:
        values.append(f"{sp} sp")
    if cp > 0:
        values.append(f"{cp} cp")

    if len(values) == 0:
        return None

    return " ".join(values)


def parse_item_weight(weight: int) -> str | None:
    if weight == 0:
        return None

    if weight < 1:
        return f"{weight*16} oz."
    else:
        return f"{weight} lb."

*/
