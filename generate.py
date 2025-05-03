import json
from src.spellcaster import SpellCaster, load_spell_casters
from src.spells import Spell, load_spells


def spell_to_json(spell: Spell, casters: dict[tuple[str, str], SpellCaster]) -> dict:
    result = {}
    result["name"] = spell.name
    result["source"] = spell.source
    result["level"] = spell.level
    result["school"] = spell.school
    result["casting_time"] = spell.casting_time
    result["range"] = spell.spell_range
    result["components"] = spell.components
    result["duration"] = spell.duration
    result["description"] = []
    result["classes"] = []

    for name, text in spell.descriptions:
        result["description"].append({"name": name, "text": text})

    spell_casters = casters.get((spell.name, spell.source), [])
    for caster in spell_casters:
        result["classes"].append({"name": caster.name, "source": caster.source})

    return result


if __name__ == "__main__":
    spells = load_spells()
    casters = load_spell_casters()

    spells_json = [spell_to_json(spell, casters) for spell in spells]

    with open("./generated/spells.json", "w") as file:
        json.dump(spells_json, file, indent=2)
