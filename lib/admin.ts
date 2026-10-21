import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentMember, type Member } from "@/lib/members";

export interface AdminMember {
  id: string;
  user_id: string | null;
  full_name: string;
}

export interface AdminGoal {
  id: string;
  user_id: string;
  name: string;
  archived_at: string | null;
  created_at: string;
}

export interface AdminUpdate {
  id: string;
  user_id: string;
  goal_id: string | null;
  goal: string | null;
  score: number;
  created_at: string;
  achievements: string | null;
  notes: string | null;
}

export interface AdminExchange {
  id: string;
  hours: number;
  exchanged_on: string;
  description: string;
  social_value: number | null;
  value_to_exchangee: number | null;
  exchangee_comments: string | null;
  value_to_exchanger: number | null;
  exchanger_comments: string | null;
  exchanger_responded_at: string | null;
  created_at: string;
  exchanger_id: string | null;
  exchangee_id: string | null;
}

export interface AdminData {
  members: AdminMember[];
  goals: AdminGoal[];
  updates: AdminUpdate[];
  exchanges: AdminExchange[];
}

/** Returns the signed-in member if they are a super user, otherwise null. */
export async function getSuperUser(supabase: SupabaseClient): Promise<Member | null> {
  const member = await getCurrentMember(supabase);
  return member?.is_super_user ? member : null;
}

// Supabase returns at most 1000 rows per request, so page through the table.
async function fetchAll<T>(
  load: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await load(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as T[]));

    if (!data || data.length < pageSize) {
      return rows;
    }
  }
}

/** Loads every member's goals, goal updates and Social Exchanges. Relies on the super user RLS policies. */
export async function loadAdminData(supabase: SupabaseClient): Promise<AdminData> {
  const [members, goals, updates, exchanges] = await Promise.all([
    fetchAll<AdminMember>((from, to) =>
      supabase.from("members").select("id, user_id, full_name").order("full_name").order("id").range(from, to)
    ),
    fetchAll<AdminGoal>((from, to) =>
      supabase
        .from("goals")
        .select("id, user_id, name, archived_at, created_at")
        .order("created_at")
        .order("id")
        .range(from, to)
    ),
    fetchAll<AdminUpdate>((from, to) =>
      supabase
        .from("updates")
        .select("id, user_id, goal_id, goal, score, created_at, achievements, notes")
        .order("created_at")
        .order("id")
        .range(from, to)
    ),
    fetchAll<AdminExchange>((from, to) =>
      supabase
        .from("social_exchanges")
        .select(
          "id, hours, exchanged_on, description, social_value, value_to_exchangee, exchangee_comments, value_to_exchanger, exchanger_comments, exchanger_responded_at, created_at, exchanger_id, exchangee_id"
        )
        .order("exchanged_on")
        .order("id")
        .range(from, to)
    ),
  ]);

  return { members, goals, updates, exchanges };
}

/** Narrows the data to one member: their goals and updates (via user_id) and exchanges on either side. */
export function dataForMember(data: AdminData, member: AdminMember): AdminData {
  return {
    members: data.members,
    goals: data.goals.filter((goal) => member.user_id && goal.user_id === member.user_id),
    updates: data.updates.filter((update) => member.user_id && update.user_id === member.user_id),
    exchanges: data.exchanges.filter(
      (exchange) => exchange.exchanger_id === member.id || exchange.exchangee_id === member.id
    ),
  };
}

export function memberSummaries(data: AdminData) {
  return data.members.map((member) => {
    const given = data.exchanges.filter((exchange) => exchange.exchanger_id === member.id);
    const received = data.exchanges.filter((exchange) => exchange.exchangee_id === member.id);
    const sum = (rows: AdminExchange[]) => rows.reduce((total, row) => total + Number(row.hours), 0);

    return {
      member,
      goals: data.goals.filter((goal) => member.user_id && goal.user_id === member.user_id && !goal.archived_at).length,
      updates: data.updates.filter((update) => member.user_id && update.user_id === member.user_id).length,
      given: given.length,
      received: received.length,
      hoursGiven: sum(given),
      hoursReceived: sum(received),
    };
  });
}

