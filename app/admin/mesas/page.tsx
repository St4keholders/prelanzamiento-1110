import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminMesasClient } from "@/components/admin/AdminMesasClient";
import { isAdmin } from "@/lib/session";
import { getAdminMesas } from "@/lib/teams-admin";

async function Content() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <AdminShell>
      <AdminMesasClient data={await getAdminMesas()} />
    </AdminShell>
  );
}

export default function AdminMesasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Cargando mesas…</div>}>
      <Content />
    </Suspense>
  );
}
