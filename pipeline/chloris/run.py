"""Entry point: python -m chloris.run --step <name|all>"""
from __future__ import annotations

import argparse
import importlib

from . import config

STEPS = ["wcvp", "wcups", "gbif", "cells", "protected", "fire", "score", "export"]


def main() -> None:
    p = argparse.ArgumentParser(prog="chloris.run")
    p.add_argument("--step", default="all", choices=[*STEPS, "all", "check"])
    args = p.parse_args()

    config.ensure_dirs()
    scoring = config.load_scoring()
    print(f"scoring.yaml {scoring.version}: weights sum to {sum(scoring.weights.values())}")
    if args.step == "check":
        return
    for name in STEPS if args.step == "all" else [args.step]:
        print(f"== step: {name}")
        importlib.import_module(f"chloris.{name}").run()


if __name__ == "__main__":
    main()
