"""
Find the spells from the 5e.tools data. The spells are saved in alphabetical order.
"""

import json
import os
from src.parser import (
    format_casting_time,
    format_components,
    format_descriptions,
    format_duration_time,
    format_range,
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
        self.casting_time = format_casting_time(json["time"])
        self.spell_range = format_range(json["range"])
        self.components = format_components(json["components"])
        self.duration = format_duration_time(json["duration"])
        self.descriptions = format_descriptions(
            "Description", json["entries"], self.url
        )
        if "entriesHigherLevel" in json:
            for entry in json["entriesHigherLevel"]:
                name = entry["name"]
                entries = entry["entries"]
                self.descriptions.extend(format_descriptions(name, entries, self.url))
        self.classes = []

    @property
    def url(self):
        url = f"https://5e.tools/spells.html#{self.name}_{self.source}"
        url = url.replace(" ", "%20")
        return url


def __load_spells_file(path: str):
    results = []
    with open(path, "r", encoding="utf-8") as file:
        spells = json.load(file)
        for raw in spells["spell"]:
            spell = Spell(raw)
            results.append(spell)

    print(f"SpellList: loaded spell file '{path}'")
    return results


def load_spells() -> list[Spell]:
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
