import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentMember } from "@/lib/members";
import { formatHours, summariseExchanges, type ExchangeRow } from "@/lib/social-exchange";
import { primaryButtonClass } from "@/lib/styles";

const notices: Record<string, { tone: "ok" | "warn"; text: string }> = {
  notified: { tone: "ok", text: "Exchange logged, and they've been asked on Slack to give their feedback. Thank you!" },
  feedback: { tone: "ok", text: "Feedback sent. Thank you!" },
  "saved-no-slack": {
    tone: "warn",
    text: "Exchange logged. We couldn't send the Slack message, so you may want to ask them to add their feedback yourself.",
  },
  deleted: { tone: "ok", text: "Exchange deleted." },
  saved: { tone: "ok", text: "Exchange logged. Thank you!" },
};

function formatValue(value: number | null) {
  return value === null ? "–" : value.toFixed(1);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-sm text-white/70">{label}</dt>
      <dd className="text-3xl font-bold">{value}</dd>
      {hint ? <p className="text-xs text-white/60">{hint}</p> : null}
    </div>
  );
}

export default async function SocialExchangePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/social-exchange");
  }

  const me = await getCurrentMember(supabase);
  const { data, error } = me
    ? await supabase
        .from("social_exchanges")
        .select(
          "id, seed_ref, hours, exchanged_on, description, social_value, value_to_exchangee, value_to_exchanger, exchanger_responded_at, exchanger:members!social_exchanges_exchanger_id_fkey(id, full_name), exchangee:members!social_exchanges_exchangee_id_fkey(id, full_name)"
        )
    : { data: null, error: null };

  const header = (
    <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Social Exchange</h1>
        <p className="text-sm text-white/70 mt-1">
          One-to-one time shared between members{me ? ` · ${me.full_name}` : ""}
        </p>
      </div>
    </header>
  );

  if (!me || error) {
    const missingSetup = error?.message.includes("social_exchanges") || error?.message.includes("claim_member");

    return (
      <main id="main-content" className="max-w-3xl mx-auto p-8" tabIndex={-1}>
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 space-y-2">
          {missingSetup || !me ? (
            <p>
              Social Exchange isn&apos;t set up yet. Run <code>supabase_social_exchange_setup.sql</code> in the
              Supabase editor, then reload.
            </p>
          ) : (
            <p>Error loading exchanges: {error?.message}</p>
          )}
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as unknown as ExchangeRow[];
  const summary = summariseExchanges(rows, me.id);
  const peak = Math.max(1, ...summary.months.map((month) => month.count));
  const banner = notice ? notices[notice] : undefined;

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8" tabIndex={-1}>
      {header}

      {banner ? (
        <p
          role="status"
          className={`mb-6 rounded border px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="mb-8">
        <Link
          href="/social-exchange/new"
          className={primaryButtonClass}
        >
          Log a Social Exchange
        </Link>
      </div>

      {summary.awaitingFeedback.length ? (
        <section aria-labelledby="feedback-heading" className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h2 id="feedback-heading" className="font-semibold mb-2">Waiting for your feedback</h2>
          <ul className="space-y-1 text-sm">
            {summary.awaitingFeedback.map((row) => (
              <li key={row.id}>
                <Link href={`/social-exchange/${row.id}/feedback`} className="underline">
                  {row.exchangee?.full_name ?? "A member"} logged an exchange with you on{" "}
                  {new Date(row.exchanged_on).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary.awaitingOthers.length ? (
        <section aria-labelledby="awaiting-heading" className="mb-8 rounded-xl border border-white/20 bg-white/10 p-5">
          <h2 id="awaiting-heading" className="font-semibold mb-2">Awaiting feedback from others</h2>
          <ul className="space-y-1 text-sm">
            {summary.awaitingOthers.map((row) => (
              <li key={row.id}>
                <Link href={`/social-exchange/${row.id}`} className="underline">
                  Awaiting feedback from {row.exchanger?.full_name}
                </Link>{" "}
                <span className="text-white/70">
                  · {new Date(row.exchanged_on).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/40 p-8 text-center text-white/80">
          <p className="font-medium mb-1">No exchanges yet.</p>
          <p>When another member helps you, log it here to see your activity build up.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <section aria-labelledby="activity-heading" className="lg:col-span-2 rounded-xl border border-white/20 bg-white/10 p-6 shadow-sm">
            <h2 id="activity-heading" className="text-2xl font-bold tracking-tight mb-6 border-b border-white/20 pb-4">
              Activity
            </h2>

            <dl className="grid grid-cols-2 gap-6 mb-8">
              <Stat
                label="Number of exchanges"
                value={String(summary.total)}
                hint={`${summary.given} given · ${summary.received} received`}
              />
              <Stat
                label="Hours shared"
                value={formatHours(summary.hoursShared)}
                hint={`${formatHours(summary.hoursReceived)} received`}
              />
            </dl>

            <h3 className="text-sm font-semibold mb-3">Timeline of exchanges</h3>
            <ol
              className="flex items-end gap-1.5 h-28 mb-8"
              aria-label="Exchanges per month by month"
            >
              {summary.months.map((month) => (
                <li key={month.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-xs text-white/70">{month.count || ""}</span>
                  <div
                    className={`w-full rounded-t ${month.count ? "bg-white" : "bg-white/20"}`}
                    style={{ height: `${month.count ? Math.max(8, (month.count / peak) * 100) : 4}%` }}
                    title={`${month.label}: ${month.count}`}
                  />
                  <span className="text-[10px] text-white/70">{month.label}</span>
                </li>
              ))}
            </ol>

            <h3 className="text-sm font-semibold mb-3">Recent exchanges</h3>
            <ul className="space-y-3">
              {summary.recent.map((row) => {
                const gave = row.exchanger?.id === me.id;
                const other = gave ? row.exchangee : row.exchanger;

                return (
                  <li key={row.id}>
                    <Link
                      href={`/social-exchange/${row.id}`}
                      className={`group block rounded-lg p-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                        gave ? "bg-[#8a6bb0] hover:bg-[#9a7cbf]" : "bg-teal-600 hover:bg-teal-500"
                      }`}
                    >
                    <div className="flex justify-between gap-3 flex-wrap text-sm">
                      <span className="font-medium group-hover:underline group-focus-visible:underline">
                        {gave ? "You helped" : "Helped by"} {other?.full_name ?? "a group"}
                      </span>
                      <span className="text-white/70">
                        {new Date(row.exchanged_on).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {formatHours(Number(row.hours))} {Number(row.hours) === 1 ? "hr" : "hrs"}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">{row.description}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="value-heading" className="rounded-xl border border-white/20 bg-white/10 p-6 shadow-sm self-start">
            <h2 id="value-heading" className="text-2xl font-bold tracking-tight mb-6 border-b border-white/20 pb-4">
              Value
            </h2>
            <dl className="space-y-6">
              <Stat label="Average social value" value={formatValue(summary.averageSocial)} hint="out of 10" />
              <Stat label="Average personal value" value={formatValue(summary.averagePersonal)} hint="out of 10" />
            </dl>
            <p className="text-xs text-white/60 mt-6">
              Averages cover every exchange you&apos;ve been part of. They&apos;re here to help you reflect, not to
              score you.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
