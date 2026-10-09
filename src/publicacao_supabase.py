"""Publica somente cadastro público; credenciais ficam no ambiente do escritor."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urlparse

import requests

from src.tratamento import read_csv
from src.utils import PROJECT_ROOT
from src.validacao import validate_collection


def publication_payload(manifest_path: Path, root: Path = PROJECT_ROOT) -> tuple[str, dict]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    payload = {
        "p_run_key": manifest["run_id"], "p_started_at": manifest["started_at"],
        "p_finished_at": manifest["finished_at"], "p_source_url": manifest["source"],
        "p_code_hash": manifest["code_sha256"],
    }
    if manifest["status"] == "failed":
        payload["p_error_summary"] = "Coleta rejeitada; última base válida preservada."
        return "record_susep_failure", payload
    if manifest["status"] != "validated":
        raise ValueError("Somente execuções concluídas podem ser publicadas.")
    filename = manifest["snapshot"]
    if Path(filename).name != filename:
        raise ValueError("Caminho de snapshot inválido.")
    snapshot = root / "data/history" / filename
    rows = read_csv(snapshot)
    validate_collection(rows)
    payload.update({
        "p_snapshot_hash": hashlib.sha256(snapshot.read_bytes()).hexdigest(),
        "p_rows": rows, "p_max_category_drop": manifest["max_category_drop"],
    })
    return "publish_susep_collection", payload


def publish(manifest_path: Path, root: Path = PROJECT_ROOT) -> None:
    url, key = os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_INGESTION_TOKEN", "")
    if not url or not key:
        raise ValueError("Configure SUPABASE_URL e SUPABASE_INGESTION_TOKEN no ambiente do coletor.")
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        raise ValueError("SUPABASE_URL deve ser a origem HTTPS do projeto, sem caminho ou credenciais.")
    function, payload = publication_payload(manifest_path, root)
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    response = requests.post(f"{url.rstrip('/')}/functions/v1/ingest-susep", json={"function": function, "payload": payload}, headers=headers, timeout=(10, 60))
    # Não imprimir body/headers: podem incluir dados ou detalhes da requisição.
    if not response.ok:
        raise RuntimeError(f"Publicação Supabase falhou (HTTP {response.status_code}); consulte os logs do projeto.")
    print("Execução pública sincronizada com Supabase.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path)
    arguments = parser.parse_args()
    path = arguments.manifest
    if path is None:
        manifests = sorted((PROJECT_ROOT / "outputs/runs").glob("execucao_*.json"))
        if not manifests:
            raise ValueError("Nenhuma execução concluída para publicar.")
        path = manifests[-1]
    publish(path)


if __name__ == "__main__":
    main()
