import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface HubCard {
  href: string;
  title: string;
  description: string;
}

function getCards(): HubCard[] {
  return [
    {
      href: "/social-exchange",
      title: "Social Exchange System",
      description: "See the time shared between members of The Studio, and log your own exchanges.",
    },
    {
      href: "/my-goals",
      title: "My Studio goals",
      description: "Set your goals, post monthly updates against them and track your progress.",
    },
  ];
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8" tabIndex={-1}>
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">My Studio</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {getCards().map((card) => (
          <section
            key={card.href}
            aria-labelledby={`${card.href}-heading`}
            className="relative flex flex-col rounded-xl border border-white/20 bg-white/10 p-6 shadow-sm transition hover:bg-white/15 focus-within:ring-2 focus-within:ring-white"
          >
            <h2 id={`${card.href}-heading`} className="text-2xl font-bold tracking-tight mb-2">
              <Link href={card.href} className="after:absolute after:inset-0 focus:outline-none">
                {card.title}
              </Link>
            </h2>
            <p className="text-white/80">{card.description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
