from src.parser import clean_dnd_text, format_words_list


class CharacterClass:
    name: str
    source: str

    hp_info: list[str] | None
    proficiencies: list[str] | None
    starting_equipment: str | None
    multiclass_info: list[str] | None

    spellcasting_ability: str | None
    cantrip_progression: dict[int, int] | None
    spells_known_progression: dict[int, int] | None

    level_features: dict[int, list[tuple[str, bool]] | None]  # TODO How to handle subclass features?

    def __init__(self, json: dict):
        self.name = json["name"]
        self.source = json["source"]

        self._set_hp_info(json)
        self._set_proficiencies(json)
        self._set_starting_equipment(json)
        self._set_multiclass_info(json)

        # self.spellcasting_ability = json.get("spellcastingAbility", None) # TODO format shortnames to long (e.g. str => Strength)
        # self.cantrip_progression = json.get("cantripProgression", None) # TODO
        # self.spells_known_progression = json.get("spellsKnownProgression", None) # TODO
        # self.level_features = None

    def _set_hp_info(self, json: dict):
        """Set the HP information for the character class."""
        self.info = None
        hd = json.get("hd", None)
        if hd is None:
            return
        
        info = []
        sides = int(hd["number"])
        faces = int(hd["faces"])

        die = f"``{sides}d{faces}``"
        avg_hp = f"``{(faces) // 2 + 1}``"
        con_mod = "Con. mod"

        info.append(f"**HP Die:** {die}")
        info.append(f"**Level 1 {self.name} HP:** ``{faces}`` + {con_mod}")
        info.append(f"**HP per {self.name} level:** {die} + {con_mod} *or* {avg_hp} + {con_mod}")

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

                    text = f"{format_words_list(armor, "and")} armor"
                    if has_shields:
                        text += " and Shields"
                
                case "weapons":
                    text = f"{format_words_list(proficiency, "and")} weapons"

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
                case _:
                    raise NotImplementedError("Unknown proficiency type: " + type)

            if text != "":
                info.append(f"**{title} Proficiencies:** {text}")
        return info

    def _set_proficiencies(self, json: dict):
        """Set the proficiencies for the character class."""
        self.proficiencies = None
        proficiencies = []

        saving_proficiencies = json.get("proficiency", None)
        if saving_proficiencies:
            saving_proficiencies = format_words_list(saving_proficiencies, "and")  # TODO: Format str/con/etc. into long name (?)
            proficiencies.append(f"**Saving Throw Proficiencies:** {saving_proficiencies}")
        
        start_prof = json.get("starting_proficiencies", None)
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
            for line in default:
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
            for skill, lvl in requirements.items():
                skills.append(f"``{lvl}`` {skill.capitalize()}")

            text = f"**Ability requirements:** At least {format_words_list(skills)}"
            if len(requirements) > 1:
                text += " (Primary ability of new class)"
            info.append(text)
        
        proficiencies = multiclassing.get("proficienciesGained", None)
        if proficiencies is not None:
            info.extend(self.__handle_proficiencies(proficiencies))
        
        if info != []:
            self.multiclass_info = info
