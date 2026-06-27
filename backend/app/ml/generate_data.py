"""Generate a synthetic manufacturing dataset for training the workforce predictor.

Run once: python -m app.ml.generate_data
"""
from __future__ import annotations

import csv
import random
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "data" / "manufacturing.csv"
N_ROWS = 1000
SEED = 42


def synth_row(rng: random.Random) -> dict:
    production_target = rng.randint(400, 1600)
    orders = max(1, int(production_target / rng.uniform(55, 75)))
    machines = max(2, min(12, round(production_target / 150 + rng.uniform(-1, 1))))
    available_workers = rng.randint(15, 35)
    average_skill = round(rng.uniform(2.0, 5.0), 1)
    overtime = max(0, int(rng.gauss(production_target / 350, 1.2)))

    base = production_target / 65.0
    skill_factor = 1.0 + (4.0 - average_skill) * 0.05
    machine_factor = 1.0 - min(0.15, machines * 0.012)
    overtime_relief = overtime * 0.3
    noise = rng.gauss(0, 1.0)

    actual = base * skill_factor * machine_factor - overtime_relief + noise
    actual_workers = int(max(4, min(available_workers, round(actual))))

    return {
        "Production_Target": production_target,
        "Orders": orders,
        "Machines": machines,
        "Available_Workers": available_workers,
        "Average_Skill": average_skill,
        "Overtime": overtime,
        "Actual_Workers": actual_workers,
    }


def main() -> None:
    rng = random.Random(SEED)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    rows = [synth_row(rng) for _ in range(N_ROWS)]
    with OUT.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
