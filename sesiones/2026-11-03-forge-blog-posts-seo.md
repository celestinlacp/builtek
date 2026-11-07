---
date: 2026-11-03
project: builtek
tags: [sesion, forge, blog, seo, marketing]
status: completada
---

# Sesión Forge — Blog Posts SEO

## Objetivos de la sesión
- Construir 5 posts de blog SEO pendientes para México/LATAM

## Lo que se hizo
- Spec generado: `docs/forge/specs/2026-11-02-blog-posts-seo.md`
- Branch: `forge/20261102-blog-posts-seo`
- Commits:
  - `a37463c` — content: add 5 SEO blog posts for Mexico/LATAM construction market
  - `ea1ef67` — feat: posthog analytics, kota dashboard, landing page updates, capterra copy (catchup de sesión anterior)
- Tests: build PASS (13.3s, 0 errores TS)
- Deploy: pendiente — merge a master interrumpido por usuario

## Posts creados
1. `control-planos-constructora` — ~700 palabras, Kota mencionado
2. `organizar-documentos-obra` — ~650 palabras
3. `alternativa-neodata-mexico` — ~750 palabras, Kota mencionado
4. `rfi-construccion-mexico` — ~700 palabras
5. `software-tareas-obra-civil` — ~650 palabras

Cada post: 3 FAQs long-tail, metadata SEO completa, HTML con estructura visual del blog, CTA a /demo y /register, footer con © 2026 Builtek · INGENIUM ANALYTICS.

## Decisiones tomadas
- Kota solo en posts 1 y 3 — encaje natural, no forzado
- Tono sobre Neodata: honesto, desde brecha funcional
- Categorías: Guía práctica (1/2/4), Comparativa (3), Análisis (5)
- Reviewer: APROBADO

## Pendientes
- [ ] Merge branch `forge/20261102-blog-posts-seo` a master (`git checkout master && git merge forge/20261102-blog-posts-seo --no-ff`)
- [ ] Deploy a Railway: `npm run ship` desde builtek/

## Notas
Revisión del Reviewer: APROBADO
El commit `ea1ef67` catchupea los cambios de la sesión 2026-11-02 (PostHog, landing, Kota dashboard) que estaban deployados pero sin commitear en git.
Branch listo para merge — el usuario detuvo el merge para cerrar sesión.
