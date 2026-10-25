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
            for boundary in ("domain/model", "application/port/in", "application/port/out",
                             "application/service", "infrastructure/adapter/in/web",
                             "infrastructure/adapter/out/database/entity",
                             "infrastructure/adapter/out/database/repository",
                             "infrastructure/adapter/out/database/mapper"):
                self.write(f"{feature}/{boundary}/Example.java", "import java.util.List;\n")
            self.write(f"{feature}/infrastructure/config/ExampleBeanConfig.java",
                       "import org.springframework.context.annotation.Configuration;\n")

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def test_pure_cores_and_framework_adapters_are_allowed(self):
        self.write("profile/infrastructure/adapter/out/database/Example.java",
                   "import org.springframework.transaction.support.TransactionTemplate;\n")
        self.write("profile/application/service/Example.java", f"import {PACKAGE}.profile.domain.model.Profile;\n")
        self.assertEqual([], violations(self.root))

    def test_framework_leak_in_core_is_rejected(self):
        self.write("profile/domain/model/Example.java", "import jakarta.persistence.Entity;\n")
        self.assertEqual(["profile/domain/model/Example.java: outward dependency jakarta.persistence.Entity"], violations(self.root))

    def test_domain_cannot_depend_on_application(self):
        target = f"{PACKAGE}.catalog.application.service.CatalogUseCase"
        self.write("catalog/domain/model/Example.java", f"import {target};\n")
        self.assertEqual([f"catalog/domain/model/Example.java: outward dependency {target}"], violations(self.root))

    def test_feature_adapters_cannot_import_another_feature(self):
        target = f"{PACKAGE}.profile.domain.model.Profile"
        self.write("catalog/infrastructure/adapter/in/web/Example.java", f"import {target};\n")
        self.assertEqual([f"catalog/infrastructure/adapter/in/web/Example.java: cross-feature dependency {target}"], violations(self.root))

    def test_missing_boundary_and_legacy_class_are_rejected(self):
        (self.root / "profile/domain/model/Example.java").unlink()
        self.write("catalog/Legacy.java", "class Legacy {}\n")
        self.assertEqual(["profile/domain/model: missing Java implementation", "catalog/Legacy.java: legacy feature-root class"], violations(self.root))

    def test_legacy_layout_is_rejected(self):
        self.write("profile/adapter/Old.java", "class Old {}\n")
        self.write("catalog/configuration/Old.java", "class Old {}\n")
        self.assertEqual(["profile/adapter/Old.java: legacy layer package",
                          "catalog/configuration/Old.java: legacy layer package"], violations(self.root))

    def test_configuration_uses_bean_config_suffix(self):
        self.write("profile/infrastructure/config/OtherConfiguration.java", "@Configuration class OtherConfiguration {}\n")
        self.assertEqual(["profile/infrastructure/config/OtherConfiguration.java: configuration must end in BeanConfig"], violations(self.root))

    def test_mapper_stays_in_infrastructure(self):
        self.write("profile/application/service/ExampleMapper.java", "class ExampleMapper {}\n")
        self.assertEqual(["profile/application/service/ExampleMapper.java: mapper outside infrastructure"], violations(self.root))

    def test_web_dto_cannot_expose_domain_or_persistence(self):
        target = f"{PACKAGE}.catalog.domain.model.CatalogStatus"
        self.write("catalog/infrastructure/adapter/in/web/dto/res/ExampleResponse.java", f"import {target};\n")
        self.assertEqual(["catalog/infrastructure/adapter/in/web/dto/res/ExampleResponse.java: DTO dependency " + target], violations(self.root))

    def test_web_dto_requires_req_or_res(self):
        self.write("profile/infrastructure/adapter/in/web/dto/Loose.java", "class Loose {}\n")
        self.assertEqual(["profile/infrastructure/adapter/in/web/dto/Loose.java: DTO must belong to req or res"], violations(self.root))


if __name__ == "__main__":
    unittest.main()
