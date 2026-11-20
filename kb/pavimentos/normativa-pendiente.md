# Normativa pendiente y diseños por añadir (pavimentos)

Actualizado: 2026-11-20. Los enlaces marcados **[verificado]** salieron de una búsqueda o ya están en `fuentes.json`. Donde no hay enlace directo oficial, se indica **dónde buscar**; no se inventan enlaces. Los números de resolución marcados *(confirmar)* están citados de memoria y deben comprobarse en la fuente.

> **Actualización (CD de normas del MTC, 2026-11-20).** El CD `CD NORMAS DE CARRETERAS` que pegaste en `fuentes-pdf/` contiene 32 PDF oficiales, entre ellos EG-2013, el Manual de Ensayo de Materiales 2016, Hidrología y Drenaje 2011, Mantenimiento 2014-2016, DG-2018, Dispositivos de Control del Tránsito, el Reglamento de Gestión de Infraestructura Vial y el de Jerarquización Vial. Esas filas de la sección 2 **ya no hacen falta**. Siguen pendientes CE.010, GH.020, A.120 vigente, OS.060, E.050 y el Reglamento Nacional de Vehículos con sus pesos por eje. El texto está en `kb/pavimentos/texto/` (no versionado), indexado en `indice-normativa.json`; se busca con `herramientas/buscar.py`.

## 1. Lo que ya está en el PDF cargado (se puede construir sin cargar nada más)

Manual MTC 2014 (RD 10-2014-MTC/14), índice impreso:

| Capítulo (pág. impresa) | Diseño que habilita |
|---|---|
| XI Afirmados (118 a 127) | Plantilla **camino afirmado**: metodología, secciones de capas, materiales |
| XIII Pavimentos semirrígidos (183 a 208) | Plantilla **semirrígido** (carpeta + base tratada) |
| 12.4 Refuerzo de pavimentos flexibles (166 a 182) | Plantilla **refuerzo / rehabilitación** con deflectometría |
| IX Estabilización de suelos (92 a 112) | Soluciones para subrasante CBR < 6 % (cal, cemento, escoria, cloruros, asfálticos, geosintéticos) |
| 10.9 Adoquines (116) | Solo materiales; el diseño del adoquinado no aparece en el índice |
| VIII Drenaje, VII Clima | Insumos de drenaje y temperatura |

**Micropavimento y alternativas de superficie** ya están cargados (Cuadros 12.13 y 12.17): carpeta en frío, micropavimento 25 mm, TSB y lechada asfáltica para Tp1 a Tp4. Falta presentarlos como un comparador de alternativas en la plantilla flexible.

## 2. Normas por cargar, por prioridad

### Prioridad alta (necesarias para veredas y vías urbanas)

