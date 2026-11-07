# Botón "Copiar errores" en /logs — Spec de Forge

**Proyecto:** Builtek
**Fecha:** 2026-11-04
**Solicitado por:** usuario via Forge

## Objetivo

Permitir al owner del workspace copiar los últimos 20 registros de error al portapapeles desde la página /logs, en texto plano listo para pegar en un chat de debugging.

## Features

1. Un botón "Copiar errores" se muestra en la barra de filtros de LogsPanel, alineado a la derecha (junto al contador de registros existente).
2. Al hacer clic, construye un texto plano con los últimos 20 registros cuyo `action` contenga `_error` o sea exactamente `error`, tomados del array `logs` completo (no del `filtered`).
3. Formato de cada línea:
   `[YYYY-MM-DD HH:MM] ERROR <action> — <user_name> · <detalle_metadata>`
4. Si no hay errores: `Sin errores en los últimos registros — Builtek [YYYY-MM-DD]`
5. Feedback visual: "¡Copiado!" + ícono Check por 2 segundos, luego vuelve al estado normal.

## Criterios de aceptación

- [ ] 1. Botón "Copiar errores" visible en barra de filtros de /logs, siempre visible
- [ ] 2. Al clic, `navigator.clipboard.writeText` recibe el texto plano formateado
- [ ] 3. Solo entradas cuyo `action` coincide con `/_error$|^error$/` — no actividad normal
- [ ] 4. Máximo 20 entradas; solo las más recientes si hay más
- [ ] 5. Fechas en hora local formato `YYYY-MM-DD HH:MM` (con padStart manual)
- [ ] 6. Si no hay errores: mensaje explicativo con fecha del día del clic
- [ ] 7. Feedback "¡Copiado!" dura 2 segundos exactos y regresa al estado original
- [ ] 8. Clic repetido reinicia el timer (no queda "pegado" en ¡Copiado!)
- [ ] 9. `npm run build` sin errores ni warnings TypeScript

## Fuera de alcance

- No modifica filtros existentes ni su lógica
- Opera siempre sobre `logs` completo, no sobre `filtered`
- No agrega dependencias nuevas
- No crea endpoint de API — 100% client-side

## Archivos a modificar

| Archivo | Acción | Cambio |
|---------|--------|--------|
| `src/app/(dashboard)/logs/LogsPanel.tsx` | Modificar | Estado `copied`, función `handleCopyErrors`, botón Copy/Check en barra de filtros. Agregar `Copy` y `Check` a imports lucide-react. |

## Decisiones

- Botón opera sobre `logs` completo, no `filtered` — más útil para debugging real
- Formato fecha manual con `padStart` para garantizar `YYYY-MM-DD HH:MM` en todos los locales
- Acciones futuras `_error` desconocidas: serializar `metadata` como JSON compacto
