import json
import os.path


DataBank = dict[str, list[dict]]


def get_image_url(path: str) -> str:
    return f"https://5e.tools/img/{path}"

def clean_url(url: str) -> str:
    # TODO use urllib
    return url.replace(" ", "%20")

def ignore_file(path: str) -> bool:
    if not os.path.exists(path):
        return True
    if not os.path.isfile(path):
        return True
    if not path.endswith(".json"):
        return True
    if path.startswith("foundry"):
        return True
    if path.endswith("changelog.json"):
        return True
    return False


def load_data(data_path: str) -> DataBank:
    databank: DataBank = dict()
    filenames = os.listdir(data_path)

    for filename in filenames:
        path = os.path.join(data_path, filename)
        if ignore_file(path):
            continue

        with open(path, "r") as file:
            data = json.load(file)
            for key in data.keys():
                if not key in databank:
                    databank[key] = []
                databank[key].extend(data[key])

    return databank
