export const areas = { treaty: "Treaty", facultative: "Facultativo", other: "Outra" } as const;
export type Area = keyof typeof areas;
export type SectorSetup = { id?: string; name: string; area: Area; lines: string[] };
export type CompanySetup = {
  name: string; administrator: string; email: string;
  legalName: string; cnpj: string; billingEmail: string; website: string; phone: string;
  areas: Area[]; sectors: SectorSetup[];
  outlook: string; mailbox: string; senderEmail: string; evidence: string[];
  reference: string; hasContacts: string; users: string; monthlyOffers: string;
  tools: string; pain: string; goal: string; step: number;
};
export type SetupResult = { error: string } | { revision: number; payload: CompanySetup; complete: boolean };
export function emptySetup(name = "", email = "", administrator = ""): CompanySetup {
  return { name, email, administrator, legalName: "", cnpj: "", billingEmail: "", website: "", phone: "", areas: [], sectors: [], outlook: "", mailbox: "", senderEmail: "", evidence: [], reference: "", hasContacts: "", users: "", monthlyOffers: "", tools: "", pain: "", goal: "", step: 0 };
}
const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const choices: Record<string, string[]> = { outlook: ["", "classic", "new", "web", "other"], mailbox: ["", "individual", "shared"], hasContacts: ["", "yes", "no"], users: ["", "1-5", "6-20", "21-50", "51+"], monthlyOffers: ["", "1-20", "21-100", "101-500", "501+"] };
export function validateSetup(raw: unknown, complete: boolean): { payload: CompanySetup; error?: never } | { error: string; payload?: never } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "Configuração inválida." };
  const r = raw as Record<string, unknown>, payload = emptySetup();
  const limits: Record<string, number> = { name: 120, administrator: 120, email: 254, legalName: 160, cnpj: 24, billingEmail: 254, website: 200, phone: 40, outlook: 20, mailbox: 20, senderEmail: 254, reference: 120, hasContacts: 10, users: 10, monthlyOffers: 10, tools: 500, pain: 1000, goal: 1000 };
  for (const [key, max] of Object.entries(limits)) {
    if (typeof r[key] !== "string" || (r[key] as string).trim().length > max) return { error: "Confira os campos e seus limites de tamanho." };
    Object.assign(payload, { [key]: (r[key] as string).trim() });
  }
  for (const key of ["email", "billingEmail", "senderEmail"] as const) if (payload[key] && !mail.test(payload[key])) return { error: "Confira os endereços de e-mail." };
  if (payload.website && !/^https?:\/\/[^\s]+$/i.test(payload.website)) return { error: "Informe um site começando com https:// ou http://." };
  if (payload.cnpj && !/^[A-Za-z0-9.\/-]+$/.test(payload.cnpj)) return { error: "Confira o formato do CNPJ." };
  for (const [key, values] of Object.entries(choices)) if (!values.includes(payload[key as keyof CompanySetup] as string)) return { error: "Selecione uma das opções disponíveis." };
  if (!Number.isInteger(r.step) || Number(r.step) < 0 || Number(r.step) > 3) return { error: "Etapa inválida." };
  payload.step = Number(r.step);
  if (!Array.isArray(r.areas) || r.areas.length > 3 || r.areas.some(a => !Object.hasOwn(areas, a))) return { error: "Confira as áreas selecionadas." };
  payload.areas = [...new Set(r.areas)] as Area[];
  if (!Array.isArray(r.evidence) || r.evidence.length > 5 || r.evidence.some(a => !["msg", "eml", "pdf", "image", "other"].includes(a))) return { error: "Confira os formatos de comprovantes." };
  payload.evidence = [...new Set(r.evidence)];
  if (!Array.isArray(r.sectors) || r.sectors.length > 30) return { error: "Use até 30 setores nesta configuração." };
  const names = new Set<string>(), ids = new Set<string>();
  for (const item of r.sectors) {
    if (!item || typeof item !== "object" || typeof item.name !== "string" || item.name.trim().length < 2 || item.name.trim().length > 100 || !Object.hasOwn(areas, item.area) || (item.id && (typeof item.id !== "string" || !uuid.test(item.id)))) return { error: "Cada setor precisa de nome (2 a 100 caracteres) e área." };
    if (names.has(item.name.trim().toLowerCase()) || (item.id && ids.has(item.id))) return { error: "Use nomes distintos para os setores." };
    names.add(item.name.trim().toLowerCase()); if (item.id) ids.add(item.id);
    if (!Array.isArray(item.lines) || item.lines.length > 30 || item.lines.some((l: unknown) => typeof l !== "string" || l.trim().length < 2 || l.trim().length > 80)) return { error: "As linhas precisam ter de 2 a 80 caracteres, até 30 por setor." };
    const lines = [...new Set<string>(item.lines.map((l: string) => l.trim()))];
    if (new Set(lines.map(l => l.toLowerCase())).size !== lines.length) return { error: "Evite linhas repetidas no mesmo setor." };
    payload.sectors.push({ ...(item.id ? { id: item.id } : {}), name: item.name.trim(), area: item.area, lines });
  }
  if (complete && (payload.name.length < 2 || payload.administrator.length < 2 || !payload.email)) return { error: "Preencha o nome da empresa, o responsável e seu e-mail." };
  return { payload };
}
