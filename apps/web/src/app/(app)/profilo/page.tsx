import { createClient } from "@/lib/supabase/server";
import { ProfiloForm } from "./profilo-form";

export default async function ProfiloPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Il tuo profilo</h1>
      <p className="mt-2 text-sm text-muted">
        Questi dati verranno usati per intestare i ricorsi. Assicurati che siano
        corretti e completi.
      </p>
      <div className="mt-6">
        <ProfiloForm
          userId={user!.id}
          initial={{
            full_name: profile?.full_name ?? "",
            fiscal_code: profile?.fiscal_code ?? "",
            address: profile?.address ?? "",
            city: profile?.city ?? "",
            province: profile?.province ?? "",
            zip_code: profile?.zip_code ?? "",
            phone: profile?.phone ?? "",
            email: profile?.email ?? user?.email ?? "",
          }}
        />
      </div>
    </div>
  );
}
