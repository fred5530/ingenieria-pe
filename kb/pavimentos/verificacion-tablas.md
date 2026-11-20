# Verificación de las tablas transcritas contra el texto del manual

Fuente del texto: `MAN_7 SGGP-2014.pdf` del CD de normas del MTC (versión con capa de texto). Se comparan los números de `manual-mtc-2014-tablas.json` con los del bloque de cada cuadro.

| Tabla | Cuadro | Resultado | Valores | Detalle |
|---|---|---|---|---|
| Fd, Fc y ponderado | 6.1 | OK (orden exacto) | 30 |  |
| Factor Fp (16x7) | 6.13 | OK (orden exacto) | 112 |  |
| Rangos Tp0-Tp15 | 6.15 | OK (orden exacto) | 31 |  |
| EE flexible Pref y exponente | 6.3 | OK (orden exacto) | 12 |  |
| EE rigido Pref y exponente | 6.4 | OK (mismo conjunto, orden distinto) | 12 |  |
| No pavimentados | 6.14 | OK (orden exacto) | 7 |  |
| Categorias CBR | 12.4 | OK (orden exacto) | 9 |  |
| MR por CBR (psi) | 12.5 | OK (mismo conjunto, orden distinto) | 50 |  |
| R una etapa | 12.6 | OK (orden exacto) | 16 |  |
| R dos etapas | 12.7 | OK (orden exacto) | 32 |  |
| Zr una etapa | 12.8 | OK (orden exacto) | 16 |  |
| Zr dos etapas | 12.9 | OK (orden exacto) | 16 |  |
| Pi flexible | 12.10 | OK (orden exacto) | 15 |  |
| Pt flexible | 12.11 | OK (orden exacto) | 15 |  |
| dPSI flexible | 12.12 | OK (orden exacto) | 15 |  |
| Coeficientes a_i | 12.13 | OK (orden exacto) | 9 |  |
| Drenaje m | 12.15 | OK (orden exacto) | 35 |  |
| SN requerido (Tp0-Tp14 x 4) | 12.16 | OK (orden exacto) | 60 |  |
| Espesores minimos | 12.17 | OK (orden exacto) | 32 |  |
| Pi/Pt/dPSI rigido | 14.4 | OK (orden exacto) | 45 |  |
| R y Zr rigido | 14.5 | OK (orden exacto) | 32 |  |
| MR y f'c concreto | 14.7 | OK (orden exacto) | 6 |  |
| Cd | 14.9 | OK (orden exacto) | 35 |  |
| J | 14.10 | OK (orden exacto) | 5 |  |

## Catálogos de losa rígida (Figuras 14.6 a 14.9)

Son imágenes en el PDF, así que no se pueden comparar por texto. Se compararon **a mano contra las imágenes** del PDF del CD el 2026-11-20: J = 2.8 (15 rangos Tp x 5 grupos CBR), J = 3.2 (15 x 5), J = 3.8 (5 x 5) y J = 4.0 (5 x 5) coinciden celda por celda. Una celda dudosa (J = 2.8, CBR 10–20 %, Tp11 = 26 cm) se amplió y se confirmó.

**Inconsistencia del manual:** los títulos de las Figuras 14.6 a 14.8 dicen «con pasadores y con bermas de concreto» para J = 2.8, 3.2 y 3.8, mientras el Cuadro 14.10 asigna J = 3.2 a berma granular con pasadores y J = 3.8 a berma de concreto sin pasadores.

## Corrección encontrada

Cuadro 12.17: para Tp1 y Tp2 el manual deja en blanco el espesor de la carpeta en frío y no da carpeta en caliente. El JSON traía 50 y 60 mm, que no figuran en el cuadro; se corrigió a `null` y la calculadora ya no inventa esos espesores.

**24 comprobaciones: 22 con orden exacto, 2 con el mismo conjunto, 0 por revisar.**
