import { HelpTooltip } from "./tooltip-hint";
import { Field, FieldLabel } from "./ui/field";
export function DepartmentField({
  departments,
  defaultValue,
}: {
  departments: { id: string; name: string }[];
  defaultValue?: string | null;
}) {
  return (
    <Field>
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor="department_id">
          Setor responsável (opcional)
        </FieldLabel>
        <HelpTooltip
          label="Setor responsável"
          content="Identifica o time responsável pelo registro. Os dados continuam compartilhados com os membros da empresa; selecionar um setor não restringe o acesso."
        />
      </div>
      <select
        id="department_id"
        name="department_id"
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">Compartilhado — sem setor definido</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
