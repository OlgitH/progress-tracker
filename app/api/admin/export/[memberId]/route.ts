import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildWorkbook,
  dataForMember,
  filenameSlug,
  getSuperUser,
  loadAdminData,
  workbookResponse,
} from "@/lib/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
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
    const data = await loadAdminData(supabase);
    const member = data.members.find((candidate) => candidate.id === memberId);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const buffer = await buildWorkbook(dataForMember(data, member));
    const today = new Date().toISOString().slice(0, 10);
    return workbookResponse(buffer, `my-studio-${filenameSlug(member.full_name)}-${today}.xlsx`);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 500 });
  }
}
