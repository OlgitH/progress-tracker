"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useParams } from "next/navigation";
import SignOutButton from "@/app/ui/sign-out-button";
import SiteMenu from "@/app/ui/site-menu";

interface GoalRef {
  id: string;
  name: string;
}

interface ExportUpdate {
  id: string;
  score: number;
  created_at: string;
  goal: GoalRef | null;
}

interface ExportPayload {
  year: number;
  updates: ExportUpdate[];
}

interface MonthPoint {
  month: number;
  avg: number | null;
  count: number;
}

interface GoalSeries {
  goalId: string;
  goalName: string;
  color: string;
  points: MonthPoint[];
}

function parseYearParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const numeric = Number(raw);

  if (!Number.isInteger(numeric) || numeric < 2000 || numeric > 3000) {
    return new Date().getFullYear();
  }

  return numeric;
}

function buildSeriesByGoal(updates: ExportUpdate[]): GoalSeries[] {
  const grouped = new Map<
    string,
    {
      goalName: string;
      totals: Array<{ total: number; count: number }>;
    }
  >();

  for (const update of updates) {
    const goalId = update.goal?.id ?? "unassigned";
    const goalName = update.goal?.name ?? "Unassigned";

    if (!grouped.has(goalId)) {
      grouped.set(goalId, {
        goalName,
        totals: Array.from({ length: 12 }, () => ({ total: 0, count: 0 })),
      });
    }

    const goal = grouped.get(goalId);
    if (!goal) {
      continue;
    }

    const monthIndex = new Date(update.created_at).getMonth();
    if (monthIndex >= 0 && monthIndex < 12) {
      goal.totals[monthIndex].total += update.score;
      goal.totals[monthIndex].count += 1;
    }
  }

  const goalIds = [...grouped.keys()].sort((left, right) => {
    const leftName = grouped.get(left)?.goalName ?? "";
    const rightName = grouped.get(right)?.goalName ?? "";
    return leftName.localeCompare(rightName);
  });

  const palette = [...d3.schemeTableau10, ...d3.schemeSet2, ...d3.schemeSet3];

  return goalIds.map((goalId, index) => {
    const group = grouped.get(goalId);
    const points = (group?.totals ?? []).map((entry, month) => ({
      month,
      avg: entry.count > 0 ? Number((entry.total / entry.count).toFixed(2)) : null,
      count: entry.count,
    }));

    return {
      goalId,
      goalName: group?.goalName ?? "Unassigned",
      color: palette[index % palette.length],
      points,
    };
  });
}

