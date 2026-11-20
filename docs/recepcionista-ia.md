# Recepcionista IA (servicio de Braindy)

Un agente de voz de ElevenLabs por marca. Contesta el teléfono (y luego WhatsApp y SMS), toma reservas, cambios, cancelaciones, avisos y pedidos de eventos, y responde preguntas con lo que dice el sitio. Piloto: Puerta del Sol (20 nov 2026), que reemplaza a Dapta (US$99/mes).

## Cómo funciona
```
Llamada → ElevenLabs (agente de la marca)
  ├─ herramientas (reservar, cambiar, cancelar, avisar, evento)
  │    → braindy-api POST /webhooks/voice/tool/:action   (cabecera x-voice-key)
  │        ├─ guarda la acción en brands/{brandId}/calls/{conversationId}
  │        └─ reenvía firmada al formulario del sitio del cliente (voiceAgents/{agentId}.forwardUrl)
  │             Puerta del Sol: /api/form → Firestore `envios` + los mismos correos de Resend
  └─ al colgar: webhook post-call → braindy-api POST /webhooks/voice/post-call (firma ElevenLabs-Signature)
       → resumen, duración, número, transcripción y datos en brands/{brandId}/calls/{conversationId}
App: GET /v1/brands/:brandId/calls y /calls/:callId (miembros de la marca)
```

- **Código:** `server/src/voice/` (`config.ts`, `tools.ts`, `history.ts`).
- **Scripts:** `voice-agent-register.ts` registra un agente, `voice-site-key.ts` saca la clave de un sitio y `voice-import-dapta.ts` importa el historial de Dapta.
- **Firestore (braindy-app):**
  - `voiceAgents/{agentId}` = `{brandId, forwardUrl, active}`.
  - `brands/{brandId}.voiceAgent` = `{agentId, active, channels}`.
  - `brands/{brandId}/calls/*`: llamadas, con `source` igual a `elevenlabs` o `dapta`.

## Secretos (Secret Manager de braindy-brand-guideline; nunca en código, chat ni logs)
| Variable en Cloud Run | Secreto | Qué es |
|---|---|---|
| `VOICE_TOOL_KEY` | `voice-tool-key` | Lo mandan las herramientas de ElevenLabs. El mismo valor vive en el secreto de ElevenLabs `braindy-voice-tool-key`. |
| `ELEVENLABS_WEBHOOK_SECRET` | `elevenlabs-webhook-secret` | Firma del webhook post-call. ElevenLabs lo muestra una vez al crear el webhook. |
| `VOICE_FORWARD_SECRET` | `voice-forward-secret` | Clave maestra. Cada sitio recibe solo su clave derivada, HMAC(maestra, `site:<brandId>`), y por eso la clave de un sitio no sirve para otro. |

Cada sitio verifica la cabecera `x-braindy-signature: t=<unix>,v1=<HMAC(clave del sitio, "t.cuerpo")>`, que vale 5 minutos. Puerta del Sol guarda su clave como `BRAINDY_VOZ_KEY` en el Secret Manager de `puertadelsol-web`.

## Activar un cliente nuevo
1. **Agente:** duplicar el agente plantilla de Puerta del Sol y cambiar prompt, voz, base de conocimiento (`llms-full.txt` del sitio) y zona horaria.
2. **Registro:** `npx tsx server/scripts/voice-agent-register.ts <agentId> <brandId> <https://sitio/api/form>`.
3. **Sitio:**
   - Su función de formulario acepta la firma de Braindy. Copiar `firmaBraindy` y `TIPOS_TELEFONO` de `puertadelsol-web/functions/index.js`.
   - Cargar su clave con `voice-site-key.ts` y `--data-file`. Borrar el archivo después.
4. **Número:** comprar en Twilio, en la subcuenta del cliente, e importarlo en ElevenLabs asignado al agente. El cliente desvía su teléfono a ese número.
5. **WhatsApp y SMS:** cuenta de WhatsApp Business del cliente y registro A2P 10DLC para SMS. Ver los costos en el triage.

## Costos de referencia (nov 2026)
- ElevenLabs: US$0,08/min más el LLM (centavos). Plan Starter US$6/mes; Creator US$22/mes si hay varios clientes.
- Twilio: número US$1,15/mes más US$0,0085/min.
- Puerta del Sol: unas 14 llamadas y 30 min al mes, ≈ US$8–12/mes.
- Precio sugerido al cliente: US$39–59/mes.

## Pendiente
- Pantalla «Recepcionista IA» en la app: activar, ver llamadas y escuchar grabaciones.
- Alta automática de agente y número desde la app.
