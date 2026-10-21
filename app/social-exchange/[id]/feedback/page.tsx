import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import { formatHours } from "@/lib/social-exchange";
import FeedbackForm from "./feedback-form";

interface FeedbackExchange {
  id: string;
  hours: number;
  exchanged_on: string;
  description: string;
  exchanger_responded_at: string | null;
  value_to_exchanger: number | null;
  exchanger_comments: string | null;
  exchanger: { id: string; full_name: string } | null;
  exchangee: { id: string; full_name: string } | null;
}

export default async function ExchangeFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/social-exchange/${id}/feedback`);
  }

  const me = await getCurrentMember(supabase);
  const { data } = await supabase
    .from("social_exchanges")
    .select(
      "id, hours, exchanged_on, description, exchanger_responded_at, value_to_exchanger, exchanger_comments, exchanger:members!social_exchanges_exchanger_id_fkey(id, full_name), exchangee:members!social_exchanges_exchangee_id_fkey(id, full_name)"
    )
    .eq("id", id)
    .maybeSingle();

  const exchange = data as unknown as FeedbackExchange | null;

  if (!me || !exchange || exchange.exchanger?.id !== me.id) {
    notFound();
  }

  return (
    <main id="main-content" className="max-w-2xl mx-auto p-8" tabIndex={-1}>
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Give feedback on a Social Exchange</h1>
          <Link href="/social-exchange" className="text-sm underline text-white/80">
            Back to Social Exchange
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-white/20 bg-white/10 p-5 mb-8">
        <p className="font-medium">
          {exchange.exchangee?.full_name ?? "A member"} says you helped them
        </p>
        <p className="text-sm text-white/70 mb-2">
          {new Date(exchange.exchanged_on).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {formatHours(Number(exchange.hours))} {Number(exchange.hours) === 1 ? "hr" : "hrs"}
        </p>
        <p className="text-sm whitespace-pre-line">{exchange.description}</p>
      </section>

      {exchange.exchanger_responded_at ? (
        <p role="status" className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          You&apos;ve already submitted feedback on this exchange. Thank you!
        </p>
      ) : (
        <>
          <p className="mb-6 text-white/80">Please give your feedback on this exchange from your perspective.</p>
          <FeedbackForm
            exchangeId={exchange.id}
            initialValue={exchange.value_to_exchanger}
            initialComments={exchange.exchanger_comments}
          />
        </>
      )}
    </main>
  );
}
