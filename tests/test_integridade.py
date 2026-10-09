import json
import logging
import tempfile
import unittest
from pathlib import Path

import pandas as pd

from src.coleta_susep import SourceFormatError, parse_results
from src.comparacao import compare_tables
from src.consulta import filter_entities
from src.pipeline import PipelinePaths, publish_files, run_pipeline
from src.tratamento import normalize_rows
from src.validacao import CollectionValidationError, EXPECTED_TYPES, validate_collection


def rows():
    return normalize_rows([
        {'tipo': tipo, 'nome': f'Empresa {index}', 'entcodigo': f'00{index}', 'cnpj': '00123456000100'}
        for index, tipo in enumerate(sorted(EXPECTED_TYPES))
    ])


class IntegrityTests(unittest.TestCase):
    def test_rejects_empty_missing_category_and_duplicate(self):
        for data in [[], rows()[:2], rows() + rows()[:1]]:
            with self.subTest(data=data), self.assertRaises(CollectionValidationError):
                validate_collection(data)

    def test_missing_identity(self):
        data = rows()
        data[0]['entcodigo'] = data[0]['cnpj'] = ''
        with self.assertRaises(CollectionValidationError):
            validate_collection(data)

    def test_suspicious_partial_drop(self):
        old = normalize_rows([
            {'tipo': tipo, 'nome': 'Empresa', 'entcodigo': str(index)}
            for tipo in EXPECTED_TYPES for index in range(10)
        ])
        new = [row for row in old if not (row['tipo'] == 'Resseguradora Local' and row['entcodigo'] in ('0', '1'))]
        with self.assertRaises(CollectionValidationError):
            validate_collection(new, old)
        validate_collection(new, old, max_category_drop=.2)

    def test_compare_rejects_duplicate(self):
        with self.assertRaises(CollectionValidationError):
            compare_tables(rows(), rows() + rows()[:1])

    def test_compare_added_absent_and_field_changes(self):
        old = rows()
        new = [row.copy() for row in old[1:]]
        new[0]['email'] = 'sintetico@example.com'
        new += normalize_rows([{'tipo': old[0]['tipo'], 'nome': 'Nova', 'entcodigo': '999'}])
        diff = compare_tables(old, new)
        self.assertEqual([len(diff[key]) for key in ('added', 'removed', 'changed')], [1, 1, 1])
        self.assertIn('email:', diff['changed'][0]['campos_alterados'])

    def test_success_then_failure_preserves_baseline(self):
        with tempfile.TemporaryDirectory() as root:
            paths = PipelinePaths(Path(root))
            success = run_pipeline(rows, paths=paths)
            self.assertEqual(success['status'], 'validated')
            before = paths.current.read_bytes()
            with self.assertLogs(level=logging.ERROR), self.assertRaises(CollectionValidationError):
                run_pipeline(lambda: rows()[:2], paths=paths)
            self.assertEqual(paths.current.read_bytes(), before)
            self.assertEqual(len(list(paths.history.glob('*.csv'))), 1)
            manifests = [json.loads(p.read_text()) for p in sorted(paths.runs.glob('*.json'))]
            self.assertEqual([m['status'] for m in manifests], ['validated', 'failed'])
            self.assertTrue(manifests[-1]['finished_at'].endswith('+00:00'))

    def test_publication_rolls_back_io_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target, stage = root / 'target', root / 'stage'
            target.write_text('valid'); stage.write_text('new')
            with self.assertRaises(FileNotFoundError):
                publish_files([(stage, target), (root / 'missing', root / 'other')])
            self.assertEqual(target.read_text(), 'valid')

    def test_search_accent_cnpj_and_literal(self):
        data = pd.DataFrame([{'nome': 'Proteção (Re)', 'cnpj': '00123456000100', 'tipo': 'Local'}])
        self.assertEqual(len(filter_entities(data, 'protecao')), 1)
        self.assertEqual(len(filter_entities(data, '00.123.456/0001-00')), 1)
        self.assertEqual(len(filter_entities(data, '(')), 1)
        self.assertTrue(filter_entities(data, category='Eventual').empty)


class ParserTests(unittest.TestCase):
    HTML = '''<p>Empresa(s) encontrada(s): 1</p><table>
    <tr><td><strong>Empresa Sintética</strong></td></tr>
    <tr><td>CNPJ: 00.123.456/0001-00</td></tr>
    <tr><td>Código FIP: 00001</td></tr>
    <tr><td>Endereço: Rua Teste</td></tr>
    <tr><td>Data Autorização/Cadastramento: 01/01/2026</td></tr>
    <tr><td><a onclick="info('entcodigo=0001&amp;codativo=True')">Dados</a></td></tr>
    </table>'''

    def test_accented_fields_and_string_ids(self):
        record = parse_results(self.HTML, 'Resseguradora Local')[0]
        self.assertEqual(record['codigo_fip'], '00001')
        self.assertEqual(record['entcodigo'], '0001')
        self.assertEqual(record['endereco'], 'Rua Teste')
        self.assertEqual(record['data_autorizacao_cadastramento'], '01/01/2026')

    def test_block_and_partial_response_rejected(self):
        for html in ['<h1>Web Page Blocked</h1>', self.HTML.replace('encontrada(s): 1', 'encontrada(s): 2')]:
            with self.subTest(html=html), self.assertRaises(SourceFormatError):
                parse_results(html, 'Resseguradora Local')


class DashboardTests(unittest.TestCase):
    def test_search_and_category_interaction(self):
        from streamlit.testing.v1 import AppTest
        app = AppTest.from_file(str(Path(__file__).resolve().parents[1] / "app/dashboard.py")).run(timeout=30)
        self.assertEqual(len(app.exception), 0)
        app.text_input(key='entity_query').set_value('nome inexistente sintetico').run()
        self.assertEqual(len(app.exception), 0)
        self.assertTrue(any('Nenhuma resseguradora encontrada' in item.value for item in app.info))
        app.text_input(key='entity_query').set_value('').run()
        app.selectbox(key='entity_category').select('Resseguradora Local').run()
        self.assertEqual(len(app.exception), 0)
        self.assertTrue((app.dataframe[0].value['Tipo'] == 'Resseguradora Local').all())


if __name__ == '__main__':
    unittest.main()
