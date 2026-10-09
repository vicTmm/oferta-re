from __future__ import annotations

import json
import re
import sys
from zoneinfo import ZoneInfo
from datetime import datetime, timezone
from pathlib import Path

import altair as alt
import pandas as pd
import streamlit as st


PROJECT_ROOT = Path(__file__).resolve().parents[1]
HISTORY_DIR = PROJECT_ROOT / "data" / "history"
REPORTS_DIR = PROJECT_ROOT / "outputs" / "reports"
RUNS_DIR = PROJECT_ROOT / "outputs" / "runs"
sys.path.insert(0, str(PROJECT_ROOT))
from src.consulta import business_days_since, filter_entities



STATUS_LABELS = {
    "novo": "Novos",
    "removido": "Ausentes na coleta",
    "alterado": "Alterados",
}

THEMES = {
    "Claro": {
        "background": "#F5F8FD",
        "surface": "#FFFFFF",
        "surface_alt": "#EAF1FF",
        "text": "#10182B",
        "muted": "#53627A",
        "border": "#DFE7F2",
        "grid": "#EAF1FF",
        "accent": "#235DDD",
        "local": "#2445AD",
        "admitida": "#10B981",
        "eventual": "#F59E0B",
        "shadow": "rgba(148, 163, 184, 0.15)",
        "gradient_hero": "linear-gradient(135deg, #FFFFFF 0%, #EAF1FF 100%)",
        "hero_border": "#DFE7F2"
    },
    "Escuro": {
        "background": "#0C1424",
        "surface": "#10182B",
        "surface_alt": "#203557",
        "text": "#F5F8FD",
        "muted": "#94A3B8",
        "border": "#203557",
        "grid": "#10182B",
        "accent": "#94BCFF",
        "local": "#94BCFF",
        "admitida": "#34D399",
        "eventual": "#FBBF24",
        "shadow": "rgba(0, 0, 0, 0.5)",
        "gradient_hero": "linear-gradient(135deg, #10182B 0%, #0C1424 100%)",
        "hero_border": "#203557"
    },
}


st.set_page_config(
    page_title="Oferta Re | Resseguradoras",
    layout="wide",
)


def extract_timestamp(path: Path) -> datetime | None:
    match = re.search(r"(\d{8}_\d{6})(?:_(\d{6}))?", path.name)
    if not match:
        return None
    value = datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
    if match.group(2):
        value = value.replace(microsecond=int(match.group(2)), tzinfo=timezone.utc)
        return value.astimezone(ZoneInfo("America/Sao_Paulo")).replace(tzinfo=None)
    return value


def format_timestamp(value: datetime | None) -> str:
    if value is None:
        return "Data não identificada"
    return value.strftime("%d/%m/%Y %H:%M:%S")


@st.cache_data(ttl=60)
def read_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path, encoding="utf-8-sig", dtype=str, keep_default_na=False)


def list_csv_files(directory: Path, pattern: str) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(directory.glob(pattern), key=lambda item: extract_timestamp(item) or datetime.min)


def latest_file(files: list[Path]) -> Path | None:
    return files[-1] if files else None


def load_latest_history() -> tuple[pd.DataFrame, Path | None]:
    files = list_csv_files(HISTORY_DIR, "susep_resseguradoras_*.csv")
    current = latest_file(files)
    if current is None:
        return pd.DataFrame(), None
    return read_csv(str(current)), current


def load_reports() -> list[Path]:
    return list_csv_files(REPORTS_DIR, "alteracoes_susep_*.csv")


def status_count(df: pd.DataFrame, status: str) -> int:
    if df.empty or "status" not in df.columns:
        return 0
    return int((df["status"] == status).sum())


