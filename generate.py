import json
from src.items import get_items_json
from src.spells import get_spells_json


if __name__ == "__main__":
    spells = get_spells_json()
    items = get_items_json()

    with open("./generated/spells.json", "w") as file:
        json.dump(spells, file, indent=2)

    with open("./generated/items.json", "w") as file:
        json.dump(items, file, indent=2)
