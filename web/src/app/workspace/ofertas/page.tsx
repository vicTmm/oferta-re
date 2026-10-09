import { redirect } from "next/navigation";
export default async function LegacyOffers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const query = new URLSearchParams(await searchParams).toString();
  redirect(`/workspace/propostas${query ? "?" + query : ""}`);
}
