import json
from src.data import clean_url
from src.parser import clean_dnd_text, format_words_list, parse_ability_score, parse_descriptions

class Description:
    name: str
    text: str

    def __init__(self, name: str, text: str | list[str]):
        self.name = name
        if isinstance(text, list):
            text = "\n".join(text)
        self.text = text
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "text": self.text,
        }

class ClassFeature:
    name: str
    source: str
    level: int

    class_name: str
    class_source: str

    description: list[str]

    def __init__(self, json: dict):
        self.name = json["name"]
        self.source = json["source"]
        self.level = int(json["level"])
        self.class_name = json["className"]
        self.class_source = json["classSource"]

        descriptions = parse_descriptions("", json["entries"], "")
        self.description = []
        for desc in descriptions:
            _, text = desc
            self.description.append(clean_dnd_text(text))

class CharacterClass:
    name: str
    source: str

    hp_info: list[str] | None
    proficiencies: list[str] | None
    starting_equipment: str | None
    multiclass_info: list[str] | None

    spellcasting_ability: str | None
    level_spell_info: list[str] | None

    level_features: list[list[str] | None] | None
    level_info: list[str] | None

    def __init__(self, json: dict, class_features: list[ClassFeature]):
        self.name = json["name"]
        self.source = json["source"]
        print(f"- {self.name} ({self.source})")

        self._set_hp_info(json)
        self._set_proficiencies(json)
        self._set_starting_equipment(json)
        self._set_multiclass_info(json)

        self._set_level_info(json)
        self._set_spell_info(json)
        self._set_class_features(json, class_features)

    @property
    def url(self):
        return clean_url(f"https://5e.tools/classes.html#{self.name.lower()}_{self.source.lower()}")

    def _set_hp_info(self, json: dict):
        """Set the HP information for the character class."""
        self.hp_info = None
        hd = json.get("hd", None)
        if hd is None:
            return
        
        info = []
        sides = int(hd["number"])
        faces = int(hd["faces"])

        die = f"``{sides}d{faces}``"
        avg_hp = f"``{(faces) // 2 + 1}``"
        con_mod = "Con. mod"

        info.append(f"• **HP Die:** {die}")
        info.append(f"• **Level 1 {self.name} HP:** ``{faces}`` + {con_mod}")
        info.append(f"• **HP per {self.name} level:** {die} + {con_mod} *or* {avg_hp} + {con_mod}")

        self.hp_info = info
    
    def __handle_proficiencies(self, proficiencies: dict) -> list[str]:
        info = []

        for type, proficiency in proficiencies.items():
            title = type.capitalize()
            if title.endswith("s"):
                title = title[:-1]

            text = ""
            match type:
                case "armor":
                    armor = []
                    has_shields = False
                    for armor_type in proficiency:
                        if armor_type == "shield":
                            has_shields = True
                            continue

                        armor.append(f"{armor_type}")

                    text = f"{format_words_list(armor, 'and')} armor"
                    if has_shields:
                        text += " and Shields"
                
                case "weapons":
                    weapons = []
                    for weapon_type in proficiency:
                        if isinstance(weapon_type, dict):
                            weapon_proficiency = weapon_type.get("proficiency", None)
                            if weapon_proficiency is not None:
                                weapons.append(weapon_proficiency)
                        else:
                            weapons.append(weapon_type)

                    text = f"{format_words_list(weapons, 'and')} weapons"
                
                case "weaponProficiencies":
                    pass # Data is not of use

                case "skills":
                    for skill_proficiencies in proficiency:
                        if text != "":
                            text += "\n"

                        choose = skill_proficiencies.get("choose", None)
                        if choose is None:
                            continue
                        
                        skills = choose.get("from", None)
                        count = int(choose.get("count", 0))

                        if skills is None or count == 0:
                            continue

                        text += f"Choose ``{count}``: {format_words_list(skills)}"
                
                case "tools":
                    tools = []
                    for tool in proficiency:
                        tool_text = clean_dnd_text(tool)
                        tools.append(tool_text)
                    
                    text = f"{format_words_list(tools, 'and')}"

                case "toolProficiencies":
                    pass # Data is not of use

                case _:
                    raise NotImplementedError("Unknown proficiency type: " + type)

            if text != "":
                info.append(f"• **{title} Proficiencies:** {text}")
        return info

    def _set_proficiencies(self, json: dict):
        """Set the proficiencies for the character class."""
        self.proficiencies = None
        proficiencies = []

        saving_proficiencies = json.get("proficiency", None)
        if saving_proficiencies:
            saving_proficiencies = [parse_ability_score(p) for p in saving_proficiencies] # Format short-names to full names
            saving_proficiencies = format_words_list(saving_proficiencies, "and")
            proficiencies.append(f"• **Saving Throw Proficiencies:** {saving_proficiencies}")
        
        start_prof = json.get("startingProficiencies", None)
        if start_prof:
            proficiencies.extend(self.__handle_proficiencies(start_prof))

        if proficiencies != []:
            self.proficiencies = proficiencies        
    
    def _set_starting_equipment(self, json: dict):
        """Set the starting equipment for the character class."""
        self.starting_equipment = None

        starting_equipment = json.get("startingEquipment", None)
        if starting_equipment is None:
            return
        
        # Old classes use 'default'
        text = ""
        default = starting_equipment.get("default", None)  # Old notations use "default"
        if default is not None:
            for line in default:
                text += f"• {clean_dnd_text(line)}\n"
            
            self.starting_equipment = text
            return

         # Modern classes use 'entries'
        entries = starting_equipment.get("entries", None)
        if entries is not None:
            for line in entries:
                text += f"• {clean_dnd_text(line)}\n"
            
            self.starting_equipment = text
            return
        
        raise NotImplementedError(f"Unknown starting equipment format for {self.name} ({self.source})")

    def _set_multiclass_info(self, json: dict):
        """Set the multiclass information for the character class."""
        self.multiclass_info = None
        multiclassing = json.get("multiclassing", None)
        if multiclassing is None:
            return
        
        info = []
        requirements = multiclassing.get("requirements", None)
        if requirements is not None:
            skills = []

            conjunction = "and"
            if "or" in requirements: # Used by Fighter (PHB)
                requirements = requirements.get("or")[0]
                conjunction = "or"

            for skill, lvl in requirements.items():
                skills.append(f"``{lvl}`` {parse_ability_score(skill)}")

            text = f"• **Ability requirements:** At least {format_words_list(skills, conjunction)}"
            if len(requirements) > 1:
                text += " (Primary ability of new class)"
            info.append(text)
        
        proficiencies = multiclassing.get("proficienciesGained", None)
        if proficiencies is not None:
            info.extend(self.__handle_proficiencies(proficiencies))
        
        if info != []:
            self.multiclass_info = info

    def __format_class_table_value(self, value: dict) -> str:
        value_type = value.get("type", None)

        match value_type:
            case "bonus":
                return f"+{value.get('value', 0)}"

            case "bonusSpeed":
                return f"+{value.get('value', 0)} ft."
            
            case "dice":
                roll = value.get("toRoll", None)[0]  # We assume there's only 1 roll, thus [0]. (Multiple dice never occurs in data.)
                num = roll.get("number", 0)
                faces = roll.get("faces", 0)
                return f"{num}d{faces}"

            case _:
                raise NotImplementedError(f"Unsupported classTableGroups row-type: {value_type}")

    def _set_level_info(self, json: dict):
        self.level_info = None
        levels = 20

        # Proficiency Bonus, follows same rules for each class. (+1 every 4 levels.)
        info = [[f"• **Proficiency Bonus:** ``+{2 + (i // 4)}``"] for i in range(levels)]

        class_table = json.get("classTableGroups", None)
        if not class_table:
            self.level_info = info
            return
        
        for group in class_table:
            labels = group.get("colLabels", None)
            rows = group.get("rows", None)

            if not labels or not rows:
                continue

            for col_index, label in enumerate(labels):
                label = clean_dnd_text(label)
                if "cantrip" in label.lower() or "spell" in label.lower():
                    continue # Skip spellcasting info; handled elsewhere
                
                for level, row in enumerate(rows):
                    value = row[col_index]

                    if isinstance(value, str):
                        value = clean_dnd_text(value)

                    elif isinstance(value, dict):
                        value = self.__format_class_table_value(value)
                        
                    info[level].append(f"• **{label}:** ``{value}``")

        self.level_info = info

    def _set_spell_info(self, json: dict):
        """Set the spellcasting information for the character class."""
        spellcasting_ability = json.get("spellcastingAbility", None)
        self.spellcasting_ability = None
        if spellcasting_ability is not None:
            self.spellcasting_ability = parse_ability_score(spellcasting_ability)

        self.level_spell_info = None

        if self.spellcasting_ability is None:
            return

        cantrip_progression = json.get("cantripProgression", [])
        spells_known_progression = json.get("spellsKnownProgression", [])
        spells_known_progression_fixed = json.get("spellsKnownProgressionFixed", [])
        prepared_spells_progression = json.get("preparedSpellsProgression", [])
        # TODO Spell-slot table per level

        max_len = max(
            len(cantrip_progression),
            len(spells_known_progression),
            len(spells_known_progression_fixed),
            len(prepared_spells_progression),
        )
        level_info: list[list[str]] = [[] for _ in range(max_len)]

        for i in range(max_len):
            level_info[i].append(f"• Uses ``{self.spellcasting_ability}``")

        for i, count in enumerate(cantrip_progression):
            level_info[i].append(f"• ``{count}`` Cantrips Known")

        for i, count in enumerate(spells_known_progression):
            level_info[i].append(f"• ``{count}`` Spells Known")

        spell_fixed_total = 0
        for i, count in enumerate(spells_known_progression_fixed):
            spell_fixed_total += count
            level_info[i].append(f"• ``+{count}`` Spells learned ({spell_fixed_total} total)")

        for i, count in enumerate(prepared_spells_progression):
            level_info[i].append(f"• ``{count}`` Prepared Spells")
        
        self.level_spell_info = level_info if any(level_info) else None
            
    def _set_class_features(self, json: dict, class_features: list[ClassFeature]):
        """Set the class features for the character class."""
        self.level_features = None
        features = json.get("classFeatures", None)
        if features is None:
            return
        
        info = []
        def __parse_class_feature(feature: str):
            """Parse a class feature string and add it to the info list."""
            parts = feature.split("|")
            while len(parts) < 5:
                parts.append("")

            name, char_class, source, level, sub_source = parts
            level = int(level)

            if source == "":
                source = self.source # Sometimes source is empty

            while len(info) < level:
                info.append([]) # Populate info with lists until we reach the level we need

            title = name
            if sub_source != "":
                # Highlights optional ruleset feats (e.g. Primal Knowledge for Barbarian, from TCE)
                source = sub_source
                title = f"*{name} ({sub_source})"

            # Copy feature descriptions
            texts = []
            for class_feature in class_features:
                name_match = class_feature.name.lower() == name.lower()
                source_match = class_feature.source.lower() == source.lower()
                level_match = class_feature.level == level
                if name_match and source_match and level_match:
                    for desc in class_feature.description:
                        texts.append(desc)
                    continue

            title = f"• **{name}:** "
            text = ""
            for line in texts:
                new_length = len(text) + len(line)
                if new_length > 1024:
                    info[level - 1].append(f"{title}{text}")
                    title = ""
                    text = ""
                text += f"{line}\n"
            
            if text != "":
                info[level - 1].append(f"{title}{text}")


        for feature in features:
            if isinstance(feature, str):
                __parse_class_feature(feature)
            elif isinstance(feature, dict): # Subclass feature
                sub_feature = feature.get("classFeature", None)
                if sub_feature is not None:
                    __parse_class_feature(sub_feature)
            else:
                raise NotImplementedError(f"Unknown class feature type: {type(feature)}")
            
        for i in range(len(info)):
            if len(info[i]) == 0:
                info[i] = None
        
        self.level_features = info

    @property
    def _base_description(self) -> list[Description]:
        desc = []

        if self.hp_info is not None:
            desc.append(Description("Hit Points", self.hp_info))

        if self.proficiencies is not None:
            desc.append(Description("Proficiencies", self.proficiencies))

        if self.starting_equipment is not None:
            desc.append(Description("Starting Equipment", self.starting_equipment)) # TODO this one should be a list, not a str. Handle everything the same.
        
        if self.multiclass_info is not None:
            desc.append(Description("Multiclassing", self.multiclass_info))
        
        return desc

    @property
    def _level_descriptions(self) -> list[Description]:
        desc = []

        for i in range(20):
            desc.append([])

        if self.level_info is not None:
            for i, info in enumerate(self.level_info):
                if info:
                    desc[i].append((Description("", info)))

        if self.level_spell_info is not None:
            for i, spell_info in enumerate(self.level_spell_info):
                if spell_info:
                    desc[i].append(Description("Spellcasting", spell_info))
        
        if self.level_features is not None:
            for i, features in enumerate(self.level_features):
                if features is None:
                    desc[i].append(None)
                    continue
                
                for j, feat in enumerate(features):
                    feat_description = Description("", feat)
                    if j == 0:
                        feat_description.name = "Class Features"
                    desc[i].append(feat_description)
        
        return desc

    @property
    def descriptions(self) -> dict[str, list[dict]]:
        """Get the description of the character class."""
        result: dict[str, list[dict]] = {}

        # Base descriptions go under level "0"
        base_entries = [d.to_dict() for d in self._base_description]
        if base_entries:
            result["0"] = base_entries

        # Level-specific descriptions (1–20)
        level_desc = self._level_descriptions
        for i, entries in enumerate(level_desc, start=1):
            level_entries = []
            for entry in entries:
                if isinstance(entry, Description):
                    level_entries.append(entry.to_dict())
            if level_entries:
                result[str(i)] = level_entries

        return result

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "source": self.source,
            "url": self.url,
            "descriptions": self.descriptions,
        }

class ClassList:
    classes: list[dict]
    INDEX_PATH = "5etools-src/data/class/index.json"

    def __init__(self):
        self.classes = []

        with open(self.INDEX_PATH, "r", encoding="utf-8") as file:
            self.index = json.load(file)

        for _, path in self.index.items():
            path = f"5etools-src/data/class/{path}"
            print(path)

            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)
            
            features_json = data.get("classFeature", [])
            features = []
            for feat_data in features_json:
                features.append(ClassFeature(feat_data))

            class_json = data.get("class", {})
            for class_data in class_json:
                character_class = CharacterClass(class_data, features)
                self.classes.append(character_class.to_dict())
            
def get_classes_json() -> list[dict]:
    """Get a character class by name and source."""
    results = ClassList().classes
    return results
