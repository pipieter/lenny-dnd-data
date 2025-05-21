from src.data import DataBank, clean_url
from src.parser import parse_descriptions, parse_image_url


def __get_condition_disease_status(type: str, data: DataBank):
    results: list[dict] = []

    for entry in data.get(type, []):
        result = dict()
        result["name"] = entry["name"]
        result["source"] = entry["source"]
        result["url"] = clean_url(
            f"https://5e.tools/conditionsdiseases.html#{entry['name']}_{entry['source']}"
        )

        result["description"] = []
        descriptions = parse_descriptions(
            "Description", entry["entries"], result["url"]
        )
        for name, text in descriptions:
            result["description"].append({"name": name, "text": text})

        result["image"] = None
        for fluff in data.get(f"{type}Fluff", []):
            if fluff["name"] == entry["name"] and fluff["source"] == entry["source"]:
                if "images" in fluff:
                    result["image"] = parse_image_url(fluff["images"])

        results.append(result)

    return results


def get_conditions_json(data: DataBank) -> list[dict]:
    results: list[dict] = []

    results.extend(__get_condition_disease_status("condition", data))
    results.extend(__get_condition_disease_status("status", data))

    return results


def get_diseases_json(data: DataBank) -> list[dict]:
    return __get_condition_disease_status("disease", data)
