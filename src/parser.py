"""
Parses data from the 5e.tools submodule
"""

import io
import re
import rich
import rich.box
from rich.table import Table
from rich.console import Console


SPELL_SCHOOLS = {
    "A": "Abjuration",
    "C": "Conjuration",
    "D": "Divination",
    "E": "Enchantment",
    "V": "Evocation",
    "I": "Illusion",
    "N": "Necromancy",
    "P": "Psionic",
    "T": "Transmutation",
}


def clean_dnd_text(text: str, no_formatting=False) -> str:
    text = re.sub(r"\{@atk rw\} ", r"+", text)

    text = re.sub(r"\{@action ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@action ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@adventure ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1 (\2)", text)
    text = re.sub(r"\{@b ([^\}]*?)\}", r"**\1**", text)
    text = re.sub(r"\{@book ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@book ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@card ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(
        r"\{@chance ([^\}]*?)\|\|\|([^\}]*?)\|([^\}]*?)\}", r"\1 percent", text
    )
    text = re.sub(r"\{@chance ([^\}]*?)\}", r"\1 percent", text)
    text = re.sub(
        r"\{@classFeature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1", text
    )
    text = re.sub(r"\{@condition ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@condition ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@d20 -([^\}]*?)\}", r"-\1", text)
    text = re.sub(r"\{@d20 ([^\}]*?)\}", r"+\1", text)
    text = re.sub(r"\{@dc ([^\}]*?)\}", r"DC \1", text)
    text = re.sub(r"\{@deck ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@deck ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@deity ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@dice ([^\}]*?)\|([^\}]*?)\}", r"\1 (\2)", text)
    text = re.sub(r"\{@dice ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@filter ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@filter ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@filter ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@hazard ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@hazard ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@hit ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@item ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
    text = re.sub(r"\{@item ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@item ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@itemProperty ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
    text = re.sub(r"\{@language ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@link ([^\}]*?)\|([^\}]*?)\}", r"[\1](\2)", text)
    text = re.sub(r"\{@optfeature ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@optfeature ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@quickref ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@race ([^\}]*?)\|\|([^\}]*?)\}", r"\2", text)
    text = re.sub(r"\{@race ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@race ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@sense ([^\}]*?)\|[^\}]*?\}", r"\1", text)
    text = re.sub(r"\{@sense ([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@table ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
    text = re.sub(r"\{@table ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@variantrule ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
    text = re.sub(r"\{@variantrule ([^\}]*?)\}", r"\1", text)

    if no_formatting:
        text = re.sub(r"\{@h\}", r"Hit: ", text)
        text = re.sub(r"\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
        text = re.sub(r"\{@creature ([^\}]*?)(\|[^\}]*?)?\}", r"\1", text)
        text = re.sub(r"\{@i ([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@italic ([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@damage ([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
        text = re.sub(r"\{@skill ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@skill ([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@spell ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@spell ([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"\3", text)
        text = re.sub(r"\{@status ([^\}]*?)\|([^\}]*?)\}", r"\1", text)
        text = re.sub(r"\{@status ([^\}]*?)\}", r"\1", text)
    else:
        text = re.sub(r"\{@h\}", r"*Hit:* ", text)
        text = re.sub(r"\{@creature ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"__\3__", text)
        text = re.sub(r"\{@creature ([^\}]*?)(\|[^\}]*?)?\}", r"__\1__", text)
        text = re.sub(r"\{@i ([^\}]*?)\}", r"*\1*", text)
        text = re.sub(r"\{@italic ([^\}]*?)\}", r"*\1*", text)
        text = re.sub(r"\{@damage ([^\}]*?)\}", r"**\1**", text)
        text = re.sub(
            r"\{@scaledamage ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"**\3**", text
        )
        text = re.sub(r"\{@skill ([^\}]*?)\|([^\}]*?)\}", r"*\1*", text)
        text = re.sub(r"\{@skill ([^\}]*?)\}", r"*\1*", text)
        text = re.sub(r"\{@spell ([^\}]*?)\|([^\}]*?)\}", r"__\1__", text)
        text = re.sub(r"\{@spell ([^\}]*?)\}", r"__\1__", text)
        text = re.sub(r"\{@status ([^\}]*?)\|([^\}]*?)\|([^\}]*?)\}", r"*\3*", text)
        text = re.sub(r"\{@status ([^\}]*?)\|([^\}]*?)\}", r"*\1*", text)
        text = re.sub(r"\{@status ([^\}]*?)\}", r"*\1*", text)

    # Note: notes should be parsed at the end, because they might contain subqueries
    text = re.sub(r"\{@note ([^\}]*?)\}", r"\(\1\)", text)

    return text


def parse_image_url(data: list[dict]) -> str | None:
    for datum in data:
        if not datum["type"] == "image":
            continue

        href = datum["href"]
        if href["type"] == "internal":
            return "https://5e.tools/img/" + href["path"]
        elif href["type"] == "external":
            return href["path"]
        else:
            raise RuntimeError(f"Unknown image href type '{href['type']}'")

    return None


def parse_spell_level(level: int) -> str:
    if level == 0:
        return "Cantrip"
    else:
        return f"Level {level}"


def parse_spell_school(school: str) -> str:
    return SPELL_SCHOOLS[school]


def __parse_single_casting_time(time: any) -> str:
    amount = time["number"]
    unit = time["unit"]
    note = None

    if "note" in time:
        note = time["note"]

    result = f"Unsupported casting time unit: {unit}"
    if unit == "action":
        if amount == 1:
            result = "Action"
        else:
            result = f"{amount} actions"

    elif unit == "bonus":
        if amount == 1:
            result = "Bonus action"
        else:
            result = f"{amount} bonus actions"

    elif amount == 1:
        result = f"{amount} {unit}"
    else:
        result = f"{amount} {unit}s"

    # Add note, if exists
    if note is not None:
        result = f"{result} ({note})"

    return result


def parse_casting_time(time: any) -> str:
    if isinstance(time, list):
        casting_times = [__parse_single_casting_time(t) for t in time]
    else:
        casting_times = [__parse_single_casting_time(time)]

    return " or ".join(casting_times)


def parse_duration_time(duration: any) -> str:
    duration = duration[0]
    if duration["type"] == "instant":
        return "Instantaneous"

    if duration["type"] == "permanent":
        return "Permanent"

    if duration["type"] == "special":
        return "Special"

    if duration["type"] == "timed":
        amount = duration["duration"]["amount"]
        unit = duration["duration"]["type"]
        if amount > 1:
            unit += "s"
        return f"{amount} {unit}"

    return f"Unsupported duration type: '{duration['type']}'"


def parse_distance(distance: any) -> str:
    if distance["type"] == "touch":
        return "Touch"

    if distance["type"] == "self":
        return "Self"

    if distance["type"] == "sight":
        return "Sight"

    if distance["type"] == "unlimited":
        return "Unlimited"

    if distance["type"] == "feet":
        if distance["amount"] == 1:
            return "1 foot"
        else:
            return f"{distance['amount']} feet"

    if distance["type"] == "miles":
        if distance["amount"] == 1:
            return "1 mile"
        else:
            return f"{distance['amount']} miles"

    return f"Unsupported distance type: '{distance['type']}'"


def parse_range(spell_range: any) -> str:
    if spell_range["type"] == "point":
        return parse_distance(spell_range["distance"])

    if spell_range["type"] == "cube":
        return f"Cube ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "emanation":
        return f"Emanation ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "radius":
        return f"Radius ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "cone":
        return f"Cone ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "line":
        return f"Line ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "sphere":
        return f"Sphere ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "hemisphere":
        return f"Hemisphere ({parse_distance(spell_range['distance'])})"

    if spell_range["type"] == "special":
        return "Special"

    return f"Unsupported range type: '{spell_range['type']}'"


def parse_components(components: dict) -> str:
    result = []
    if components.get("v", False):
        result.append("V")
    if components.get("s", False):
        result.append("S")
    if "m" in components.keys():
        material = components["m"]
        if not isinstance(material, str):
            material = material["text"]
        result.append(f"M ({material})")
    return ", ".join(result)


def __parse_description_block(description: any) -> str:
    if isinstance(description, str):
        return clean_dnd_text(description)
    
    type = description["type"]
    match type:
        case "quote":
            quote = __parse_description_block_from_blocks(description["entries"])
            if "by" in description:
                by = description["by"]
                return f"*{quote}* - {by}"
            else:
                return f"*{quote}*"
            
        case "list":
            bullet = "•"  # U+2022
            points = []
            for item in description["items"]:
                points.append(f"{bullet} {__parse_description_block(item)}")
            return "\n".join(points)

        case "inset":
            return f"*{__parse_description_block_from_blocks(description['entries'])}*"

        case "item":
            name = description["name"]
            if "entries" in description:
                entries = [__parse_description_block(e) for e in description["entries"]]
            elif "entry" in description:
                entries = [__parse_description_block(description["entry"])]
            else:
                raise RuntimeError(
                    "Could not find entry in description block with type 'item'"
                )
            entries = "\n".join(entries)
            return f"**{name}**: {entries}"  

        case "entries" | "section":
            name = description.get("name", None)
            entries = [__parse_description_block(e) for e in description["entries"]]
            entries = "\n".join(entries)
            return f"**{name}**: {entries}" if name else entries
        
        case "entry":
            entries = [__parse_description_block(description["entry"])]
            return "\n".join(entries)
        
        case "table":
            title, table = __parse_description_from_table(description, "")

            if title.strip() == "":
                return table
            return f"**{title}**:\n{table}"
        
        case "insetReadaloud":
            return "Unsupported 'insetReadaloud'" # Unsupported
        
        case "image":
            return "Unsupported 'image'" # Unsupported

    raise NotImplementedError(f"Unsupported description type: '{description['type']}'")


def __parse_description_block_from_blocks(descriptions: list[any]) -> str:
    blocks = [__parse_description_block(desc) for desc in descriptions]
    return "\n\n".join(blocks)


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