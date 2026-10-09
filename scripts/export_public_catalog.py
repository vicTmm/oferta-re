"""Gera a base pública local da interface; não lê bases privadas."""
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.tratamento import read_csv
from src.utils import PROJECT_ROOT
from src.validacao import validate_collection

history = sorted((PROJECT_ROOT / 'data/history').glob('susep_resseguradoras_*.csv'))[-1]
records = read_csv(history)
validate_collection(records)
manifest = next((json.loads(path.read_text()) for path in (PROJECT_ROOT / 'outputs/runs').glob('*.json') if json.loads(path.read_text()).get('snapshot') == history.name), None)
output = PROJECT_ROOT / 'web/src/lib/public-catalog.json'
output.write_text(json.dumps({'snapshot': history.name, 'collectedAt': manifest['finished_at'] if manifest else None, 'records': records}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Catálogo público exportado: {len(records)} registros.')
