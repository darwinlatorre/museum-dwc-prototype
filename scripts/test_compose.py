#!/usr/bin/env python3
"""Contratos Compose, empaquetado y CLI aislados, sin leer dotenv reales."""
import json
import os
import http.client
import re
import time
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ComposeTests(unittest.TestCase):
    def model(self, values, overlays=(), profiles=(), base="compose.yml"):
        with tempfile.TemporaryDirectory(prefix="museum-compose-") as directory:
            scratch = Path(directory)
            fixture = scratch / "fixture.env"
            fixture.write_text(values)
            # Copiar solo manifiestos conocidos: ningún dotenv real se abre.
            for name in ("compose.yml", "compose.dev.yml"):
                shutil.copyfile(ROOT / name, scratch / name)
            (scratch / ".env").write_text(values + "ENV_SOURCE=production\n")
            (scratch / ".env.dev").write_text(values + "ENV_SOURCE=development\n")
            env = {"PATH": os.environ["PATH"], "HOME": directory}
            args = ["docker", "compose", "--project-directory", directory,
                    "--env-file", str(fixture), "-f", str(scratch / base)]
            for overlay in overlays:
                args += ["-f", str(scratch / overlay)]
            for profile in profiles:
                args += ["--profile", profile]
            return subprocess.run(args + ["config", "--format", "json"],
                                  env=env, capture_output=True, text=True)

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
                for service, published, target in (("museum-db", db_port, 5432), ("backend", server_port, 8080), ("frontend", 8081, 80)):
                    self.assertEqual(services[service]["ports"], [{"mode": "ingress", "host_ip": "127.0.0.1", "target": target, "published": str(published), "protocol": "tcp"}])
                    self.assertIn("healthcheck", services[service])
                backend = services["backend"]
                # config serializa $ como $$ para que el modelo pueda reutilizarse
                # sin interpolar el valor literal; no es una transformación propia.
                self.assertEqual(backend["environment"], {"DB_HOST": "museum-db", "DB_PORT": "5432", "DB_NAME": "fixture", "DB_USER": "fixture_user", "DB_PASSWORD": "literal $$ value", "SERVER_ADDRESS": "0.0.0.0", "SERVER_PORT": "8080", "CORS_ALLOWED_ORIGINS": None})
                self.assertEqual(services["museum-db"]["environment"]["POSTGRES_PASSWORD"], "literal $$ value")
                self.assertEqual(backend["depends_on"]["museum-db"]["condition"], "service_healthy")
                self.assertEqual(services["frontend"]["depends_on"]["backend"]["condition"], "service_healthy")
                self.assertEqual(services["museum-db"]["volumes"][0]["source"], "museum_mvp_data")

    def test_development_mounts_ports_and_storage_are_isolated(self):
        result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\nFRONTEND_PORT=14200\n",
                            base="compose.dev.yml")
        self.assertEqual((result.returncode, result.stderr), (0, ""))
        model = json.loads(result.stdout)
        self.assertEqual(model["name"], "universidad-dev")
        services = model["services"]
        for name in ("backend", "frontend"):
            self.assertEqual(services[name]["build"]["target"], "development")
            mounts = services[name]["volumes"]
            self.assertTrue(any(m["type"] == "bind" and m["target"] == "/app/src" for m in mounts))
            self.assertFalse(any(m["type"] == "bind" and m["target"] == "/app" for m in mounts))
        self.assertEqual(services["frontend"]["ports"][0]["target"], 4200)
        self.assertEqual(services["frontend"]["ports"][0]["published"], "14200")
        self.assertEqual(services["museum-db"]["volumes"][0]["source"], "museum_dev_data")
        self.assertNotEqual(model["volumes"]["museum_dev_data"]["name"], "universidad_museum_mvp_data")
        frontend = services["frontend"]
        self.assertEqual(frontend["command"], ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--poll", "1000"])
        self.assertTrue(all(m["read_only"] for m in frontend["volumes"]))

    def test_traefik_routes_only_to_frontend_in_both_modes(self):
        for dev, port in ((False, "80"), (True, "4200")):
            result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n",
                                (), ("local-traefik",),
                                base="compose.dev.yml" if dev else "compose.yml")
            self.assertEqual((result.returncode, result.stderr), (0, ""))
            model = json.loads(result.stdout)
            services = model["services"]
            labels = services["frontend"]["labels"]
            self.assertEqual(labels["traefik.enable"], "true")
            self.assertEqual(labels["traefik.http.services.museum.loadbalancer.server.port"], port)
            self.assertEqual(labels["traefik.http.routers.museum.rule"], "Host(`localhost`)")
            self.assertEqual(labels["traefik.http.routers.museum.service"], "museum")
            self.assertEqual(labels["traefik.http.routers.museum.entrypoints"], "websecure")
            self.assertNotIn("proxy", services["backend"]["networks"])
            self.assertNotIn("proxy", services["museum-db"]["networks"])
            self.assertTrue(model["networks"]["proxy"]["external"])
            self.assertEqual(model["networks"]["proxy"]["name"], "proxy")
            self.assertEqual(labels["traefik.docker.network"], "proxy")
            self.assertIn("--providers.docker.network=proxy", services["traefik"]["command"])
            for name in ("backend", "museum-db"):
                self.assertEqual(set(services[name]["networks"]), {"app"})
            self.assertEqual(set(services["frontend"]["networks"]), {"app", "proxy"})
            self.assertEqual(services["traefik"]["ports"][0]["host_ip"], "127.0.0.1")
            self.assertNotIn("--api.insecure=true", services["traefik"]["command"])

    def test_each_mode_passes_only_explicit_environment_and_uses_app_network(self):
        for base, source in (("compose.yml", "production"), ("compose.dev.yml", "development")):
            result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\nDB_HOST=host-only\nDB_PORT=15432\nSERVER_PORT=18080\nCORS_ALLOWED_ORIGINS=http://localhost:14200,http://127.0.0.1:14200\n", base=base)
            self.assertEqual((result.returncode, result.stderr), (0, ""))
            model = json.loads(result.stdout)
            services = model["services"]
            backend = services["backend"]
            self.assertNotIn("ENV_SOURCE", backend["environment"])
            self.assertNotIn("env_file:", (ROOT / base).read_text())
            self.assertEqual(backend["environment"]["CORS_ALLOWED_ORIGINS"], "http://localhost:14200,http://127.0.0.1:14200")
            for key, value in (("DB_HOST", "museum-db"), ("DB_PORT", "5432"), ("SERVER_PORT", "8080")):
                self.assertEqual(backend["environment"][key], value)
            self.assertEqual(set(services), {"museum-db", "backend", "frontend"})
            self.assertEqual(backend["depends_on"]["museum-db"]["condition"], "service_healthy")
            self.assertEqual(services["frontend"]["depends_on"]["backend"]["condition"], "service_healthy")
            self.assertEqual(model["networks"]["app"]["name"], model["name"] + "_app")
            self.assertFalse(model["networks"]["app"].get("internal", False))
            self.assertEqual(services["museum-db"]["image"], "postgres:17")
            if source == "development":
                self.assertEqual(services["frontend"]["environment"], {"__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": "localhost"})
            else:
                self.assertNotIn("environment", services["frontend"])
            self.assertNotIn("default", model["networks"])
            for name in ("museum-db", "backend"):
                self.assertEqual(set(services[name]["networks"]), {"app"})
            self.assertEqual(set(services["frontend"]["networks"]), {"app", "proxy"})
            if source == "development":
                self.assertNotIn("museum_mvp_data", model["volumes"])

    def test_traefik_host_default_and_override_are_consistent(self):
        for setting, host in (("", "localhost"), ("TRAEFIK_HOST=custom.localhost\n", "custom.localhost")):
            for base in ("compose.yml", "compose.dev.yml"):
                with self.subTest(setting=setting, base=base):
                    result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n" + setting,
                                        (), base=base)
                    self.assertEqual((result.returncode, result.stderr), (0, ""))
                    frontend = json.loads(result.stdout)["services"]["frontend"]
                    self.assertEqual(frontend["labels"]["traefik.http.routers.museum.rule"], f"Host(`{host}`)")
                    if base == "compose.dev.yml":
                        self.assertEqual(frontend["environment"], {"__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": host})
                        self.assertNotIn("--allowed-hosts", frontend["command"])

    def test_development_actual_cli_and_restrictive_hosts(self):
        """CLI/builder instalados; fixture mínima, sin app ni servicios Docker."""
        cli = ROOT / "frontend/node_modules/@angular/cli/bin/ng.js"
        self.assertTrue(cli.exists(), "Requiere dependencias frontend instaladas y Node 24")
        evidence = ROOT / ".browser/httpclient-query-cors/integration-environments-cli"
        evidence.mkdir(parents=True, exist_ok=True)
        for label, setting, allowed in (("default", "", "localhost"),
                                        ("custom", "TRAEFIK_HOST=museum.example.test\n", "museum.example.test"),
                                        ("host", None, "localhost")):
            with self.subTest(mode=label), tempfile.TemporaryDirectory(prefix="cli-environments-") as directory:
                scratch = Path(directory)
                config = json.loads((ROOT / "frontend/angular.json").read_text())
                config["cli"]["cache"] = {"enabled": False}
                build = config["projects"]["frontend"]["architect"]["build"]
                build["options"] = {"browser": "src/main.ts", "tsConfig": "tsconfig.app.json", "index": "src/index.html"}
                (scratch / "angular.json").write_text(json.dumps(config))
                for name in ("tsconfig.json", "tsconfig.app.json", "package.json"):
                    shutil.copyfile(ROOT / "frontend" / name, scratch / name)
                (scratch / "src/environments").mkdir(parents=True)
                for name in ("environment.ts", "environment.development.ts"):
                    shutil.copyfile(ROOT / "frontend/src/environments" / name, scratch / "src/environments" / name)
                (scratch / "node_modules").symlink_to(ROOT / "frontend/node_modules", target_is_directory=True)
                (scratch / "src/main.ts").write_text("document.body.dataset['ready'] = 'cli-host-proof';\n")
                (scratch / "src/index.html").write_text("<!doctype html><html><body>cli-host-proof</body></html>")
                env = {"PATH": os.environ["PATH"], "HOME": directory, "CI": "true", "NG_CLI_ANALYTICS": "false"}
                if setting is None:
                    command = ["npm", "start", "--", "--host", "127.0.0.1", "--port", "0"]
                else:
                    model = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n" + setting, base="compose.dev.yml")
                    self.assertEqual((model.returncode, model.stderr), (0, ""))
                    frontend = json.loads(model.stdout)["services"]["frontend"]
                    command = frontend["command"]
                    command[command.index("--host") + 1] = "127.0.0.1"
                    command[command.index("--port") + 1] = "0"
                    env.update(frontend.get("environment", {}))
                args = command
                outpath = evidence / f"cleanup-cli-{label}-stdout.log"
                errpath = evidence / f"cleanup-cli-{label}-stderr.log"
                observations = []
                with outpath.open("w") as stdout, errpath.open("w") as stderr:
                    process = subprocess.Popen(args, cwd=scratch, env=env, stdout=stdout, stderr=stderr, start_new_session=True)
                    try:
                        deadline = time.monotonic() + 60
                        port = None
                        while time.monotonic() < deadline and process.poll() is None:
                            match = re.search(r"http://(?:localhost|127\.0\.0\.1):(\d+)", outpath.read_text())
                            if match:
                                port = int(match[1])
                                break
                            time.sleep(0.1)  # Poll del estado observable, no espera fija de arranque.
                        self.assertIsNotNone(port, outpath.read_text() + errpath.read_text())
                        for hostname, status in ((allowed, 200), ("localhost", 200), ("untrusted.example.test", 403)):
                            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
                            try:
                                connection.request("GET", "/", headers={"Host": hostname})
                                response = connection.getresponse()
                                body = response.read().decode()
                            finally:
                                connection.close()
                            observations.append({"host": hostname, "status": response.status, "body": body})
                            self.assertEqual(response.status, status, body)
                            self.assertIn("cli-host-proof" if status == 200 else f'This host ("{hostname}") is not allowed', body)
                    finally:
                        # npm crea un hijo Angular: cerrar todo nuestro grupo aislado.
                        try:
                            os.killpg(process.pid, signal.SIGTERM)
                        except ProcessLookupError:
                            pass
                        try:
                            process.wait(timeout=10)
                        except subprocess.TimeoutExpired:
                            os.killpg(process.pid, signal.SIGKILL)
                            process.wait(timeout=5)
                        (evidence / f"cleanup-cli-{label}-result.log").write_text(json.dumps({"argv": args, "environment": {k: v for k, v in env.items() if k == "__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS"}, "exit": process.returncode, "http": observations}, indent=2))

    def test_traefik_network_override_is_preserved(self):
        result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\nTRAEFIK_NETWORK=custom_proxy\n",
                            ())
        self.assertEqual((result.returncode, result.stderr), (0, ""))
        model = json.loads(result.stdout)
        self.assertEqual(model["networks"]["proxy"]["name"], "custom_proxy")
        self.assertEqual(model["services"]["frontend"]["labels"]["traefik.docker.network"], "custom_proxy")

    def test_local_proxy_port_is_fixed_despite_stale_setting(self):
        removed = "LOCAL_" + "TRAEFIK_PORT"
        for base in ("compose.yml", "compose.dev.yml"):
            self.assertNotIn(removed, (ROOT / base).read_text())
        result = self.model(f"DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n{removed}=18000\n",
                            (), ("local-traefik",))
        self.assertEqual((result.returncode, result.stderr), (0, ""))
        self.assertEqual(json.loads(result.stdout)["services"]["traefik"]["ports"], [
            {"mode": "ingress", "host_ip": "127.0.0.1", "target": 80,
             "published": "80", "protocol": "tcp"},
            {"mode": "ingress", "host_ip": "127.0.0.1", "target": 443,
             "published": "443", "protocol": "tcp"}])

    def test_router_names_do_not_depend_on_project_interpolation(self):
        removed = "COMPOSE_" + "PROJECT_NAME"
        for name in ("compose.yml", "compose.dev.yml"):
            self.assertNotIn(removed, (ROOT / name).read_text())
        # El proyecto cambia solo los recursos Compose, no los identificadores Traefik.
        for base in ("compose.yml", "compose.dev.yml"):
            result = self.model(f"DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n{removed}=fixture-project\n",
                                (), base=base)
            self.assertEqual((result.returncode, result.stderr), (0, ""))
            labels = json.loads(result.stdout)["services"]["frontend"]["labels"]
            self.assertEqual(labels["traefik.http.routers.museum.service"], "museum")
            self.assertEqual(set(key for key in labels if key.startswith("traefik.http.services.")),
                             {"traefik.http.services.museum.loadbalancer.server.port"})

    def test_redundant_defaults_are_implicit_without_changing_storage(self):
        manifest = (ROOT / "compose.yml").read_text()
        self.assertNotIn("    name:", manifest.split("\nvolumes:\n", 1)[1])
        self.assertNotIn("target: production", manifest)
        for feature in ("backend", "frontend"):
            stages = [line for line in (ROOT / feature / "Dockerfile").read_text().splitlines()
                      if line.startswith("FROM ")]
            self.assertTrue(stages[-1].endswith(" AS production"))
        result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n",
                            (), ("local-traefik",))
        self.assertEqual((result.returncode, result.stderr), (0, ""))
        model = json.loads(result.stdout)
        self.assertEqual(model["volumes"]["museum_mvp_data"]["name"], "universidad_museum_mvp_data")
        proxy = model["services"]["traefik"]
        self.assertNotIn("traefik.enable", proxy.get("labels", {}))
        self.assertIn("--providers.docker.exposedbydefault=false", proxy["command"])

    def test_tls_resolver_defaults_overrides_and_local_proxy(self):
        for base in ("compose.yml", "compose.dev.yml"):
            for settings, resolver, entrypoint, email in (
                ("", "le", "websecure", "example@email.com"),
                ("TRAEFIK_CERTRESOLVER=custom\nTRAEFIK_ENTRYPOINT=secure\nTRAEFIK_ACME_EMAIL=ops@example.test\n", "custom", "secure", "ops@example.test"),
            ):
                with self.subTest(base=base, resolver=resolver):
                    result = self.model("DB_NAME=fixture\nDB_USER=fixture\nDB_PASSWORD=fixture\n" + settings,
                                        profiles=("local-traefik",), base=base)
                    self.assertEqual((result.returncode, result.stderr), (0, ""))
                    model = json.loads(result.stdout)
                    proxy = model["services"]["traefik"]
                    labels = model["services"]["frontend"]["labels"]
                    self.assertEqual(labels["traefik.http.routers.museum.tls"], "true")
                    self.assertEqual(labels["traefik.http.routers.museum.tls.certresolver"], resolver)
                    self.assertEqual(labels["traefik.http.routers.museum.entrypoints"], entrypoint)
                    self.assertEqual(proxy["image"], "traefik:v3.7")
                    self.assertEqual(proxy["restart"], "unless-stopped")
                    self.assertEqual(proxy["profiles"], ["local-traefik"])
                    self.assertNotIn("container_name", proxy)  # Evitar colisiones entre proyectos.
                    for command in (
                        "--entrypoints.web.address=:80",
                        f"--entrypoints.web.http.redirections.entrypoint.to={entrypoint}",
                        "--entrypoints.web.http.redirections.entrypoint.scheme=https",
                        f"--entrypoints.{entrypoint}.address=:443",
                        f"--certificatesresolvers.{resolver}.acme.email={email}",
                        f"--certificatesresolvers.{resolver}.acme.storage=/letsencrypt/acme.json",
                        f"--certificatesresolvers.{resolver}.acme.httpchallenge.entrypoint=web",
                    ):
                        self.assertIn(command, proxy["command"])
                    self.assertTrue(any(v["source"] == "certificates" and v["target"] == "/letsencrypt"
                                        for v in proxy["volumes"]))
                    self.assertEqual(set(proxy["networks"]), {"proxy"})
                    self.assertNotIn("env_file:", (ROOT / base).read_text())

    def test_required_credentials_missing_or_empty(self):
        for key in ("DB_NAME", "DB_USER", "DB_PASSWORD"):
            for empty in (False, True):
                with self.subTest(key=key, empty=empty):
                    values = "".join(f"{name}=fixture\n" for name in ("DB_NAME", "DB_USER", "DB_PASSWORD") if name != key)
                    for base, dotenv in (("compose.yml", ".env"), ("compose.dev.yml", ".env.dev")):
                        result = self.model(values + (f"{key}=\n" if empty else ""), base=base)
                        self.assertEqual(result.returncode, 1)
                        self.assertEqual(result.stdout, "")
                        self.assertIn(f"Set {key} in {dotenv}", result.stderr)
                        self.assertNotIn("fixture", result.stderr)


