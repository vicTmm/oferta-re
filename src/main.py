from __future__ import annotations

import os

from src.pipeline import run_pipeline
from src.utils import configure_logging


def main() -> None:
    configure_logging()
    run_pipeline(max_category_drop=float(os.environ.get("SUSEP_MAX_CATEGORY_DROP", "0.10")))


if __name__ == "__main__":
    main()
