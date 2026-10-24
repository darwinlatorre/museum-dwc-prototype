#!/usr/bin/env python3
"""Check the hexagonal boundaries without dependencies or application startup."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1] / "src/main/java/co/edu/unicauca/backend"
PACKAGE = "co.edu.unicauca.backend"
IMPORT = re.compile(r"^import\s+(?:static\s+)?([\w.]+)", re.MULTILINE)


def violations(root: Path) -> list[str]:
    errors: list[str] = []
    for feature in ("profile", "catalog"):
        base = root / feature
        for boundary in ("domain", "application", "adapter", "configuration"):
            if not list((base / boundary).rglob("*.java")):
                errors.append(f"{feature}/{boundary}: missing Java implementation")
        for path in base.glob("*.java"):
            errors.append(f"{path.relative_to(root)}: legacy feature-root class")
        for boundary in ("domain", "application"):
            allowed = ["java.", f"{PACKAGE}.{feature}.domain.", f"{PACKAGE}.shared.exceptions."]
            if boundary == "application":
                allowed.append(f"{PACKAGE}.{feature}.application.")
            for path in (base / boundary).rglob("*.java"):
                for imported in IMPORT.findall(path.read_text(encoding="utf-8")):
                    if not any(imported.startswith(prefix) for prefix in allowed):
                        errors.append(f"{path.relative_to(root)}: outward dependency {imported}")
        other = "catalog" if feature == "profile" else "profile"
        for path in base.rglob("*.java"):
            for imported in IMPORT.findall(path.read_text(encoding="utf-8")):
                if imported.startswith(f"{PACKAGE}.{other}."):
                    errors.append(f"{path.relative_to(root)}: cross-feature dependency {imported}")
    return errors


def main() -> int:
    errors = violations(ROOT)
    if errors:
        print("Arquitectura hexagonal inválida:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Arquitectura hexagonal correcta: núcleos puros, dependencias hacia adentro y funcionalidades independientes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
