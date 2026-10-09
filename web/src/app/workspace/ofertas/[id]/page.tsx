import { redirect } from "next/navigation";
export default async function LegacyOperation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const query = new URLSearchParams(await searchParams).toString();
  redirect(
    `/workspace/propostas/${encodeURIComponent(id)}${query ? "?" + query : ""}`,
  );
}
