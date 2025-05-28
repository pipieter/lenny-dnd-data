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
    text = text.replace(/\{@atk rw\} /, '+');
    text = text.replace(/\{@atk rw\}/, '+');
    text = text.replace(/\{@action ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1 ($2)');
    text = text.replace(/\{@b ([^\}]*?)\}/, '**$1**');
    text = text.replace(/\{@book ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@book ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@card ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@chance ([^\}]*?)\|\|\|([^\}]*?)\|([^\}]*?)\}/, '$1 percent');
    text = text.replace(/\{@chance ([^\}]*?)\}/, '$1 percent');
    text = text.replace(/\{@classFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@condition ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@condition ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@d20 -([^\}]*?)\}/, '-$1');
    text = text.replace(/\{@d20 ([^\}]*?)\}/, '+$1');
    text = text.replace(/\{@dc ([^\}]*?)\}/, 'DC $1');
    text = text.replace(/\{@deck ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@deck ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@deity ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@dice ([^\}]*?)\|([^\}]*?)\}/, '$1 ($2)');
    text = text.replace(/\{@dice ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@filter ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@filter ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@filter ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@hazard ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@hazard ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@hit ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@item ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
    text = text.replace(/\{@item ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@item ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@itemProperty ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
    text = text.replace(/\{@language ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@link ([^\}]*?)\|([^\}]*?)\}/, '[$1]($2)');
    text = text.replace(/\{@optfeature ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@optfeature ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@quickref ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@race ([^\}]*?)\|\|([^\}]*?)\}/, '$2');
    text = text.replace(/\{@race ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@race ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@sense ([^\}]*?)\|[^\}]*?\}/, '$1');
    text = text.replace(/\{@sense ([^\}]*?)\}/, '$1');
    text = text.replace(/\{@table ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
    text = text.replace(/\{@table ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@variantrule ([^\}]*?)\|([^\}]*?)\}/, '$1');
    text = text.replace(/\{@variantrule ([^\}]*?)\}/, '$1');

    if (noFormat) {
        text = text.replace(/\{@h\}/, 'Hit: ');
        text = text.replace(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
        text = text.replace(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/, '$1');
        text = text.replace(/\{@i ([^\}]*?)\}/, '$1');
        text = text.replace(/\{@italic ([^\}]*?)\}/, '$1');
        text = text.replace(/\{@damage ([^\}]*?)\}/, '$1');
        text = text.replace(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
        text = text.replace(/\{@skill ([^\}]*?)\|([^\}]*?)\}/, '$1');
        text = text.replace(/\{@skill ([^\}]*?)\}/, '$1');
        text = text.replace(/\{@spell ([^\}]*?)\|([^\}]*?)\}/, '$1');
        text = text.replace(/\{@spell ([^\}]*?)\}/, '$1');
        text = text.replace(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '$3');
        text = text.replace(/\{@status ([^\}]*?)\|([^\}]*?)\}/, '$1');
        text = text.replace(/\{@status ([^\}]*?)\}/, '$1');
    } else {
        text = text.replace(/\{@h\}/, '*Hit:* ');
        text = text.replace(/\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '__$3__');
        text = text.replace(/\{@creature ([^\}]*?)(\|[^\}]*?)?\}/, '__$1__');
        text = text.replace(/\{@i ([^\}]*?)\}/, '*$1*');
        text = text.replace(/\{@italic ([^\}]*?)\}/, '*$1*');
        text = text.replace(/\{@damage ([^\}]*?)\}/, '**$1**');
        text = text.replace(/\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, ' ** $3 ** ');
        text = text.replace(/\{@skill ([^\}]*?)\|([^\}]*?)\}/, '*$1*');
        text = text.replace(/\{@skill ([^\}]*?)\}/, '*$1*');
        text = text.replace(/\{@spell ([^\}]*?)\|([^\}]*?)\}/, '__$1__');
        text = text.replace(/\{@spell ([^\}]*?)\}/, '__$1__');
        text = text.replace(/\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}/, '*$3*');
        text = text.replace(/\{@status ([^\}]*?)\|([^\}]*?)\}/, '*$1*');
        text = text.replace(/\{@status ([^\}]*?)\}/, '*$1*');
    }

    // Note: notes should be parsed at the end, because they might contain subqueries
    text = text.replace(/\{@note ([^\}]*?)\}/, '\($1\)');

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

