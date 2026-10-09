import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterCatalog, catalogCsv, businessDaysOld } from '../src/lib/catalog-utils.ts';
const records = [{nome:'Proteção (Re)',cnpj:'00.123.456/0001-00',tipo:'Resseguradora Local',codigo_fip:'00001',email:'=formula@example.com',site:'',entcodigo:'0001'}];
test('name search ignores accents and treats punctuation literally', () => {
  assert.equal(filterCatalog(records,'protecao','Todas').length,1);
  assert.equal(filterCatalog(records,'(','Todas').length,1);
  assert.equal(filterCatalog(records,'inexistente','Todas').length,0);
});
test('CNPJ search and categories preserve string identifiers', () => {
  assert.equal(filterCatalog(records,'00123456000100','Todas').length,1);
  assert.equal(filterCatalog(records,'00.123.456/0001-00','Resseguradora Local').length,1);
  assert.equal(filterCatalog(records,'','Resseguradora Admitida').length,0);
  assert.equal(records[0].entcodigo,'0001');
});
test('CSV is BOM encoded, quoted and neutralizes spreadsheet formulas', () => {
  const csv = catalogCsv(records);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"00001"'));
  assert.ok(csv.includes('"\'=formula@example.com"'));
});
test('data age uses Brazilian dates and excludes weekends', () => {
  assert.equal(businessDaysOld('2026-10-09T23:00:00Z',new Date('2026-10-12T12:00:00Z')),1);
  assert.equal(businessDaysOld(null),null);
  assert.equal(businessDaysOld('2026-10-09T02:00:00Z',new Date('2026-10-09T12:00:00Z')),1);
});
