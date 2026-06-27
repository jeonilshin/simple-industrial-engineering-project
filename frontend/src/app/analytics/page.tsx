"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/Card";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type AnalyticsResponse } from "@/lib/api";

function AnalyticsInner() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.analytics().then(setData).catch((e) => setError(e.message));
  }, []);

  async function onExportXlsx() {
    setDownloading(true);
    try {
      await api.downloadExport("predictions.xlsx");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <p className="text-sm text-slate-500">
            Productivity, labor cost, overtime, and worker utilization.
          </p>
        </div>
        <button
          onClick={onExportXlsx}
          disabled={downloading}
          className="border border-slate-300 rounded px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {downloading ? "Exporting…" : "Export Predictions (Excel)"}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card label="Total Predicted Cost" value={`₱${data.total_predicted_cost.toLocaleString()}`} hint="last 14 predictions" />
        <Card label="Avg Confidence" value={`${(data.avg_confidence * 100).toFixed(1)}%`} />
        <Card label="Productivity" value={`${data.productivity}`} hint="units / worker (latest)" />
        <Card label="Idle Workers" value={data.idle_workers} hint="available minus assigned today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Predicted Workers Over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted_workers" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Predicted Labor Cost Over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="predicted_cost" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workforce by Skill Level">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.workers_by_skill}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="skill_level" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cumulative Overtime">
          <div className="flex items-center justify-center h-[260px]">
            <div className="text-center">
              <p className="text-5xl font-semibold text-slate-900">{data.overtime_total}</p>
              <p className="text-sm text-slate-500 mt-2">total overtime hours logged across plans</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-sm text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      <AnalyticsInner />
    </RequireAuth>
  );
}
