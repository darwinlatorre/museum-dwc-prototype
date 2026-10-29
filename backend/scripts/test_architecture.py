"""Regression tests for generic feature boundaries; no application dependencies."""
import tempfile
import unittest
from pathlib import Path
from check_architecture import PACKAGE, violations

BOUNDARIES = ('domain/model', 'application/port/in', 'application/port/out',
              'application/service', 'infrastructure/adapter/in/web',
              'infrastructure/adapter/out/database/entity',
              'infrastructure/adapter/out/database/repository',
              'infrastructure/adapter/out/database/mapper', 'infrastructure/config')

class ArchitectureTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        for feature in ('recordsources', 'catalog'):
            self.feature(feature)

    def feature(self, feature):
        for boundary in BOUNDARIES:
            name = 'ExampleBeanConfig' if boundary.endswith('config') else 'Example'
            self.write(f'{feature}/{boundary}/{name}.java', 'import java.util.List;\n')

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if not text.startswith('package '):
            package = '.'.join(path.relative_to(self.root).parent.parts)
            text = f'package {PACKAGE}.{package};\n' + text
        path.write_text(text)

    def test_required_record_sources_boundaries_cannot_be_replaced_by_catalog(self):
        with tempfile.TemporaryDirectory() as scratch:
            errors = violations(Path(scratch))
        for boundary in BOUNDARIES:
            self.assertIn(f'recordsources/{boundary}: missing Java implementation', errors)
        self.assertFalse(any(error.startswith('validationconfiguration/') for error in errors))

    def test_package_declaration_must_match_feature_directory(self):
        path = 'recordsources/infrastructure/adapter/in/web/Example.java'
        self.write(path, f'package {PACKAGE}.validationconfiguration.infrastructure.adapter.in.web;\n')
        self.assertEqual([f'{path}: package must be {PACKAGE}.recordsources.infrastructure.adapter.in.web'],
                         violations(self.root))

    def test_retired_namespace_import_is_rejected_even_in_shared_handler(self):
        path = 'shared/infrastructure/adapter/in/web/exception/Example.java'
        target = f'{PACKAGE}.validationconfiguration.domain.exception.ConfigurationConflictException'
        self.write(path, f'import {target};\n')
        self.assertEqual([f'{path}: retired namespace dependency {target}'], violations(self.root))

    def test_retired_namespace_cannot_return_as_a_feature(self):
        self.feature('validationconfiguration')
        self.assertIn('validationconfiguration: retired feature namespace', violations(self.root))

    def test_empty_retired_directories_are_not_active_features(self):
        (self.root / 'profile/domain').mkdir(parents=True)
        self.assertEqual([], violations(self.root))

    def test_pure_cores_and_framework_adapters_are_allowed(self):
        self.write('recordsources/infrastructure/adapter/out/database/Example.java',
                   'import org.springframework.transaction.support.TransactionTemplate;\n')
        self.write('recordsources/application/service/Example.java',
                   f'import {PACKAGE}.recordsources.domain.model.ValidationConfiguration;\n')
        self.assertEqual([], violations(self.root))

    def test_source_only_generators_are_allowed(self):
        self.write('recordsources/domain/model/Example.java', 'import lombok.Builder;\n')
        self.write('catalog/application/service/Example.java', 'import lombok.RequiredArgsConstructor;\n')
        self.assertEqual([], violations(self.root))

    def test_runtime_lombok_and_framework_imports_are_rejected(self):
        for target in ('lombok.SneakyThrows', 'jakarta.persistence.Entity', 'org.springframework.stereotype.Service'):
            path = 'recordsources/domain/model/Example.java'
            self.write(path, f'import {target};\n')
            self.assertEqual([f'{path}: outward dependency {target}'], violations(self.root))

    def test_domain_cannot_depend_on_application(self):
        target = f'{PACKAGE}.catalog.application.service.CatalogUseCase'
        path = 'catalog/domain/model/Example.java'
        self.write(path, f'import {target};\n')
        self.assertEqual([f'{path}: outward dependency {target}'], violations(self.root))

    def test_any_feature_cannot_import_another_feature(self):
        self.feature('thirdfeature')
        target = f'{PACKAGE}.recordsources.domain.model.ValidationConfiguration'
        path = 'thirdfeature/infrastructure/adapter/in/web/Example.java'
        self.write(path, f'import {target};\n')
        self.assertEqual([f'{path}: cross-feature dependency {target}'], violations(self.root))

    def test_missing_boundary_and_legacy_class_are_rejected(self):
        # Use a fresh incomplete feature rather than deleting fixture files.
        self.write('thirdfeature/Legacy.java', 'class Legacy {}')
        self.write('thirdfeature/domain/Marker.java', 'class Marker {}')
        errors = violations(self.root)
        self.assertIn('thirdfeature/domain/model: missing Java implementation', errors)
        self.assertIn('thirdfeature/Legacy.java: legacy feature-root class', errors)

    def test_legacy_layout_is_rejected(self):
        self.write('catalog/adapter/Old.java', 'class Old {}')
        self.write('catalog/configuration/Old.java', 'class Old {}')
        self.assertEqual(['catalog/adapter/Old.java: legacy layer package',
                          'catalog/configuration/Old.java: legacy layer package'], violations(self.root))

    def test_configuration_uses_bean_config_suffix(self):
        path = 'catalog/infrastructure/config/OtherConfiguration.java'
        self.write(path, '@Configuration class OtherConfiguration {}')
        self.assertEqual([f'{path}: configuration must end in BeanConfig'], violations(self.root))

    def test_mapper_stays_in_infrastructure(self):
        path = 'catalog/application/service/ExampleMapper.java'
        self.write(path, 'class ExampleMapper {}')
        self.assertEqual([f'{path}: mapper outside infrastructure'], violations(self.root))

    def test_web_dto_cannot_expose_domain_or_persistence(self):
        path = 'catalog/infrastructure/adapter/in/web/dto/res/ExampleResponse.java'
        target = f'{PACKAGE}.catalog.domain.model.CatalogStatus'
        self.write(path, f'import {target};\n')
        self.assertEqual([f'{path}: DTO dependency {target}'], violations(self.root))

    def test_web_dto_requires_req_or_res(self):
        path = 'catalog/infrastructure/adapter/in/web/dto/Loose.java'
        self.write(path, 'class Loose {}')
        self.assertEqual([f'{path}: DTO must belong to req or res'], violations(self.root))

if __name__ == '__main__':
    unittest.main()
