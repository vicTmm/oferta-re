"""Configura somente os segredos do coletor no repositório deste projeto."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
repo = 'vicTmm/pipeline-susep-resseguradoras'
key = (ROOT/'.env.ingestion.local').read_text().strip().split('=', 1)[1]
values = {'SUPABASE_URL': 'https://vssghglrtxqkfpsdfeik.supabase.co', 'SUPABASE_INGESTION_TOKEN': key}
for name,value in values.items():
    subprocess.run(['gh','secret','set',name,'--repo',repo],input=value,text=True,check=True,capture_output=True)
print('Segredos do coletor configurados no GitHub. Nenhuma chave administrativa foi compartilhada.')
