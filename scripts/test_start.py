#!/usr/bin/env python3
"""Contratos aislados: nunca ejecutar start.sh en el checkout ni leer dotenv reales."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HELP = ("Uso: ./start.sh [--help]\n"
        "Valida el .env raíz con Compose, compila Angular y Spring y despliega el MVP local.\n"
        "Requiere Bash, Node.js 24, npm, Java 21 y Docker Compose con --wait.\n"
        "No borra volúmenes; ante un fallo se detiene sin anunciar éxito.\n")
SUCCESS = "MVP disponible en http://localhost:4200 (servicios saludables).\n"


class StartupTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix="museum-start-")
        self.addCleanup(self.scratch.cleanup)
        self.base = Path(self.scratch.name)
        self.root = self.base / "proyecto con espacios ; literal"
        self.root.mkdir()
        self.bin = self.base / "bin"
        self.bin.mkdir()
        self.log = self.base / "commands.jsonl"
        self.log.write_text("")
        for directory in ("backend", "frontend"):
            (self.root / directory).mkdir()
        self.envfile = self.root / ".env"
        self.envfile.write_text("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD='$(touch NEVER_EXECUTE)'\n")
        self.stored = self.root / "stored-data"
        self.stored.write_text("published revision=17; attempts=4\n")
        self.original = {p: p.read_bytes() for p in (self.envfile, self.stored)}
        if (ROOT / "start.sh").exists():
            shutil.copyfile(ROOT / "start.sh", self.root / "start.sh")
        (self.root / "docker-compose.yml").write_text("services: {}\n")
        stub = f'''#!{shutil.which('python3')}
import json, os, pathlib, sys
name = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
with open(os.environ['CALL_LOG'], 'a') as log:
    log.write(json.dumps([name, args, os.getcwd()]) + '\\n')
step = name
if name == 'docker':
    step = 'compose' if args == ['compose', 'version'] else ('config' if 'config' in args else 'up')
elif name == 'npm':
    step = 'ci' if args[0] == 'ci' else 'build'
if os.environ.get('FAIL_STEP') == step:
    print('fallo simulado', file=sys.stderr)
    sys.exit(37)
'''
        for name in ("docker", "npm", "node", "java", "mvn"):
            path = self.bin / name
            path.write_text(stub)
            path.chmod(0o755)
        (self.root / "backend/mvnw").write_text('exec mvn "$@"\n')
        self.env = {"PATH": str(self.bin) + os.pathsep + os.defpath,
                    "HOME": str(self.base), "CALL_LOG": str(self.log)}

    def run_script(self, *args, fail=None):
        if fail:
            self.env["FAIL_STEP"] = fail
        result = subprocess.run(["/bin/bash", str(self.root / "start.sh"), *args],
                                cwd=self.base, env=self.env, capture_output=True, text=True)
        for path, content in self.original.items():
            retained = self.root / "fixture-retained" if path == self.envfile and not path.exists() else path
            self.assertEqual(retained.read_bytes(), content)
        self.assertFalse((self.base / "NEVER_EXECUTE").exists())
        self.assertFalse((self.root / "NEVER_EXECUTE").exists())
        self.assertNotIn("$(touch", result.stdout + result.stderr)
        return result

    def calls(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()]

    def expected(self):
        compose = ["compose", "--project-name", "universidad", "--project-directory", str(self.root),
                   "--env-file", str(self.envfile), "-f", str(self.root / "docker-compose.yml")]
        return [["docker", ["compose", "version"], str(self.base)],
                ["docker", compose + ["config", "--quiet"], str(self.base)],
                ["npm", ["ci", "--no-audit", "--no-fund"], str(self.root / "frontend")],
                ["npm", ["run", "build"], str(self.root / "frontend")],
                ["mvn", ["package", "-DskipTests"], str(self.root / "backend")],
                ["docker", compose + ["up", "--build", "-d", "--wait", "--wait-timeout", "180"], str(self.base)]]

    def test_help_is_passive(self):
        result = self.run_script("--help")
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, HELP, ""))
        self.assertEqual(self.calls(), [])

    def test_unknown_and_extra_arguments(self):
        for args in (("--unknown",), ("--help", "extra"), ("deploy",)):
            with self.subTest(args=args):
                result = self.run_script(*args)
                self.assertEqual((result.returncode, result.stdout, result.stderr),
                                 (2, "", "Error: argumentos no admitidos. Use ./start.sh --help.\n"))
                self.assertEqual(self.calls(), [])

    def test_success_order_root_resolution_and_literal_env(self):
        result = self.run_script()
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, SUCCESS, ""))
        self.assertEqual(self.calls(), self.expected())

    def test_failure_stops_at_each_stage(self):
        for index, step in enumerate(("compose", "config", "ci", "build", "mvn", "up")):
            with self.subTest(step=step):
                self.log.write_text("")
                result = self.run_script(fail=step)
                self.assertEqual((result.returncode, result.stdout, result.stderr),
                                 (37, "", "fallo simulado\n"))
                self.assertEqual(self.calls(), self.expected()[:index + 1])

    def test_missing_env_rejected_before_commands(self):
        self.envfile.rename(self.root / "fixture-retained")
        result = self.run_script()
        self.assertEqual((result.returncode, result.stdout, result.stderr),
                         (1, "", "Error: falta el .env raíz; consulte README.md.\n"))
        self.assertEqual(self.calls(), [])
        self.assertEqual((self.root / "fixture-retained").read_bytes(), self.original[self.envfile])

    def test_missing_tool_rejected_before_commands(self):
        # PATH aislado: solo las herramientas expresamente proporcionadas.
        self.env["PATH"] = str(self.bin)
        for name in ("dirname", "bash"):
            (self.bin / name).symlink_to(shutil.which(name))
        (self.bin / "node").rename(self.bin / "node-retained")
        result = self.run_script()
        self.assertEqual((result.returncode, result.stdout, result.stderr),
                         (1, "", "Error: falta la herramienta node.\n"))
        self.assertEqual(self.calls(), [])


class ComposeTests(unittest.TestCase):
    def model(self, values):
        with tempfile.TemporaryDirectory(prefix="museum-compose-") as directory:
            fixture = Path(directory) / "fixture.env"
            fixture.write_text(values)
            env = {"PATH": os.environ["PATH"], "HOME": directory}
            return subprocess.run(["docker", "compose", "--project-directory", directory,
                                   "--env-file", str(fixture), "-f", str(ROOT / "docker-compose.yml"),
                                   "config", "--format", "json"], env=env, capture_output=True, text=True)

    def test_default_and_override_ports_network_storage_and_credentials(self):
        for overrides, db_port, server_port in (("", 5432, 8080), ("DB_PORT=15432\nSERVER_PORT=18080\n", 15432, 18080)):
            with self.subTest(overrides=overrides):
                result = self.model("DB_NAME=fixture\nDB_USER=fixture_user\nDB_PASSWORD='literal $ value'\n" + overrides)
                self.assertEqual((result.returncode, result.stderr), (0, ""))
                model = json.loads(result.stdout)
                self.assertEqual(model["name"], "universidad")
                self.assertEqual(set(model["services"]), {"museum-db", "backend", "frontend"})
                self.assertEqual(set(model["volumes"]), {"museum_mvp_data"})
                self.assertEqual(model["volumes"]["museum_mvp_data"]["name"], "universidad_museum_mvp_data")
                services = model["services"]
                for service, published, target in (("museum-db", db_port, 5432), ("backend", server_port, 8080), ("frontend", 4200, 80)):
                    self.assertEqual(services[service]["ports"], [{"mode": "ingress", "host_ip": "127.0.0.1", "target": target, "published": str(published), "protocol": "tcp"}])
                    self.assertIn("healthcheck", services[service])
                backend = services["backend"]
                # config serializa $ como $$ para que el modelo pueda reutilizarse
                # sin interpolar el valor literal; no es una transformación propia.
                self.assertEqual(backend["environment"], {"DB_HOST": "museum-db", "DB_PORT": "5432", "DB_NAME": "fixture", "DB_USER": "fixture_user", "DB_PASSWORD": "literal $$ value", "SERVER_ADDRESS": "0.0.0.0", "SERVER_PORT": "8080"})
                self.assertEqual(services["museum-db"]["environment"]["POSTGRES_PASSWORD"], "literal $$ value")
                self.assertEqual(backend["depends_on"]["museum-db"]["condition"], "service_healthy")
                self.assertEqual(services["frontend"]["depends_on"]["backend"]["condition"], "service_healthy")
                self.assertEqual(services["museum-db"]["volumes"][0]["source"], "museum_mvp_data")

    def test_required_credentials_missing_or_empty(self):
        for key in ("DB_NAME", "DB_USER", "DB_PASSWORD"):
            for empty in (False, True):
                with self.subTest(key=key, empty=empty):
                    values = "".join(f"{name}=fixture\n" for name in ("DB_NAME", "DB_USER", "DB_PASSWORD") if name != key)
                    result = self.model(values + (f"{key}=\n" if empty else ""))
                    self.assertEqual(result.returncode, 1)
                    self.assertEqual(result.stdout, "")
                    self.assertIn(f"Set {key} in .env", result.stderr)
                    self.assertNotIn("fixture", result.stderr)


class PackagingTests(unittest.TestCase):
    def test_frontend_image_retains_dependency_licenses(self):
        dockerfile = (ROOT / "frontend/Dockerfile").read_text()
        context = (ROOT / "frontend/.dockerignore").read_text().splitlines()
        self.assertIn(
            "COPY dist/frontend/3rdpartylicenses.txt /usr/share/nginx/html/3rdpartylicenses.txt",
            dockerfile,
        )
        self.assertIn("!dist/frontend/3rdpartylicenses.txt", context)


if __name__ == "__main__":
    unittest.main(verbosity=2)
