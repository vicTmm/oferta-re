"""Prepara uma chave dedicada. Não publica nem imprime o segredo."""
import hashlib
import os
from pathlib import Path
import secrets

ROOT = Path(__file__).resolve().parents[1]
secret_file = ROOT / '.env.ingestion.local'
if secret_file.exists():
    token = secret_file.read_text().strip().split('=', 1)[1]
else:
    token = secrets.token_urlsafe(32)
    descriptor = os.open(secret_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as file:
        file.write('SUPABASE_INGESTION_TOKEN=' + token + '\n')
os.chmod(secret_file, 0o600)
digest = hashlib.sha256(token.encode()).hexdigest()
(ROOT/'supabase/functions/ingest-susep/token-hash.ts').write_text(
    '// Hash da chave dedicada; o segredo original não pertence ao código.\n'
    f"export const INGESTION_TOKEN_SHA256 = '{digest}';\n"
)
print('Chave dedicada preparada; segredo mantido em arquivo local ignorado no Git.')
