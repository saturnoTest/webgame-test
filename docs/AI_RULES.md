# AI Rules

Estas reglas son permanentes y deben cumplirse en cualquier cambio futuro del repo.

## Reglas de trabajo (obligatorias)
1) Branching
   - Todo cambio se hace en una branch nueva con formato:
     `agent/(feat|fix|adj|upd)-<componente-o-modulo>`.
   - Nunca hacer commits directo a `main`.
2) Tamaño de cambios
   - Si una tarea implica varias cosas, subdividir en subpasos.
   - Ideal: 1 PR = 1 feature o 1 fix específico.
   - Commits pequeños y descriptivos (conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`).
3) Calidad
   - TypeScript en modo estricto.
   - No introducir dependencias nuevas sin justificar en el PR.
   - No dejar comentarios en el código salvo que:
     a) sea una regla de negocio no obvia, o
     b) exista una razón técnica importante (workaround, edge case).
4) Estructura y estilo
   - Priorizar módulos pequeños.
   - Separar lógica de juego (escenas/sistemas) de UI.
   - Mantener assets en `/assets` (no mezclar con código).
5) Salida esperada
   - Siempre entregar PR con: resumen, lista de archivos tocados, checklist de pruebas manuales.
6) Validación
   - Antes de terminar, correr los scripts disponibles (build/lint/test).
   - Si no se pueden ejecutar en el entorno, indicarlo y dar pasos manuales.

## Cómo pedir trabajo a Codex
Usa este mini-formato de prompt recomendado:
- objetivo
- criterios de aceptación
- scope/archivos
- validación
- salida (PR + checklist)
