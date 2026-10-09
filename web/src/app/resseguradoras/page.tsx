import { AppShell } from "@/components/app-shell";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  return (
    <AppShell>
      <CatalogBrowser catalog={await getCatalog()} />
    </AppShell>
  );
}
