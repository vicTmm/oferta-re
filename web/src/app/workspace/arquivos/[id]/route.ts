import { workspaceContext } from "@/lib/workspace";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orgId = new URL(request.url).searchParams.get("org") ?? undefined;
  const { client, org } = await workspaceContext(orgId);
  const { data, error } = await client
    .from("documents")
    .select("storage_path,original_name")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (error || !data)
    return new Response("Arquivo não encontrado.", { status: 404 });
  const { data: signed, error: e } = await client.storage
    .from("operation-documents")
    .createSignedUrl(data.storage_path, 60, { download: data.original_name });
  if (e || !signed)
    return new Response(
      "O arquivo ainda não foi recebido. Reenvie o original pela tela de comprovantes.",
      { status: 404 },
    );
  return new Response(null, {
    status: 303,
    headers: {
      Location: signed.signedUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
