import json
from src.data import load_data
from src.items import get_items_json
from src.creatures import get_creatures_json


if __name__ == "__main__":
    data = load_data("./5etools-src/data")

    items = get_items_json()
    creatures = get_creatures_json()

    with open("./generated/items.json", "w") as file:
        json.dump(items, file, indent=2)

    with open("./generated/creatures.json", "w") as file:
        json.dump(creatures, file, indent=2)
