"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type DashboardSummary } from "@/lib/api";

function DashboardInner() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.summary().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="text-red-600">
        Failed to load dashboard: {error}
        <p className="text-sm text-slate-500 mt-2">
          Make sure the FastAPI backend is running.
        </p>
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">Loading…</p>;

  const pred = data.latest_prediction;

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-500">Workforce demand and capacity at a glance.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Total Employees" value={data.total_employees} />
        <Card label="Available Today" value={data.available_employees} />
        <Card
          label="AI Prediction"
          value={pred ? `${pred.predicted_workers} workers` : "—"}
          hint={pred ? `target ${pred.production_target} units` : "Run a prediction first"}
        />
        <Card
          label="Predicted Labor Cost"
          value={pred ? `₱${pred.predicted_cost.toLocaleString()}` : "—"}
          hint={pred ? `confidence ${(pred.confidence * 100).toFixed(0)}%` : undefined}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
