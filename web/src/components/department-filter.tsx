import { HelpTooltip } from "./tooltip-hint";
import { Field, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
export function DepartmentFilter({
  org,
  departments,
  selected,
}: {
  org: string;
  departments: { id: string; name: string }[];
  selected?: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="org" value={org} />
      <Field>
        <div className="flex items-center gap-1.5">
          <FieldLabel htmlFor="sector-filter">Organizar por setor</FieldLabel>
          <HelpTooltip
            label="Filtro por setor"
            content="Filtra os registros pelo setor responsável. Sem setor definido mostra os registros que ainda não foram vinculados a um time."
          />
        </div>
        <select
          id="sector-filter"
          name="setor"
          defaultValue={selected ?? ""}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">Todos os setores da empresa</option>
          <option value="geral">Sem setor definido</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" variant="outline">
        Filtrar
      </Button>
    </form>
  );
}
