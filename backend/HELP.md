# Ayuda de ejecución del backend

Para iniciar el módulo y conocer sus contratos, consultar primero [README.md](README.md) y el [README principal](../README.md).

## Referencias oficiales

Los enlaces llevan a documentación externa, que puede estar disponible en el idioma original de cada proyecto.

- [Documentación de Apache Maven](https://maven.apache.org/guides/index.html).
- [Plugin Maven de Spring Boot](https://docs.spring.io/spring-boot/4.1.1/maven-plugin).
- [Creación de una imagen OCI](https://docs.spring.io/spring-boot/4.1.1/maven-plugin/build-image.html).
- [Spring Web](https://docs.spring.io/spring-boot/4.1.1/reference/web/servlet.html).
- [Acceso a datos con Spring Data JPA](https://docs.spring.io/spring-boot/4.1.1/reference/data/sql.html#data.sql.jpa-and-spring-data).
- [Migraciones Flyway](https://docs.spring.io/spring-boot/4.1.1/how-to/data-initialization.html#howto.data-initialization.migration-tool.flyway).
- [Validación](https://docs.spring.io/spring-boot/4.1.1/reference/io/validation.html).

## Guías

- [Crear un servicio REST](https://spring.io/guides/gs/rest-service/).
- [Servir contenido con Spring MVC](https://spring.io/guides/gs/serving-web-content/).
- [Construir servicios REST con Spring](https://spring.io/guides/tutorials/rest/).
- [Acceder a datos con JPA](https://spring.io/guides/gs/accessing-data-jpa/).
- [Validar datos de entrada](https://spring.io/guides/gs/validating-form-input/).

## Herencia del proyecto Maven

El POM puede heredar elementos como `license` y `developers` de su proyecto padre. El proyecto inicial incluye declaraciones vacías para evitar esa herencia accidental. Si se cambia el padre, revisar esas declaraciones y conservar solo los datos de licencia y autoría que correspondan realmente a este proyecto.
