import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSuperUser, loadAdminData, memberSummaries } from "@/lib/admin";
import { formatHours } from "@/lib/social-exchange";
import { primaryButtonClass } from "@/lib/styles";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!(await getSuperUser(supabase))) {
    notFound();
  }

  const data = await loadAdminData(supabase);
  const summaries = memberSummaries(data);
  const totals = {
    goals: summaries.reduce((sum, s) => sum + s.goals, 0),
    updates: summaries.reduce((sum, s) => sum + s.updates, 0),
    exchanges: data.exchanges.length,
    hours: data.exchanges.reduce((sum, row) => sum + Number(row.hours), 0),
  };

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8" tabIndex={-1}>
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">All members</h1>
          <p className="text-sm text-white/70 mt-1">
            Super user view of every member&apos;s goals and Social Exchanges
          </p>
        </div>
        {/* A file download, not a page navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/admin/export/all" download className={primaryButtonClass}>
          Download everything (Excel)
        </a>
      </header>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 rounded-xl border border-white/20 bg-white/10 p-6">
        {[
          ["Members", data.members.length],
          ["Active goals", totals.goals],
          ["Goal updates", totals.updates],
          ["Social Exchanges", `${totals.exchanges} (${formatHours(totals.hours)} hrs)`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-white/70">{label}</dt>
            <dd className="text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="members-heading" className="rounded-xl border border-white/20 bg-white/10 p-6 overflow-x-auto">
        <h2 id="members-heading" className="text-2xl font-bold tracking-tight mb-4">
          Select a member
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/20 text-white/70">
              <th scope="col" className="py-2 pr-4 font-medium">Member</th>
              <th scope="col" className="py-2 pr-4 font-medium">Active goals</th>
              <th scope="col" className="py-2 pr-4 font-medium">Updates</th>
              <th scope="col" className="py-2 pr-4 font-medium">Exchanges given</th>
              <th scope="col" className="py-2 pr-4 font-medium">Exchanges received</th>
              <th scope="col" className="py-2 font-medium">Hours given / received</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.member.id} className="border-b border-white/10">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  <Link href={`/admin/members/${s.member.id}`} className="underline">
                    {s.member.full_name}
                  </Link>
                </th>
                <td className="py-2 pr-4">{s.goals}</td>
                <td className="py-2 pr-4">{s.updates}</td>
                <td className="py-2 pr-4">{s.given}</td>
                <td className="py-2 pr-4">{s.received}</td>
                <td className="py-2">
                  {formatHours(s.hoursGiven)} / {formatHours(s.hoursReceived)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