def inject_theme_css(theme: dict[str, str]) -> None:
    st.markdown(
        f"""
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            :root {{
                --app-bg: {theme["background"]};
                --app-surface: {theme["surface"]};
                --app-text: {theme["text"]};
                --app-muted: {theme["muted"]};
                --app-border: {theme["border"]};
                --app-accent: {theme["accent"]};
                --app-shadow: {theme.get("shadow", "rgba(0,0,0,0.1)")};
                --app-gradient: {theme.get("gradient_hero", "none")};
                --app-hero-border: {theme.get("hero_border", theme["border"])};
            }}

            .stApp {{
                background-color: var(--app-bg);
                color: var(--app-text);
                font-family: 'Inter', sans-serif;
            }}

            [data-testid="stHeader"] {{
                background: transparent;
            }}

            [data-testid="stMainBlockContainer"] {{
                max-width: 1200px;
                padding-top: 2.5rem;
                padding-bottom: 4rem;
            }}

            h1, h2, h3, h4, p, span, label, div {{
                font-family: 'Inter', sans-serif;
            }}

            /* TOPBAR & HERO */
            .topbar {{
                align-items: center;
                display: flex;
                gap: 24px;
                justify-content: space-between;
                margin-bottom: 2rem;
            }}

            .hero {{
                background: var(--app-gradient);
                border: 1px solid var(--app-hero-border);
                border-radius: 16px;
                flex: 1;
                padding: 32px;
                box-shadow: 0 4px 20px var(--app-shadow);
                position: relative;
                overflow: hidden;
            }}

            .hero::before {{
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 4px;
                background: linear-gradient(90deg, #2445AD, #235DDD, #2445AD);
            }}

            .hero-eyebrow {{
                color: var(--app-accent);
                font-size: 0.85rem;
                font-weight: 700;
                letter-spacing: 0.05em;
                margin-bottom: 12px;
                text-transform: uppercase;
            }}

            .hero-title {{
                color: var(--app-text);
                font-size: 2.5rem;
                font-weight: 800;
                letter-spacing: -0.02em;
                line-height: 1.2;
                margin: 0;
            }}

            .hero-copy {{
                color: var(--app-muted);
                font-size: 1.05rem;
                line-height: 1.6;
                margin-top: 12px;
                max-width: 800px;
                font-weight: 400;
            }}

            /* THEME TOGGLE */
            .theme-label {{
                color: var(--app-muted);
                font-size: 0.75rem;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}

            div[data-testid="stRadio"] {{
                background: var(--app-surface);
                border: 1px solid var(--app-border);
                border-radius: 99px;
                padding: 4px;
                box-shadow: 0 2px 8px var(--app-shadow);
            }}

            div[data-testid="stRadio"] > label {{
                display: none;
            }}
            
            div[data-testid="stRadio"] label {{
                font-size: 0.85rem;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 99px;
            }}

            /* METRIC CARDS */
            .metric-card {{
                background: var(--app-surface);
                border: 1px solid var(--app-border);
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 2px 10px var(--app-shadow);
                transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 140px;
            }}

            .metric-card:hover {{
                transform: translateY(-4px);
                box-shadow: 0 8px 24px var(--app-shadow);
                border-color: var(--app-accent);
            }}

            .metric-label {{
                color: var(--app-muted);
                font-size: 0.85rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}

            .metric-value {{
                color: var(--app-text);
                font-size: 2.75rem;
                font-weight: 800;
                line-height: 1;
                margin: 12px 0 8px 0;
            }}

            .metric-note {{
                color: var(--app-muted);
                font-size: 0.85rem;
                font-weight: 400;
            }}

            /* META LINE & BADGES */
            .status-container {{
                display: flex;
                gap: 16px;
                margin: 24px 0;
                padding-bottom: 24px;
                border-bottom: 1px solid var(--app-border);
                flex-wrap: wrap;
            }}
            .badge {{
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--app-surface);
                border: 1px solid var(--app-border);
                padding: 6px 12px;
                border-radius: 99px;
                font-size: 0.85rem;
                color: var(--app-muted);
                box-shadow: 0 2px 4px var(--app-shadow);
            }}
            .badge strong {{
                color: var(--app-text);
                font-weight: 600;
            }}
            .badge-icon {{
                color: var(--app-accent);
                font-size: 1rem;
            }}
            .metric-card.primary {{
                background: var(--app-gradient);
                border-color: var(--app-accent);
                box-shadow: 0 4px 16px var(--app-shadow);
            }}
            .metric-card.primary .metric-value {{
                color: var(--app-accent);
                font-size: 3.5rem;
            }}
            .metric-card.primary .metric-label {{
                color: var(--app-text);
            }}

            .section-title {{
                color: var(--app-text);
                font-size: 1.25rem;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: -0.01em;
            }}

            .section-caption {{
                color: var(--app-muted);
                font-size: 0.95rem;
                margin-bottom: 24px;
                line-height: 1.5;
            }}

            /* COMPONENT TWEAKS */
            div[data-testid="stDataFrame"] {{
                border: 1px solid var(--app-border);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 12px var(--app-shadow);
            }}

            div[data-testid="stTabs"] button {{
                color: var(--app-muted);
                font-weight: 500;
                font-size: 1rem;
                padding-bottom: 12px;
            }}

            div[data-testid="stTabs"] button[aria-selected="true"] {{
                color: var(--app-accent);
                font-weight: 600;
            }}

            div[data-baseweb="tab-highlight"] {{
                background-color: var(--app-accent);
            }}

            @media (max-width: 780px) {{
                .hero {{ padding: 24px; }}
                .hero-title {{ font-size: 2rem; }}
                .metric-card {{ min-height: auto; padding: 16px; }}
                .metric-value {{ font-size: 2rem; }}
            }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_topbar() -> str:
    left, right = st.columns([5, 1.35])
    with left:
        st.markdown(
            """
            <div class="hero">
                <div class="hero-eyebrow">Oferta Re</div>
                <h1 class="hero-title">Resseguradoras</h1>
                <div class="hero-copy">
                    Consulte os dados coletados na SUSEP e acompanhe as diferenças entre versões.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with right:
        st.markdown(
            """
            <div class="theme-label">Tema</div>
            """,
            unsafe_allow_html=True,
        )
        theme_choice = st.radio(
            "Tema",
            ["Claro", "Escuro"],
            index=0,
            horizontal=True,
            label_visibility="collapsed",
        )
    return theme_choice


def render_metric_card(label: str, value: int | str, note: str, primary: bool = False) -> None:
    primary_class = " primary" if primary else ""
    st.markdown(
        f"""
        <div class="metric-card{primary_class}">
            <div class="metric-label">{label}</div>
            <div class="metric-value">{value}</div>
            <div class="metric-note">{note}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_product_sidebar() -> None:
    st.sidebar.title("Oferta Re")
    st.sidebar.caption("Ofertas, contatos e comprovantes em um só lugar.")
    st.sidebar.markdown("**Consulta de resseguradoras**")
    st.sidebar.caption("Consulta pública disponível. Modelos, ofertas, comprovantes e integração Outlook serão adicionados nas próximas etapas.")
    st.sidebar.info("Alertas por e-mail ainda não estão disponíveis.")


def load_run_manifests() -> tuple[list[dict], bool]:
    manifests, invalid = [], False
    for path in sorted(RUNS_DIR.glob("execucao_*.json")):
        try:
            item = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(item, dict) or item.get("status") not in {"validated", "failed"}:
                raise ValueError("Manifesto inválido")
            manifests.append(item)
        except (OSError, ValueError):
            invalid = True
    return manifests, invalid


def render_collection_status(history_file: Path | None) -> None:
    st.caption("Fonte: SUSEP · https://www2.susep.gov.br/menuatendimento/procura_2011.asp")
    manifests, invalid = load_run_manifests()
    if invalid:
        st.warning("Há registros de execução que não puderam ser lidos. A situação da coleta precisa ser verificada.")
    if manifests and manifests[-1]["status"] == "failed":
        st.error("A última tentativa de coleta falhou. Exibimos a última base disponível; consulte os registros da execução.")
    if history_file is None:
        return
    matching = next((item for item in reversed(manifests) if item.get("snapshot") == history_file.name and item["status"] == "validated"), None)
    collected = None
    if matching:
        try:
            collected = datetime.fromisoformat(matching["finished_at"])
            if collected.tzinfo is None:
                raise ValueError("Horário sem fuso")
            collected = collected.astimezone(ZoneInfo("America/Sao_Paulo"))
            st.caption(f"Última coleta validada: {collected:%d/%m/%Y %H:%M:%S} (horário de Brasília).")
        except (KeyError, ValueError, TypeError):
            st.warning("O horário da coleta não pôde ser validado pelo manifesto.")
    if collected is None:
        collected = extract_timestamp(history_file)
        st.caption(f"Snapshot histórico: {format_timestamp(collected)}. O arquivo antigo não informa fuso nem validação da execução.")
    if collected and business_days_since(collected, datetime.now(ZoneInfo("America/Sao_Paulo"))) > 1:
        st.warning("A base tem mais de um dia útil de defasagem. Confirme informações recentes na fonte oficial.")


def render_entity_search(history_df: pd.DataFrame) -> None:
    render_section_header("Base de resseguradoras", "Busque por nome ou CNPJ e exporte os resultados selecionados.")
    if history_df.empty:
        st.info("Nenhuma base disponível para consulta.")
        return
    left, right = st.columns([3, 1])
    query = left.text_input("Buscar por nome ou CNPJ", placeholder="Nome, razão social ou CNPJ", key="entity_query")
    category = right.selectbox("Tipo de resseguradora", ["Todas", *sorted(history_df["tipo"].unique())], key="entity_category")
    filtered = filter_entities(history_df, query, category)
    st.caption(f"{len(filtered)} de {len(history_df)} registros coletados. Ausência de resultado não comprova ausência de licença.")
    columns = ["nome", "tipo", "cnpj", "codigo_fip", "data_autorizacao_cadastramento", "site", "email"]
    labels = {"nome": "Resseguradora", "tipo": "Tipo", "cnpj": "CNPJ", "codigo_fip": "Código FIP", "data_autorizacao_cadastramento": "Data de autorização/cadastramento", "site": "Site", "email": "E-mail cadastral"}
    if filtered.empty:
        st.info("Nenhuma resseguradora encontrada com esses filtros.")
    else:
        st.dataframe(filtered[columns].rename(columns=labels), width="stretch", hide_index=True)
    st.download_button("Exportar resultados CSV", filtered.to_csv(index=False).encode("utf-8-sig"), "oferta-re-resseguradoras.csv", "text/csv", key="export_entities", disabled=filtered.empty)
    st.caption("O e-mail cadastral não foi verificado como canal de subscrição. Contatos privados serão tratados separadamente.")


def render_section_header(title: str, caption: str) -> None:
    st.markdown(
        f"""
        <div class="section-title">{title}</div>
        <div class="section-caption">{caption}</div>
        """,
        unsafe_allow_html=True,
    )


def build_type_distribution(history_df: pd.DataFrame) -> pd.DataFrame:
    by_type = history_df["tipo"].value_counts().rename_axis("Tipo").reset_index(name="Quantidade")
    total = int(by_type["Quantidade"].sum())
    by_type["Percentual"] = (by_type["Quantidade"] / total * 100).round(1)
    by_type["Participação"] = by_type["Percentual"].map(lambda value: f"{value:.1f}%")
    by_type["Rótulo"] = by_type.apply(
        lambda row: f"{row['Quantidade']}   {row['Participação']}",
        axis=1,
    )
    return by_type.sort_values("Quantidade", ascending=True)


def type_color_scale(theme: dict[str, str]) -> alt.Scale:
    return alt.Scale(
        domain=["Resseguradora Local", "Resseguradora Admitida", "Resseguradora Eventual"],
        range=[theme["local"], theme["admitida"], theme["eventual"]],
    )


def render_type_distribution(history_df: pd.DataFrame, theme: dict[str, str]) -> None:
    by_type = build_type_distribution(history_df)
    max_quantity = int(by_type["Quantidade"].max()) if not by_type.empty else 1
    domain_max = max_quantity + max(1, round(max_quantity * 0.25))

    bars = (
        alt.Chart(by_type)
        .mark_bar(cornerRadius=6, height=22)
        .encode(
            x=alt.X(
                "Quantidade:Q",
                title=None,
                scale=alt.Scale(domain=[0, domain_max]),
                axis=alt.Axis(
                    domain=False,
                    grid=True,
                    gridColor=theme["grid"],
                    labelColor=theme["muted"],
                    tickColor=theme["border"],
                    tickMinStep=1,
                ),
            ),
            y=alt.Y(
                "Tipo:N",
                title=None,
                sort=alt.SortField(field="Quantidade", order="descending"),
                axis=alt.Axis(
                    domain=False,
                    labelColor=theme["text"],
                    labelFontSize=13,
                    labelLimit=240,
                    ticks=False,
                ),
            ),
            color=alt.Color("Tipo:N", scale=type_color_scale(theme), legend=None),
            tooltip=[
                alt.Tooltip("Tipo:N", title="Tipo"),
                alt.Tooltip("Quantidade:Q", title="Quantidade"),
                alt.Tooltip("Participação:N", title="Participação"),
            ],
        )
    )

    labels = (
        alt.Chart(by_type)
        .mark_text(align="left", baseline="middle", dx=10, color=theme["muted"], fontSize=12)
        .encode(
            x="Quantidade:Q",
            y=alt.Y("Tipo:N", sort=alt.SortField(field="Quantidade", order="descending")),
            text="Rótulo:N",
        )
    )

    chart = (
        alt.layer(bars, labels)
        .properties(height=230, background=theme["surface"])
        .configure_view(strokeWidth=0)
    )
    st.altair_chart(chart, width="stretch")

    table_df = by_type.sort_values("Quantidade", ascending=False)[
        ["Tipo", "Quantidade", "Participação"]
    ]
    st.dataframe(table_df, width="stretch", hide_index=True)


def render_empty_state() -> None:
    st.info(
        "Ainda não há histórico versionado para exibição. "
        "Execute o pipeline localmente ou pelo GitHub Actions para gerar os primeiros arquivos."
    )


def main() -> None:
    theme_choice = render_topbar()
    theme = THEMES[theme_choice]
    inject_theme_css(theme)

    render_product_sidebar()

    history_df, history_file = load_latest_history()
    report_files = load_reports()

    render_collection_status(history_file)

    if history_df.empty and not report_files:
        render_empty_state()
        return

    latest_report = latest_file(report_files)
    latest_report_df = read_csv(str(latest_report)) if latest_report else pd.DataFrame()
    latest_history_date = extract_timestamp(history_file) if history_file else None
    latest_report_date = extract_timestamp(latest_report) if latest_report else None

    total_monitorado = len(history_df)
    novos = status_count(latest_report_df, "novo")
    removidos = status_count(latest_report_df, "removido")
    alterados = status_count(latest_report_df, "alterado")

    col_main, col_stats = st.columns([1.5, 2.5], gap="large")
    with col_main:
        render_metric_card("Registros coletados", total_monitorado, "Último snapshot disponível", primary=True)
    
    with col_stats:
        c1, c2, c3 = st.columns(3)
        with c1:
            render_metric_card("Novos", novos, "Último relatório")
        with c2:
            render_metric_card("Ausentes", removidos, "Na coleta; a confirmar")
        with c3:
            render_metric_card("Alterados", alterados, "Último relatório")

    st.caption("Diferenças entre snapshots podem incluir correções de extração. Revise os campos antes de interpretar uma alteração regulatória.")

    hist_str = history_file.name if history_file else "-"
    rep_str = format_timestamp(latest_report_date or latest_history_date)
    st.markdown(
        f"""
        <div class="status-container">
            <div class="badge">
                <span class="badge-icon">🗃️</span> Último snapshot: <strong>{hist_str}</strong>
            </div>
            <div class="badge">
                <span class="badge-icon">⏱️</span> Data do relatório: <strong>{rep_str}</strong>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_base, tab_resumo, tab_alteracoes, tab_historico = st.tabs(["Resseguradoras", "Resumo", "Alterações", "Histórico"])

    with tab_base:
        render_entity_search(history_df)

    with tab_resumo:
        render_section_header(
            "Distribuição da base atual",
            "Composição da base monitorada por tipo de resseguradora.",
        )
        if "tipo" in history_df.columns and not history_df.empty:
            render_type_distribution(history_df, theme)
        else:
            st.info("A base histórica ainda não possui dados para sumarização.")

    with tab_alteracoes:
        render_section_header(
            "Relatórios de alterações",
            "Consulta por execução, com filtro por status e download do CSV.",
        )
        if not report_files:
            st.info("Nenhum relatório de alterações foi encontrado.")
        else:
            st.caption("Ausentes na coleta são ocorrências a confirmar, não cancelamentos de licença.")
            options = {
                f"{format_timestamp(extract_timestamp(path))} - {path.name}": path
                for path in reversed(report_files)
            }
            selected_label = st.selectbox("Execução", list(options.keys()))
            selected_report = options[selected_label]
            report_df = read_csv(str(selected_report))

            status_options = ["Todos", *STATUS_LABELS.values()]
            selected_status = st.segmented_control("Status", status_options, default="Todos")
            visible_df = report_df.copy()
            if selected_status != "Todos" and "status" in visible_df.columns:
                reverse_labels = {value: key for key, value in STATUS_LABELS.items()}
                visible_df = visible_df[visible_df["status"] == reverse_labels[selected_status]]

            st.dataframe(visible_df, width="stretch", hide_index=True)
            st.download_button(
                "Baixar relatório CSV",
                data=selected_report.read_bytes(),
                file_name=selected_report.name,
                mime="text/csv",
            )

    with tab_historico:
        render_section_header(
            "Snapshots históricos",
            "Arquivos versionados usados para rastrear a evolução da base.",
        )
        history_files = list_csv_files(HISTORY_DIR, "susep_resseguradoras_*.csv")
        history_summary = pd.DataFrame(
            [
                {
                    "Data": format_timestamp(extract_timestamp(path)),
                    "Arquivo": path.name,
                    "Registros": len(read_csv(str(path))),
                }
                for path in reversed(history_files)
            ]
        )
        st.dataframe(history_summary, width="stretch", hide_index=True)


if __name__ == "__main__":
    main()
