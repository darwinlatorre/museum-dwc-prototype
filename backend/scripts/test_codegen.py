"""Guardas de configuración de los generadores, sin iniciar Maven ni descargar dependencias."""
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
NS = {"m": "http://maven.apache.org/POM/4.0.0"}


class CodeGenerationTests(unittest.TestCase):
    def setUp(self):
        self.pom = ET.parse(ROOT / "pom.xml").getroot()

    def plugin(self, name):
        for plugin in self.pom.findall("m:build/m:plugins/m:plugin", NS):
            if plugin.findtext("m:artifactId", namespaces=NS) == name:
                return plugin
        self.fail(f"Plugin ausente: {name}")

    def test_mapstruct_api_has_a_pinned_version(self):
        deps = {item.findtext("m:artifactId", namespaces=NS): item
                for item in self.pom.findall("m:dependencies/m:dependency", NS)}
        self.assertIn("mapstruct", deps)
        self.assertEqual("${mapstruct.version}", deps["mapstruct"].findtext("m:version", namespaces=NS))
        self.assertEqual("1.6.3", self.pom.findtext("m:properties/m:mapstruct.version", namespaces=NS))

    def test_both_compile_paths_share_lombok_mapstruct_and_binding(self):
        compiler = self.plugin("maven-compiler-plugin")
        paths = compiler.findall("m:configuration/m:annotationProcessorPaths/m:path", NS)
        processors = {p.findtext("m:artifactId", namespaces=NS): p for p in paths}
        self.assertEqual({"lombok", "mapstruct-processor", "lombok-mapstruct-binding"}, set(processors))
        self.assertEqual("${mapstruct.version}", processors["mapstruct-processor"].findtext("m:version", namespaces=NS))
        self.assertEqual("0.2.0", processors["lombok-mapstruct-binding"].findtext("m:version", namespaces=NS))
        self.assertEqual([], compiler.findall("m:executions/m:execution/m:configuration/m:annotationProcessorPaths", NS))

    def test_lombok_is_excluded_from_the_executable_jar(self):
        excludes = self.plugin("spring-boot-maven-plugin").findall("m:configuration/m:excludes/m:exclude", NS)
        self.assertIn(("org.projectlombok", "lombok"),
                      [(e.findtext("m:groupId", namespaces=NS), e.findtext("m:artifactId", namespaces=NS)) for e in excludes])


if __name__ == "__main__":
    unittest.main()
