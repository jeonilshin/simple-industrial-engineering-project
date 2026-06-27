"""Greedy shift assignment.

For an MVP we skip OR-Tools / PuLP and use a deterministic greedy strategy:
  1. Filter to available employees.
  2. Sort by skill descending.
  3. Distribute across the three shifts, honoring preferred_shift when possible.

Inputs are plain dicts so this works from the API without DB models.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

SHIFTS = ("morning", "afternoon", "night")


def assign_shifts(
    employees: Iterable[dict],
    workers_needed: int,
    hours_per_shift: int = 8,
) -> dict:
    available = [e for e in employees if e.get("available", True)]
    available.sort(key=lambda e: (-e.get("skill_level", 0), e.get("hourly_rate", 0)))

    if workers_needed <= 0 or not available:
        return {"shifts": {s: [] for s in SHIFTS}, "assigned": 0, "shortfall": workers_needed}

    workers_needed = min(workers_needed, len(available))
    base = workers_needed // 3
    remainder = workers_needed % 3
    targets = {
        "morning": base + (1 if remainder > 0 else 0),
        "afternoon": base + (1 if remainder > 1 else 0),
        "night": base,
    }

    shifts: dict[str, list[dict]] = defaultdict(list)
    leftovers: list[dict] = []

    for emp in available[:workers_needed]:
        pref = emp.get("preferred_shift")
        if pref in SHIFTS and len(shifts[pref]) < targets[pref]:
            shifts[pref].append(emp)
        else:
            leftovers.append(emp)

    for emp in leftovers:
        target_shift = min(SHIFTS, key=lambda s: len(shifts[s]) - targets[s])
        shifts[target_shift].append(emp)

    total_cost = sum(
        e.get("hourly_rate", 0) * hours_per_shift
        for shift in shifts.values()
        for e in shift
    )

    return {
        "shifts": {s: shifts[s] for s in SHIFTS},
        "assigned": workers_needed,
        "shortfall": max(0, workers_needed - len(available)),
        "estimated_labor_cost": round(total_cost, 2),
        "hours_per_shift": hours_per_shift,
    }
