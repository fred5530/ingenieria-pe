"""Genera kb/pavimentos/indice-normativa.json a partir de los .txt extraidos del CD de normas del MTC.
Uso: python kb/pavimentos/herramientas/indexar_normativa.py"""
import re, os, json, glob
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TXT = os.path.join(RAIZ, "kb/pavimentos/texto")
META = {
 "MAN_1_DG_2018": ("Manual de Carreteras: Diseño Geométrico DG-2018", "manual", ["geometria", "pendientes", "bombeo", "secciones"]),
 "MAN_2_SV_2017": ("Manual de Seguridad Vial 2017", "manual", ["seguridad vial"]),
 "MAN_3_PT_2016": ("Manual de Puentes y Túneles 2016", "manual", ["puentes", "tuneles"]),
 "MAN_4_TMyOC_2016": ("Manual de Carreteras: Túneles, Muros y Obras Complementarias 2016", "manual", ["muros", "tuneles", "obras complementarias"]),
 "MAN_5_EM_2016": ("Manual de Ensayo de Materiales 2016 (EM-2016)", "manual", ["ensayos", "CBR", "Proctor", "calidad"]),
 "MAN_6_DCT_2016": ("Manual de Dispositivos de Control del Tránsito Automotor 2016", "manual", ["señalizacion", "dispositivos"]),
 "MAN_7_SGGP_2014": ("Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos 2014", "manual", ["pavimentos", "afirmados", "suelos", "diseno estructural"]),
 "MAN_8_IV_2014_2015": ("Manual de Inventarios Viales 2014-2015", "manual", ["inventario vial"]),
 "MAN_9_MCV_2014_2016": ("Manual de Carreteras: Mantenimiento o Conservación Vial 2014-2016", "manual", ["mantenimiento", "conservacion"]),
 "MAN_10_EG_2013": ("Manual de Carreteras: Especificaciones Técnicas Generales para Construcción EG-2013", "manual", ["especificaciones", "afirmado", "mezclas asfalticas", "concreto"]),
 "MAN_11_HHD_2011": ("Manual de Hidrología, Hidráulica y Drenaje 2011", "manual", ["drenaje", "hidrologia"]),
 "Regl_N_G_I_V": ("Reglamento Nacional de Gestión de Infraestructura Vial", "reglamento", []),
 "Regl_de_Jerarquizacin_Vial": ("Reglamento de Jerarquización Vial", "reglamento", ["jerarquizacion"]),
}
def titulo(n):
    if n in META: return META[n]
    return (re.sub(r"_+", " ", n), "documento tecnico", [])
CAP = re.compile(r"^\s*(CAP[IÍ]TULO|SECCI[OÓ]N)\s+([IVXLC]+|\d+)\b(.*)$", re.I)
CUA = re.compile(r"^\s*(Cuadro|Tabla|Figura)\s+(N[º°o]\s*)?(\d+(?:\.\d+)*[a-z]?)\s*$")
docs = []
for f in sorted(glob.glob(os.path.join(TXT, "*.txt"))):
    n = os.path.basename(f)[:-4]
    lineas = open(f, encoding="utf-8").read().split("\n")
    pag, paginas, sin_texto = 0, 0, 0
    caps, cuadros = [], []
    for i, l in enumerate(lineas):
        m = re.match(r"^===== pagina PDF (\d+) =====", l)
        if m: pag = int(m.group(1)); paginas = max(paginas, pag); continue
        c = CAP.match(l)
        if c and len(l.strip()) < 90:
            t = (c.group(3) or "").strip(" .-–:")
            if not t:  # el nombre esta en la linea siguiente
                for k in range(i + 1, min(i + 4, len(lineas))):
                    if lineas[k].strip(): t = lineas[k].strip(); break
            caps.append({"pdf": pag, "titulo": ("%s %s %s" % (c.group(1).capitalize(), c.group(2), t)).strip()})
        q = CUA.match(l)
        if q:
            tt = ""
            for k in range(i + 1, min(i + 4, len(lineas))):
                if lineas[k].strip(): tt = lineas[k].strip(); break
            cuadros.append({"pdf": pag, "id": "%s %s" % (q.group(1), q.group(3)), "titulo": tt[:110]})
    # sin duplicados consecutivos
    def unicos(a, k):
        s, o = set(), []
        for x in a:
            key = tuple(x[j] for j in k)
            if key not in s: s.add(key); o.append(x)
        return o
    caps = unicos(caps, ("titulo",)); cuadros = unicos(cuadros, ("id", "pdf"))
    nom, tipo, temas = titulo(n)
    docs.append({"archivo_txt": "kb/pavimentos/texto/%s.txt" % n, "titulo": nom, "tipo": tipo, "temas": temas,
                 "paginas_pdf": paginas, "capitulos": caps[:60], "cuadros_y_figuras": len(cuadros),
                 "cuadros": cuadros if tipo == "manual" and n in ("MAN_7_SGGP_2014", "MAN_10_EG_2013", "MAN_9_MCV_2014_2016", "MAN_11_HHD_2011", "MAN_1_DG_2018") else []})
escaneados = ["01_DT_Soluciones_Bsicas", "02_Aut_derecho_de_va", "07_DS_derecho_de_va", "08_Seguridad_e_Higiene_Industrial", "12_Temas_de_Investigacin_DEE"]
sal = {"generado": "2026-11-20", "origen": "CD NORMAS DE CARRETERAS (MTC), AutoPlay/Docs, 32 PDF",
       "nota": "Los .txt y el CD no se versionan en git (kb/pavimentos/texto y fuentes-pdf estan excluidos). Para regenerar: extraer con pymupdf y correr este script.",
       "escaneados_sin_texto": escaneados, "documentos": docs}
json.dump(sal, open(os.path.join(RAIZ, "kb/pavimentos/indice-normativa.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(docs), "documentos;", sum(d["cuadros_y_figuras"] for d in docs), "cuadros y figuras detectados")
for d in docs:
    print("%-70s pags %4d  caps %3d  cuadros %4d" % (d["titulo"][:70].encode("ascii", "replace").decode(), d["paginas_pdf"], len(d["capitulos"]), d["cuadros_y_figuras"]))
