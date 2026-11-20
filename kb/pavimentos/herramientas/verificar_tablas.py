"""Verifica manual-mtc-2014-tablas.json contra el texto del manual SGGP (CD de normas).
Uso (desde la raiz del repo):  python kb/pavimentos/herramientas/verificar_tablas.py
Nivel de cada comprobacion: "orden" = los numeros aparecen en el mismo orden en el bloque del cuadro;
"conjunto" = aparecen todos pero en otro orden (columnas extraidas por separado); "FALTAN" = revisar."""
import json, re, sys, io, collections, os
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TXT = os.path.join(RAIZ, "kb/pavimentos/texto/MAN_7_SGGP_2014.txt")
JSON = os.path.join(RAIZ, "kb/pavimentos/manual-mtc-2014-tablas.json")
D = json.load(open(JSON, encoding="utf-8"))
lineas = open(TXT, encoding="utf-8").read().split("\n")
NUM = re.compile(r"[-−]?\d[\d',]*(?:\.\d+)?")

def nums(txt):
    out = []
    txt = txt.replace("’", "'").replace("‘", "'")
    for m in NUM.finditer(txt):
        s = m.group(0).replace("−", "-").replace("'", "").replace(",", "")
        try: out.append(round(float(s), 6))
        except ValueError: pass
    return out

def bloque(cuadro, largo=230):
    """Lineas desde el titulo exacto 'Cuadro N.N' (ultima aparicion como titulo) hasta 'largo' lineas despues."""
    pat = re.compile(r"^\s*(Cuadro|CUADRO)\s*(N[º°o]\s*)?%s\s*$" % re.escape(cuadro))
    idx = [i for i, l in enumerate(lineas) if pat.match(l)]
    if not idx: return None
    i = idx[-1]
    fin = min(len(lineas), i + largo)
    for j in range(i + 3, fin):                      # cortar en el siguiente titulo de cuadro
        if re.match(r"^\s*(Cuadro|CUADRO)\s*(N[º°o]\s*)?\d+\.\d+\s*$", lineas[j]) : fin = j; break
    return "\n".join(lineas[i:fin])

def es_subsec(esp, tokens):
    it = iter(tokens)
    return all(any(abs(x - t) < 1e-9 for t in it) for x in esp)

def conjunto(esp, tokens):
    cuenta = collections.Counter(tokens); falta = []
    for x in esp:
        if cuenta[x] > 0: cuenta[x] -= 1
        else: falta.append(x)
    return falta

resultados = []
def chequea(nombre, cuadro, esperado, pagina=None, largo=230):
    b = bloque(cuadro, largo)
    if b is None:
        resultados.append((nombre, cuadro, "SIN BLOQUE", "no se encontro el titulo del cuadro", len(esperado))); return
    t = nums(b)
    if es_subsec(esperado, t): nivel, det = "orden", ""
    else:
        f = conjunto(esperado, t)
        nivel, det = ("conjunto", "") if not f else ("FALTAN", "no aparecen: " + ", ".join(str(x) for x in f[:12]))
    resultados.append((nombre, cuadro, nivel, det, len(esperado)))

