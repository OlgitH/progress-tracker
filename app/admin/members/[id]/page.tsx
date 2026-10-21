import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { dataForMember, getSuperUser, loadAdminData } from "@/lib/admin";
import { formatHours } from "@/lib/social-exchange";
import { primaryButtonClass } from "@/lib/styles";

const dateFormat: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", dateFormat);
}

export default async function AdminMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/admin/members/${id}`);
  }

  if (!(await getSuperUser(supabase))) {
    notFound();
  }

  const all = await loadAdminData(supabase);
  const member = all.members.find((candidate) => candidate.id === id);

  if (!member) {
    notFound();
  }

  const data = dataForMember(all, member);
  const names = new Map(all.members.map((m) => [m.id, m.full_name]));
  const goalById = new Map(data.goals.map((goal) => [goal.id, goal]));
  const goals = data.goals.filter((goal) => !goal.archived_at);
  const updatesByGoal = new Map<string, typeof data.updates>();

  for (const update of data.updates) {
    const key = (update.goal_id && goalById.has(update.goal_id) ? update.goal_id : update.goal?.trim()) || "Unassigned";
    updatesByGoal.set(key, [...(updatesByGoal.get(key) ?? []), update]);
  }

  const sections = [
    ...goals.map((goal) => ({ key: goal.id, label: goal.name })),
    ...[...updatesByGoal.keys()]
      .filter((key) => !goalById.has(key))
      .map((key) => ({ key, label: key })),
  ];
  const exchanges = [...data.exchanges].sort((a, b) => b.exchanged_on.localeCompare(a.exchanged_on));
  const panel = "rounded-xl border border-white/20 bg-white/10 p-6 shadow-sm";

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8" tabIndex={-1}>
      <Link href="/admin" className="text-sm underline">
        &larr; All members
      </Link>

      <header className="flex justify-between items-center my-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{member.full_name}</h1>
          <p className="text-sm text-white/70 mt-1">
            {goals.length} active goals · {data.updates.length} updates · {exchanges.length} Social Exchanges
          </p>
        </div>
        <a href={`/api/admin/export/${member.id}`} download className={primaryButtonClass}>
          Download {member.full_name} (Excel)
        </a>
      </header>

      <div className="grid gap-8">
        <section aria-labelledby="goals-heading" className={panel}>
          <h2 id="goals-heading" className="text-2xl font-bold tracking-tight mb-4">Goals</h2>
          {!member.user_id ? (
            <p className="text-sm text-white/70">This member hasn&apos;t signed in yet, so has no goals.</p>
          ) : sections.length === 0 ? (
            <p className="text-sm text-white/70">No goals yet.</p>
          ) : (
            <ul className="space-y-6">
              {sections.map((section) => {
                const updates = [...(updatesByGoal.get(section.key) ?? [])].sort((a, b) =>
                  b.created_at.localeCompare(a.created_at)
                );

                return (
                  <li key={section.key}>
                    <h3 className="font-semibold text-lg">{section.label}</h3>
                    {updates.length === 0 ? (
                      <p className="text-sm text-white/70">No updates</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {updates.map((update) => (
                          <li key={update.id} className="rounded-lg bg-white/10 p-3 text-sm">
                            <p className="font-medium">
                              {formatDate(update.created_at)} · Score {update.score}/10
                            </p>
                            {update.achievements ? (
                              <p className="mt-1 whitespace-pre-line">
                                <span className="text-white/70">Achievements: </span>
                                {update.achievements}
                              </p>
                            ) : null}
                            {update.notes ? (
                              <p className="mt-1 whitespace-pre-line">
                                <span className="text-white/70">Notes: </span>
                                {update.notes}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="exchanges-heading" className={panel}>
          <h2 id="exchanges-heading" className="text-2xl font-bold tracking-tight mb-4">Social Exchanges</h2>
          {exchanges.length === 0 ? (
            <p className="text-sm text-white/70">No exchanges yet.</p>
          ) : (
            <ul className="space-y-3">
              {exchanges.map((exchange) => {
                const gave = exchange.exchanger_id === member.id;
                const otherId = gave ? exchange.exchangee_id : exchange.exchanger_id;

                return (
                  <li key={exchange.id}>
                    <Link
                      href={`/social-exchange/${exchange.id}`}
                      className={`group block rounded-lg p-4 transition ${
                        gave ? "bg-[#8a6bb0] hover:bg-[#9a7cbf]" : "bg-teal-600 hover:bg-teal-500"
                      }`}
                    >
                      <div className="flex justify-between gap-3 flex-wrap text-sm">
                        <span className="font-medium group-hover:underline">
                          {gave ? "Helped" : "Helped by"} {(otherId && names.get(otherId)) || "a group"}
                        </span>
                        <span className="text-white/70">
                          {formatDate(exchange.exchanged_on)} · {formatHours(Number(exchange.hours))}{" "}
                          {Number(exchange.hours) === 1 ? "hr" : "hrs"}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 mt-1 line-clamp-2">{exchange.description}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
