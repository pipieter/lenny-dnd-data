
import json

from src.data import clean_url
from src.parser import parse_descriptions


class _Creature(object):
    name: str
    source: str
    size: str | None
    creature_type: str
    summoned_by_spell: str | None
    summoned_by_spell_level: int | None

    token_url: str | None
    description: str | None

    def __init__(self, json: dict, fluff_json: dict | None) -> None:
        self.name = json["name"]
        self.source = json["source"]
        self.size = json.get("size", None)
        self.creature_type = json.get("type", None)
        self.summoned_by_spell = json.get("summoned_by_spell", None)
        self.summoned_by_spell_level = json.get("summoned_by_spell_level", None)

        has_token = json.get("hasToken", False)
        token_url = f"https://5e.tools/img/bestiary/tokens/{self.source}/{self.name}.webp"
        self.token_url = clean_url(token_url) if has_token else None
        self.description = None

        if fluff_json is None:
            return
        
        entries = fluff_json.get("entries", None)
        if entries:
            self.description = parse_descriptions("", entries, "")

    def to_dict(self):
        return {
            "name": self.name,
            "source": self.source,
            "size": self.size,
            "creature_type": self.creature_type,
            "summoned_by_spell": self.summoned_by_spell,
            "summoned_by_spell_level": self.summoned_by_spell_level,
            "token_url": self.token_url,
            "description": self.description,
        }

class _Bestiary(object):
    creatures: list[_Creature]

    def __init__(self, path: str, fluff_path: str | None) -> None:
        self.creatures = []
        
        with open(path, "r", encoding="utf-8") as file:
            creatures = json.load(file)['monster']
        
        fluff = None
        if fluff_path:
            with open(fluff_path, "r", encoding="utf-8") as file:
                fluff = json.load(file)['monsterFluff']

        for creature in creatures:
            creature_fluff = self._get_and_pop_creature_fluff(creature["name"], fluff)
            c = _Creature(creature, creature_fluff)
            print(f" - {c.name} ({c.source})")
            self.creatures.append(c)

    def _get_and_pop_creature_fluff(self, creature_name: str, fluff: list | None) -> dict | None:
        if fluff is None:
            return None
        
        creature_fluff = None
        pop_index = -1
        for i, f in enumerate(fluff):
            if f["name"] == creature_name:
                creature_fluff = f
                pop_index = i
                break
        
        if pop_index != -1:
            fluff.pop(pop_index)

        return creature_fluff


class CreatureList(object):
    creatures: list[_Creature]
    INDEX_PATH = "5etools-src/data/bestiary/index.json"
    INDEX_FLUFF_PATH = "5etools-src/data/bestiary/fluff-index.json"

    def __init__(self) -> None:
        self.creatures = []

        with open(self.INDEX_PATH, "r", encoding="utf-8") as file:
            self.index = json.load(file)
        with open(self.INDEX_FLUFF_PATH, "r", encoding="utf-8") as file:
            self.fluff_index = json.load(file)

        for source, path in self.index.items():
            print(path)
            path = f"5etools-src/data/bestiary/{path}"
            fluff_path = self.fluff_index.get(source, None)
            fluff_path = f"5etools-src/data/bestiary/{fluff_path}" if fluff_path else None
            b = _Bestiary(path, fluff_path)
            self.creatures.extend(b.creatures)
        print(f" --- Total creatures loaded: {len(self.creatures)} ---")

def get_creatures_json() -> list[dict]:
    results = CreatureList().creatures
    return [creatures.to_dict() for creatures in results]