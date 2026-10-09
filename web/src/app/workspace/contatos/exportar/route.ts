import { workspaceContext } from "@/lib/workspace";
export async function GET(request: Request) {
  const { client, org } = await workspaceContext(
    new URL(request.url).searchParams.get("org") ?? undefined,
  );
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from("contacts")
      .select("id,reinsurer_key,name,email,specialties,source_note,verified_at")
      .eq("organization_id", org.id)
      .order("id")
      .range(offset, offset + 999);
    if (error)
      return new Response("Não foi possível exportar a base.", { status: 503 });
    rows.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  const fields = [
    "reinsurer_key",
    "name",
    "email",
    "specialties",
    "source_note",
    "verified_at",
  ];
  const cell = (v: unknown) => {
    const text = Array.isArray(v) ? v.join(", ") : String(v ?? "");
    return (
      '"' +
      (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  const csv =
    "\uFEFF" +
    [
      fields.map(cell).join(","),
      ...rows.map((row) => fields.map((key) => cell(row[key])).join(",")),
    ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contatos-oferta-re.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
