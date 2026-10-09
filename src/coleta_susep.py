from __future__ import annotations

import logging
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.tratamento import FIELDNAMES, Table, clean_value, slugify_column


URL = "https://www2.susep.gov.br/menuatendimento/procura_2011.asp"
TIPOS_RESGURO = {
    "locais": "Resseguradora Local",
    "admitidos": "Resseguradora Admitida",
    "eventuais": "Resseguradora Eventual",
}
PARSER_VERSION = "http-form-v1"


class SourceFormatError(RuntimeError):
    """A fonte não contém o formulário ou o resultado esperado."""


def parse_results(html: str, tipo_texto: str) -> Table:
    soup = BeautifulSoup(html, "html.parser")
    count_match = re.search(r"Empresa\(s\) encontrada\(s\):\s*(\d+)", soup.get_text(" ", strip=True))
    if not count_match:
        raise SourceFormatError("Resposta sem quantidade declarada de empresas; possível bloqueio ou mudança de layout.")
    records: Table = []
    field_map = {
        "cnpj": "cnpj", "codigo_fip": "codigo_fip", "endereco": "endereco",
        "site": "site", "e_mail": "email", "email": "email",
        "data_autorizacao/cadastramento": "data_autorizacao_cadastramento",
    }
    for table in soup.find_all("table"):
        cells = [cell for cell in table.find_all("td") if cell.find_parent("table") is table]
        lines = [clean_value(cell.get_text(" ", strip=True)) for cell in cells]
        if not any(line.startswith("CNPJ:") for line in lines):
            continue
        record = {field: "" for field in FIELDNAMES if field != "chave_monitoramento"}
        record["tipo"] = tipo_texto
        name = table.find("strong")
        record["nome"] = clean_value(name.get_text(" ", strip=True)) if name else ""
        for link in table.select("a[onclick]"):
            match = re.search(r"entcodigo=(\d+).*?codativo=([A-Za-z]+)", link.get("onclick", ""))
            if match:
                record["entcodigo"], record["codativo"] = match.groups()
                break
        for line in lines:
            label, separator, value = line.partition(":")
            key = slugify_column(label)
            if separator and key in field_map:
                record[field_map[key]] = value.strip()
            elif re.search(r"cep:", line, re.IGNORECASE):
                record["cidade_uf_cep"] = line
            elif key == "ddd":
                for label, field in [("DDD", "ddd"), ("Tel", "tel"), ("Fax", "fax")]:
                    match = re.search(rf"{label}:\s*(.*?)(?=\s+-\s+(?:Tel|Fax):|$)", line, re.IGNORECASE)
                    record[field] = match.group(1).strip() if match else ""
        if not record["nome"] or not (record["entcodigo"] or record["cnpj"]):
            raise SourceFormatError("Resultado contém empresa sem nome ou identificação.")
        records.append(record)
    expected = int(count_match.group(1))
    if not records or len(records) != expected:
        raise SourceFormatError(f"Resultado incompleto para {tipo_texto}: declarados {expected}, extraídos {len(records)}.")
    return records


def decode_response(response: requests.Response) -> str:
    # O servidor não declara charset no header, mas entrega UTF-8 no formulário.
    try:
        return response.content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return response.content.decode("iso-8859-1")


def coletar_resseguradoras(headless: bool = True, *, evidence_dir: Path | None = None) -> Table:
    """Consulta o formulário público por HTTP. headless mantido para compatibilidade."""
    if evidence_dir:
        evidence_dir.mkdir(parents=True, exist_ok=True)
    with requests.Session() as session:
        # Os POSTs desta sessão consultam dados; não criam nem alteram registros.
        retry = Retry(total=2, backoff_factor=1, allowed_methods={"GET", "POST"}, status_forcelist=[429, 500, 502, 503, 504], raise_on_status=False)
        session.mount("https://", HTTPAdapter(max_retries=retry))
        response = session.get(URL, timeout=(10, 45))
        html = decode_response(response)
        if evidence_dir:
            (evidence_dir / "formulario.html").write_text(html, encoding="utf-8")
        response.raise_for_status()
        soup = BeautifulSoup(html, "html.parser")
        form = soup.find("form", attrs={"name": "DaForm"})
        select = form.find("select", attrs={"name": "tiposempresas"}) if form else None
        if select is None:
            raise SourceFormatError("Resposta sem formulário SUSEP; possível bloqueio ou mudança de layout.")
        options = {clean_value(option.get_text()): option.get("value") for option in select.find_all("option")}
        hidden = {item["name"]: item.get("value", "") for item in form.select("input[type=hidden][name]")}
        all_rows: Table = []
        for key, tipo in TIPOS_RESGURO.items():
            if not options.get(tipo):
                raise SourceFormatError(f"Categoria não encontrada no formulário: {tipo}.")
            logging.info("Consultando fonte pública: %s.", tipo)
            response = session.post(URL, data={**hidden, "Criteria": "", "estado": "", "tiposempresas": options[tipo], "Busca": "OK"}, timeout=(10, 45))
            html = decode_response(response)
            if evidence_dir:
                (evidence_dir / f"{key}.html").write_text(html, encoding="utf-8")
            response.raise_for_status()
            rows = parse_results(html, tipo)
            logging.info("%s registros extraídos para %s.", len(rows), tipo)
            all_rows.extend(rows)
        return all_rows
