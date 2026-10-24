#!/usr/bin/env bash
set -euo pipefail

if (( $# == 1 )) && [[ $1 == --help ]]; then
    printf '%s\n' \
        'Uso: ./start.sh [--help]' \
        'Valida el .env raíz con Compose, compila Angular y Spring y despliega el MVP local.' \
        'Requiere Bash, Node.js 24, npm, Java 21 y Docker Compose con --wait.' \
        'No borra volúmenes; ante un fallo se detiene sin anunciar éxito.'
    exit 0
fi
if (( $# != 0 )); then
    printf '%s\n' 'Error: argumentos no admitidos. Use ./start.sh --help.' >&2
    exit 2
fi

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if [[ ! -f "$ROOT/.env" ]]; then
    printf '%s\n' 'Error: falta el .env raíz; consulte README.md.' >&2
    exit 1
fi
for tool in node npm java docker bash; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        printf 'Error: falta la herramienta %s.\n' "$tool" >&2
        exit 1
    fi
done

# Compose interpreta dotenv; el shell nunca ejecuta ni exporta su contenido.
compose=(docker compose --project-name universidad --project-directory "$ROOT"
    --env-file "$ROOT/.env" -f "$ROOT/docker-compose.yml")
docker compose version >/dev/null
"${compose[@]}" config --quiet
(
    cd -- "$ROOT/frontend"
    npm ci --no-audit --no-fund
    npm run build
)
(
    cd -- "$ROOT/backend"
    bash ./mvnw package -DskipTests
)
"${compose[@]}" up --build -d --wait --wait-timeout 180
printf '%s\n' 'MVP disponible en http://localhost:4200 (servicios saludables).'
