# Conector de Braindy App para Claude

Desde cualquier Claude puedes decir «súbelo a Braindy App», «sube el triage», «registra lo que hicimos» o «entrega esta versión» y sucede en la marca que corresponde.

## Dos formas, las mismas herramientas

| | Local | Remoto |
|---|---|---|
| Dónde sirve | Sesiones de Claude Code en el PC de Nicolas | Chat de claude.ai, Cowork, celular y también Code |
| Identidad | Su sesión de Google (`gcloud auth application-default login`) | Inicio de sesión con su cuenta Braindy (OAuth), solo administradores |
| Archivos | Rutas del disco: hasta 200 archivos, 500 MB cada uno | Dentro del mensaje (base64, unos 15 MB por llamada) o enlace https (hasta 25 MB) |
| Código | `server/mcp/index.ts` | `server/src/connector/http.ts` + `oauth.ts`, en el servicio `braindy-api` |

Ambas usan `server/src/connector/tools.ts`, así que cualquier herramienta nueva aparece en las dos. Ninguna lee ni cambia accesos o contraseñas de clientes.

## Herramientas

- `braindy_find_brand`: buscar el id de una marca
- `braindy_app_link`: tarjeta en Mis apps (la misma URL actualiza la tarjeta)
- `braindy_site_changes_sync` / `_import_html` / `_get`: el triage del sitio (Ajustes del sitio)
- `braindy_log_session`: registro interno de trabajo (solo Nicolas)
- `braindy_upload`: archivos a Mis archivos › Uploads
- `braindy_requests` / `braindy_create_request`: ver y crear solicitudes
- `braindy_deliver_version`: entregar una versión al cliente (pasa a Por aprobar y sale el aviso de revisión)

## Conectar el remoto (una vez)

1. claude.ai → Configuración → Conectores → **Agregar conector personalizado**.
2. Nombre: `Braindy App`. URL: `https://braindy-api-283103160183.us-central1.run.app/mcp`
3. Claude abre la página **/conectar** de Braindy App: entras con tu cuenta y das **Permitir**.

Desde ahí queda en el chat, en Cowork y en el celular. El permiso dura una hora y se renueva solo; si pasan 30 días sin usarlo, se vuelve a pedir.

Para desconectar todos los Claude a la vez: `POST /v1/connector/revoke` (admin). Todavía no tiene botón en la app.

## Local (ya instalado)

```bash
claude mcp add --scope user braindy-app -- node C:/Users/Mark/braindy-app/node_modules/tsx/dist/cli.mjs C:/Users/Mark/braindy-app/server/mcp/index.ts
```
