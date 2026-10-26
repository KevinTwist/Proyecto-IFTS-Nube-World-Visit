# 🌍 WorldVisit — Aplicación Web de Exploración Global (Angular + AWS Amplify)

Documentación técnica y guía de despliegue de **WorldVisit**, una aplicación web moderna orientada a la exploración de datos geográficos, demográficos y culturales a nivel mundial, integrada con servicios en la nube de AWS.

---

## 📊 Arquitectura del Sistema

| Capa / Módulo | Servicio / Tecnología | Rol en el Proyecto |
| :--- | :--- | :--- |
| **Frontend** | Angular (TypeScript / Ionic UI) | Interfaz de usuario SPA enfocada en web, ruteo y componentes responsivos. |
| **Autenticación** | AWS Cognito | Gestión segura de usuarios, registro, inicio de sesión y validación de tokens de acceso. |
| **API Externa** | Rest Countries API (v5) | Proveedor externo de datos geográficos y demográficos globales. |
| **Hosting & Despliegue** | AWS Amplify Hosting | Publicación y distribución continua de la aplicación estática web desde GitHub. |

---

## 🏗️ Esquema de Integración

```text
Usuario ➔ AWS Amplify Hosting (Angular Web)
                  │
                  ├──► AWS Cognito (Gestión y Autenticación de Usuarios)
                  │
                  └──► Rest Countries API v5 (Consulta HTTP protegida con API Key y CORS)

1: Acerca de la Aplicación
WorldVisit permite a los usuarios interactuar con un catálogo completo de información internacional. Sus módulos principales abarcan:
Exploración Global: Listado general y filtrado dinámico de países por continentes y regiones.
Fichas Técnicas Detalladas: Visualización estructurada que incluye capitales, regiones, población, idiomas, monedas, dominios (TLD) y zonas horarias.
Gestión de Favoritos y Perfil: Experiencia de usuario personalizada respaldada por autenticación segura.

2: Gestión de Usuarios con AWS Cognito
La aplicación integra AWS Cognito como proveedor de identidad.
¿Por qué lo usamos?: Permite delegar la seguridad de las credenciales de los usuarios en una infraestructura robusta administrada por AWS. Evita la creación de un servidor backend tradicional para contraseñas, garantizando un flujo estándar de autenticación mediante tokens JWT y protegiendo las rutas privadas de la interfaz web.

3: Integración de API Externa y Pruebas en Postman
El sistema consume la Rest Countries API (v5) para la obtención de datos mediante peticiones HTTP asíncronas optimizadas con RxJS (expand, reduce).
🧪 Verificación de la API en Postman
Para validar el funcionamiento del endpoint y el uso correcto de las credenciales antes de integrarlas al código fuente, se configuró Postman de la siguiente manera:
Método: GET
URL del Endpoint: https://api.restcountries.com/countries/v5
Cabeceras de Autorización (Headers):
Authorization ➔ Bearer rc_live_6bbadba02cd4cb9add223cd04854e5a (ejemplo de API KEY).
Respuesta Esperada: Un objeto JSON estructurado con la metadata de paginación y la lista completa de objetos correspondientes a los países autorizados.

4. Despliegue y Hosting en AWS Amplify
El despliegue continuo de la aplicación se gestiona conectando el repositorio oficial de GitHub (KevinTwist/Proyecto-IFTS-Nube-World-Visit) directamente con AWS Amplify Hosting.
Configuración de CORS y Seguridad en la API
Debido a las restricciones de seguridad del proveedor de la API de países, se debieron configurar explícitamente los orígenes autorizados para evitar bloqueos por políticas de CORS tanto en desarrollo local como en producción.