export async function buildWorkbook(data: AdminData): Promise<ArrayBuffer> {
  const memberByUserId = new Map(data.members.filter((m) => m.user_id).map((m) => [m.user_id as string, m.full_name]));
  const memberById = new Map(data.members.map((m) => [m.id, m.full_name]));
  const goalById = new Map(data.goals.map((goal) => [goal.id, goal]));
  const dateOf = (value: string | null) => (value ? new Date(value) : null);

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  function addSheet(name: string, columns: Array<{ header: string; width: number; wrap?: boolean }>, rows: unknown[][]) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns.map((column) => ({ header: column.header, width: column.width }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    sheet.eachRow((row) => {
      row.alignment = { vertical: "top" };
    });
    columns.forEach((column, index) => {
      if (column.wrap) {
        sheet.getColumn(index + 1).alignment = { vertical: "top", wrapText: true };
      }
    });
    sheet.getRow(1).alignment = { vertical: "top" };
  }

  const summaries = memberSummaries(data).filter(
    (summary) => summary.goals || summary.updates || summary.given || summary.received
  );
  addSheet(
    "Summary",
    [
      { header: "Member", width: 28 },
      { header: "Active goals", width: 13 },
      { header: "Goal updates", width: 14 },
      { header: "Exchanges given", width: 17 },
      { header: "Exchanges received", width: 19 },
      { header: "Hours given", width: 13 },
      { header: "Hours received", width: 15 },
    ],
    summaries.map((s) => [s.member.full_name, s.goals, s.updates, s.given, s.received, s.hoursGiven, s.hoursReceived])
  );

  addSheet(
    "Goals",
    [
      { header: "Member", width: 28 },
      { header: "Goal", width: 60, wrap: true },
      { header: "Status", width: 11 },
      { header: "Created", width: 13 },
      { header: "Archived", width: 13 },
    ],
    data.goals.map((goal) => [
      memberByUserId.get(goal.user_id) ?? "Unknown",
      goal.name,
      goal.archived_at ? "Archived" : "Active",
      dateOf(goal.created_at),
      dateOf(goal.archived_at),
    ])
  );

  addSheet(
    "Goal updates",
    [
      { header: "Member", width: 28 },
      { header: "Goal", width: 40, wrap: true },
      { header: "Date", width: 13 },
      { header: "Score (0-10)", width: 13 },
      { header: "Achievements", width: 60, wrap: true },
      { header: "Notes", width: 60, wrap: true },
    ],
    [...data.updates]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((update) => [
        memberByUserId.get(update.user_id) ?? "Unknown",
        (update.goal_id ? goalById.get(update.goal_id)?.name : null) ?? update.goal ?? "Unassigned",
        dateOf(update.created_at),
        update.score,
        update.achievements ?? "",
        update.notes ?? "",
      ])
  );

  addSheet(
    "Social exchanges",
    [
      { header: "Date", width: 13 },
      { header: "Exchanger (gave help)", width: 26 },
      { header: "Exchangee (received help)", width: 26 },
      { header: "Hours", width: 8 },
      { header: "Description", width: 60, wrap: true },
      { header: "Social value (0-10)", width: 18 },
      { header: "Value to exchangee (0-10)", width: 24 },
      { header: "Exchangee comments", width: 50, wrap: true },
      { header: "Value to exchanger (0-10)", width: 24 },
      { header: "Exchanger comments", width: 50, wrap: true },
      { header: "Exchanger responded", width: 20 },
    ],
    [...data.exchanges]
      .sort((a, b) => a.exchanged_on.localeCompare(b.exchanged_on))
      .map((exchange) => [
        dateOf(exchange.exchanged_on),
        (exchange.exchanger_id && memberById.get(exchange.exchanger_id)) || "Group",
        (exchange.exchangee_id && memberById.get(exchange.exchangee_id)) || "Group",
        Number(exchange.hours),
        exchange.description,
        exchange.social_value,
        exchange.value_to_exchangee,
        exchange.exchangee_comments ?? "",
        exchange.value_to_exchanger,
        exchange.exchanger_comments ?? "",
        dateOf(exchange.exchanger_responded_at),
      ])
  );

  for (const sheet of workbook.worksheets) {
    sheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = "dd/mm/yyyy";
        }
      });
    });
  }

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export function workbookResponse(buffer: ArrayBuffer, filename: string) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function filenameSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member";
}
