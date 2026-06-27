"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type ScheduleResponse } from "@/lib/api";

const SHIFTS: Array<keyof ScheduleResponse["shifts"]> = ["morning", "afternoon", "night"];

function ScheduleInner() {
  const [workers, setWorkers] = useState(18);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      setData(await api.schedule(workers));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onExportPdf() {
    setExporting(true);
    try {
      await api.downloadExport("schedule.pdf");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">Generate Schedule</h2>
        <p className="text-sm text-slate-500">
          Distribute workers across shifts. Saves to the database and can be exported as PDF.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-end gap-3 mb-6">
        <label className="text-sm">
          <span className="block text-slate-600 mb-1">Workers Needed</span>
          <input
            type="number"
            min={1}
            value={workers}
            onChange={(e) => setWorkers(Number(e.target.value))}
            className="border rounded px-3 py-2 w-40"
          />
        </label>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="bg-brand-600 text-white rounded px-5 py-2 hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Schedule"}
        </button>
        <button
          onClick={onExportPdf}
          disabled={exporting}
          className="border border-slate-300 rounded px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export PDF"}
        </button>
        {data && (
          <div className="ml-auto text-sm text-slate-600">
            Assigned <b>{data.assigned}</b> · Cost{" "}
            <b>₱{data.estimated_labor_cost.toLocaleString()}</b>
            {data.shortfall > 0 && (
              <span className="ml-3 text-amber-600">Shortfall: {data.shortfall}</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHIFTS.map((s) => (
            <div key={s} className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold capitalize mb-3">
                {s}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({data.shifts[s].length})
                </span>
              </h3>
              <ul className="space-y-2">
                {data.shifts[s].map((e) => (
                  <li
                    key={e.id}
                    className="flex justify-between text-sm border-b border-slate-100 pb-1"
                  >
                    <span>{e.name}</span>
                    <span className="text-slate-500">★ {e.skill_level}</span>
                  </li>
                ))}
                {data.shifts[s].length === 0 && (
                  <li className="text-xs text-slate-400">Empty</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <RequireAuth>
      <ScheduleInner />
    </RequireAuth>
  );
}
