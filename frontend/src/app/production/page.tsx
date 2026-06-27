"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { RequireAuth } from "@/components/RequireAuth";
import {
  api,
  type PredictRequest,
  type PredictResponse,
  type ProductionPlan,
} from "@/lib/api";

const DEFAULTS: PredictRequest = {
  production_target: 1200,
  orders: 20,
  machines: 8,
  available_workers: 28,
  average_skill: 4.0,
  overtime: 3,
};

function ProductionInner() {
  const [form, setForm] = useState<PredictRequest>(DEFAULTS);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = () => api.listPlans().then(setPlans).catch(() => {});
  useEffect(() => {
    refreshPlans();
  }, []);

  async function onPredictAndSave() {
    setLoading(true);
    setError(null);
    try {
      const prediction = await api.predict(form);
      setResult(prediction);
      await api.createPlan({
        plan_date: new Date().toISOString().slice(0, 10),
        production_target: form.production_target,
        expected_orders: form.orders,
        machines_running: form.machines,
        average_skill: form.average_skill,
        overtime: form.overtime,
      });
      refreshPlans();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePlan(id: number) {
    await api.deletePlan(id);
    refreshPlans();
  }

  const num =
    (k: keyof PredictRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: Number(e.target.value) });

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">Production Plan</h2>
        <p className="text-sm text-slate-500">
          Enter tomorrow&apos;s plan, run the AI prediction, save the plan to the database.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Field label="Production Target" value={form.production_target} onChange={num("production_target")} />
        <Field label="Expected Orders" value={form.orders} onChange={num("orders")} />
        <Field label="Machines Running" value={form.machines} onChange={num("machines")} />
        <Field label="Available Workers" value={form.available_workers} onChange={num("available_workers")} />
        <Field label="Average Skill (1-5)" value={form.average_skill} onChange={num("average_skill")} step={0.1} />
        <Field label="Overtime Hours" value={form.overtime} onChange={num("overtime")} />
      </div>

      <button
        onClick={onPredictAndSave}
        disabled={loading}
        className="bg-brand-600 text-white rounded px-5 py-2 hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Predicting…" : "Predict & Save Plan"}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card label="Workers Needed" value={result.predicted_workers} hint={`raw: ${result.raw_prediction}`} />
          <Card label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} hint={`std ±${result.std}`} />
          <Card label="Estimated Cost" value={`₱${result.estimated_cost.toLocaleString()}`} hint="₱80/hr × 8h baseline" />
        </div>
      )}

      <section className="mt-10">
        <h3 className="font-semibold mb-3">Recent Production Plans</h3>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Orders</th>
                <th className="px-4 py-2">Machines</th>
                <th className="px-4 py-2">Overtime</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{p.plan_date}</td>
                  <td className="px-4 py-2">{p.production_target}</td>
                  <td className="px-4 py-2">{p.expected_orders}</td>
                  <td className="px-4 py-2">{p.machines_running}</td>
                  <td className="px-4 py-2">{p.overtime}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onDeletePlan(p.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No plans yet — predict & save above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function ProductionPage() {
  return (
    <RequireAuth>
      <ProductionInner />
    </RequireAuth>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: number;
}) {
  return (
    <label className="text-sm">
      <span className="block text-slate-600 mb-1">{label}</span>
      <input
        type="number"
        step={step ?? 1}
        value={value}
        onChange={onChange}
        className="w-full border rounded px-3 py-2"
      />
    </label>
  );
}
