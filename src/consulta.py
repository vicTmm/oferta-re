from __future__ import annotations

import re
import unicodedata
from datetime import datetime, timedelta

import pandas as pd


def normalized_text(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))


def filter_entities(data: pd.DataFrame, query: str = "", category: str = "Todas") -> pd.DataFrame:
    filtered = data.copy()
    if category != "Todas" and "tipo" in filtered:
        filtered = filtered[filtered["tipo"] == category]
    query = query.strip()
    if query and not filtered.empty:
        names = filtered["nome"].fillna("").map(normalized_text)
        match = names.str.contains(normalized_text(query), regex=False)
        digits = re.sub(r"\D", "", query)
        if digits and not re.search(r"[A-Za-zÀ-ÿ]", query):
            cnpjs = filtered["cnpj"].fillna("").str.replace(r"\D", "", regex=True)
            match |= cnpjs.str.contains(digits, regex=False)
        filtered = filtered[match]
    return filtered


def business_days_since(collected_at: datetime, now: datetime) -> int:
    day, end = collected_at.date(), now.date()
    count = 0
    while day < end:
        day += timedelta(days=1)
        count += day.weekday() < 5
    return count
