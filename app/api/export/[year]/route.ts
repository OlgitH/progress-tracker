import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function parseYear(value: string) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    return null;
  }

  return year;
}

async function resolveYear(
  request: Request,
  params: { year?: string } | Promise<{ year?: string }> | undefined
) {
  const resolvedParams = params ? await params : undefined;
  const queryYear = new URL(request.url).searchParams.get("year") ?? undefined;

  return parseYear(resolvedParams?.year ?? queryYear ?? "");
}

export async function GET(
  request: Request,
  { params }: { params: { year?: string } | Promise<{ year?: string }> }
) {
  const year = await resolveYear(request, params);

  if (!year) {
    return NextResponse.json(
      { error: "Invalid year. Use /api/export/2026 or /api/export?year=2026" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startDate = `${year}-01-01T00:00:00.000Z`;
  const endDate = `${year + 1}-01-01T00:00:00.000Z`;

  const [goalsResult, updatesResult] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, archived_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("updates")
      .select("id, goal_id, goal:goals(id, name), score, created_at, achievements, notes")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: true }),
  ]);

  if (goalsResult.error) {
    return NextResponse.json({ error: goalsResult.error.message }, { status: 500 });
  }

  if (updatesResult.error) {
    return NextResponse.json({ error: updatesResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    year,
    user: {
      id: user.id,
      email: user.email,
    },
    goals: goalsResult.data ?? [],
    updates: updatesResult.data ?? [],
    counts: {
      goals: goalsResult.data?.length ?? 0,
      updates: updatesResult.data?.length ?? 0,
    },
  });
}
