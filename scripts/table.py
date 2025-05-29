import argparse
import io
import rich
import json

from rich.table import Table
from rich.console import Console


def table(path: str, out: str, width: str) -> None:
    with open(path, "r") as file:
        data = json.load(file)

    headers = data["headers"]
    rows = data["rows"]
    table = Table(style=None, box=rich.box.ROUNDED)

    for header in headers:
        table.add_column(header, justify="left", style=None)

    for row in rows:
        row = map(str, row)
        table.add_row(*row)

    with open(out, "w") as file:
        console = Console(file=file, width=width)
        console.print(table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=str)
    parser.add_argument("out", type=str)
    parser.add_argument("width", type=int)

    args = parser.parse_args()
    path = args.path
    out = args.out
    width = args.width

    table(path, out, width)