export function parseSpellSchool(school: string): string | null {
    return SpellSchools.get(school) || null;
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
            if (amount == 1) result = `${amount} {unit}`;
            else result = `${amount} {unit}s`;
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
            return description.entry;
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

interface Description {
    name: string;
    text: string;
}

function parseDescriptionFromTable(description: any, fallbackUrl: string): Description {
    return { name: 'TABLE', text: 'THIS IS NOT IMPLEMENTED YET' };
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



def __parse_table_value(value: any) -> str:
    if isinstance(value, str):
        return clean_dnd_text(value)
    elif isinstance(value, dict):
        if value.get("type") == "cell":
            # Should be improved
            if "roll" in value.keys():
                if "exact" in value["roll"].keys():
                    return str(value["roll"]["exact"])
                elif "min" in value["roll"].keys() and "max" in value["roll"].keys():
                    roll_min = value["roll"]["min"]
                    roll_max = value["roll"]["max"]
                    return f"{roll_min}-{roll_max}"

            return f"Unsupported table value cell-type: '{value['type']}'"
        return f"Unsupported table value-type: '{value['type']}'"
    else:
        # For primitives, just convert to string
        return str(value)


def __prettify_table(title: str, cells: list[list[str]], fallbackUrl: str) -> str:
    """
    Prettify a table, by converting it to a string. The field string length is less
    than or equal to 1024 characters. Because the generated string needs at least 6
    characters for the code block styling, the table string can only be 1018
    characters long at most.

    The used library is 'rich'. Rich is originally meant to be a console application,
    but with some workarounds you can save the generated table to a string.
    """

    # TODO remove formatting effects in the cells

    failure = f"The table for [{title} can be found here]({fallbackUrl})."
    headers = cells[0]
    rows = cells[1:]

    table = Table(style=None, box=rich.box.ROUNDED)
    for header in headers:
        table.add_column(header, justify="left", style=None)

    for row in rows:
        table.add_row(*row)

    buffer = io.StringIO()
    console = Console(file=buffer, width=56)
    console.print(table)
    table_string = buffer.getvalue()
    buffer.close()

    if len(table_string) > 1018:
        return failure

    return f"```{table_string}```"


def __parse_description_from_table(
    description: any, fallbackUrl: str
) -> tuple[str, str]:
    caption = description.get("caption", "")
    labels = [clean_dnd_text(label) for label in description["colLabels"]]
    rows = [[__parse_table_value(v) for v in row] for row in description["rows"]]

    table = __prettify_table(caption, [labels] + rows, fallbackUrl)
    return (caption, table)


def parse_descriptions(
    name: str, description: list[any], fallbackUrl: str
) -> list[tuple[str, str]]:
    subdescriptions: list[tuple[str, str]] = []

    blocks: list[str] = []

    for desc in description:
        # Special case scenario where an entry is a description on its own
        # These will be handled separately
        if isinstance(desc, str):
            blocks.append(clean_dnd_text(desc))
        else:
            if desc["type"] == "entries":
                desc_name = clean_dnd_text(desc.get("name", ""), no_formatting=True)
                subdescriptions.extend(
                    parse_descriptions(desc_name, desc["entries"], fallbackUrl)
                )
            elif desc["type"] == "table":
                subdescriptions.append(
                    __parse_description_from_table(desc, fallbackUrl)
                )
            else:
                blocks.append(__parse_description_block(desc))

    descriptions = []
    if len(blocks) > 0:
        descriptions.append((name, blocks[0]))
    for i in range(1, len(blocks)):
        descriptions.append(("", blocks[i]))
    descriptions.extend(subdescriptions)

    cleaned_descriptions = [ # Unsupported types may append empty strings, these are removed here.
        (title, desc) for title, desc in descriptions if desc.strip()
    ]

    return cleaned_descriptions


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
