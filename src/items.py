import json
import re

from src.parser import (
    clean_dnd_text,
    parse_descriptions,
    parse_item_value,
    parse_item_weight,
)


ITEM_PATHS = ["5etools-src/data/items.json", "5etools-src/data/items-base.json"]

DAMAGE_TYPES = {
    "A": "Acid",
    "B": "Bludgeoning",
    "C": "Cold",
    "F": "Fire",
    "O": "Force",
    "L": "Lightning",
    "N": "Necrotic",
    "P": "Piercing",
    "I": "Poison",
    "Y": "Psychic",
    "R": "Radiant",
    "S": "Slashing",
    "T": "Thunder",
}


def __load_item_types() -> dict[str, dict]:
    types = []

    for path in ITEM_PATHS:
        with open(path, "r") as file:
            data = json.load(file)
            types.extend(data.get("itemType", []))

    results = dict()
    for type in types:
        results[type["abbreviation"]] = type

    return results


def __load_item_properties() -> dict[str, dict]:
    properties = []

    for path in ITEM_PATHS:
        with open(path, "r") as file:
            data = json.load(file)
            properties.extend(data.get("itemProperty", []))

    results = dict()
    for property in properties:
        results[property["abbreviation"]] = property

    return results


def __load_items() -> list[dict]:
    items = []

    for path in ITEM_PATHS:
        with open(path, "r") as file:
            data = json.load(file)
            items.extend(data.get("item", []))
            items.extend(data.get("baseitem", []))
            # TODO items.extend(data.get("itemGroup", [])), has special interactions

    return items


def __apply_item_template(item: dict, entry: dict, template: str) -> str:
    # Apply item parts to name
    template = template.replace("{{prop_name}}", entry["name"])
    template = template.replace("{{prop_name_lower}}", entry["name"].lower())

    has_remaining_template = True
    while has_remaining_template:
        matches = re.match(r"^.*\{\{item\.([^\}]*?)\}\}.*$", template)
        if matches == None:
            has_remaining_template = False
        else:
            template_field = matches.group(1)
            template_result = str(item[template_field])
            template_result = template_result.split("|")[0]
            template = template.replace(
                f"{{{{item.{template_field}}}}}",
                template_result,
            )
    return template


def get_items_json() -> list[dict]:
    """
    TODO
    - Weapon properties
      - Weapon masteries
    - _copy items
    - item groups
    - item entries
    """

    items = __load_items()
    types = __load_item_types()
    properties = __load_item_properties()

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
        result["value"] = parse_item_value(item.get("value", 0))
        if "weight" in item:
            weight = parse_item_weight(item["weight"])
            note = ""
            if "weightNote" in item:
                note = f" {item['weightNote']}"
            result["weight"] = f"{weight}{note}"
        else:
            result["weight"] = None

        # Item type information, see render.js:11480 (getHtmlAndTextTypes)
        result["type"] = []

        if "wondrous" in item:
            wondrous = item["wondrous"]
            tattoo = item.get("tattoo", False)
            if wondrous and tattoo:
                result["type"].append("wondrous item (tattoo)")
            elif wondrous:
                result["type"].append("wondrous item")

        if item.get("staff"):
            result["type"].append("staff")

        if item.get("ammo"):
            result["type"].append("ammunition")

        if "age" in item:
            result["type"].append(item["age"])

        if "weaponCategory" in item:
            if "baseItem" in item:
                baseItem = item["baseItem"].split("|")[0]
                result["type"].append(f"weapon ({baseItem})")
            result["type"].append(f"{item['weaponCategory']} weapon")

        if "type" in item:
            type = item["type"].split("|")[0]
            type = types[type]
            result["type"].append(type["name"].lower())

        if "typeAlt" in item:
            typeAlt = item["typeAlt"].split("|")[0]
            typeAlt = types[typeAlt]
            result["type"].append(typeAlt["name"].lower())

        if item.get("firearm"):
            result["type"].append("firearm")

        if item.get("poison"):
            poison_types = item.get("poisonTypes", [])
            poison_types_text = ""
            if len(poison_types) == 1:
                poison_types_text = f" ({poison_types[0]})"
            elif len(poison_types) > 1:
                poison_types_text = [", ".join(poison_types[:-1]), poison_types[-1]]
                poison_types_text = " or ".join(poison_types_text)
                poison_types_text = f" ({poison_types_text})"
            result["type"].append(f"poison{poison_types_text}")

        # Attunement information
        if "rarity" in item:
            rarity = item["rarity"]
            attune = ""
            if "reqAttune" in item:
                reqAttune = item["reqAttune"]
                if reqAttune == False:
                    ...
                elif reqAttune == True:
                    attune = " (requires attunement)"
                elif reqAttune == "optional":
                    attune = " (attunement optional)"
                elif reqAttune.startswith("by"):
                    attune = f" (requires attunement {clean_dnd_text(reqAttune)})"

            if rarity == "none" or rarity.startswith("unknown"):
                ...
            else:
                result["type"].append(f"{rarity}{attune}")

        # Item description
        result["description"] = []
        description = parse_descriptions("", item.get("entries", []), url)
        for name, text in description:
            result["description"].append({"name": name, "text": text})

        # Item properties
        result["properties"] = []
        if "dmg1" in item:
            damage = f"**{item['dmg1']}** {DAMAGE_TYPES[item['dmgType']]}"
            result["properties"].append(damage)
        if "property" in item:
            for p in item["property"]:
                note = None
                if isinstance(p, dict):
                    note = p.get("note")
                    p = p["uid"]

                property = properties.get(p, None)
                if property == None:
                    p = p.split("|")[0]
                    property = properties[p]

                if property.get("name") == "special":
                    result["properties"].append("special")
                else:
                    entries = property.get("entries")
                    if entries is None:
                        entries = property.get("entriesTemplate")
                    if entries is None or len(entries) == 0:
                        continue

                    if len(entries) > 1:
                        raise RuntimeError(
                            f"Found property with more than one entry '{property['abbreviation']}'"
                        )

                    entry = entries[0]
                    template = __apply_item_template(item, entry, property["template"])
                    template = template.lower()

                    result["properties"].append(template)

                    # Apply template to entries of entry, required for Extended Reach
                    for i in range(len(entry["entries"])):
                        entry["entries"][i] = __apply_item_template(
                            item, entry, entry["entries"][i]
                        )

                    property_description = parse_descriptions(
                        entry["name"], entry["entries"], url
                    )
                    for name, text in property_description:
                        result["description"].append({"name": name, "text": text})

        results.append(result)

    # TODO
    while len(to_copy) > 0:
        print(len(to_copy))
        break

    return results
