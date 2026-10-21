export interface ExchangeRow {
  id: string;
  seed_ref?: string | null;
  hours: number;
  exchanged_on: string;
  description: string;
  social_value: number | null;
  value_to_exchangee: number | null;
  value_to_exchanger: number | null;
  exchanger_responded_at: string | null;
  exchanger: { id: string; full_name: string } | null;
  exchangee: { id: string; full_name: string } | null;
}

export interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

function average(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : null;
}

/** The value this member got from the exchange: the Exchanger's or Exchangee's rating, depending on their side. */
function valueToMember(row: ExchangeRow, memberId: string) {
  if (row.exchanger?.id === memberId) return row.value_to_exchanger;
  if (row.exchangee?.id === memberId) return row.value_to_exchangee;
  return null;
}

export function summariseExchanges(rows: ExchangeRow[], memberId: string, now = new Date()) {
  const given = rows.filter((row) => row.exchanger?.id === memberId);
  const received = rows.filter((row) => row.exchangee?.id === memberId);

  const dates = rows.map((row) => row.exchanged_on).sort();
  const first = dates.length ? new Date(`${dates[0].slice(0, 7)}-01T00:00:00`) : now;
  const last = new Date(now.getFullYear(), now.getMonth(), 1);

  // Every month from the first exchange to now, capped to the latest 24 so the chart stays readable.
  const months: MonthBucket[] = [];
  for (let date = new Date(last); date >= first && months.length < 24; date.setMonth(date.getMonth() - 1)) {
    const label = date.toLocaleDateString("en-GB", { month: "short" });
    months.unshift({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.getMonth() === 0 ? `${label} ${String(date.getFullYear()).slice(2)}` : label,
      count: 0,
    });
  }

  if (months.length) {
    months[0].label = `${months[0].label.split(" ")[0]} ${months[0].key.slice(2, 4)}`;
  }

  for (const row of rows) {
    const bucket = months.find((month) => month.key === row.exchanged_on.slice(0, 7));
    if (bucket) {
      bucket.count += 1;
    }
  }

  return {
    total: rows.length,
    given: given.length,
    received: received.length,
    hoursShared: given.reduce((sum, row) => sum + Number(row.hours), 0),
    hoursReceived: received.reduce((sum, row) => sum + Number(row.hours), 0),
    averageSocial: average(rows.map((row) => row.social_value)),
    averagePersonal: average(rows.map((row) => valueToMember(row, memberId))),
    awaitingFeedback: given.filter((row) => !row.exchanger_responded_at),
    // Exchanges this member logged where the helper hasn't submitted yet (imported history is excluded).
    awaitingOthers: received.filter((row) => row.exchanger && !row.exchanger_responded_at && !row.seed_ref),
    months,
    recent: [...rows].sort((a, b) => b.exchanged_on.localeCompare(a.exchanged_on)).slice(0, 8),
  };
}

export function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0$/, "");
}

/** Parses an optional 0-10 whole-number form field. */
export function parseValue(raw: FormDataEntryValue | null, label: string) {
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) {
    return { value: null, error: null };
  }

  const value = Number(text);

  if (!Number.isInteger(value) || value < 0 || value > 10) {
    return { value: null, error: `${label} must be a whole number from 0 to 10.` };
  }

  return { value, error: null };
}
