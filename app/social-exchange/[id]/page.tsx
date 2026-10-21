import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import { formatHours } from "@/lib/social-exchange";
import DeleteExchangeButton from "./delete-button";

interface ExchangeDetail {
  id: string;
  seed_ref: string | null;
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

export default async function ExchangeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
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
      "id, seed_ref, hours, exchanged_on, description, social_value, value_to_exchangee, value_to_exchanger, exchangee_comments, exchanger_comments, exchanger_responded_at, created_at, exchanger:members!social_exchanges_exchanger_id_fkey(id, full_name), exchangee:members!social_exchanges_exchangee_id_fkey(id, full_name)"
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

      {notice === "delete-failed" ? (
        <p role="alert" className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Couldn&apos;t delete this exchange. Only the person who logged it can delete it.
        </p>
      ) : null}

      {notice === "draft" ? (
        <p role="status" className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Draft saved. You can keep editing it until you submit.
        </p>
      ) : null}

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
            {exchange.exchanger_responded_at
              ? `Given ${date(exchange.exchanger_responded_at)}`
              : `Awaiting feedback from ${exchange.exchanger?.full_name ?? "the Exchanger"}`}
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

        <div className="flex items-center justify-between gap-4 border-t border-white/20 pt-4">
          <h2 className="text-lg font-semibold">From the Exchanger</h2>
          {exchange.exchanger?.id === me.id && !exchange.exchanger_responded_at ? (
            <Link
              href={`/social-exchange/${exchange.id}/feedback`}
              className="rounded bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200 transition"
            >
              {exchange.value_to_exchanger !== null || exchange.exchanger_comments ? "Edit your feedback" : "Add your feedback"}
            </Link>
          ) : null}
        </div>
        <dl className="space-y-6">
          <Field label="Value to the Exchanger">{score(exchange.value_to_exchanger)}</Field>
          <Field label="Comments">{text(exchange.exchanger_comments)}</Field>
        </dl>
      </section>

      {exchange.exchangee?.id === me.id && !exchange.seed_ref ? (
        <div className="mt-8">
          <DeleteExchangeButton exchangeId={exchange.id} />
        </div>
      ) : null}
    </main>
  );
}
