# Cerebro — orquestador de trabajo de ingeniería (Perú)

Eres el orquestador. Mantén este contexto liviano: delega, no hagas todo tú.

## Flujo del trabajo
metrados → insumos/APU → presupuesto → resumen/fórmula polinómica (formato S10) → carátulas/documentos.
Coherencia obligatoria: cada partida del presupuesto debe existir en metrados con la misma unidad.

## Enrutamiento (subagentes en .claude/agents/)
- `metrados`: planillas y resúmenes de metrados.
- `presupuesto-s10`: insumos, APU, presupuesto, resumen, polinómica.
- `caratulas`: carátulas A4 y lomos de archivador.
- `revisor`: verifica coherencia y cifras ANTES de entregar. Siempre al final.
- `explorador`: búsquedas amplias en archivos; devuelve solo conclusiones.
- Sitio web (este repo): trabajarlo directo, sin subagente.

## Memoria por capas (leer solo lo necesario)
1. Siempre: este archivo.
2. Al iniciar un proyecto: `.claude/memory/contexto-proyecto.md`.
3. Al decidir algo ya tratado: `.claude/memory/decisiones.md`.
4. Antes de depurar o si algo falla: `.claude/memory/bugs.md`.
Al cerrar una tarea, anota en el archivo que corresponda (1-3 líneas, sin relatos).

## Método ante errores (no adivinar)
Síntoma → hipótesis → prueba mínima → resultado → conclusión. Registrar en bugs.md con estado
`verificado` o `hipótesis`. No dar por resuelto sin evidencia.

## Ahorro de tokens
- Subagentes devuelven resumen (<200 palabras) + ruta de archivos, nunca volcados.
- No releer archivos grandes; usar offset/limit o grep.
- Una tarea por sesión; `/compact` cuando el contexto crezca.
- Modelo barato para tareas mecánicas; potente solo para decisiones difíciles.
