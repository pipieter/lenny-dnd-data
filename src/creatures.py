
import json

from src.data import clean_url
from src.parser import parse_creature_size, parse_creature_summon_spell, parse_creature_type, parse_descriptions


class _HasKey:
    """Ensures Parent & _CreatureBase make the same type of keys."""
    name: str
    source: str

    @property
    def key(self) -> str:
        # Need to do lower() because there is one creature that doesn't match cases.
        return f"{self.name} ({self.source})".lower()


class _Mod:  # TODO: Actually use mod-parsed data in creatures, for now the parsing works but we do not yet assign/copy these over to creatures.
    mode: str
    items: dict
    descriptions: list
    images: list

    def __init__(self, json: dict):
        self.mode = json.get("mode")
        self.items = json.get("items")
        self.descriptions = []
        self.images = []

        self.handle_items()

    def handle_items(self):
        if self.items is None:
            return
        
        for item in self.items:
            if isinstance(item, str):
                continue  # String items unsupported

            type = item.get("type", None)
            if type is None:
                continue

            match type:
                case "entries" | "section":
                    # Good example creature is Feral Ashenwight PaBTSO
                    inner_items = item.get("items", None)
                    if inner_items is None:
                        # In some cases the items are set as entries instead. (Aurumvorax JTTRC)
                        inner_items = item.get("entries")

                    self.descriptions.extend(parse_descriptions("", inner_items, ""))
                    print(self.descriptions)
                
                case "image":
                    path = item.get("href", {}).get("path", None)
                    if path:
                        url = clean_url(f"https://5e.tools/img/{path}")
                        self.images.extend(url)
                        print(url)
                
                case "insetReadaloud":
                    continue  # Unsupported

                case _:
                    raise NotImplementedError(f"{type} not supported.")


class Parent(_HasKey):
    """Basic parent class to easily set and access the name and source of a parent."""
    name: str
    source: str
    mods: dict[str, _Mod] | None

    def __init__(self, _copy: dict):
        self.name = _copy["name"]
        self.source = _copy["source"]
        print(self.key)
        self.set_mods(_copy)
    
    def set_mods(self, _copy: dict):
        mods = _copy.get("_mod", None)
        if mods is None:
            self.mods = None
            return

        self.mods = {}
        for key, mod in mods.items():
            if isinstance(mod, list) or isinstance(mod, str):
                continue  # Lists and strings not supported

            self.mods[key] = _Mod(mod)

        if self.mods == {}:
            self.mods = None


class _CreatureBase(_HasKey):
    """Shared properties between fluff- and non-fluff creatures, handles common tasks such as name/source & parent linking."""
    name: str
    source: str
    parent: Parent | None

    def __init__(self, json: dict):
        self.name = json["name"]
        self.source = json["source"]
        self.set_parent(json)

    @property
    def is_child(self) -> bool:
        return self.parent is not None

    def set_parent(self, data: dict):
        copy = data.get("_copy", None)
        self.parent = None
        if copy:
            print(f"### {self.key} ###")
            self.parent = Parent(copy)
            print()

    @property
    def url(self):
        url = f"https://5e.tools/bestiary.html#{self.name}_{self.source}"
        return clean_url(url)

class _BaseCreature(_CreatureBase):
    """Creatures defined within bestiary-x.json files."""
    subtitle: str | None
    summoned_by_spell: str | None
    summoned_by_spell_level: int | None
    has_token: bool
    stats: dict

    def __init__(self, json: dict):
        super().__init__(json)

        size = parse_creature_size(json.get("size", ""))
        type = parse_creature_type(json.get("type", ""))
        self.subtitle = f"{size} {type}".strip()

        self.summoned_by_spell = parse_creature_summon_spell(json.get("summonedBySpell", None))
        self.summoned_by_spell_level = json.get("summonedBySpellLevel", None)

        self.has_token = json.get("hasToken", False)
        self.stats = {
            "str": json.get("str", None),
            "dex": json.get("dex", None),
            "con": json.get("con", None),
            "int": json.get("int", None),
            "wis": json.get("wis", None),
            "cha": json.get("cha", None),
        }
    
    @property
    def token_url(self):
        if not self.has_token:
            return None

        url = f"https://5e.tools/img/bestiary/tokens/{self.source}/{self.name}.webp"
        return clean_url(url)
    
    def inherit_from(self, parent: "_BaseCreature"):
        self.subtitle = self.subtitle or parent.subtitle
        self.summoned_by_spell = self.summoned_by_spell or parent.summoned_by_spell
        self.summoned_by_spell_level = self.summoned_by_spell_level or parent.summoned_by_spell_level
        self.stats = self.stats or parent.stats


