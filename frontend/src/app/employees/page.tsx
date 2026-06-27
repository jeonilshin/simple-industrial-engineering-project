"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { api, type Employee, type EmployeeInput } from "@/lib/api";

const EMPTY: EmployeeInput = {
  name: "",
  skill_level: 3,
  hourly_rate: 80,
  available: true,
  preferred_shift: "morning",
  max_hours: 8,
};

export default function EmployeesPage() {
  return (
    <RequireAuth>
      <EmployeesInner />
    </RequireAuth>
  );
}

function EmployeesInner() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draft, setDraft] = useState<EmployeeInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => api.listEmployees().then(setEmployees).catch((e) => setError(e.message));
  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    try {
      await api.createEmployee(draft);
      setDraft(EMPTY);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDelete(id: number) {
    await api.deleteEmployee(id);
    refresh();
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">Employees</h2>
        <p className="text-sm text-slate-500">Add workers and their skill profile.</p>
      </header>

      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-6 gap-3"
      >
        <input
          className="border rounded px-3 py-2 col-span-2"
          placeholder="Name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <input
          type="number"
          min={1}
          max={5}
          className="border rounded px-3 py-2"
          placeholder="Skill 1-5"
          value={draft.skill_level}
          onChange={(e) => setDraft({ ...draft, skill_level: Number(e.target.value) })}
        />
        <input
          type="number"
          step="0.5"
          className="border rounded px-3 py-2"
          placeholder="Hourly rate"
          value={draft.hourly_rate}
          onChange={(e) => setDraft({ ...draft, hourly_rate: Number(e.target.value) })}
        />
        <select
          className="border rounded px-3 py-2"
          value={draft.preferred_shift}
          onChange={(e) =>
            setDraft({
              ...draft,
              preferred_shift: e.target.value as EmployeeInput["preferred_shift"],
            })
          }
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="night">Night</option>
        </select>
        <button className="bg-brand-600 text-white rounded px-4 py-2 hover:bg-brand-700">
          Add
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Skill</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Shift</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{e.name}</td>
                <td className="px-4 py-2">{e.skill_level}</td>
                <td className="px-4 py-2">₱{e.hourly_rate}</td>
                <td className="px-4 py-2 capitalize">{e.preferred_shift}</td>
                <td className="px-4 py-2">{e.available ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => onDelete(e.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No employees yet — add one above or run the seed script.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
