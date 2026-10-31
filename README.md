# 🌍 WorldVisit — Aplicación Web de Exploración Global (Angular + AWS Serverless)

Documentación técnica y guía de integración de **WorldVisit**, una aplicación web moderna orientada a la exploración de datos geográficos, demográficos y culturales a nivel mundial, conectada a una arquitectura *serverless* en la nube de AWS.

---

## 📊 Arquitectura del Sistema

| Capa / Módulo | Servicio / Tecnología | Rol en el Proyecto |
| :--- | :--- | :--- |
| **Frontend** | Angular (TypeScript / Ionic UI) | Interfaz de usuario SPA, ruteo y componentes responsivos alojados en AWS Amplify. |
| **Autenticación** | AWS Cognito | Gestión de usuarios, inicio de sesión y emisión de tokens JWT seguros. |
| **Capa de Control** | API Gateway + AWS Lambda | Endpoints HTTP seguros y lógica de negocio orientada a funciones serverless. |
| **Base de Datos** | Amazon DynamoDB | Persistencia NoSQL escalable para el almacenamiento de favoritos por usuario. |
| **API Externa** | Rest Countries API (v5) | Proveedor externo de datos geográficos y demográficos globales. |

---

## 🏗️ Esquema de Integración y Flujo Serverless

```text
Usuario ➔ AWS Amplify Hosting (Angular SPA)
                  │
                  ├──► AWS Cognito (Autenticación y Generación de Tokens JWT)
                  │
                  ├──► API Gateway + AWS Lambda (Lógica de Backend y Endpoints Protegidos)
                  │         │
                  │         └──► Amazon DynamoDB (Tabla: WorldVisitFavorites)
                  │
                  └──► Rest Countries API v5 (Consulta de datos geográficos)

1: Acerca de la Aplicación:
WorldVisit permite a los usuarios interactuar con un catálogo completo de información internacional. Sus módulos principales abarcan:
Exploración Global: Listado general y filtrado dinámico de países por continentes y regiones.
Fichas Técnicas Detalladas: Visualización estructurada que incluye capitales, regiones, población, idiomas, monedas, dominios (TLD) y zonas horarias.
Gestión de Favoritos y Perfil: Experiencia de usuario personalizada con persistencia en tiempo real respaldada por autenticación segura en la nube.

2: Gestión de Usuarios y Seguridad con AWS Cognito:
La aplicación integra AWS Cognito como proveedor de identidad.
¿Por qué lo usamos?: Permite delegar la seguridad de las credenciales de los usuarios en una infraestructura robusta administrada por AWS. Evita la creación de un servidor backend tradicional para contraseñas, garantizando un flujo estándar de autenticación mediante tokens JWT y protegiendo las rutas privadas de la interfaz web.
Gestión de Sesión: AWS Amplify gestiona de forma transparente la sesión y los tokens en el cliente, los cuales son enviados automáticamente en las cabeceras HTTP para autorizar de forma segura las peticiones hacia el API Gateway.

3: Persistencia en la Nube (API Gateway + Lambda + DynamoDB):
El almacenamiento y la persistencia de los datos del sistema pasaron a un modelo totalmente serverless:
Fuente de Verdad en AWS: Los favoritos de los usuarios se almacenan directamente en la tabla Amazon DynamoDB (WorldVisitFavorites), procesados mediante funciones AWS Lambda expuestas a través de API Gateway.
Eliminación de localStorage: Se removió por completo el uso de almacenamiento local en el navegador y la clave obsoleta worldvisit:favorite-country-ids, garantizando que la información del usuario esté sincronizada en cualquier dispositivo al iniciar sesión.

4: Integración de API Externa y Pruebas en Postman
El sistema consume la Rest Countries API (v5) para la obtención de datos mediante peticiones HTTP asíncronas optimizadas con RxJS (expand, reduce).