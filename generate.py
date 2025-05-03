from src.spellcaster import load_spell_casters
from src.spells import Spell, load_spells


def spell_to_json(spell: Spell) -> dict:
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

    return result


if __name__ == "__main__":
    spells = load_spells()
    casters = load_spell_casters()

    spells_json = []
    for spell in spells:
        spell_json = spell_to_json(spell)
        spell_json["classes"] = casters.get((spell.name, spell.source), [])
