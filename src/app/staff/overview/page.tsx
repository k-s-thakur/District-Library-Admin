"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Clock,
  IndianRupee,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  UserPlus,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useStaff } from "@/context/StaffContext";

interface OverviewMetrics {
  catalogueTitles: number;
  totalCopies: number;
  activeMembers: number;
  booksOnLoan: number;
  overdueLoans: number;
  collectionsToday: number;
  todayTransactionsCount: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  member: string;
  time: string;
}

export default function StaffOverviewPage() {
  const { previewData, setTransactionModalOpen } = useStaff();
  const [timeFilter, setTimeFilter] = useState("Today");
  const [activityFilter, setActivityFilter] = useState("Today");

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    catalogueTitles: 8426,
    totalCopies: 12680,
    activeMembers: 3218,
    booksOnLoan: 1084,
    overdueLoans: 42,
    collectionsToday: 2840,
    todayTransactionsCount: 146,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act-1",
      type: "return",
      title: "Book Returned",
      detail: "The White Tiger · ACC-2024-0012",
      member: "MBR-2023-3904 (Sunita Rao)",
      time: "09:42 AM",
    },
    {
      id: "act-2",
      type: "issue",
      title: "Book Issued",
      detail: "Wings of Fire · ACC-2024-0043",
      member: "MBR-2024-0188 (Priya Vance)",
      time: "09:12 AM",
    },
    {
      id: "act-3",
      type: "member",
      title: "New Member Registered",
      detail: "Student Category · Quota: 4",
      member: "MBR-2026-00012 (Aditya Roy)",
      time: "08:58 AM",
    },
  ]);

  useEffect(() => {
    if (!previewData) {
      fetch("/api/administration/overview")
        .then((res) => res.json())
        .then((data) => {
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          if (data.recentActivities && data.recentActivities.length > 0) {
            setActivities(data.recentActivities);
          }
        })
        .catch(() => {});
    }
  }, [previewData]);

  // Clean Chart Data Points
  const chartPoints = [
    { time: "08 AM", issues: 18, returns: 12 },
    { time: "10 AM", issues: 42, returns: 28 },
    { time: "12 PM", issues: 32, returns: 40 },
    { time: "02 PM", issues: 58, returns: 38 },
    { time: "04 PM", issues: 45, returns: 32 },
    { time: "06 PM", issues: 24, returns: 16 },
  ];

  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 35;
  const paddingY = 20;
  const maxVal = 70;

  const getX = (index: number) =>
    paddingX + (index * (svgWidth - 2 * paddingX)) / (chartPoints.length - 1);
  const getY = (val: number) =>
    svgHeight - paddingY - (val * (svgHeight - 2 * paddingY)) / maxVal;

  const issuesPath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.issues)}`)
    .join(" ");

  const returnsPath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.returns)}`)
    .join(" ");

  return (
    <div className="space-y-6">
      {/* District Public Library Management Dashboard Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-xs border border-emerald-950/20">
        <img
          src="/images/library-banner.png"
          alt="District Public Library - Library Management Dashboard"
          className="w-full h-auto min-h-[85px] max-h-[135px] object-cover object-left block"
        />
        {/* Floating Time Filter Selector on top-right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block">
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 text-xs font-medium pl-3.5 pr-8 py-1.5 rounded-full focus:outline-emerald-400 cursor-pointer shadow-md backdrop-blur-xs transition"
            >
              <option value="Today">Today</option>
              <option value="This week">This week</option>
              <option value="This month">This month</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Top 4 Essential KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {metrics.catalogueTitles.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Catalogue Titles</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {metrics.activeMembers.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Active Members</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {metrics.booksOnLoan.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Books on Loan</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              ₹ {metrics.collectionsToday.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Collections Today</div>
          </div>
        </div>
      </div>

      {/* 3. Middle 2 Panels (Activity & Inventory) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Library Activity Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Circulation Activity
                </h3>
                <p className="text-xs text-slate-500">Issues vs Returns across library shifts</p>
              </div>
              <div className="relative">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-7 py-1.5 rounded-full focus:outline-[#0d7a55] cursor-pointer shadow-xs"
                >
                  <option>Today</option>
                  <option>This week</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.todayTransactionsCount}
              </span>
              <span className="text-xs font-normal text-slate-500">transactions today</span>
              <span className="text-xs text-[#0d7a55] font-medium flex items-center gap-0.5 ml-2">
                <TrendingUp className="w-3.5 h-3.5" /> Live
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="mt-4 w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-36 text-slate-300 overflow-visible"
            >
              {[15, 35, 55].map((val) => (
                <line
                  key={val}
                  x1={paddingX}
                  y1={getY(val)}
                  x2={svgWidth - paddingX}
                  y2={getY(val)}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              ))}

              <line
                x1={paddingX}
                y1={getY(0)}
                x2={svgWidth - paddingX}
                y2={getY(0)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Returns line (blue/dashed) */}
              <path
                d={returnsPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Issues line (teal/solid) */}
              <path
                d={issuesPath}
                fill="none"
                stroke="#0d7a55"
                strokeWidth="2"
              />

              {chartPoints.map((p, i) => (
                <g key={p.time}>
                  <circle
                    cx={getX(i)}
                    cy={getY(p.issues)}
                    r="3.5"
                    fill="#0d7a55"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(p.returns)}
                    r="3"
                    fill="#3b82f6"
                  />
                  <text
                    x={getX(i)}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    {p.time}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0d7a55]" />
                <span className="text-[11px] font-medium text-slate-700">Issues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-medium text-slate-700">Returns</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Shift activity</span>
          </div>
        </div>

        {/* Right: Copy Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Holdings Status
                </h3>
                <p className="text-xs text-slate-500">Physical copy availability breakdown</p>
              </div>
              <Link
                href="/staff/catalogue"
                className="text-slate-400 hover:text-slate-700 transition"
                title="Open catalogue"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.totalCopies.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-500 ml-1.5">total physical copies</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden mt-4">
              <div style={{ width: "65%" }} className="bg-[#0d7a55]" title="Available" />
              <div style={{ width: "25%" }} className="bg-blue-600" title="Issued" />
              <div style={{ width: "10%" }} className="bg-amber-500" title="Reserved/Other" />
            </div>

            {/* Breakdown List */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0d7a55]" />
                  <span className="text-slate-700 font-medium">Available on Shelves</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono">
                  {Math.max(0, metrics.totalCopies - metrics.booksOnLoan)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-slate-700 font-medium">Currently on Loan</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono">
                  {metrics.booksOnLoan}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-700 font-medium">Overdue Returns</span>
                </div>
                <span className="font-semibold text-rose-700 font-mono">
                  {metrics.overdueLoans}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 font-medium">Catalog Titles</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono">
                  {metrics.catalogueTitles}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom 2 Panels (Recent Activity & Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Library Activity
              </h3>
              <p className="text-xs text-slate-500">Live circulation stream across all desks</p>
            </div>
            <Link
              href="/staff/circulation"
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-[#0d7a55] font-medium transition"
            >
              <span>Circulation Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {activities.map((act) => {
              const IconComponent =
                act.type === "return" ? RotateCcw : act.type === "issue" ? BookOpen : UserPlus;
              const badgeBg =
                act.type === "return"
                  ? "bg-[#e2f6ee] text-[#0d7a55]"
                  : act.type === "issue"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-emerald-50 text-emerald-700";

              return (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl px-2 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${badgeBg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{act.title}</div>
                      <div className="text-slate-500 text-[11px]">{act.detail}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-700 font-medium text-[11px]">{act.member}</div>
                    <div className="text-slate-400 text-[10px]">{act.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Action Shortcuts (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Desk Shortcuts
            </h3>
            <p className="text-xs text-slate-500">Quick circulation and catalogue actions</p>

            <div className="mt-4 space-y-2.5">
              <Link
                href="/staff/circulation"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0d7a55] hover:bg-[#e2f6ee]/30 transition group text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center group-hover:scale-105 transition">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800">Issue / Return Book</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0d7a55] group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/staff/catalogue"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0d7a55] hover:bg-[#e2f6ee]/30 transition group text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800">Catalogue Register</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/staff/finance"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0d7a55] hover:bg-[#e2f6ee]/30 transition group text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800">Collect Fines / Reversal</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-slate-400 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d7a55]" />
            <span>Connected to District Public Library Server</span>
          </div>
        </div>
      </div>
    </div>
  );
}
