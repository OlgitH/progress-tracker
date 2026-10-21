import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import { formatHours } from "@/lib/social-exchange";

interface ExchangeDetail {
  id: string;
  hours: number;
  exchanged_on: string;
  description: string;
  social_value: number | null;
  value_to_exchangee: number | null;
  value_to_exchanger: number | null;
  exchangee_comments: string | null;
  exchanger_comments: string | null;
  exchanger_responded_at: string | null;
  created_at: string;
  exchanger: { id: string; full_name: string } | null;
  exchangee: { id: string; full_name: string } | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-white/70">{label}</dt>
      <dd className="whitespace-pre-line">{children}</dd>
    </div>
  );
}

function score(value: number | null) {
  return value === null ? "Not given" : `${value} / 10`;
}

function text(value: string | null) {
  return value?.trim() ? value : "None";
}

export default async function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/social-exchange/${id}`);
  }

  const me = await getCurrentMember(supabase);
  const { data } = await supabase
    .from("social_exchanges")
    .select(
      "id, hours, exchanged_on, description, social_value, value_to_exchangee, value_to_exchanger, exchangee_comments, exchanger_comments, exchanger_responded_at, created_at, exchanger:members!social_exchanges_exchanger_id_fkey(id, full_name), exchangee:members!social_exchanges_exchangee_id_fkey(id, full_name)"
    )
    .eq("id", id)
    .maybeSingle();

  const exchange = data as unknown as ExchangeDetail | null;

  if (!me || !exchange) {
    notFound();
  }

  const date = (value: string, month: "long" | "short" = "long") =>
    new Date(value).toLocaleDateString("en-GB", { day: "numeric", month, year: "numeric" });

  return (
    <main id="main-content" className="max-w-2xl mx-auto p-8" tabIndex={-1}>
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Social Exchange</h1>
        <Link href="/social-exchange" className="text-sm underline text-white/80">
          Back to Social Exchange
        </Link>
      </header>

      <section className="rounded-xl border border-white/20 bg-white/10 p-6 space-y-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <Field label="Exchanger (helped)">{exchange.exchanger?.full_name ?? "A group"}</Field>
          <Field label="Exchangee (was helped)">{exchange.exchangee?.full_name ?? "A group"}</Field>
          <Field label="Date of exchange">{date(exchange.exchanged_on)}</Field>
          <Field label="Hours">
            {formatHours(Number(exchange.hours))} {Number(exchange.hours) === 1 ? "hr" : "hrs"}
          </Field>
          <Field label="Logged on">{date(exchange.created_at)}</Field>
          <Field label="Exchanger feedback">
            {exchange.exchanger_responded_at ? `Given ${date(exchange.exchanger_responded_at)}` : "Awaiting feedback"}
          </Field>
        </dl>

        <dl className="space-y-6">
          <Field label="Description">{exchange.description}</Field>
        </dl>

        <h2 className="text-lg font-semibold border-t border-white/20 pt-4">From the Exchangee</h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          <Field label="Value to the Exchangee">{score(exchange.value_to_exchangee)}</Field>
          <Field label="Social value">{score(exchange.social_value)}</Field>
        </dl>
        <dl>
          <Field label="Comments">{text(exchange.exchangee_comments)}</Field>
        </dl>

        <h2 className="text-lg font-semibold border-t border-white/20 pt-4">From the Exchanger</h2>
        <dl className="space-y-6">
          <Field label="Value to the Exchanger">{score(exchange.value_to_exchanger)}</Field>
          <Field label="Comments">{text(exchange.exchanger_comments)}</Field>
        </dl>
      </section>
    </main>
  );
}
