import json
from src.data import load_data
from src.conditions import get_conditions_json, get_diseases_json
from src.items import get_items_json
from src.spells import get_spells_json


if __name__ == "__main__":
    data = load_data("./5etools-src/data")

    spells = get_spells_json()
    items = get_items_json()
    conditions = get_conditions_json(data)
    diseases = get_diseases_json(data)

    with open("./generated/spells.json", "w") as file:
        json.dump(spells, file, indent=2)

    with open("./generated/items.json", "w") as file:
        json.dump(items, file, indent=2)

    with open("./generated/conditions.json", "w") as file:
        json.dump(conditions, file, indent=2)

    with open("./generated/diseases.json", "w") as file:
        json.dump(diseases, file, indent=2)
