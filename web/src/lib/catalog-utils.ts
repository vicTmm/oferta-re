import type { Reinsurer } from './catalog';
export function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}
export function filterCatalog(records: Reinsurer[], query: string, category: string) {
  const text = normalize(query.trim());
  const digits = text.replace(/\D/g, '');
  return records.filter(record => (category === 'Todas' || record.tipo === category) &&
    (!text || normalize(record.nome).includes(text) ||
      (digits && !/\p{L}/u.test(text) && record.cnpj.replace(/\D/g, '').includes(digits))));
}
export function catalogCsv(records: Reinsurer[]) {
  const fields = ['nome','tipo','cnpj','codigo_fip','email','site','data_autorizacao_cadastramento','entcodigo'];
  const cell = (value: string) => '"' + (/^[=+@-]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"';
  return '\uFEFF' + [fields.map(cell).join(','), ...records.map(record => fields.map(field => cell(record[field] ?? '')).join(','))].join('\r\n');
}
export function businessDaysOld(iso: string | null, today = new Date()) {
  if (!iso) return null;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const date = (value: Date) => {
    const parts = formatter.formatToParts(value);
    const number = (name: string) => Number(parts.find(part => part.type === name)?.value);
    return Date.UTC(number('year'), number('month') - 1, number('day'));
  };
  let cursor = date(new Date(iso)); const end = date(today); let count = 0;
  while (cursor < end) {
    cursor += 86400000;
    const weekday = new Date(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}