class _FluffCreature(_CreatureBase):
    """
    Creature fluff-data, sometimes used purely for sharing descriptions between creatures.\n
    e.g. Githyanki Knight (MM) inherits description from Githyanki (MM), which is not an actual creature you can look up, but we do need to create it as a FluffCreature to inherit information from.
    """ 
    description: str | None

    def __init__(self, json: dict):
        super().__init__(json)
        self.description = None

        entries = json.get("entries", None)
        if entries is None:
            return
        
        descriptions = parse_descriptions("", entries, self.url)
        if descriptions:
            # Creatures have a lot of info, we only use the first entry's text to avoid huge descriptions.
            _, self.description = descriptions[0]

    def inherit_from(self, parent: "_FluffCreature"):
        self.description = self.description or parent.description

class Creature(object): # TODO: Actually implement the new classes I just wrote :-) Good Morning Daniel!
    name: str
    source: str
    subtitle: str | None

    summoned_by_spell: str | None
    summoned_by_spell_level: int | None

    url: str | None
    token_url: str | None
    description: str | None

    stats: dict

    def __init__(self, base: _BaseCreature, fluff: _FluffCreature | None):
        self.name = base.name
        self.source = base.source
        self.subtitle = base.subtitle
        self.summoned_by_spell = base.summoned_by_spell
        self.summoned_by_spell_level = base.summoned_by_spell_level
        self.url = base.url
        self.token_url = base.token_url
        self.stats = base.stats
        
        self.description = None

        if fluff is None:
            return

        self.description = fluff.description

    def to_dict(self):
        return {
            "name": self.name,
            "source": self.source,
            "subtitle": self.subtitle,
            "description": self.description,
            "summoned_by_spell": self.summoned_by_spell,
            "summoned_by_spell_level": self.summoned_by_spell_level,
            "url": self.url,
            "token_url": self.token_url,
            "stats": self.stats
        }

class _Bestiary(object):
    creatures: dict[str, _BaseCreature]
    fluff_creatures: dict[str, _FluffCreature]

    def __init__(self, path: str, fluff_path: str | None) -> None:
        self.creatures = {}
        self.fluff_creatures = {}
        
        with open(path, "r", encoding="utf-8") as file:
            creatures = json.load(file)['monster']
        for c in creatures:
            creature = _BaseCreature(c)
            self.creatures[creature.key] = creature

        if fluff_path is None:
            return
        
        fluff = {}
        with open(fluff_path, "r", encoding="utf-8") as file:
            fluff = json.load(file)['monsterFluff']
        for c in fluff:
            creature = _FluffCreature(c)
            self.fluff_creatures[creature.key] = creature


class CreatureList(object):
    creatures: list[Creature]
    INDEX_PATH = "5etools-src/data/bestiary/index.json"
    INDEX_FLUFF_PATH = "5etools-src/data/bestiary/fluff-index.json"

    def __init__(self) -> None:
        self.creatures = []

        with open(self.INDEX_PATH, "r", encoding="utf-8") as file:
            self.index = json.load(file)
        with open(self.INDEX_FLUFF_PATH, "r", encoding="utf-8") as file:
            self.fluff_index = json.load(file)

        creatures = {}
        fluff_creatures = {}

        for source, path in self.index.items():
            path = f"5etools-src/data/bestiary/{path}"
            fluff_path = self.fluff_index.get(source, None)
            fluff_path = f"5etools-src/data/bestiary/{fluff_path}" if fluff_path else None

            b = _Bestiary(path, fluff_path)
            creatures.update(b.creatures)
            fluff_creatures.update(b.fluff_creatures)

        self.creatures = self._handle_inheritance(creatures, fluff_creatures)
        print(f"{len(self.creatures)} creatures parsed.")

    def _handle_inheritance(self, base: dict[str, _BaseCreature], fluff: dict[str, _FluffCreature]) -> list[Creature]:
        def resolve_child(c: _CreatureBase, creatures: dict[str, _CreatureBase]):
            """Recursively resolve inheritance for a child creature."""
            if not c.is_child or c.key in resolved:
                return
            
            parent_key = c.parent.key
            parent = creatures.get(parent_key, None)

            if parent is None:
                print(f"Warning: Parent '{c.parent.key}' not found for child '{c.key}'.")
                return
            
            if parent.is_child:  # Handle parents' inheritance first.
                resolve_child(parent, creatures)

            c.inherit_from(parent)
            resolved.add(c.key)

        resolved = set()
        for c in fluff.values():
            resolve_child(c, fluff)

        resolved = set()            
        creatures = []
        for c in base.values():
            resolve_child(c, base)
            f = fluff.get(c.key, None)
            creatures.append(Creature(c, f))
        return creatures
            

def get_creatures_json() -> list[dict]:
    results = CreatureList().creatures
    return [creatures.to_dict() for creatures in results]