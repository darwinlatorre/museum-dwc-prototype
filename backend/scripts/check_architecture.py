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
        for boundary in ("domain/model", "application/port/in", "application/port/out",
                         "application/service", "infrastructure/adapter/in/web",
                         "infrastructure/adapter/out/database/entity",
                         "infrastructure/adapter/out/database/repository",
                         "infrastructure/adapter/out/database/mapper", "infrastructure/config"):
            if not list((base / boundary).rglob("*.java")):
                errors.append(f"{feature}/{boundary}: missing Java implementation")
        for path in base.glob("*.java"):
            errors.append(f"{path.relative_to(root)}: legacy feature-root class")
        for boundary in ("domain", "application"):
            allowed = ["java.", f"{PACKAGE}.{feature}.domain."]
            if boundary == "application":
                allowed.append(f"{PACKAGE}.{feature}.application.")
            for path in (base / boundary).rglob("*.java"):
                for imported in IMPORT.findall(path.read_text(encoding="utf-8")):
                    if not any(imported.startswith(prefix) for prefix in allowed):
                        errors.append(f"{path.relative_to(root)}: outward dependency {imported}")
        other = "catalog" if feature == "profile" else "profile"
        for path in sorted(base.rglob("*.java")):
            relative = path.relative_to(base)
            location = path.relative_to(root)
            text = path.read_text(encoding="utf-8")
            if relative.parts[0] in ("adapter", "configuration") or relative.parts[:2] == ("application", "usecase"):
                errors.append(f"{location}: legacy layer package")
            if path.stem.endswith("Mapper") and relative.parts[0] != "infrastructure":
                errors.append(f"{location}: mapper outside infrastructure")
            if relative.parts[:2] == ("infrastructure", "config") and "@Configuration" in text and not path.stem.endswith("BeanConfig"):
                errors.append(f"{location}: configuration must end in BeanConfig")
            dto = relative.parts[:5] == ("infrastructure", "adapter", "in", "web", "dto")
            if dto and relative.parts[5] not in ("req", "res"):
                errors.append(f"{location}: DTO must belong to req or res")
            for imported in IMPORT.findall(text):
                if imported.startswith(f"{PACKAGE}.{other}."):
                    errors.append(f"{location}: cross-feature dependency {imported}")
                if dto and imported.startswith(f"{PACKAGE}.") and not any(
                        codec in imported for codec in (".infrastructure.adapter.in.web.dto.",
                                                       ".infrastructure.adapter.json.")):
                    errors.append(f"{location}: DTO dependency {imported}")
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
