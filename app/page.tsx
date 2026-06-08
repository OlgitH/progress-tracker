import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { log } from "console";

// Define an explicit TypeScript type for your database updates
interface UpdateItem {
  id: string;
  goal: string;
  score: number;
  created_at: string;
  achievements?: string;
  notes?: string;
}

const colours: Record<string, string> = {
  "AI Learning": "bg-blue-50 border-blue-200 text-blue-900",
  Connections: "bg-green-50 border-green-200 text-green-900",
  "Paid Work": "bg-yellow-50 border-yellow-200 text-yellow-900",
  Workspace: "bg-purple-50 border-purple-200 text-purple-900",
  "Freelance Growth": "bg-red-50 border-red-200 text-red-900",
};

export default async function Home() {
  // Fetching flat list of updates, ordered newest first
  const { data, error } = await supabase
    .from("updates")
    .select("*")
    .order("created_at", { ascending: false });

      console.log("GData:", data);

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Studio Progress Tracker</h1>
        <p className="text-red-500">Error loading data: {error.message}</p>
      </main>
    );
  }

  // Grouping updates by their goal category name
  const groupedGoals = (data as UpdateItem[] || []).reduce<Record<string, UpdateItem[]>>((acc, item) => {
    if (!acc[item.goal]) {
      acc[item.goal] = [];
    }
    acc[item.goal].push(item);
    return acc;
  }, {});
  // console.log("Grouped Goals:", groupedGoals);

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Studio Progress Tracker</h1>
        <Link
          href="/new"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Add Monthly Update
        </Link>
      </div>

      {Object.keys(groupedGoals).length === 0 && (
        <div className="border rounded-lg p-6 text-center text-gray-500">
          <p>No updates yet.</p>
        </div>
      )}

      {/* Grid containing each Main Goal Section */}
      <div className="grid gap-8">
        {Object.entries(groupedGoals).map(([goalName, updates]) => (
          <section key={goalName} className="border rounded-xl p-6 shadow-sm bg-white">
            
            {/* Goal Title Header Section */}
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <span className={`w-4 h-4 rounded-full border ${colours[goalName]?.split(' ')[1] || 'border-gray-400 bg-gray-400'}`}></span>
              <h2 className="text-2xl font-bold tracking-tight">{goalName}</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {updates.length} {updates.length === 1 ? 'update' : 'updates'}
              </span>
            </div>

            {/* Nested Updates under this specific goal */}
            <div className="grid gap-4 pl-4 border-l-2 border-gray-100">
              {updates.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-5 ${colours[item.goal] || "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-medium text-gray-500">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-inherit shadow-2xs">
                      <span className="text-xs text-gray-500 font-medium">Score:</span>
                      <span className="text-lg font-black">{item.score}/10</span>
                    </div>
                  </div>

                  {item.achievements && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold opacity-85 mb-1">
                        What I did this month
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">
                        {item.achievements}
                      </p>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-2 pt-2 border-t border-black/5">
                      <h4 className="text-sm font-semibold opacity-85 mb-1">
                        Notes
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-line opacity-95">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}