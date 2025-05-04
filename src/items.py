import dataclasses
import json

from src.parser import clean_dnd_text, parse_descriptions, parse_item_value


class Item(object):
    name: str
    source: str
    type: str | None
    value: str
    weight: str | None
    rarity: str | None
    wondrous: bool
    attunement: str | bool
    description: list[tuple[str, str]]

    def __init__(self, json: dict) -> None:
        print(json)
        self.name = json["name"]
        self.source = json["source"]
        self.type = json.get("type", None)
        # self.value = parse_item_value(json["value"])
        # self.weight = parse_item_weight(json["weight"])
        self.rarity = json["rarity"]
        self.wondrous = json.get("wondrous", False)
        self.attunement = json.get("reqAttune", False)
        self.description = parse_descriptions("Description", json["entries"], self.url)

    @property
    def url(self) -> str:
        url = f"https://5e.tools/items.html#{self.name}_{self.source}"
        url = url.replace(" ", "%20")
        return url


@dataclasses.dataclass
class ItemProperty(object):
    abbreviation: str
    source: str
    template: str
    description: list[str, str]


@dataclasses.dataclass
class ItemType(object):
    name: str
    source: str
    abbreviation: str


@dataclasses.dataclass
class ItemEntry:
    name: str
    source: str
    entries: list[tuple[str, str]]


@dataclasses.dataclass
class ItemMastery:
    name: str
    source: str
    description: list[tuple[str, str]]


ItemPropertyDict = dict[tuple[str, str], ItemProperty]
ItemTypeDict = dict[tuple[str, str], ItemType]
ItemEntryDict = dict[tuple[str, str], ItemEntry]
ItemMasteryDict = dict[tuple[str, str], ItemMastery]


def load_items(data: list[dict]) -> list[Item]:
    items = []
    for datum in data:
        items.append(Item(datum))
    return items


def load_item_properties(data: list[dict]) -> list[ItemProperty]:
    properties = []

    for datum in data:
        abbreviation = datum["abbreviation"]
        source = datum["source"]
        template = datum["template"]
        entries = datum["entries"]
        if len(entries) != 1:
            raise RuntimeError(f"Multiple item property entries for '{abbreviation}'")
        entry = entries[0]
        description = parse_descriptions(entry["name"], entry["entries"], None)
        properties.append(ItemProperty(abbreviation, source, template, description))

    return properties


def load_item_types(data: list[dict]) -> list[ItemType]:
    types = []

    for datum in data:
        name = datum["name"]
        source = datum["source"]
        abbreviation = datum["abbreviation"]
        types.append(ItemType(name, source, abbreviation))

    return types


def load_item_entries(data: list[dict]) -> list[ItemEntry]:
    item_entries = []
    for datum in data:
        name = datum["name"]
        source = datum["source"]
        url = f"https://5e.tools/items.html#{name}_{source}"
        url = url.replace(" ", "%20")
        entries_template = datum["entriesTemplate"]
        entries = parse_descriptions(name, entries_template, url)
        item_entries.append(ItemEntry(name, source, entries))
    return item_entries


def load_item_masteries(data: list[dict]) -> list[ItemMastery]:
    masteries = []
    for datum in data:
        name = datum["name"]
        source = datum["source"]
        url = f"https://5e.tools/book.html#{source}"
        entries = datum["entries"]
        description = parse_descriptions(name, entries, url)
        masteries.append(ItemMastery(name, source, description))
    return masteries


def load_item_data():
    paths = ["5etools-src/data/items.json", "5etools-src/data/items-base.json"]

    items: list[Item] = []
    item_properties: ItemPropertyDict = dict()
    item_types: ItemTypeDict = dict()
    item_entries: ItemEntryDict = dict()
    item_masteries: ItemMasteryDict = dict()

    for path in paths:
        with open(path, "r") as file:
            data = json.load(file)

            if "item" in data:
                items.extend(load_items(data["item"]))
            if "baseItem" in data:
                items.extend(load_items(data["baseItem"]))
            if "itemGroup" in data:
                items.extend(load_items(data["itemGroup"]))
            if "itemProperty" in data:
                properties = load_item_properties(data["itemProperty"])
                for property in properties:
                    item_properties[(property.abbreviation, property.source)] = property
            if "itemType" in data:
                types = load_item_types(data["itemType"])
                for type in types:
                    item_types[(type.abbreviation, type.source)] = type
            if "itemEntry" in data:
                entries = load_item_entries(data["itemEntry"])
                for entry in entries:
                    item_entries[(entry.name, entry.source)] = entry
            if "itemMastery" in data:
                masteries = load_item_masteries(data["itemMastery"])
                for mastery in masteries:
                    item_masteries[(mastery.name, mastery.source)] = mastery

    return (
        items,
        item_properties,
        item_types,
        item_entries,
        item_masteries,
    )


ITEM_PATHS = ["5etools-src/data/items.json", "5etools-src/data/items-base.json"]


def __load_items() -> list[dict]:
    items = []

    for path in ITEM_PATHS:
        with open(path, "r") as file:
            data = json.load(file)
            items.extend(data.get("item", []))

    return items


def get_items_json() -> list[dict]:
    """
    TODO
    - Weapon properties
      - Weapon properties small above
      - Weapon properties in detail
    - _copy items
    """

    items = __load_items()

    results = []
    to_copy = []

    for item in items:
        url = f"https://5e.tools/items.html#{item['name']}_{item['source']}"
        url = url.replace(" ", "%20")

        if "_copy" in item:
            to_copy.append(item)
            continue

        result = dict()

        result["name"] = clean_dnd_text(item["name"])
        result["source"] = item["source"]
        result["url"] = url
        result["wondrous"] = item.get("wondrous", False)
        result["rarity"] = item["rarity"]
        result["value"] = parse_item_value(item.get("value", None))
        
        attunement = item.get("reqAttune", False)
        if isinstance(attunement, str):
            attunement = clean_dnd_text(attunement)
        result["attunement"] = attunement
        

        result["description"] = []
        description = parse_descriptions("", item.get("entries", []), url)
        for name, text in description:
            result["description"].append({"name": name, "text": text})

        results.append(result)

    # TODO
    while len(to_copy) > 0:
        print(len(to_copy))
        break

    return results
