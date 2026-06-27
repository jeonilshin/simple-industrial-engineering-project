const BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "aws_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (res.status === 401) {
    setToken(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Role = "admin" | "manager";

export type Employee = {
  id: number;
  name: string;
  skill_level: number;
  hourly_rate: number;
  available: boolean;
  preferred_shift: "morning" | "afternoon" | "night";
  max_hours: number;
};
export type EmployeeInput = Omit<Employee, "id">;

export type PredictRequest = {
  production_target: number;
  orders: number;
  machines: number;
  available_workers: number;
  average_skill: number;
  overtime: number;
};

export type PredictResponse = {
  predicted_workers: number;
  raw_prediction: number;
  confidence: number;
  std: number;
  estimated_cost: number;
};

export type ScheduleResponse = {
  shifts: Record<"morning" | "afternoon" | "night", Employee[]>;
  assigned: number;
  shortfall: number;
  estimated_labor_cost: number;
  hours_per_shift: number;
};

export type DashboardSummary = {
  total_employees: number;
  available_employees: number;
  avg_hourly_rate: number;
  latest_prediction: {
    id: number;
    created_at: string;
    predicted_workers: number;
    predicted_cost: number;
    confidence: number;
    production_target: number;
  } | null;
};

export type ProductionPlanInput = {
  plan_date: string;
  production_target: number;
  expected_orders: number;
  machines_running: number;
  average_skill: number;
  overtime: number;
};
export type ProductionPlan = ProductionPlanInput & { id: number };

export type AnalyticsResponse = {
  trend: Array<{
    date: string;
    predicted_workers: number;
    predicted_cost: number;
    confidence: number;
    production_target: number;
  }>;
  total_predicted_cost: number;
  avg_confidence: number;
  overtime_total: number;
  productivity: number;
  idle_workers: number;
  workers_by_skill: Array<{ skill_level: number; count: number }>;
};

export type ScheduleRow = {
  id: number;
  employee_id: number;
  employee_name: string;
  schedule_date: string;
  shift: string;
  hours: number;
};

export const api = {
  async login(username: string, password: string): Promise<{ token: string; role: Role; username: string }> {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error("Wrong username or password");
    const data = await res.json();
    return { token: data.access_token, role: data.role, username: data.username };
  },
  me: () => request<{ username: string; role: Role }>("/auth/me"),

  listEmployees: () => request<Employee[]>("/employees"),
  createEmployee: (e: EmployeeInput) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(e) }),
  deleteEmployee: (id: number) =>
    request<void>(`/employees/${id}`, { method: "DELETE" }),

  predict: (p: PredictRequest) =>
    request<PredictResponse>("/predict", { method: "POST", body: JSON.stringify(p) }),

  schedule: (workers_needed: number, hours_per_shift = 8) =>
    request<ScheduleResponse>("/schedule", {
      method: "POST",
      body: JSON.stringify({ workers_needed, hours_per_shift }),
    }),
  scheduleHistory: (onDate?: string) =>
    request<ScheduleRow[]>(`/schedule/history${onDate ? `?on_date=${onDate}` : ""}`),

  listPlans: () => request<ProductionPlan[]>("/production"),
  createPlan: (p: ProductionPlanInput) =>
    request<ProductionPlan>("/production", { method: "POST", body: JSON.stringify(p) }),
  deletePlan: (id: number) =>
    request<void>(`/production/${id}`, { method: "DELETE" }),

  summary: () => request<DashboardSummary>("/dashboard/summary"),
  analytics: () => request<AnalyticsResponse>("/analytics"),

  exportUrl(path: "predictions.xlsx" | "schedule.pdf") {
    return `${BASE}/exports/${path}`;
  },
  async downloadExport(path: "predictions.xlsx" | "schedule.pdf") {
    const token = getToken();
    const res = await fetch(`${BASE}/exports/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