| Norma | Para qué | Enlace / dónde buscar |
|---|---|---|
| **CE.010 Pavimentos Urbanos** (RNE) | Pavimentos urbanos y espesores de veredas. No se encontró el PDF en la búsqueda | Portal del Ministerio de Vivienda en gob.pe, sección Reglamento Nacional de Edificaciones. Confirmar edición vigente tras las modificaciones del RNE |
| **GH.020 Componentes de Diseño Urbano** (RNE) | Anchos, pendientes y secciones de veredas | Misma fuente. Una fuente menciona el DS 006-2011 como base *(confirmar)*. Hay proyecto de modificación y no se pudo confirmar el ancho mínimo vigente (1.5 m frente a 1.8 m según opiniones) |
| **A.120 Accesibilidad Universal en Edificaciones** | Rampas, pendientes, pasamanos; cadena de accesibilidad de la vereda | [PDF en gob.pe](https://cdn.www.gob.pe/uploads/document/file/2022869/2.%20Norma%20A.120%20Accesibilidad%20para%20personas%20con%20discapacidad%20y%20las%20personas%20adultas%20mayores.pdf) **[verificado, edición anterior: la vigente es la RM 072-2019-VIVIENDA]** y [Guía gráfica CONADIS](https://www.gob.pe/institucion/conadis/informes-publicaciones/259026-guia-grafica-de-la-norma-tecnica-a-120) **[verificado]** |
| **Instructivo FTE Vías Locales (MEF)** | Criterios de pavimentos urbanos para proyectos de inversión | [Enlace del MEF](https://www.mef.gob.pe/contenidos/inv_publica/docs/ficha_tecnica/vivienda/Instructivo_FTE_Vias_Locales.pdf) (ya en `fuentes.json`; el sitio bloqueó la lectura automática, hay que descargarlo a mano) |
| **Sistematización de diseño de pavimentos urbanos (gob.pe)** | Referencia de diseño urbano | [PDF](https://cdn.www.gob.pe/uploads/document/file/4768980/Sistematizaci%C3%B3n%20de%20informaci%C3%B3n%20sobre%20dise%C3%B1o%2C%20gesti%C3%B3n%2C%20construcci%C3%B3n%20y%20reparaci%C3%B3n%20de%20pavimentos%20urbanos.pdf) (ya en `fuentes.json`; devolvió 403, descargar a mano) |

### Prioridad media (precisión de caminos y calidad)

| Norma | Para qué | Enlace / dónde buscar |
|---|---|---|
| **EG-2013 Especificaciones Técnicas Generales para Construcción** (RD 22-2013-MTC/14) | Especificaciones de afirmado, TSB, micropavimento, mezclas asfálticas y concreto | [Resumen de la aprobación](https://sni.org.pe/aprueban-actualizacion-del-manual-de-carreteras-especificaciones-tecnicas-generales-para-construccion-eg-2013/) **[verificado]**; PDF oficial: ficha del MTC en gob.pe (enlace a Google Drive según el MTC) |
| **Manual de Diseño de Carreteras Pavimentadas de Bajo Volumen de Tránsito** (2008) | Catálogos para caminos de bajo volumen | Copia no oficial en [foro de Autodesk](https://forums.autodesk.com/autodesk/attachments/autodesk/321/22248/2/10.Manual%20Pavimentadas.pdf) **[verificado, no oficial]**; buscar la edición oficial en gob.pe/mtc |
| **Soluciones Básicas en Carreteras No Pavimentadas** | Complemento de afirmados | [PDF en gob.pe](https://cdn.www.gob.pe/uploads/document/file/4980588/Soluciones%20B%C3%A1sicas%20en%20Carreteras%20No%20Pavimentadas.pdf) **[verificado]** |
| **Manual de Ensayo de Materiales** (RD 18-2016-MTC/14) | Método de cada ensayo (CBR, Proctor, etc.) para el cuadro de control de calidad | Buscar en gob.pe/mtc. No hay copia oficial confirmada |
| **Manual de Hidrología, Hidráulica y Drenaje** (2008) | Drenaje de la plataforma | Buscar en gob.pe/mtc |
| **Reglamento Nacional de Vehículos** (DS 058-2003-MTC y DS 006-2014-MTC) | Pesos por eje legales para precargar los vehículos tipo (C2, C3, T3S3...) | Pendiente desde antes; la exposición de motivos del DS 006-2014 ya está en [fuentes](https://cdn.www.gob.pe/uploads/document/file/5443604/343611-exposicion-de-motivos-del-decreto-supremo-n-006-2014-mtc.pdf) |
| **Manual de Carreteras: Mantenimiento o Conservación Vial** *(confirmar RD y año)* | Mantenimiento y rehabilitación | Listado de manuales del MTC: [documento en gob.pe](https://cdn.www.gob.pe/uploads/document/file/5073951/4594406-normas-de-infraestructura-vial-y-transporte-terrestre-dpntra%282%29.pdf) **[verificado]** |
| **Norma OS.060 Drenaje Pluvial Urbano** (RNE) | Drenaje en vías urbanas | Portal del Ministerio de Vivienda |
| **E.050 Suelos y Cimentaciones** (RNE) | Exploración y clasificación de suelos urbanos | Portal del Ministerio de Vivienda |
| **Diseño Geométrico DG-2018** *(confirmar RD)* y **Dispositivos de Control del Tránsito** | Pendientes, anchos, bombeo | Listado del MTC (enlace anterior) |

### Referencias técnicas internacionales (sin enlace verificado)

Úsalas solo si decides ir más allá del manual MTC.

- AASHTO, *Mechanistic-Empirical Pavement Design Guide* (3.ª ed., 2020): diseño mecanicista para tráficos altos.
- PCA, *Thickness Design for Concrete Highway and Street Pavements*: método alternativo para losas y calles.
- ACI 330R (estacionamientos y calles de concreto) y ACI 360R (losas sobre el suelo): juntas, espesores de veredas y losas livianas.
- Asphalt Institute MS-1 (el manual MTC lo cita para el factor de presión) y MS-2 (mezclas).
- Austroads AGPT02 y guías de ICPI para adoquines.
- NTP de INACAL (concreto, cemento, adoquines): confirmar el número de cada una en el catálogo de INACAL antes de citar.

## 3. Diseños por añadir (orden sugerido)

1. **Camino afirmado** (Cap. XI): se puede hacer ya con el PDF.
2. **Pavimento semirrígido** (Cap. XIII): ya con el PDF.
3. **Refuerzo / rehabilitación de flexible** (12.4): ya con el PDF; pide deflectometría.
4. **Comparador de alternativas de superficie** (TSB, lechada, micropavimento, frío, caliente) para Tp1 a Tp4: ya con los datos cargados.
5. **Estabilización de suelos** para CBR < 6 %: ya con el PDF (Cap. IX).
6. **Veredas**: requiere CE.010, GH.020 y A.120. No cargar cifras de memoria: el espesor mínimo, el f'c y los anchos deben salir del texto oficial.
7. **Pavimento urbano** (CE.010) y **adoquines**: requieren CE.010 y la norma de adoquines.
8. **Diseño en dos etapas** del flexible: las tablas ya están en el JSON, falta la plantilla.

## 4. Otras sugerencias

- **Vehículos tipo precargados** (C2, C3, T3S3...) con los pesos máximos del Reglamento Nacional de Vehículos, para no tipear cargas.
- **Importar el conteo vehicular** desde Excel.
- **Metrados y presupuesto del pavimento** (m³ por capa y por tramo) conectados con la skill de APU/presupuesto y S10.
- **Diseño de juntas y pasadores** del pavimento rígido (ACI 330R / PCA).
- **Cuadro de control de calidad por capa** con el método de ensayo MTC E de cada una.
- **Comparador flexible vs rígido** con costo de ciclo de vida.
- **Caso de validación contra software** (AASHTOWare Pavement ME o similar) para respaldar los resultados.
- **Exportar la memoria también en `.tex` y Word**, para que el ingeniero la edite.
- **Vigencia por norma**: mostrar en cada resultado la norma, su versión y la fecha en que se verificó.
- **Pruebas automáticas** (ya hay 25 sobre el motor) también para el generador de la memoria.
