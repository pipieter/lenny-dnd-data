import urllib
import urllib.parse
from src.data import DataBank, clean_url
from src.parser import parse_descriptions, parse_image_url


def get_conditions_json(data: DataBank) -> list[dict]:
    results: list[dict] = []

    # Search conditions
    for condition in data["condition"]:
        result = dict()
        result["name"] = condition["name"]
        result["source"] = condition["source"]
        result["url"] = clean_url(
            f"https://5e.tools/conditionsdiseases.html#{condition['name']}_{condition['source']}"
        )
        result["description"] = parse_descriptions(
            "Description", condition["entries"], result["url"]
        )
        result["image"] = None

        # Find fluff
        for fluff in data["conditionFluff"]:
            if (
                fluff["name"] == condition["name"]
                and fluff["source"] == condition["source"]
            ):
                if "images" in fluff:
                    result["image"] = parse_image_url(fluff["images"])

        results.append(result)

    # Also include status in conditions
    for status in data["status"]:
        result = dict()
        result["name"] = status["name"]
        result["source"] = status["source"]
        result["url"] = clean_url(
            f"https://5e.tools/conditionsdiseases.html#{status['name']}_{status['source']}"
        )
        result["description"] = parse_descriptions(
            "Description", status["entries"], result["url"]
        )
        result["image"] = None

        # Find fluff
        for fluff in data.get("statusFluff", []):
            if fluff["name"] == status["name"] and fluff["source"] == status["source"]:
                if "images" in fluff:
                    result["image"] = parse_image_url(fluff["images"])

        results.append(result)

    return results


def get_diseases_json(data: DataBank) -> list[dict]:
    results: list[dict] = []

    for disease in data["disease"]:
        result = dict()
        result["name"] = disease["name"]
        result["source"] = disease["source"]
        result["url"] = clean_url(
            f"https://5e.tools/conditionsdiseases.html#{disease['name']}_{disease['source']}"
        )
        result["description"] = parse_descriptions(
            "Description", disease["entries"], result["url"]
        )
        result["image"] = None

        # Find fluff
        for fluff in data.get("diseaseFluff", []):
            if (
                fluff["name"] == disease["name"]
                and fluff["source"] == disease["source"]
            ):
                if "images" in fluff:
                    result["image"] = parse_image_url(fluff["images"])

        results.append(result)

    return results
