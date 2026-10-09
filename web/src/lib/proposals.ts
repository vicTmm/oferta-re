export const proposalStages = { preparation:"Em preparação",review:"Em revisão",market:"No mercado",negotiation:"Em negociação",placed:"Colocada",not_placed:"Não colocada",cancelled:"Cancelada",closed:"Encerrada (legado)" } as const;
export const businessKinds = {new_business:"Novo negócio",renewal:"Renovação"} as const;
export type ProposalStage = keyof typeof proposalStages;
export type Proposal = {
 id:string; reference:string; title:string; cedent_name:string; contract_reference?:string|null;
 business_kind:keyof typeof businessKinds; stage:ProposalStage; insured_name?:string|null;
 department_id?:string|null; business_line_id?:string|null; prior_operation_id?:string|null;
 coverage_start?:string|null; coverage_end?:string|null; due_date?:string|null;
 next_action:string; closure_note:string; proposal_revision:number;
};
export function isClosed(stage:string) { return ['placed','not_placed','cancelled','closed'].includes(stage); }
export function brazilToday(now=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function dateLabel(date?:string|null) { return date ? date.split('-').reverse().join('/') : 'Não informada'; }
export function isOverdue(proposal:Pick<Proposal,'stage'|'due_date'>,today=brazilToday()) { return !isClosed(proposal.stage) && !!proposal.due_date && proposal.due_date<today; }
export function upcomingRenewal(proposal:Pick<Proposal,'stage'|'business_kind'|'due_date'>,today=brazilToday()) {
 const until = new Date(`${today}T12:00:00Z`); until.setUTCDate(until.getUTCDate()+30);
 return proposal.business_kind==='renewal' && !isClosed(proposal.stage) && !!proposal.due_date && proposal.due_date>=today && proposal.due_date<=until.toISOString().slice(0,10);
}

export function expiringCoverage(proposal: Pick<Proposal,"stage"|"coverage_end">, today = brazilToday()) {
  const until = new Date(`${today}T12:00:00Z`);
  until.setUTCDate(until.getUTCDate()+30);
  return proposal.stage === "placed" && !!proposal.coverage_end && proposal.coverage_end >= today && proposal.coverage_end <= until.toISOString().slice(0,10);
}
