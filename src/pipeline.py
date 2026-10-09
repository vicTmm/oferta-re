from __future__ import annotations

import hashlib
import json
import logging
import os
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Callable

from src.comparacao import SOURCE_URL, compare_tables, write_changes_csv, write_markdown_report
from src.tratamento import Table, normalize_rows, read_csv, write_csv, write_raw_csv
from src.utils import PROJECT_ROOT, execution_timestamp
from src.validacao import validate_collection


@dataclass(frozen=True)
class PipelinePaths:
    root: Path = PROJECT_ROOT

    @property
    def history(self) -> Path:
        return self.root / "data/history"

    @property
    def current(self) -> Path:
        return self.root / "data/processed/susep_resseguradoras_atual.csv"

    @property
    def runs(self) -> Path:
        return self.root / "outputs/runs"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_manifest(path: Path, manifest: dict) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def publish_files(files: list[tuple[Path, Path]]) -> None:
    """Restaura destinos já publicados em erro de I/O; não é transação entre processos."""
    published: list[tuple[Path, bytes | None]] = []
    try:
        for staged, target in files:
            original = target.read_bytes() if target.exists() else None
            os.replace(staged, target)
            published.append((target, original))
    except Exception:
        for target, original in reversed(published):
            if original is None:
                target.unlink(missing_ok=True)
            else:
                temporary = target.with_suffix(target.suffix + ".restore")
                temporary.write_bytes(original)
                os.replace(temporary, target)
        raise


def run_pipeline(
    collect: Callable[[], Table] | None = None,
    *, paths: PipelinePaths | None = None, max_category_drop: float = 0.10,
) -> dict:
    paths = paths or PipelinePaths()
    run_id = execution_timestamp()
    raw_path = paths.root / f"data/raw/susep_resseguradoras_raw_{run_id}.csv"
    snapshot_path = paths.history / f"susep_resseguradoras_{run_id}.csv"
    report_path = paths.root / "outputs/reports"
    for directory in [raw_path.parent, paths.current.parent, paths.history, paths.runs, report_path]:
        directory.mkdir(parents=True, exist_ok=True)
    previous_file = next(iter(sorted(paths.history.glob("susep_resseguradoras_*.csv"), reverse=True)), None)
    manifest_path = paths.runs / f"execucao_{run_id}.json"
    code_digest = hashlib.sha256()
    for source in sorted(Path(__file__).parent.glob("*.py")):
        code_digest.update(source.name.encode())
        code_digest.update(source.read_bytes())
    manifest = {
        "schema_version": 1, "run_id": run_id, "started_at": utc_now(),
        "source": SOURCE_URL, "code_sha256": code_digest.hexdigest(),
        "commit": os.environ.get("GITHUB_SHA"), "status": "running",
        "previous_snapshot": previous_file.name if previous_file else None,
        "max_category_drop": max_category_drop, "counts": {},
    }
    try:
        if collect is None:
            from src.coleta_susep import PARSER_VERSION, coletar_resseguradoras
            manifest["parser_version"] = PARSER_VERSION
            evidence_dir = raw_path.parent / run_id
            manifest["html_evidence_dir"] = run_id
            collect = lambda: coletar_resseguradoras(evidence_dir=evidence_dir)
        raw_rows = collect()
        write_raw_csv(raw_path, raw_rows)
        manifest["raw_file"] = raw_path.name
        manifest["raw_sha256"] = hashlib.sha256(raw_path.read_bytes()).hexdigest()
        rows = normalize_rows(raw_rows)
        manifest["counts"] = dict(Counter(row["tipo"] for row in rows))
        previous_rows = read_csv(previous_file) if previous_file else None
        validate_collection(rows, previous_rows, max_category_drop=max_category_drop)
        diff = compare_tables(previous_rows, rows) if previous_rows is not None else None
        with TemporaryDirectory(prefix="oferta-re-", dir=paths.current.parent) as staging:
            stage = Path(staging)
            staged_current, staged_snapshot = stage / "current.csv", stage / "snapshot.csv"
            write_csv(staged_current, rows)
            write_csv(staged_snapshot, rows)
            files = []
            if diff is not None:
                csv_path = report_path / f"alteracoes_susep_{run_id}.csv"
                md_path = csv_path.with_suffix(".md")
                write_changes_csv(stage / "report.csv", diff)
                write_markdown_report(stage / "report.md", diff, previous_file, snapshot_path)
                files.extend([(stage / "report.csv", csv_path), (stage / "report.md", md_path)])
                manifest["reports"] = [csv_path.name, md_path.name]
                manifest["changes"] = {key: len(value) for key, value in diff.items()}
            files.extend([(staged_current, paths.current), (staged_snapshot, snapshot_path)])
            manifest.update({"status": "validated", "finished_at": utc_now(), "snapshot": snapshot_path.name})
            write_manifest(stage / "manifest.json", manifest)
            files.append((stage / "manifest.json", manifest_path))
            publish_files(files)
        logging.info("Coleta validada: %s registros; snapshot %s.", len(rows), snapshot_path.name)
        return manifest
    except Exception as error:
        manifest.update({"status": "failed", "finished_at": utc_now(), "error": str(error), "error_type": type(error).__name__})
        manifest.pop("snapshot", None)
        manifest.pop("reports", None)
        write_manifest(manifest_path, manifest)
        logging.exception("Execução rejeitada; última base válida preservada.")
        raise
