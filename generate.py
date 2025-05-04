import json
from src.spells import get_spells_json


if __name__ == "__main__":
    spells = get_spells_json()
    
    with open("./generated/spells.json", "w") as file:
        json.dump(spells, file, indent=2)
