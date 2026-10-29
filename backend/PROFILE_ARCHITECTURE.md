# Perfiles retirados

El producto de perfiles ya no tiene código, rutas ni semillas activas. Su sustituto es la [configuración global de fuentes de registros biológicos](RECORD_SOURCES_ARCHITECTURE.md).

V1/V2 se conservan sin modificar para respetar el historial Flyway. V3 agrega la configuración; V4 retira de forma irreversible la tabla histórica `profiles`, su trigger y su función dedicada, por autorización explícita S7. No retira catálogo, configuración ni historial de migraciones. No ejecutar SQL manual ni probar este retiro contra bases vivas.

Las garantías aplicables de revisión, transacción, bootstrap, errores y persistencia se comprueban en `recordsources`; las pruebas del trigger antiguo se sustituyen por cobertura de migración y ausencia de borrado colateral. Ver [contrato actual](README.md).