T, R, F = D["trafico"], D["rigido"], D["flexible"]
Tp = ["Tp%d" % i for i in range(16)]
# ---- trafico
chequea("Fd, Fc y ponderado", "6.1", [x for r in T["cuadro_6_1_factores_direccional_y_carril"]["filas"] for x in (r["Fd"], r["Fc"], r["ponderado"])])
fp = T["cuadro_6_13_Fp"]["filas_mm"]
chequea("Factor Fp (16x7)", "6.13", [v for k in sorted(fp, key=int) for v in fp[k]], largo=300)
ee = T["cuadro_6_15_pavimentados"]["rangos_EE"]
chequea("Rangos Tp0-Tp15", "6.15", [x for r in ee for x in (r["min"], r["max"]) if x is not None])
c63 = T["cuadro_6_3_EE_flexible"]["ejes"]; c64 = T["cuadro_6_4_EE_rigido"]["ejes"]
chequea("EE flexible Pref y exponente", "6.3", [x for v in c63.values() for x in (v["Pref"], v["exp"])])
chequea("EE rigido Pref y exponente", "6.4", [x for v in c64.values() for x in (v["Pref"], v["exp"])])
chequea("No pavimentados", "6.14", [x for r in T["cuadro_6_14_no_pavimentados"]["rangos_EE"] for x in (r["min"], r["max"]) if x])
# ---- flexible
chequea("Categorias CBR", "12.4", [3, 6, 6, 10, 10, 20, 20, 30, 30])
mr = F["cuadro_12_5_MR_por_CBR"]["CBR_a_MR_psi"]
chequea("MR por CBR (psi)", "12.5", [x for k in sorted(mr, key=int) for x in (int(k), mr[k])])
chequea("R una etapa", "12.6", [F["cuadro_12_6_confiabilidad_una_etapa"]["por_Tp"][t] for t in Tp])
e2 = F["cuadro_12_7_confiabilidad_dos_etapas_de_10_anos"]["por_Tp"]
chequea("R dos etapas", "12.7", [x for t in Tp for x in (e2[t]["etapa"], e2[t]["total"])])
chequea("Zr una etapa", "12.8", [F["cuadro_12_8_Zr_una_etapa"]["por_Tp"][t] for t in Tp])
chequea("Zr dos etapas", "12.9", [F["cuadro_12_9_Zr_dos_etapas_de_10_anos"]["por_Tp"][t] for t in Tp])
sv = F["cuadros_12_10_a_12_12_serviciabilidad"]["por_Tp"]; tp1 = ["Tp%d" % i for i in range(1, 16)]
chequea("Pi flexible", "12.10", [sv[t]["Pi"] for t in tp1])
chequea("Pt flexible", "12.11", [sv[t]["Pt"] for t in tp1])
chequea("dPSI flexible", "12.12", [sv[t]["dPSI"] for t in tp1])
co = F["cuadro_12_13_coeficientes_estructurales"]
chequea("Coeficientes a_i", "12.13", [co["capa_superficial"][0]["a"], co["capa_superficial"][1]["a"], co["capa_superficial"][2]["a"], co["base"][0]["a"], co["base"][1]["a"], co["base"][2]["a"], co["base"][3]["a"], co["base"][4]["a"], co["subbase"][0]["a"]])
m = F["cuadros_12_14_y_12_15_drenaje_m"]["m"]
chequea("Drenaje m", "12.15", [float(x) for k in ("Excelente", "Bueno", "Regular", "Pobre", "Muy pobre") for c in m[k] for x in re.findall(r"\d+\.\d+", c)])
sn = F["cuadro_12_16_SN_requerido_20_anos"]["por_Tp"]
chequea("SN requerido (Tp0-Tp14 x 4)", "12.16", [v for t in Tp[:15] for v in sn[t]])
mn = F["cuadro_12_17_espesores_minimos_mm"]["por_Tp"]
chequea("Espesores minimos", "12.17", [mn[t][k] for t in Tp[1:15] for k in ("tsb_o_lechada", "micropavimento", "frio", "caliente", "base") if mn[t].get(k) is not None and not isinstance(mn[t][k], bool)])
# ---- rigido
c4 = R["cuadro_14_4_serviciabilidad"]["por_Tp"]
chequea("Pi/Pt/dPSI rigido", "14.4", [c4[t][k] for t in tp1 for k in ("Pi", "Pt", "dPSI")], largo=300)
c5 = R["cuadro_14_5_confiabilidad"]["por_Tp"]
chequea("R y Zr rigido", "14.5", [x for t in Tp for x in (c5[t]["R"], c5[t]["Zr"])])
c7 = R["cuadro_14_7_resistencia_concreto"]["filas"]
chequea("MR y f'c concreto", "14.7", [x for r in c7 for x in (r["MR_kg_cm2"], r["fc_kg_cm2"])])
cd = R["cuadro_14_9_drenaje_Cd"]["calidad"]
chequea("Cd", "14.9", [float(x) for k in ("Excelente", "Bueno", "Regular", "Pobre", "Muy pobre") for c in cd[k] for x in re.findall(r"\d+\.\d+", c)])
chequea("J", "14.10", [3.2, 3.8, 4.4, 2.8, 3.8])

# ---- informe
col = {"orden": "OK (orden exacto)", "conjunto": "OK (mismo conjunto, orden distinto)", "FALTAN": "REVISAR", "SIN BLOQUE": "SIN BLOQUE"}
sal = io.StringIO()
sal.write("# Verificación de las tablas transcritas contra el texto del manual\n\n")
sal.write("Fuente del texto: `MAN_7 SGGP-2014.pdf` del CD de normas del MTC (versión con capa de texto). Se comparan los números de `manual-mtc-2014-tablas.json` con los del bloque de cada cuadro.\n\n")
sal.write("| Tabla | Cuadro | Resultado | Valores | Detalle |\n|---|---|---|---|---|\n")
for n, c, nivel, det, k in resultados: sal.write("| %s | %s | %s | %d | %s |\n" % (n, c, col[nivel], k, det))
sal.write("""
## Catálogos de losa rígida (Figuras 14.6 a 14.9)

Son imágenes en el PDF, así que no se pueden comparar por texto. Se compararon **a mano contra las imágenes** del PDF del CD el 2026-11-20: J = 2.8 (15 rangos Tp x 5 grupos CBR), J = 3.2 (15 x 5), J = 3.8 (5 x 5) y J = 4.0 (5 x 5) coinciden celda por celda. Una celda dudosa (J = 2.8, CBR 10–20 %, Tp11 = 26 cm) se amplió y se confirmó.

**Inconsistencia del manual:** los títulos de las Figuras 14.6 a 14.8 dicen «con pasadores y con bermas de concreto» para J = 2.8, 3.2 y 3.8, mientras el Cuadro 14.10 asigna J = 3.2 a berma granular con pasadores y J = 3.8 a berma de concreto sin pasadores.

## Corrección encontrada

Cuadro 12.17: para Tp1 y Tp2 el manual deja en blanco el espesor de la carpeta en frío y no da carpeta en caliente. El JSON traía 50 y 60 mm, que no figuran en el cuadro; se corrigió a `null` y la calculadora ya no inventa esos espesores.
""")
malos = [r for r in resultados if r[2] in ("FALTAN", "SIN BLOQUE")]
sal.write("\n**%d comprobaciones: %d con orden exacto, %d con el mismo conjunto, %d por revisar.**\n" % (len(resultados), sum(r[2] == "orden" for r in resultados), sum(r[2] == "conjunto" for r in resultados), len(malos)))
open(os.path.join(RAIZ, "kb/pavimentos/verificacion-tablas.md"), "w", encoding="utf-8").write(sal.getvalue())
print(sal.getvalue().encode("ascii", "replace").decode())
sys.exit(1 if malos else 0)
