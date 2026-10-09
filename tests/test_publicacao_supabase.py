import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, Mock

from src.pipeline import PipelinePaths, run_pipeline
from src.publicacao_supabase import publication_payload, publish
from src.tratamento import normalize_rows


class PublicationTests(unittest.TestCase):
    def test_only_validated_snapshot_is_sent_and_identifiers_stay_strings(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rows = normalize_rows([{'nome':'Sintética','tipo':f'Resseguradora {kind}','entcodigo':f'00{i}'} for i,kind in enumerate(['Local','Admitida','Eventual'])])
            run_pipeline(lambda:rows, paths=PipelinePaths(root))
            manifest = next((root/'outputs/runs').glob('*.json'))
            function, payload = publication_payload(manifest, root)
            self.assertEqual(function, 'publish_susep_collection')
            self.assertTrue(all(row['entcodigo'].startswith('00') for row in payload['p_rows']))
            with patch.dict('os.environ',{'SUPABASE_URL':'https://example.supabase.co','SUPABASE_INGESTION_TOKEN':'SYNTHETIC_ONLY'}), patch('src.publicacao_supabase.requests.post',return_value=Mock(ok=True)) as request:
                publish(manifest,root)
                self.assertNotIn('apikey',request.call_args.kwargs['headers'])
                self.assertEqual(request.call_args.kwargs['json'],{'function':function,'payload':payload})

    def test_failure_publication_contains_no_raw_error_or_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertLogs(level='ERROR'), self.assertRaises(ValueError):
                run_pipeline(lambda:[],paths=PipelinePaths(root))
            manifest = next((root/'outputs/runs').glob('*.json'))
            function,payload = publication_payload(manifest,root)
            self.assertEqual(function,'record_susep_failure')
            self.assertNotIn('p_rows',payload)
            self.assertNotIn('error',payload)
