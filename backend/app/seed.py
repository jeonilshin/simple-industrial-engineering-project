"""Seed the SQLite DB with a handful of demo employees.

Run: python -m app.seed
"""
from __future__ import annotations

from .database import Base, SessionLocal, engine
from .models import Employee

DEMO = [
    ("Alice Reyes", 5, 110.0, "morning"),
    ("Ben Cruz", 4, 95.0, "afternoon"),
    ("Carla Dela Rosa", 5, 115.0, "night"),
    ("Dan Lim", 3, 80.0, "morning"),
    ("Erika Santos", 4, 90.0, "afternoon"),
    ("Felix Tan", 2, 70.0, "night"),
    ("Gina Bautista", 4, 95.0, "morning"),
    ("Hugo Morales", 3, 78.0, "afternoon"),
    ("Ines Garcia", 5, 120.0, "night"),
    ("Jay Villanueva", 3, 82.0, "morning"),
    ("Karla Aquino", 2, 68.0, "afternoon"),
    ("Leo Mendoza", 4, 100.0, "morning"),
    ("Mika Pascual", 3, 85.0, "night"),
    ("Noel Ramos", 5, 118.0, "afternoon"),
    ("Olivia Castro", 4, 92.0, "morning"),
    ("Paolo Domingo", 3, 80.0, "night"),
    ("Quinn Roxas", 4, 96.0, "afternoon"),
    ("Rico Salazar", 5, 112.0, "morning"),
    ("Sam Torres", 2, 72.0, "night"),
    ("Tina Ubaldo", 4, 94.0, "afternoon"),
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(Employee).count() > 0:
        print("Employees already seeded; skipping.")
        return
    for name, skill, rate, shift in DEMO:
        db.add(
            Employee(
                name=name,
                skill_level=skill,
                hourly_rate=rate,
                preferred_shift=shift,
                available=True,
                max_hours=8,
            )
        )
    db.commit()
    print(f"Seeded {len(DEMO)} employees.")


if __name__ == "__main__":
    main()
