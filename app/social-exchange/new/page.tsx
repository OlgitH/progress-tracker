import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import ExchangeForm from "./exchange-form";

export default async function NewSocialExchangePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/social-exchange/new");
  }

  const me = await getCurrentMember(supabase);
  const { data: members } = await supabase
    .from("members")
    .select("id, full_name")
    .neq("id", me?.id ?? "")
    .order("full_name", { ascending: true });

  return (
    <main id="main-content" className="max-w-2xl mx-auto p-8" tabIndex={-1}>
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Log a Social Exchange</h1>
          <Link href="/social-exchange" className="text-sm underline text-white/80">
            Back to Social Exchange
          </Link>
        </div>
      </header>

      <p className="mb-6 text-white/80">
        Log a one-to-one session where another member helped you. They&apos;ll be notified on Slack
        and asked to give feedback from their side.
      </p>

      <ExchangeForm members={members ?? []} today={new Date().toISOString().slice(0, 10)} />
    </main>
  );
}
