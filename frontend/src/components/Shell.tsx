"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/production", label: "Production" },
  { href: "/schedule", label: "Schedule" },
  { href: "/analytics", label: "Analytics" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-900 text-slate-100 p-6 flex flex-col gap-2">
        <h1 className="text-lg font-semibold mb-4">AI Workforce</h1>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded hover:bg-slate-800 ${
                pathname === l.href ? "bg-slate-800" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-slate-400 space-y-2">
          {user && (
            <div className="rounded bg-slate-800 px-3 py-2">
              <p className="text-slate-200">{user.username}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                {user.role}
              </p>
              <button
                onClick={logout}
                className="mt-2 text-xs text-red-300 hover:text-red-200"
              >
                Sign out
              </button>
            </div>
          )}
          <p>v0.2.0</p>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