class PackagingTests(unittest.TestCase):
    def test_frontend_static_spa_fallback_without_api_proxy_or_runtime_config(self):
        config_path = ROOT / "frontend/nginx.conf"
        self.assertTrue(config_path.is_file(), "Las rutas SPA requieren fallback estático a index.html")
        config = config_path.read_text()
        dockerfile = (ROOT / "frontend/Dockerfile").read_text()
        self.assertIn("COPY nginx.conf /etc/nginx/conf.d/default.conf", dockerfile)
        self.assertRegex(config, r"listen\s+80\s*;")
        self.assertRegex(config, r"root\s+/usr/share/nginx/html\s*;")
        self.assertRegex(config, r"index\s+index\.html\s*;")
        self.assertRegex(config, r"location\s+/\s*\{\s*try_files\s+\$uri\s+\$uri/\s+/index\.html\s*;\s*\}")
        # El fallback solo sirve archivos: no restaura el proxy API retirado
        # ni convierte los environments de compilación en configuración runtime.
        for forbidden in ("proxy_pass", "upstream", "location /api", "envsubst",
                          "API_URL", "BASE_URL", "templates", "docker-entrypoint.d"):
            self.assertNotIn(forbidden, config + dockerfile)
        for name in ("proxy.conf.json", "proxy.docker.conf.json"):
            self.assertFalse((ROOT / "frontend" / name).exists())

    def test_frontend_image_retains_dependency_licenses(self):
        dockerfile = (ROOT / "frontend/Dockerfile").read_text()
        context = (ROOT / "frontend/.dockerignore").read_text().splitlines()
        self.assertIn(
            "COPY --from=build /app/dist/frontend/3rdpartylicenses.txt /usr/share/nginx/html/3rdpartylicenses.txt",
            dockerfile,
        )
        self.assertIn("dist", context)

    def test_multistage_builds_and_compose_owned_health(self):
        for feature in ("backend", "frontend"):
            dockerfile = (ROOT / feature / "Dockerfile").read_text()
            for stage in ("base", "development", "build", "production"):
                self.assertIn(" AS " + stage, dockerfile)
            ignore = (ROOT / feature / ".dockerignore").read_text().splitlines()
            self.assertIn("**/.env", ignore)
            self.assertIn("**/.env.*", ignore)
        self.assertFalse((ROOT / "backend/docker-healthcheck.sh").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
