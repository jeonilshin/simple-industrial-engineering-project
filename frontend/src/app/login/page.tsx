"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white shadow-sm rounded-xl border border-slate-200 p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">AI Workforce</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Sign in to access the dashboard.
        </p>

        <label className="text-sm block mb-3">
          <span className="block text-slate-600 mb-1">Username</span>
          <input
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="text-sm block mb-5">
          <span className="block text-slate-600 mb-1">Password</span>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white rounded px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Default accounts: <code>admin / admin123</code> ·{" "}
          <code>manager / manager123</code>
        </p>
      </form>
    </div>
  );
}
