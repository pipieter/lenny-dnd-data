"""
Find the spell casters from the 5e.tools data. The casters are saved in alphabetical order.
"""

import dataclasses
import json


@dataclasses.dataclass
class SpellCaster(object):
    name: str
    source: str


def load_spell_casters() -> dict[tuple[str, str], list[SpellCaster]]:
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
