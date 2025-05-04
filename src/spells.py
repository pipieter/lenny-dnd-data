"""
Find the spells from the 5e.tools data. The spells are saved in alphabetical order.
"""

import dataclasses
import json
import os
from src.parser import (
    parse_casting_time,
    parse_components,
    parse_descriptions,
    parse_duration_time,
    parse_range,
    parse_spell_level,
    parse_spell_school,
)


class Spell(object):
    name: str
    source: str
    level: str
    school: str
    casting_time: str
    spell_range: str
    components: str
    duration: str
    descriptions: list[tuple[str, str]]
    classes: list[tuple[str, str]]

    def __init__(self, json: any):
        self.name = json["name"]
        self.source = json["source"]
        self.level = parse_spell_level(json["level"])
        self.school = parse_spell_school(json["school"])
        self.casting_time = parse_casting_time(json["time"])
        self.spell_range = parse_range(json["range"])
        self.components = parse_components(json["components"])
        self.duration = parse_duration_time(json["duration"])
        self.descriptions = parse_descriptions("", json["entries"], self.url)
        if "entriesHigherLevel" in json:
            for entry in json["entriesHigherLevel"]:
                name = entry["name"]
                entries = entry["entries"]
                self.descriptions.extend(parse_descriptions(name, entries, self.url))
        self.classes = []

    @property
    def url(self):
        url = f"https://5e.tools/spells.html#{self.name}_{self.source}"
        url = url.replace(" ", "%20")
        return url


@dataclasses.dataclass
class SpellCaster(object):
    name: str
    source: str


def __load_spells_file(path: str) -> list[Spell]:
    results = []
    with open(path, "r", encoding="utf-8") as file:
        spells = json.load(file)
        for raw in spells["spell"]:
            spell = Spell(raw)
            results.append(spell)

    return results


def __load_spells() -> list[Spell]:
    index_path = "5etools-src/data/spells"
    spells: list[Spell] = []

    index = os.path.join(index_path, "index.json")
    with open(index, "r") as file:
        sources = json.load(file)

    for source in sources:
        sourcePath = os.path.join(index_path, sources[source])
        spells.extend(__load_spells_file(sourcePath))

    spells = sorted(spells, key=lambda s: (s.name, s.source))
    return spells


def __load_spell_casters() -> dict[tuple[str, str], list[SpellCaster]]:
    casters: dict[SpellCaster] = dict()

    path = "5etools-src/data/spells/sources.json"

    with open(path, "r") as file:
        sources = json.load(file)
        for source, spells_data in sources.items():
            for spell, caster_entries in spells_data.items():
                casters[(spell, source)] = []
                if "class" in caster_entries:
                    for caster_data in caster_entries["class"]:
                        caster_name = caster_data["name"]
                        caster_source = caster_data["source"]
                        casters[(spell, source)].append(
                            SpellCaster(caster_name, caster_source)
                        )
                if "classVariant" in caster_entries:
                    for caster_data in caster_entries["classVariant"]:
                        caster_name = caster_data["name"]
                        caster_source = caster_data["source"]
                        casters[(spell, source)].append(
                            SpellCaster(caster_name, caster_source)
                        )

    # Sort casters alphabetically
    for key in casters.keys():
        casters[key] = sorted(
            casters[key],
            key=lambda c: (c.name, c.source),
        )

    return casters


def get_spells_json() -> list[dict]:
    spells = __load_spells()
    casters = __load_spell_casters()

    results = []

    for spell in spells:
        result = dict()
        result["name"] = spell.name
        result["source"] = spell.source
        result["level"] = spell.level
        result["school"] = spell.school
        result["casting_time"] = spell.casting_time
        result["range"] = spell.spell_range
        result["components"] = spell.components
        result["duration"] = spell.duration
        result["url"] = spell.url
        result["description"] = []
        result["classes"] = []

        for name, text in spell.descriptions:
            result["description"].append({"name": name, "text": text})

        spell_casters = casters.get((spell.name, spell.source), [])
        for caster in spell_casters:
            result["classes"].append({"name": caster.name, "source": caster.source})

        results.append(result)

    return results
