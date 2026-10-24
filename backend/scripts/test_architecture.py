"""Regression tests for the boundary checker itself; no project dependencies."""
import tempfile
import unittest
from pathlib import Path

from check_architecture import PACKAGE, violations


class ArchitectureTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        for feature in ("profile", "catalog"):
            for boundary in ("domain", "application", "adapter", "configuration"):
                self.write(f"{feature}/{boundary}/Example.java", "import java.util.List;\n")

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def test_pure_cores_and_framework_adapters_are_allowed(self):
        self.write("profile/adapter/Example.java", "import org.springframework.transaction.support.TransactionTemplate;\n")
        self.write("profile/application/Example.java", f"import {PACKAGE}.profile.domain.Profile;\n")
        self.assertEqual([], violations(self.root))

    def test_framework_leak_in_core_is_rejected(self):
        self.write("profile/domain/Example.java", "import jakarta.persistence.Entity;\n")
        self.assertEqual(["profile/domain/Example.java: outward dependency jakarta.persistence.Entity"], violations(self.root))

    def test_domain_cannot_depend_on_application(self):
        target = f"{PACKAGE}.catalog.application.CatalogUseCase"
        self.write("catalog/domain/Example.java", f"import {target};\n")
        self.assertEqual([f"catalog/domain/Example.java: outward dependency {target}"], violations(self.root))

    def test_feature_adapters_cannot_import_another_feature(self):
        target = f"{PACKAGE}.profile.domain.Profile"
        self.write("catalog/adapter/Example.java", f"import {target};\n")
        self.assertEqual([f"catalog/adapter/Example.java: cross-feature dependency {target}"], violations(self.root))

    def test_missing_boundary_and_legacy_class_are_rejected(self):
        (self.root / "profile/domain/Example.java").unlink()
        self.write("catalog/Legacy.java", "class Legacy {}\n")
        self.assertEqual(["profile/domain: missing Java implementation", "catalog/Legacy.java: legacy feature-root class"], violations(self.root))


if __name__ == "__main__":
    unittest.main()
