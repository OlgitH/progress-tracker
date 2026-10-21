import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { buildWorkbook, getSuperUser, loadAdminData, workbookResponse } from "@/lib/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await getSuperUser(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await buildWorkbook(await loadAdminData(supabase));
    const today = new Date().toISOString().slice(0, 10);
    return workbookResponse(buffer, `my-studio-all-members-${today}.xlsx`);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 500 });
  }
}
