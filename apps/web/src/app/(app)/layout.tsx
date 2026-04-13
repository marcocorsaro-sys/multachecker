import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      {/* App header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/upload" className="text-xl font-bold">
            Multa<span className="text-primary">Check</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pratiche"
              className="text-sm text-muted hover:text-foreground transition"
            >
              Le mie pratiche
            </Link>
            <span className="text-xs text-muted truncate max-w-[150px]">
              {user.email}
            </span>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
