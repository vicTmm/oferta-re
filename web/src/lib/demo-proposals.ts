import type {Proposal} from './proposals';
export const demoLines=[{id:'line-property',name:'Property'},{id:'line-financial',name:'Financial Lines'},{id:'line-treaty',name:'Multirramos'}];
export const portalDemoDepartments=[{id:'dep-property',name:'Property'},{id:'dep-financial',name:'Financial Lines'},{id:'dep-treaty',name:'Soluções Estruturadas'}];
const base={proposal_revision:0,closure_note:'',contract_reference:null,insured_name:null,coverage_start:null,coverage_end:null,prior_operation_id:null};
export function demoProposalData(today:string):Proposal[] {
 const offset=(days:number)=>{const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 return [
 {...base,id:'demo-property-renewal',reference:'REN-2026-001',title:'Renovação patrimonial',cedent_name:'Cedente Exemplo A',business_kind:'renewal',stage:'negotiation',department_id:'dep-property',business_line_id:'line-property',prior_operation_id:'demo-previous-property',contract_reference:'CON-EXEMPLO-2025',insured_name:'Risco industrial fictício',coverage_start:offset(30),coverage_end:offset(395),due_date:offset(7),next_action:'Revisar a dúvida sobre limites e solicitar retorno dos mercados pendentes.'},
 {...base,id:'demo-financial',reference:'PROP-2026-002',title:'Novo programa de responsabilidade',cedent_name:'Cedente Exemplo B',business_kind:'new_business',stage:'review',department_id:'dep-financial',business_line_id:'line-financial',due_date:offset(-2),next_action:'Conferir condições e anexos antes de preparar o envio ao mercado.'},
 {...base,id:'demo-treaty',reference:'REN-2026-003',title:'Renovação do programa Treaty',cedent_name:'Cedente Exemplo C',business_kind:'renewal',stage:'market',department_id:'dep-treaty',business_line_id:'line-treaty',due_date:offset(20),next_action:'Acompanhar retornos dos resseguradores e registrar as respostas.'},
 {...base,id:'demo-preparation',reference:'PROP-2026-004',title:'Novo negócio de engenharia',cedent_name:'Cedente Exemplo D',business_kind:'new_business',stage:'preparation',department_id:'dep-property',business_line_id:'line-property',due_date:null,next_action:'Receber informações do risco e definir a vigência.'},
 {...base,id:'demo-previous-property',reference:'PROP-2025-001',title:'Programa patrimonial · período anterior',cedent_name:'Cedente Exemplo A',business_kind:'new_business',stage:'placed',department_id:'dep-property',business_line_id:'line-property',due_date:offset(-360),next_action:'',closure_note:'Colocação registrada pela equipe na demonstração. Sem validade contratual.',coverage_start:offset(-335),coverage_end:offset(29)},
 ];
}
