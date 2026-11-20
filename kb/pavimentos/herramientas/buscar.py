"""Busca un texto en la normativa extraida y muestra documento, pagina del PDF y contexto.
Uso: python kb/pavimentos/herramientas/buscar.py "espesor minimo" [--doc SGGP] [--max 20]"""
import sys, os, re, glob, argparse
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ap = argparse.ArgumentParser(); ap.add_argument("texto"); ap.add_argument("--doc", default=""); ap.add_argument("--max", type=int, default=20)
a = ap.parse_args(); pat = re.compile(re.escape(a.texto), re.I); n = 0
for f in sorted(glob.glob(os.path.join(RAIZ, "kb/pavimentos/texto/*.txt"))):
    nom = os.path.basename(f)[:-4]
    if a.doc and a.doc.lower() not in nom.lower(): continue
    pag = 0
    for l in open(f, encoding="utf-8"):
        m = re.match(r"^===== pagina PDF (\d+) =====", l)
        if m: pag = int(m.group(1)); continue
        if pat.search(l):
            print("%s | pag PDF %d | %s" % (nom, pag, l.strip()[:160])); n += 1
            if n >= a.max: sys.exit(0)
if not n: print("sin resultados")
