#!/usr/bin/env bash
set -euo pipefail
# timeout limita también la conexión TCP; read limita la espera de la cabecera.
exec timeout 4 bash -c '
    exec 3<>/dev/tcp/127.0.0.1/8080
    printf "GET /api/catalog/status HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n" >&3
    IFS= read -r -t 3 status <&3
    [[ "$status" == "HTTP/1.1 200 "* || "$status" == "HTTP/1.0 200 "* ]]
' >/dev/null 2>&1
