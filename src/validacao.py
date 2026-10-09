from __future__ import annotations

from collections import Counter

from src.tratamento import FIELDNAMES, Table


EXPECTED_TYPES = frozenset({
    "Resseguradora Local", "Resseguradora Admitida", "Resseguradora Eventual",
})


class CollectionValidationError(ValueError):
    """A coleta não pode substituir a última base válida."""


def validate_unique_keys(rows: Table) -> None:
    keys = [row.get("chave_monitoramento", "") for row in rows]
    if any(not key.strip() for key in keys):
        raise CollectionValidationError("Registro sem chave de monitoramento.")
    if len(set(keys)) != len(keys):
        raise CollectionValidationError("Chaves de monitoramento duplicadas na base.")


def validate_collection(
    rows: Table, previous: Table | None = None, *, max_category_drop: float = 0.10,
) -> dict[str, int]:
    """O limiar de queda é operacional, não uma regra legal."""
    if not 0 <= max_category_drop < 1:
        raise ValueError("O limite de queda deve estar entre 0 (inclusive) e 1 (exclusive).")
    if not rows:
        raise CollectionValidationError("Coleta vazia.")
    validate_unique_keys(rows)
    for row in rows:
        if not set(FIELDNAMES).issubset(row):
            raise CollectionValidationError("Esquema de campos incompleto.")
        if not row["nome"] or not (row["entcodigo"] or row["cnpj"]):
            raise CollectionValidationError("Registro sem nome ou identificador estável.")
    counts = Counter(row["tipo"] for row in rows)
    if set(counts) != EXPECTED_TYPES:
        raise CollectionValidationError("Categorias ausentes ou inesperadas na coleta.")
    if previous is not None:
        validate_unique_keys(previous)
        old_counts = Counter(row["tipo"] for row in previous)
        for category, old_count in old_counts.items():
            if old_count and (old_count - counts[category]) / old_count > max_category_drop:
                raise CollectionValidationError(
                    f"Queda suspeita em {category}: {old_count} para {counts[category]}. "
                    "Revisar a coleta antes de publicar."
                )
    return dict(sorted(counts.items()))
