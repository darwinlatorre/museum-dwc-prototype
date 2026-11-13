# Petición: persistencia e importación confirmada de colecciones

Este corte corresponde únicamente al backend. El resumen, la confirmación y la tabla Angular son entregas posteriores; no se afirma que ya existan.

## Petición original relevante

«Cuando le de finalizar este debe pasar al backend en donde se va a realizar la misma comprobacion del front en donde por ejemplo revalida datos, comprueba duplicados y ejecuta la importacion de forma segura.»

«Debemos poder todos los datos de una forma amigable y no muy distinta a un excel, dentro de estas tambien debe permitirse gestionar mas datos, es decir, ingresar, eliminar, actualizar.»

«Tambien para el backend ten en cuenta las recomendaciones de como se esta desarrollando todo, para crear el nuevo servicio.»

## Decisiones de negocio confirmadas

«Colecciones reutilizable, pero tengo entendido de que en el back estos archivos no se van a guardar dentro de un archivo si no que se van a guardar dentro de una tabla dentro de base de datos. La idea tambien es que se puedan importar datos dentro de una coleccion ya creada desde un archivo si es necesario.»

- «Bloquear en la misma colección (recomendado)»: «Rechaza el lote completo si hay duplicados internos o contra esa colección; otras colecciones son independientes.»
- «Sin errores; todo o nada (recomendado)»: «Los errores bloquean; las advertencias se confirman. Si falla una fila, no se guarda ninguna.»
- «Registros con papelera (recomendado)»: «Permite agregar, editar y retirar/restaurar registros; no borrar colecciones completas.»

## Restricciones vigentes

El análisis CSV/XLSX y la normalización permanecen en el navegador; únicamente la confirmación explícita envía registros, no archivos. Se conservan originales textuales y valores efectivos sin coerción. La normalización no se aplica automáticamente. La autoridad de validación es la configuración global vigente y el vocabulario TDWG. Los duplicados locales siguen siendo avisos; la persistencia los bloquea por colección.

Se mantiene el MVP en localhost, sin autenticación añadida ni exposición a Internet. El módulo sigue arquitectura hexagonal por funcionalidad, núcleo Java puro, JPA, MapStruct y composición explícita. La migración es aditiva; no modifica migraciones aplicadas ni elimina datos previos. Se requieren control de revisión, protección frente a escrituras concurrentes, rechazo sin efectos y confirmaciones idempotentes.