export default function ProgressYearPage() {
  const params = useParams<{ year: string }>();
  const year = parseYearParam(params?.year);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [payload, setPayload] = useState<ExportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExportData() {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/export/${year}`, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        if (!cancelled) {
          setError(result.error ?? "Failed to load yearly export.");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setPayload(result as ExportPayload);
        setLoading(false);
      }
    }

    loadExportData();

    return () => {
      cancelled = true;
    };
  }, [year]);

  const goalSeries = useMemo(() => buildSeriesByGoal(payload?.updates ?? []), [payload]);
  const totalUpdates = payload?.updates.length ?? 0;
  const yearlyAverage =
    totalUpdates > 0
      ? Number(((payload?.updates.reduce((sum, item) => sum + item.score, 0) ?? 0) / totalUpdates).toFixed(2))
      : 0;

  useEffect(() => {
    if (!svgRef.current || loading || error) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 420;
    const margin = { top: 28, right: 28, bottom: 52, left: 56 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    const root = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 11]).range([0, chartWidth]);
    const y = d3.scaleLinear().domain([0, 10]).nice().range([chartHeight, 0]);

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    root
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(d3.range(12))
          .tickFormat((value) => monthLabels[Number(value)])
      )
      .call((group) => group.selectAll("text").attr("fill", "#374151"))
      .call((group) => group.selectAll("path,line").attr("stroke", "#9ca3af"));

    root
      .append("g")
      .call(d3.axisLeft(y).tickValues([0, 2, 4, 6, 8, 10]))
      .call((group) => group.selectAll("text").attr("fill", "#374151"))
      .call((group) => group.selectAll("path,line").attr("stroke", "#9ca3af"));

    root
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickValues([0, 2, 4, 6, 8, 10])
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .call((group) => group.select(".domain").remove())
      .call((group) => group.selectAll("line").attr("stroke", "#e5e7eb"));

    const line = d3
      .line<MonthPoint>()
      .defined((point) => point.avg !== null)
      .x((point) => x(point.month))
      .y((point) => y(point.avg ?? 0))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const sortedSeries = [...goalSeries].sort((left, right) => {
      if (!hoveredGoalId) {
        return 0;
      }

      if (left.goalId === hoveredGoalId) {
        return 1;
      }

      if (right.goalId === hoveredGoalId) {
        return -1;
      }

      return 0;
    });

    const lineGroups = root
      .selectAll("g.goal-series")
      .data(sortedSeries, (series) => (series as GoalSeries).goalId)
      .enter()
      .append("g")
      .attr("class", "goal-series");

    lineGroups.each(function renderSeries(series, seriesIndex) {
      const group = d3.select(this);
      const isActive = !hoveredGoalId || hoveredGoalId === series.goalId;
      const strokeColor = isActive ? series.color : "#cbd5e1";
      const strokeOpacity = !hoveredGoalId ? 1 : isActive ? 1 : 0.9;

      const linePath = group
        .append("path")
        .datum(series.points)
        .attr("fill", "none")
        .attr("stroke", strokeColor)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-width", isActive ? 3 : 2)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);

      const totalLength = linePath.node()?.getTotalLength() ?? 0;
      linePath
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .delay(seriesIndex * 90)
        .duration(900)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

      const definedPoints = series.points.filter((point) => point.avg !== null);

      group
        .selectAll("circle.point")
        .data(definedPoints)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (point) => x(point.month))
        .attr("cy", y(0))
        .attr("r", 0)
        .attr("fill", strokeColor)
        .attr("fill-opacity", strokeOpacity)
        .transition()
        .delay((_point, index) => seriesIndex * 90 + 180 + index * 35)
        .duration(350)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr("cy", (point) => y(point.avg ?? 0))
        .attr("r", isActive ? 4 : 3);
    });

    root
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 42)
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", 12)
      .text("Month");

    root
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", 12)
        .text("Score (0-10)");
      }, [goalSeries, hoveredGoalId, loading, error]);

  return (
    <main id="main-content" className="max-w-6xl mx-auto p-8 space-y-6" tabIndex={-1}>
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mt-2">Progress graph for {year}</h1>
          <p className="text-sm text-gray-600 mt-1">Animated monthly trend based on your yearly updates.</p>
        </div>

        <SiteMenu
          label="Open main navigation menu"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/goals", label: "My goals" },
            { href: "/new", label: "Add Monthly Update" },
            { href: `/progress/${year}`, label: `Progress graph (${year})` },
            { href: `/api/export/${year}`, label: `Open raw JSON (${year})` },
          ]}
        >
          <SignOutButton className="w-full text-left rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100" />
        </SiteMenu>
      </header>

      {loading ? (
        <div className="rounded-xl border p-8 text-gray-600">Loading yearly progress...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">Updates in {year}</p>
              <p className="text-3xl font-bold">{totalUpdates}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">Average score</p>
              <p className="text-3xl font-bold">{yearlyAverage}/10</p>
            </div>
          </div>

          <section className="rounded-xl border bg-white p-4 sm:p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Goals key</h2>
            <div className="flex flex-wrap gap-2">
              {goalSeries.map((series) => {
                const isHoveredState = hoveredGoalId !== null;
                const isActive = !isHoveredState || hoveredGoalId === series.goalId;

                return (
                  <button
                    key={series.goalId}
                    type="button"
                    onMouseEnter={() => setHoveredGoalId(series.goalId)}
                    onMouseLeave={() => setHoveredGoalId(null)}
                    onFocus={() => setHoveredGoalId(series.goalId)}
                    onBlur={() => setHoveredGoalId(null)}
                    className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition ${isActive ? "border-gray-300 bg-white text-gray-900" : "border-gray-200 bg-gray-50 text-gray-400"}`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: isActive ? series.color : "#cbd5e1" }}
                    ></span>
                    {series.goalName}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4 sm:p-6">
            <svg ref={svgRef} className="w-full h-[340px] sm:h-[420px]" aria-label="Yearly progress chart" />
          </section>
        </>
      )}
    </main>
  );
}
