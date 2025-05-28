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

export function cleanUrl(url: string): string {
    return encodeURI(url);
}

export function cleanDNDText(text: string, noFormat: boolean = false): string {
    // Note: all regexes should end with a g, which stands for "global"

    text = text.replaceAll(/\{@atk rw\} /g, '+');
    text = text.replaceAll(/\{@atk rw\}/g, '+');
    text = text.replaceAll(/\{@action ([^\}]*?)\|([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@action ([^\}]*?)\}/g, '$1');
    text = text.replaceAll(/\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/g, '$1 ($2)');
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
        case 'insetReadalout': {
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

def format_words_list(words: list) -> str:
    """Formats a list of words into comma-separated text. Example: [A, B] => "A or B" / [A, B, C] => "A, B, or C"""
    words = [word.title() for word in words]

    if len(words) == 2:
        return ' or '.join(words)
    elif len(words) > 2:
        return ', '.join(words[:-1]) + f", or {words[-1]}"
    elif len(words) == 1:
        return words[0]
    else:
        return ""

def parse_creature_size(sizes: any) -> str:
    size_map = {
        "T": "Tiny",
        "S": "Small",
        "M": "Medium",
        "L": "Large",
        "H": "Huge",
        "G": "Gargantuan"
    }

    # Good reference creature is Animated Object
    words = []
    for size in sizes:
        word = size_map.get(size, None)
        if word:
            words.append(word)

    return format_words_list(words)

def parse_creature_type(creature_type: str | dict) -> str:
    if isinstance(creature_type, dict):
        type = creature_type.get("type", "")

        if isinstance(type, dict):
            # Edge case where type can be multiple types (eg. Otherworldly Steed)
            choices = type.get("choose", "")
            type = format_words_list(choices)
        else:
            type = type.title()

        tags = creature_type.get("tags", None)
        if tags:
            tag_list = [t if isinstance(t, str) else t.get("name", "") for t in tags]
            tags = ' '.join(tag_list).title()
        else:
            tags = None
            
        return f"{type} ({tags})" if tags else type
    return creature_type.title() if creature_type else ""

def parse_creature_summon_spell(spell: str | None) -> str | None:
    if spell is None:
        return None

    if "|" in spell:
        name, source = spell.split("|", 1)
        return name
    else:
        return spell

*/
