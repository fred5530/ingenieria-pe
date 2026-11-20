/* Memoria de calculo en PDF con aspecto LaTeX: Computer Modern, ecuaciones MathJax (vectoriales), tablas tipo booktabs,
   figuras SVG, indice y referencias. Se genera en el navegador con pdfmake; las librerias se cargan solo al pedir la memoria. */
(function () {
  "use strict";
  var C = window.PavCalc;
  var LIBS = {
    pdfmake: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js",
    mathjax: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js"
  };
  var FUENTES = { r: "cmu-serif-regular.ttf", b: "cmu-serif-bold.ttf", i: "cmu-serif-italic.ttf", bi: "cmu-serif-bolditalic.ttf" };
  var listo = null;

  function cargarScript(u) {
    return new Promise(function (ok, no) {
      var s = document.createElement("script"); s.src = u; s.onload = ok;
      s.onerror = function () { no(new Error("No se pudo cargar " + u)); }; document.head.appendChild(s);
    });
  }
  function aBase64(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function preparar(baseUrl) {
    if (listo) return listo;
    window.MathJax = { startup: { typeset: false }, svg: { fontCache: "none" } };
    listo = Promise.all([cargarScript(LIBS.pdfmake), cargarScript(LIBS.mathjax)]).then(function () {
      return window.MathJax.startup.promise;
    }).then(function () {
      var claves = Object.keys(FUENTES);
      return Promise.all(claves.map(function (k) {
        return fetch(baseUrl + "fonts/" + FUENTES[k]).then(function (r) { if (!r.ok) throw new Error("Falta la fuente " + FUENTES[k]); return r.arrayBuffer(); }).then(aBase64);
      })).then(function (datos) {
        var vfs = {}; claves.forEach(function (k, i) { vfs[FUENTES[k]] = datos[i]; });
        window.pdfMake.vfs = vfs;
        window.pdfMake.fonts = { CMU: { normal: FUENTES.r, bold: FUENTES.b, italics: FUENTES.i, bolditalics: FUENTES.bi } };
      });
    }).catch(function (e) { listo = null; throw e; });
    return listo;
  }

  /* ---------- utilidades de formato ---------- */
  function limpia(s) {
    return String(s == null ? "" : s).replace(/⚠\s*/g, "").replace(/≥/g, "mayor o igual a").replace(/≤/g, "menor o igual a")
      .replace(/≈/g, "aprox.").replace(/≠/g, "distinto de").replace(/∑/g, "Σ").replace(/[‑−]/g, "-")
      .replace(/[₀-₉]/g, function (c) { return String(c.charCodeAt(0) - 0x2080); })
      .replace(/[⁴-⁹⁰]/g, function (c) { return "^" + "0123456789"["⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)]; })
      .replace(/([A-Za-zΔ]+)_\{?([A-Za-z0-9]+)\}?/g, "$1$2");
  }
  function esc(s) { return limpia(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function f(x, d) { return x == null || isNaN(x) ? "—" : x.toLocaleString("es-PE", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function ent(x) { return x == null || isNaN(x) ? "—" : Math.round(x).toLocaleString("es-PE"); }
  function lg(x) { return Math.log10(x); }
  function slug(s) { return String(s || "proyecto").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "proyecto"; }
  function palabrasRango(t) { return String(t).replace(/^<=\s*/, "menor o igual a ").replace(/^>\s*/, "mayor que "); }
  function corto(t) { t = limpia(t || ""); return t.length > 52 ? t.slice(0, 50).trim() + "..." : t; }
  function fechaLarga(iso) {
    var m = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var p = String(iso || "").split("-"); if (p.length !== 3) return String(iso || "");
    return parseInt(p[2], 10) + " de " + m[parseInt(p[1], 10) - 1] + " de " + p[0];
  }

  /* ---------- ecuaciones (MathJax -> SVG vectorial) ---------- */
  function mj(tex, size) {
    var n = window.MathJax.tex2svg(tex, { display: true }), s = n.querySelector("svg");
    var vb = s.getAttribute("viewBox").split(/\s+/).map(Number), w = vb[2] / 1000 * size, h = vb[3] / 1000 * size, tope = 400;
    if (w > tope) { h = h * tope / w; w = tope; }
    s.setAttribute("width", w); s.setAttribute("height", h); s.removeAttribute("style"); s.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return { svg: s.outerHTML.replace(/currentColor/g, "#000000"), w: w, h: h };
  }

  function simb(tex) {
    var n = window.MathJax.tex2svg(tex, { display: false }), sv = n.querySelector("svg"), vb = sv.getAttribute("viewBox").split(/\s+/).map(Number), w = vb[2] / 1000 * 10.5, h = vb[3] / 1000 * 10.5;
    sv.setAttribute("width", w); sv.setAttribute("height", h); sv.removeAttribute("style"); sv.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return { svg: sv.outerHTML.replace(/currentColor/g, "#000000"), width: w, alignment: "center", margin: [0, 1, 0, 0] };
  }

  /* ---------- constructor del documento ---------- */
  function Doc() {
    var d = { c: [], nT: 0, nF: 0, nE: 0, s1: 0, s2: 0 };
    d.h1 = function (t) { d.s1++; d.s2 = 0; d.c.push({ text: d.s1 + "   " + limpia(t), style: "h1", tocItem: true, tocStyle: { fontSize: 11 } }); };
    d.h2 = function (t) { d.s2++; d.c.push({ text: d.s1 + "." + d.s2 + "   " + limpia(t), style: "h2" }); };
    d.p = function (t, estilo) { d.c.push({ text: typeof t === "string" ? limpia(t) : t.map(function (r) { return typeof r === "string" ? limpia(r) : Object.assign({}, r, { text: limpia(r.text) }); }), style: estilo || "p" }); };
    d.ul = function (items) { d.c.push({ ul: items.map(limpia), style: "p", margin: [14, 0, 0, 6] }); };
    d.eq = function (tex, texto) {
      var n = ++d.nE, m = mj(tex, 11);
      if (texto) d.p(texto);
      d.c.push({ columns: [{ width: "*", stack: [{ svg: m.svg, width: m.w, alignment: "center" }] }, { width: 30, text: "(" + n + ")", alignment: "right", margin: [0, Math.max(0, m.h / 2 - 6), 0, 0] }], margin: [0, 4, 0, 8], unbreakable: true });
      return n;
    };
    d.tabla = function (titulo, cab, filas, anchos, alin, fuente) {
      var n = ++d.nT;
      var celda = function (v, j, esCab) { var o = typeof v === "object" && v !== null && !Array.isArray(v) ? v : { text: limpia(v) }; if (o.text != null) o.text = limpia(o.text); o.alignment = o.alignment || (alin && alin[j]) || "left"; if (esCab) o.bold = true; return o; };
      var cuerpo = [cab.map(function (v, j) { return celda(v, j, true); })].concat(filas.map(function (r) { return r.map(function (v, j) { return celda(v, j, false); }); }));
      var partes = [{ text: [{ text: "Tabla " + n + ". ", bold: true }, limpia(titulo)], style: "cap", keepWithNext: true },
        { table: { headerRows: 1, widths: anchos, body: cuerpo, dontBreakRows: true }, layout: "booktabs", fontSize: 10, margin: [0, 0, 0, fuente ? 2 : 10] }];
      if (fuente) partes.push({ text: limpia(fuente), style: "fuente" });
      d.c.push({ stack: partes, unbreakable: filas.length <= 18 });
      return n;
    };
    d.fig = function (svg, ancho, titulo) {
      var n = ++d.nF;
      d.c.push({ stack: [{ svg: svg, width: ancho, alignment: "center" }, { text: [{ text: "Figura " + n + ". ", bold: true }, limpia(titulo)], style: "cap", alignment: "center", margin: [0, 4, 0, 0] }], margin: [0, 6, 0, 12], unbreakable: true });
      return n;
    };
    return d;
  }

  /* ---------- graficos SVG (en pt, texto Computer Modern) ---------- */
  var FSVG = 'font-family="CMU"';
  function txt(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.s || 8) + '" text-anchor="' + (o.a || "start") + '"' + (o.i ? ' font-style="italic"' : "") + (o.b ? ' font-weight="bold"' : "") + (o.r ? ' transform="rotate(' + o.r + " " + x + " " + y + ')"' : "") + ' fill="' + (o.c || "#000") + '">' + esc(s) + "</text>"; }
  function chart(o) {
    var W = o.w || 420, H = o.h || 225, m = { l: 52, r: 16, t: 14, b: 46 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var lx = function (v) { return o.xlog ? Math.log10(v) : v; };
    var X = function (v) { return m.l + (lx(v) - lx(o.xmin)) / (lx(o.xmax) - lx(o.xmin)) * iw; };
    var Y = function (v) { return m.t + ih - (v - o.ymin) / (o.ymax - o.ymin) * ih; };
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" ' + FSVG + ">";
    (o.xticks || []).forEach(function (t) { s += '<line x1="' + X(t) + '" y1="' + m.t + '" x2="' + X(t) + '" y2="' + (m.t + ih) + '" stroke="#d0d0d0" stroke-width="0.4"/>' + txt(X(t), m.t + ih + 11, o.xfmt ? o.xfmt(t) : ent(t), { a: "middle" }); });
    (o.yticks || []).forEach(function (t) { s += '<line x1="' + m.l + '" y1="' + Y(t) + '" x2="' + (m.l + iw) + '" y2="' + Y(t) + '" stroke="#d0d0d0" stroke-width="0.4"/>' + txt(m.l - 4, Y(t) + 3, f(t, o.yd == null ? 1 : o.yd), { a: "end" }); });
    (o.hlines || []).forEach(function (h) { if (h.y >= o.ymin && h.y <= o.ymax) s += '<line x1="' + m.l + '" y1="' + Y(h.y) + '" x2="' + (m.l + iw) + '" y2="' + Y(h.y) + '" stroke="#555" stroke-width="0.6" stroke-dasharray="3 2"/>' + txt(m.l + iw - 2, Y(h.y) - 2, h.t, { a: "end", s: 7, i: true }); });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="none" stroke="#000" stroke-width="0.7"/>';
    (o.series || []).forEach(function (se) {
      var pts = se.pts.filter(function (p) { return p[1] >= o.ymin - 1e-9 && p[1] <= o.ymax + 1e-9; }).map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ");
      s += '<polyline points="' + pts + '" fill="none" stroke="' + (se.c || "#000") + '" stroke-width="1.1"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : "") + "/>";
    });
    (o.dots || []).forEach(function (d) { s += '<circle cx="' + X(d.x) + '" cy="' + Y(d.y) + '" r="' + (d.r || 2) + '" fill="' + (d.c || "#fff") + '" stroke="' + (d.s || "#000") + '" stroke-width="0.8"/>'; });
    if (o.mark) {
      var mx = X(o.mark.x), my = Y(o.mark.y);
      s += '<line x1="' + mx + '" y1="' + my + '" x2="' + mx + '" y2="' + (m.t + ih) + '" stroke="#a31515" stroke-width="0.6" stroke-dasharray="2 2"/><line x1="' + m.l + '" y1="' + my + '" x2="' + mx + '" y2="' + my + '" stroke="#a31515" stroke-width="0.6" stroke-dasharray="2 2"/>';
      s += '<rect x="' + (mx - 3) + '" y="' + (my - 3) + '" width="6" height="6" fill="#a31515" transform="rotate(45 ' + mx + " " + my + ')"/>';
      s += txt(mx + 8, my + 14, o.mark.t, { s: 8, c: "#a31515", b: true });
    }
    s += txt(m.l + iw / 2, H - 22, o.xlabel, { a: "middle", s: 9 }) + txt(12, m.t + ih / 2, o.ylabel, { a: "middle", s: 9, r: -90 });
    var ly = H - 8, lxp = m.l;
    (o.leyenda || []).forEach(function (l) {
      s += (l.punto ? '<circle cx="' + (lxp + 4) + '" cy="' + (ly - 3) + '" r="2" fill="#fff" stroke="#000" stroke-width="0.8"/>' : '<line x1="' + lxp + '" y1="' + (ly - 3) + '" x2="' + (lxp + 14) + '" y2="' + (ly - 3) + '" stroke="' + (l.c || "#000") + '" stroke-width="1.2"' + (l.dash ? ' stroke-dasharray="' + l.dash + '"' : "") + "/>") + txt(lxp + 18, ly, l.t, { s: 8 });
      lxp += 22 + l.t.length * 4.1;
    });
    return { svg: s + "</svg>", w: W };
  }
  function xticksLog(min, max) { var t = [], e = Math.ceil(lg(min)); for (var v = Math.pow(10, e); v <= max * 1.0001; v *= 10) t.push(v); return t; }
  function fmtEE(v) { return v >= 1e6 ? (v / 1e6) + " M" : (v / 1e3) + " mil"; }

  function seccionSVG(capas, subTxt) {
    var W = 360, x0 = 78, w = 120, y = 14, s = "", total = 0;
    var gris = ["#e6e6e6", "#cfcfcf", "#b8b8b8", "#a1a1a1"];
    s += txt(x0 + w / 2, 8, "Sección transversal (no está a escala)", { a: "middle", s: 8, i: true });
    capas.forEach(function (c, i) {
      var h = Math.max(20, Math.min(46, c.d * 2.6 + 12));
      s += '<rect x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (c.fill || gris[i % gris.length]) + '" stroke="#000" stroke-width="0.7"/>';
      s += txt(x0 - 6, y + h / 2 + 3, f(c.d, 0) + " cm", { a: "end", s: 9, b: true });
      s += txt(x0 + w + 8, y + h / 2 + 3, c.t, { s: 8.5 });
      y += h; total += c.d;
    });
    var hs = 34;
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + hs + '" fill="#fff" stroke="#000" stroke-width="0.7"/>';
    for (var k = -hs; k < w; k += 9) s += '<line x1="' + (x0 + Math.max(0, k)) + '" y1="' + (y + (k < 0 ? -k : 0)) + '" x2="' + (x0 + Math.min(w, k + hs)) + '" y2="' + (y + Math.min(hs, hs - Math.max(0, k + hs - w))) + '" stroke="#777" stroke-width="0.4"/>';
    s += txt(x0 + w + 8, y + hs / 2 + 3, subTxt, { s: 8.5 });
    s += '<line x1="' + (x0 - 46) + '" y1="14" x2="' + (x0 - 46) + '" y2="' + y + '" stroke="#000" stroke-width="0.6"/>' + txt(x0 - 50, 14 + (y - 14) / 2, "Espesor total " + f(total, 0) + " cm", { a: "middle", s: 8, r: -90 });
    var H = y + hs + 10;
    return { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" ' + FSVG + ">" + s + "</svg>", w: W };
  }

  /* ---------- piezas comunes ---------- */
  var REF = {
    mtc: "MTC (2014). Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos. Sección Suelos y Pavimentos, versión abril 2014. Resolución Directoral N.° 10-2014-MTC/14. Ministerio de Transportes y Comunicaciones, Dirección General de Caminos y Ferrocarriles, Lima.",
    aashto: "AASHTO (1993). Guide for Design of Pavement Structures. American Association of State Highway and Transportation Officials, Washington, D. C.",
    trrl: "TRRL. Correlación CBR–módulo resiliente (Transport and Road Research Laboratory), tal como la adopta el Manual [1], Cuadro 12.5.",
    aci: "ACI Committee 363 / ACI 318. Correlaciones de módulo de rotura y módulo elástico del concreto, citadas en el Manual [1], pág. 231."
  };
  function portada(d, tipoTit, subt, proy) {
    var filas = [["Proyecto", proy.nombre], ["Ubicación", proy.ubicacion], ["Entidad / cliente", proy.entidad], ["Responsable", proy.responsable], ["CIP N.°", proy.cip], ["Código / revisión", proy.codigo], ["Fecha", fechaLarga(proy.fecha)]].filter(function (r) { return r[1]; });
    d.c.push({ text: "MEMORIA DE CÁLCULO", style: "tit", margin: [0, 110, 0, 6] });
    d.c.push({ canvas: [{ type: "line", x1: 90, y1: 0, x2: 365, y2: 0, lineWidth: 1.5 }], margin: [0, 0, 0, 14], alignment: "center" });
    d.c.push({ text: tipoTit, style: "sub" });
    d.c.push({ text: subt, style: "sub2" });
    d.c.push({ table: { widths: [120, "*"], body: filas.map(function (r) { return [{ text: r[0], bold: true, alignment: "right", margin: [0, 2, 8, 2] }, { text: limpia(r[1]), margin: [0, 2, 0, 2] }]; }) }, layout: "noBorders", margin: [40, 50, 40, 0], fontSize: 12 });
    d.c.push({ text: "Documento de referencia generado con ingenierIA.pe a partir de las tablas del Manual de Carreteras MTC 2014. No sustituye el diseño del Ingeniero Responsable.", style: "pieport", margin: [60, 150, 60, 0] });
    d.c.push({ text: "", pageBreak: "after" });
    d.c.push({ toc: { title: { text: "Índice", style: "h1x" }, textMargin: [0, 2, 0, 2] } });
    d.c.push({ text: "", pageBreak: "after" });
  }
  function secReferencias(d, claves) {
    d.h1("Referencias");
    claves.forEach(function (k, i) { d.c.push({ columns: [{ width: 26, text: "[" + (i + 1) + "]" }, { width: "*", text: limpia(REF[k]), alignment: "justify" }], style: "ref", margin: [0, 0, 0, 5] }); });
  }
  function firma(d, proy) {
    d.c.push({ columns: [{ width: "*", text: "" }, { width: 200, stack: [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.6 }], margin: [0, 50, 0, 3] }, { text: limpia(proy.responsable || "Ingeniero Responsable del diseño"), alignment: "center" }, { text: proy.cip ? "CIP N.° " + limpia(proy.cip) : "CIP N.° ______", alignment: "center", fontSize: 10 }] }, { width: "*", text: "" }], unbreakable: true, margin: [0, 10, 0, 0] });
  }
  function secLimites(d) {
    d.h2("Alcance y limitaciones");
    d.p("Los resultados de esta memoria son una referencia de cálculo obtenida con las ecuaciones y tablas del Manual de Carreteras del MTC (versión abril 2014). Las tablas se transcribieron del manual y cada valor indica el cuadro y la página de origen. La memoria no sustituye el estudio de mecánica de suelos, el censo de cargas ni el criterio del Ingeniero Responsable, quien debe verificar la vigencia de la norma aplicable al proyecto y la aceptación de la Entidad.");
  }
  function tablaTraficoRango(d, tp, ee) {
    var r = tp.rango;
    d.tabla("Clasificación del tránsito de diseño", ["Parámetro", "Valor"], [["Ejes equivalentes de diseño W₁₈", ent(ee) + " EE de 8.2 t"], ["Rango de tránsito", tp.id + " (" + ent(r.min) + " < EE" + (r.max ? " ≤ " + ent(r.max) : "") + ")"]], [200, "*"], ["left", "right"], "Fuente: Manual MTC [1], Cuadro 6.15, pág. 75.");
  }

  /* ---------- verificacion numerica de las ecuaciones AASHTO ---------- */
  function terminosFlex(W18, p, MR, SN) {
    var t1 = p.Zr * p.So, t2 = 9.36 * lg(SN + 1), t3 = -0.2, t4 = lg(p.dPSI / 2.7) / (0.4 + 1094 / Math.pow(SN + 1, 5.19)), t5 = 2.32 * lg(MR), t6 = -8.07;
    return { t: [t1, t2, t3, t4, t5, t6], suma: t1 + t2 + t3 + t4 + t5 + t6, objetivo: lg(W18) };
  }
  function terminosRig(W18, p, calc, Cd, J, MRc, k_pci, Ec, Sc, Din) {
    var t1 = p.Zr * p.So, t2 = 7.35 * lg(Din + 1), t3 = -0.06, t4 = lg(p.dPSI / 3.0) / (1 + 1.624e7 / Math.pow(Din + 1, 8.46));
    var num = Sc * Cd * (Math.pow(Din, 0.75) - 1.132), den = 215.63 * J * (Math.pow(Din, 0.75) - 18.42 / Math.pow(Ec / k_pci, 0.25));
    var t5 = (4.22 - 0.32 * p.Pt) * lg(num / den);
    return { t: [t1, t2, t3, t4, t5], suma: t1 + t2 + t3 + t4 + t5, objetivo: lg(W18) };
  }

  var TEX_FLEX = String.raw`\log_{10} W_{18} = Z_R S_o + 9.36\,\log_{10}(SN+1) - 0.20 + \frac{\log_{10}\!\left(\frac{\Delta PSI}{4.2-1.5}\right)}{0.40+\dfrac{1094}{(SN+1)^{5.19}}} + 2.32\,\log_{10} M_R - 8.07`;
  var TEX_RIG = String.raw`\begin{aligned}\log_{10} W_{18} &= Z_R S_o + 7.35\,\log_{10}(D+1) - 0.06 + \frac{\log_{10}\!\left(\frac{\Delta PSI}{4.5-1.5}\right)}{1+\dfrac{1.624\times10^{7}}{(D+1)^{8.46}}} \\ &\quad + (4.22-0.32\,P_t)\,\log_{10}\!\left[\frac{S_c\,C_d\,\left(D^{0.75}-1.132\right)}{215.63\,J\left(D^{0.75}-\dfrac{18.42}{(E_c/k)^{0.25}}\right)}\right]\end{aligned}`;

  /* =====================================================================
     MEMORIA: TRAFICO
     ===================================================================== */
  function memTrafico(s, proy, d) {
    var tp = s.tp, o = s.o;
    portada(d, "Estudio de tránsito de diseño", "Número de repeticiones de ejes equivalentes de 8.2 t (" + (s.pav === "rigido" ? "pavimento rígido" : "pavimento flexible") + ")", proy);
    d.h1("Generalidades");
    d.h2("Objeto");
    d.p("La presente memoria determina el número de repeticiones de ejes equivalentes (EE) de 8.2 t que solicitarán al pavimento en el carril de diseño durante el periodo de análisis, y clasifica el tránsito en los rangos de tráfico pesado del Manual de Carreteras MTC [1].");
    secLimites(d);
    d.h1("Metodología");
    d.p("El efecto del tránsito pesado se expresa en ejes equivalentes: cada paso de un eje con carga P se convierte al número de pasadas de un eje simple de rueda doble cargado con 8.2 t que produce el mismo deterioro. El Manual [1] adopta las relaciones simplificadas de las tablas del apéndice D de la guía AASHTO 93 [2]:");
    d.eq(String.raw`EE_{eje} = \left(\frac{P}{P_{ref}}\right)^{n}`, "Para cada eje con carga real P en toneladas:");
    var exps = s.pav === "rigido" ? D_.trafico.cuadro_6_4_EE_rigido : D_.trafico.cuadro_6_3_EE_flexible;
    var nombres = { simple_rueda_simple: "Eje simple, rueda simple", simple_rueda_doble: "Eje simple, rueda doble", tandem_1RS_1RD: "Tándem (1 RS + 1 RD)", tandem_2RD: "Tándem (2 RD)", tridem_2RD_1RS: "Trídem (2 RD + 1 RS)", tridem_3RD: "Trídem (3 RD)" };
    d.tabla("Parámetros de equivalencia por tipo de eje", ["Tipo de eje", "P_ref (t)", "Exponente n"], Object.keys(exps.ejes).map(function (k) { return [nombres[k], f(exps.ejes[k].Pref, 1), f(exps.ejes[k].exp, 1)]; }), ["*", 90, 90], ["left", "right", "right"], "Fuente: Manual MTC [1], Cuadro " + (s.pav === "rigido" ? "6.4" : "6.3") + ", pág. 67.");
    d.eq(String.raw`F_{vp} = \sum EE_{eje}`, "El factor vehículo pesado es la suma de los ejes equivalentes de todos los ejes del vehículo:");
    d.eq(String.raw`F_{ca} = \frac{(1+r)^{n}-1}{r}`, "El factor de crecimiento acumulado, con tasa anual r y periodo n en años (si r = 0, F_ca = n):");
    d.eq(String.raw`N_{rep} = \sum_i \left[\, IMD_i \cdot F_d \cdot F_c \cdot F_{vp,i} \cdot F_{p,i} \cdot F_{ca} \cdot 365 \,\right]`, "El número de repeticiones de EE de 8.2 t en el carril y periodo de diseño es:");
    d.p("donde IMD es el índice medio diario por tipo de vehículo pesado, F_d el factor direccional, F_c el factor carril y F_p el factor de ajuste por presión de neumáticos (igual a 1.00 en pavimentos rígidos y afirmados).");
    d.h1("Datos de entrada");
    d.tabla("Datos generales del tránsito", ["Parámetro", "Valor", "Referencia"], [
      ["Tipo de pavimento", s.pav === "rigido" ? "Rígido" : "Flexible / semirrígido", "Cuadros 6.3 y 6.4"],
      ["Sección de la vía", s.filaTxt, "Cuadro 6.1"],
      ["Factor direccional F_d", f(s.fila.Fd, 2), "Cuadro 6.1"], ["Factor carril F_c", f(s.fila.Fc, 2), "Cuadro 6.1"],
      ["Periodo de diseño n", f(s.n, 0) + " años", "dato"], ["Tasa de crecimiento r", f(s.r * 100, 2) + " %", "dato; típico 2 % a 6 %"],
      ["Factor de crecimiento F_ca", f(o.Fca, 2), "Ec. (3)"],
      ["Factor de presión F_p", s.fpInfo ? f(s.fpInfo.Fp, 2) + " (PCN = " + f(s.fpInfo.PCN, 1) + " psi)" : "1.00", "Cuadro 6.13"]
    ], [190, "*", 120], ["left", "right", "left"], "Fuente: Manual MTC [1], págs. 64 a 73.");
    d.h1("Cálculo por tipo de vehículo");
    s.lista.forEach(function (v, i) {
      if (v.ejes) {
        d.tabla("Factor vehículo pesado de " + v.nombre, ["Eje", "Tipo", "P (t)", "EE"], v.ejes.map(function (e, j) { return [String(j + 1), nombres[e.tipo], f(e.P, 2), f(e.ee, 3)]; }).concat([[{ text: "F_vp", bold: true }, "", "", { text: f(v.fvp, 3), bold: true }]]), [30, "*", 70, 70], ["center", "left", "right", "right"], "Calculado con la Ec. (1) y la Tabla 1.");
      }
    });
    d.tabla("Repeticiones de ejes equivalentes por tipo de vehículo", ["Vehículo", "IMD", "F_vp", "F_p", "EE día-carril", "N_rep"], o.filas.map(function (x, i) { return [x.nombre, ent(s.lista[i].imd), f(s.lista[i].fvp, 3), f(x.Fp, 2), f(x.eeDia, 2), ent(x.nrep)]; }).concat([[{ text: "Total", bold: true }, "", "", "", "", { text: ent(o.total), bold: true }]]), ["*", 50, 50, 40, 80, 80], ["left", "right", "right", "right", "right", "right"], "EE día-carril = IMD × F_d × F_c × F_vp × F_p; N_rep = EE día-carril × F_ca × 365.");
    d.h1("Resultados");
    d.p(["El número de repeticiones de ejes equivalentes de 8.2 t en el carril de diseño, para ", { text: f(s.n, 0) + " años", bold: true }, ", es ", { text: "N_rep = " + ent(o.total) + " EE", bold: true }, ", que corresponde al rango de tránsito ", { text: tp.id || "fuera de rango", bold: true }, " del Cuadro 6.15 del Manual [1]."]);
    tablaTraficoRango(d, tp, o.total);
    // figuras
    var bars = (function () {
      var W = 420, H = 150, m = { l: 150, r: 20, t: 8, b: 26 }, iw = W - m.l - m.r, mx = Math.max.apply(null, o.filas.map(function (x) { return x.nrep; })) * 1.1, sv = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" ' + FSVG + ">";
      var bh = Math.min(24, (H - m.t - m.b) / o.filas.length - 6);
      o.filas.forEach(function (x, i) {
        var y = m.t + i * ((H - m.t - m.b) / o.filas.length) + 3, w = x.nrep / mx * iw;
        sv += txt(m.l - 6, y + bh / 2 + 3, x.nombre.slice(0, 28), { a: "end", s: 8.5 }) + '<rect x="' + m.l + '" y="' + y + '" width="' + w + '" height="' + bh + '" fill="#9a9a9a" stroke="#000" stroke-width="0.6"/>' + txt(m.l + w + 4, y + bh / 2 + 3, ent(x.nrep), { s: 8 });
      });
      sv += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (H - m.b) + '" stroke="#000" stroke-width="0.7"/>' + txt(m.l + iw / 2, H - 8, "Repeticiones de EE de 8.2 t en el periodo de diseño", { a: "middle", s: 9 });
      return { svg: sv + "</svg>", w: W };
    })();
    d.fig(bars.svg, bars.w, "Aporte de cada tipo de vehículo al número de repeticiones de EE.");
    var anual = o.total / o.Fca / 365, pts = [];
    for (var y = 0; y <= s.n; y += Math.max(0.25, s.n / 80)) pts.push([y, anual * 365 * C.fca(s.r, y)]);
    var tope = o.total * 1.15, hl = D_.trafico.cuadro_6_15_pavimentados.rangos_EE.filter(function (r) { return r.max && r.max < tope && r.max > o.total * 0.2; }).map(function (r) { return { y: r.max, t: r.id + " ≤ " + ent(r.max) }; });
    var g = chart({ w: 420, h: 215, xmin: 0, xmax: s.n, ymin: 0, ymax: tope, xticks: [0, s.n / 4, s.n / 2, 3 * s.n / 4, s.n].map(function (v) { return Math.round(v * 100) / 100; }), yticks: [0, 0.25, 0.5, 0.75, 1].map(function (v) { return v * o.total; }), xfmt: function (v) { return f(v, 0); }, yd: 0, xlabel: "Años desde la puesta en servicio", ylabel: "EE acumulados", series: [{ pts: pts, c: "#000" }], hlines: hl, mark: { x: s.n, y: o.total, t: ent(o.total) + " EE" } });
    d.fig(g.svg, g.w, "Crecimiento de los ejes equivalentes acumulados en el periodo de diseño y límites de los rangos Tp.");
    d.h1("Conclusiones y recomendaciones");
    d.ul(["El tránsito de diseño es de " + ent(o.total) + " EE de 8.2 t en " + f(s.n, 0) + " años, rango " + (tp.id || "fuera de rango") + ".", "Las cargas por eje deben provenir del censo de cargas del proyecto y los IMD de un conteo vehicular representativo; la tasa de crecimiento debe sustentarse (población para vehículos livianos, PBI para carga)."].concat((s.avisos || []).map(function (a) { return a.x || a; })));
    firma(d, proy);
    secReferencias(d, ["mtc", "aashto"]);
  }

  /* =====================================================================
     MEMORIA: FLEXIBLE
     ===================================================================== */
  function memFlexible(s, proy, d) {
    var tp = s.tp, p = s.p, W18 = s.ee, mt = terminosFlex(W18, p, s.MR, s.SNr);
    portada(d, "Diseño de pavimento flexible", "Método AASHTO 93 · Manual de Carreteras MTC 2014", proy);
    d.h1("Generalidades");
    d.h2("Objeto");
    d.p("La presente memoria presenta el dimensionamiento de la estructura de un pavimento flexible (carpeta asfáltica, base y subbase granular) por el método de la Guía AASHTO 93 [2], con los parámetros y criterios del Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos del MTC [1].");
    secLimites(d);
    d.h1("Metodología");
    d.p("El método determina el número estructural requerido SN que el pavimento debe tener para soportar el tránsito de diseño con la serviciabilidad y confiabilidad especificadas, sobre una subrasante de módulo resiliente M_R. La ecuación de diseño del Manual [1] (pág. 131) es:");
    d.eq(TEX_FLEX, "");
    d.tabla("Variables de la ecuación de diseño", ["Símbolo", "Descripción", "Unidad"], [
      [simb("W_{18}"), "Ejes equivalentes de 8.2 t acumulados en el carril y periodo de diseño", "EE"], [simb("Z_R"), "Desviación estándar normal asociada a la confiabilidad R", "—"], [simb("S_o"), "Desviación estándar combinada", "—"],
      [simb("\\Delta PSI"), "Pérdida de serviciabilidad: P_i − P_t", "—"], [simb("M_R"), "Módulo resiliente de la subrasante", "psi"], [simb("SN"), "Número estructural requerido", "pulg. (adim.)"]
    ], [60, "*", 80], ["center", "left", "left"], "Fuente: Manual MTC [1], págs. 131 a 140.");
    d.p("La ecuación no tiene solución cerrada para SN: se resuelve por iteración (bisección) hasta que ambos miembros coinciden. Una vez obtenido el SN requerido, se verifica que la estructura propuesta lo provea:");
    d.eq(String.raw`SN = a_1 d_1 + a_2 d_2 m_2 + a_3 d_3 m_3`, "");
    d.p("con a_i los coeficientes estructurales por centímetro de cada capa, d_i sus espesores en centímetros y m_i los coeficientes de drenaje de base y subbase (Manual [1], pág. 140).");
    d.h1("Datos de entrada");
    var filasIn = [["Ejes equivalentes de diseño W₁₈", ent(W18) + " EE"], ["Periodo de diseño", f(s.per, 0) + " años"], ["CBR de la subrasante", f(s.cbr, 1) + " %"], ["Módulo resiliente M_R", ent(s.MR) + " psi" + (s.mrManual ? " (ensayo de laboratorio)" : " (correlación con el CBR)")], ["Capa superficial", s.capas[0].nombre], ["Base", s.capas[1].nombre], ["Subbase", s.capas[2].nombre], ["Coeficientes de drenaje m₂ / m₃", f(s.m2, 2) + " / " + f(s.m3, 2)]];
    d.tabla("Datos de entrada del diseño", ["Dato", "Valor"], filasIn, [210, "*"], ["left", "left"], null);
    d.h1("Tránsito de diseño");
    if (s.trafico) {
      d.p("El tránsito de diseño se obtuvo del estudio de tránsito de este proyecto (memoria de tránsito): se emplearon " + s.trafico.lista.length + " tipo(s) de vehículo pesado, factor de crecimiento F_ca = " + f(s.trafico.o.Fca, 2) + " para " + f(s.trafico.n, 0) + " años y tasa r = " + f(s.trafico.r * 100, 2) + " %, con lo cual N_rep = " + ent(s.trafico.o.total) + " EE.");
    } else d.p("El tránsito de diseño W₁₈ = " + ent(W18) + " EE de 8.2 t fue ingresado como dato; su sustento debe constar en el estudio de tránsito del proyecto.");
    tablaTraficoRango(d, tp, W18);
    d.h1("Subrasante");
    var cat = s.cat;
    d.p("La subrasante se clasifica por su CBR según el Cuadro 12.4 del Manual [1]. Se consideran aptos para la capa de subrasante los suelos con CBR mayor o igual a 6 %; con valores menores corresponde estabilizar o reemplazar el suelo.");
    d.tabla("Categorías de subrasante", ["Categoría", "Calificación", "CBR (%)"], D_.flexible.cuadro_12_4_categorias_subrasante.categorias.map(function (c) { var act = c.id === cat.id; return [{ text: c.id, bold: act }, { text: c.nombre, bold: act }, { text: c.CBR.replace(">=", "mayor o igual a ").replace("<", "menor que ").replace(" y ", " y "), bold: act }]; }), [90, "*", 170], ["center", "left", "left"], "Fuente: Manual MTC [1], Cuadro 12.4, pág. 130. La categoría del proyecto es " + cat.id + " (" + cat.nombre + ").");
    if (!s.mrManual) { d.eq(String.raw`M_R = 2555\,\mathrm{CBR}^{0.64}\ \ (\mathrm{psi})`, "El módulo resiliente se estimó con la correlación CBR–M_R del TRRL [3], que reproduce el Cuadro 12.5 del Manual [1] (8,043 psi para CBR 6 % y 22,529 psi para CBR 30 %):"); d.p("Con CBR = " + f(s.cbr, 1) + " %, M_R = 2555 × " + f(s.cbr, 1) + "^0.64 = " + ent(s.MR) + " psi."); }
    else d.p("Se adoptó el módulo resiliente M_R = " + ent(s.MR) + " psi obtenido por ensayo de laboratorio.");
    d.h1("Parámetros de diseño");
    d.tabla("Parámetros AASHTO 93 adoptados para " + tp.id, ["Parámetro", "Valor", "Fuente"], [
      ["Confiabilidad R", p.R + " %", "Cuadro 12.6, pág. 133"], ["Desviación normal Z_R", f(p.Zr, 3), "Cuadro 12.8, pág. 135"], ["Desviación estándar combinada S_o", f(p.So, 2), "Pág. 136"],
      ["Serviciabilidad inicial P_i", f(p.Pi, 2), "Cuadro 12.10, pág. 137"], ["Serviciabilidad final P_t", f(p.Pt, 2), "Cuadro 12.11, pág. 138"], ["Pérdida de serviciabilidad ΔPSI", f(p.dPSI, 2), "Cuadro 12.12, pág. 139"],
      ["Módulo resiliente M_R", ent(s.MR) + " psi", s.mrManual ? "Ensayo de laboratorio" : "Cuadro 12.5, pág. 132"]
    ], [190, 100, "*"], ["left", "right", "left"], (p.avisos && p.avisos.length ? limpia(p.avisos.join(" ")) : null));
    d.h1("Cálculo del número estructural requerido");
    d.p("Se resolvió la Ec. (1) para el tránsito y los parámetros anteriores. La Tabla " + (d.nT + 1) + " muestra la evaluación de cada término con el SN que satisface la ecuación.");
    var tt = mt.t;
    d.tabla("Verificación de la ecuación de diseño con SN = " + f(s.SNr, 3), ["Núm.", "Expresión", "Valor"], [
      ["1", "Z_R · S_o = " + f(p.Zr, 3) + " × " + f(p.So, 2), f(tt[0], 4)], ["2", "9.36 · log₁₀(SN + 1)", f(tt[1], 4)], ["3", "−0.20", f(tt[2], 4)],
      ["4", "log₁₀(ΔPSI / 2.7) / [0.40 + 1094 / (SN + 1)^5.19]", f(tt[3], 4)], ["5", "2.32 · log₁₀(M_R)", f(tt[4], 4)], ["6", "−8.07", f(tt[5], 4)],
      [{ text: "Σ", bold: true }, { text: "log₁₀ W₁₈ calculado", bold: true }, { text: f(mt.suma, 4), bold: true }], ["", "log₁₀ W₁₈ de diseño = log₁₀(" + ent(W18) + ")", f(mt.objetivo, 4)]
    ], [40, "*", 90], ["center", "left", "right"], "Diferencia entre ambos miembros: " + f(Math.abs(mt.suma - mt.objetivo), 6) + ".");
    d.p([{ text: "SN requerido = " + f(s.SNr, 2), bold: true }, "."]);
    // curva SN vs EE
    var pts = [], i, ee;
    for (i = 0; i <= 70; i++) { ee = 75000 * Math.pow(3e7 / 75000, i / 70); var t = C.tpDeEE(D_, ee); if (!t.id) continue; var pp = C.parametrosFlexible(D_, t.id); var sn = C.snRequerido(ee, pp.Zr, pp.So, pp.dPSI, s.MR); if (sn != null) pts.push([ee, sn]); }
    var cat12 = D_.flexible.cuadro_12_16_SN_requerido_20_anos.por_Tp, dots = [];
    if (cat.apta) D_.trafico.cuadro_6_15_pavimentados.rangos_EE.forEach(function (r) { if (r.max && cat12[r.id]) dots.push({ x: r.max, y: cat12[r.id][cat.col] }); });
    var ymax = Math.ceil(Math.max.apply(null, pts.map(function (q) { return q[1]; }).concat(dots.map(function (q) { return q.y; }))) + 0.5);
    var g1 = chart({ xmin: 75000, xmax: 3e7, xlog: true, ymin: 0, ymax: ymax, xticks: xticksLog(75000, 3e7), xfmt: function (v) { return ent(v); }, yticks: Array.apply(null, Array(ymax + 1)).map(function (_, k) { return k; }), yd: 0, xlabel: "Ejes equivalentes de 8.2 t (escala logarítmica)", ylabel: "Número estructural SN", series: [{ pts: pts, c: "#000" }], dots: dots, mark: { x: W18, y: s.SNr, t: "SN = " + f(s.SNr, 2) }, leyenda: [{ t: "Ec. AASHTO 93 (M_R = " + ent(s.MR) + " psi)" }].concat(dots.length ? [{ t: "Catálogo Cuadro 12.16 (" + cat.id + ")", punto: true }] : []) });
    d.fig(g1.svg, g1.w, "Número estructural requerido en función del tránsito para la subrasante del proyecto. Los saltos corresponden al cambio de parámetros entre rangos Tp.");
    d.h1("Estructura de pavimento");
    var capas = s.capas, snp = capas.reduce(function (a, c) { return a + c.a * c.d * c.m; }, 0);
    d.p("Con los coeficientes estructurales del Cuadro 12.13 del Manual [1] y los espesores adoptados, el número estructural provisto, según la Ec. (2), es:");
    d.tabla("Estructura propuesta y número estructural provisto", ["Capa", "a (1/cm)", "m", "d (cm)", "SN capa"], capas.map(function (c) { return [c.nombre, f(c.a, 3), f(c.m, 2), f(c.d, 0), f(c.a * c.d * c.m, 3)]; }).concat([[{ text: "SN provisto", bold: true }, "", "", "", { text: f(snp, 3), bold: true }], [{ text: "SN requerido", bold: true }, "", "", "", { text: f(s.SNr, 3), bold: true }]]), ["*", 55, 40, 50, 60], ["left", "right", "right", "right", "right"], "Fuente: coeficientes del Manual MTC [1], Cuadro 12.13, pág. 141.");
    var cumple = snp + 1e-9 >= s.SNr;
    d.p(["Verificación: SN provisto = ", { text: f(snp, 3), bold: true }, cumple ? " mayor o igual al SN requerido = " : " menor que el SN requerido = ", { text: f(s.SNr, 3), bold: true }, ". La estructura ", { text: cumple ? "cumple" : "NO cumple", bold: true }, " el criterio de diseño."]);
    var g = (function () { var x = snp, lo = 0.05, hi = 30; var fN = function (SN) { return terminosFlex(1, p, s.MR, SN).suma; }; return Math.pow(10, fN(x)); })();
    d.p("Con el SN provisto, la ecuación de diseño admite un tránsito de W₁₈ admisible = " + ent(g) + " EE, frente a W₁₈ de diseño = " + ent(W18) + " EE" + (g >= W18 ? " (reserva de " + f((g / W18 - 1) * 100, 1) + " %)." : " (déficit de " + f((1 - g / W18) * 100, 1) + " %)."));
    var capasFig = capas.filter(function (c) { return c.d > 0; }).map(function (c) { return { d: c.d, t: c.nombre.split(" (")[0].replace(/ CBR.*$/, "").replace(/compactada.*/, "") }; });
    var sec = seccionSVG(capasFig, "Subrasante (CBR = " + f(s.cbr, 1) + " %, " + cat.id + ")");
    d.fig(sec.svg, sec.w, "Sección típica de la estructura de pavimento flexible propuesta.");
    if (s.min) {
      var mm = s.min, dm = capas.map(function (c) { return c.d * 10; });
      var okB = dm[1] >= mm.base - 1e-9, minSup = capas[0].id === "carpeta_caliente" ? mm.caliente : capas[0].id === "carpeta_frio" ? mm.frio : null, okS = minSup == null ? true : dm[0] >= minSup;
      d.tabla("Espesores mínimos recomendados para " + tp.id, ["Capa", "Mínimo (mm)", "Adoptado (mm)", "Verificación"], [["Capa superficial", minSup == null ? "no indicado" : f(minSup, 0), f(dm[0], 0), minSup == null ? "—" : (okS ? "cumple" : "no cumple")], ["Base granular", f(mm.base, 0), f(dm[1], 0), okB ? "cumple" : "no cumple"]], ["*", 90, 90, 90], ["left", "right", "right", "center"], "Fuente: Manual MTC [1], Cuadro 12.17, pág. 145.");
    }
    d.h1("Comparación con el catálogo del Manual");
    if (s.cf != null) {
      var dif = s.SNr - s.cf;
      d.tabla("SN calculado frente al catálogo", ["Concepto", "SN"], [["SN del catálogo, Cuadro 12.16 (20 años), " + tp.id + ", " + cat.id, f(s.cf, 3)], ["SN calculado con la Ec. (1)", f(s.SNr, 3)], ["Diferencia", (dif >= 0 ? "+" : "") + f(dif, 3)]], ["*", 90], ["left", "right"], "Fuente: Manual MTC [1], Cuadro 12.16, pág. 144.");
      d.p(Math.abs(dif) > 0.15 ? "La diferencia es mayor que 0.15. Para tránsitos altos el catálogo del Manual no se reproduce con los parámetros que el propio Manual declara en los Cuadros 12.6 a 12.12 (la diferencia crece desde Tp5 y es del orden de 0.5 en Tp12 a Tp14). Esta memoria adopta los parámetros declarados, que conducen a un SN mayor (del lado de la seguridad). El Ingeniero Responsable debe decidir si adopta el valor calculado o el del catálogo." : "La diferencia es pequeña y la ecuación reproduce el catálogo del Manual.");
    } else d.p("El Manual no presenta SN de catálogo para la categoría " + cat.id + " (" + cat.nombre + "): requiere estabilización de suelos y Estudio Especial.");
    d.h1("Conclusiones y recomendaciones");
    var conc = ["Para W₁₈ = " + ent(W18) + " EE (" + tp.id + ") y subrasante " + cat.id + " con CBR = " + f(s.cbr, 1) + " %, el número estructural requerido es SN = " + f(s.SNr, 2) + ".", "La estructura adoptada (" + capas.map(function (c) { return f(c.d, 0) + " cm de " + c.nombre.split(" (")[0].toLowerCase().replace(/ cbr.*$/, ""); }).join("; ") + ") provee SN = " + f(snp, 2) + ", por lo que " + (cumple ? "cumple" : "no cumple") + " el diseño."];
    (s.avisos || []).forEach(function (a) { conc.push(a.x || a); });
    conc.push("La ecuación AASHTO no tiene solución única: el Manual [1] indica que el Ingeniero Proyectista debe analizar alternativas de estructura y su comportamiento, y cuidar el drenaje, la compactación al 100 % de la MDS y el control de calidad de los materiales.");
    d.ul(conc);
    firma(d, proy);
    secReferencias(d, ["mtc", "aashto", "trrl"]);
  }

  /* =====================================================================
     MEMORIA: RIGIDO
     ===================================================================== */
  function memRigido(s, proy, d) {
    var tp = s.tp, p = s.p, W18 = s.ee, calc = s.calc;
    portada(d, "Diseño de pavimento rígido", "Método AASHTO 93 · Manual de Carreteras MTC 2014", proy);
    d.h1("Generalidades");
    d.h2("Objeto");
    d.p("La presente memoria presenta el dimensionamiento de la losa de concreto de un pavimento rígido con subbase granular por el método de la Guía AASHTO 93 [2], con los parámetros y criterios del Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos del MTC [1].");
    secLimites(d);
    d.h1("Metodología");
    d.p("El espesor de losa D se obtiene resolviendo la ecuación AASHTO 93 para pavimentos de concreto, con D en pulgadas, el módulo de rotura S_c y el módulo elástico E_c del concreto en psi y el módulo de reacción k en psi por pulgada (Manual [1], pág. 234):");
    d.eq(TEX_RIG, "");
    d.tabla("Variables de la ecuación de diseño", ["Símbolo", "Descripción", "Unidad"], [
      [simb("W_{18}"), "Ejes equivalentes de 8.2 t en el carril y periodo de diseño (factores del Cuadro 6.4)", "EE"], [simb("Z_R"), "Desviación estándar normal asociada a la confiabilidad", "—"], [simb("S_o"), "Desviación estándar combinada", "—"],
      [simb("\\Delta PSI"), "Pérdida de serviciabilidad: P_i − P_t", "—"], [simb("P_t"), "Serviciabilidad final", "—"], [simb("S_c"), "Módulo de rotura del concreto a 28 días (MR)", "psi"], [simb("C_d"), "Coeficiente de drenaje", "—"],
      [simb("J"), "Coeficiente de transferencia de carga", "—"], [simb("E_c"), "Módulo elástico del concreto", "psi"], [simb("k"), "Módulo de reacción de la subrasante (o combinado k_c)", "psi/pulg"], [simb("D"), "Espesor de la losa", "pulg."]
    ], [55, "*", 70], ["center", "left", "left"], "Fuente: Manual MTC [1], págs. 227 a 234.");
    d.eq(String.raw`E_c = 57\,000\,\sqrt{f'_c}\quad (f'_c\ \text{en psi})`, "El módulo elástico se estima con la correlación de ACI [4] indicada por el Manual [1], pág. 231:");
    if (s.kcTxt) d.eq(String.raw`k_c = \left[1+\left(\frac{h}{38}\right)^{2}\left(\frac{K_1}{K_0}\right)^{2/3}\right]^{0.5} K_0`, "El módulo combinado con la subbase granular (h en cm, K en kg/cm³) es, según el Manual [1], pág. 230:");
    d.h1("Datos de entrada");
    d.tabla("Datos de entrada del diseño", ["Dato", "Valor"], [["Ejes equivalentes de diseño W₁₈", ent(W18) + " EE (factores de rígido)"], ["CBR de la subrasante", s.cbr ? f(s.cbr, 1) + " %" : "no indicado (se ingresó k)"], ["Transferencia de carga J", f(s.J, 1) + " — " + s.JTxt], ["Coeficiente de drenaje C_d", f(s.Cd, 2)], ["Resistencia del concreto", "MR = " + f(s.MRc, 0) + " kg/cm²; f'c = " + f(s.fc, 0) + " kg/cm²" + (s.propios ? " (propios)" : " (Cuadro 14.7)")]], [210, "*"], ["left", "left"], null);
    d.h1("Tránsito de diseño");
    if (s.trafico) d.p("El tránsito de diseño se obtuvo del estudio de tránsito de este proyecto con los factores de equivalencia de pavimento rígido (Cuadro 6.4): N_rep = " + ent(s.trafico.o.total) + " EE en " + f(s.trafico.n, 0) + " años.");
    else d.p("El tránsito de diseño W₁₈ = " + ent(W18) + " EE de 8.2 t fue ingresado como dato; debe sustentarse en el estudio de tránsito con los factores del Cuadro 6.4.");
    tablaTraficoRango(d, tp, W18);
    d.h1("Subrasante y subbase");
    d.p("Se adopta para la subrasante k = " + f(s.k_MPam, 0) + " MPa/m (" + ent(s.k_MPam * 3.683) + " pci)" + (s.kManual ? ", obtenido por ensayo de placa." : ", obtenido por interpolación de los rangos de CBR del catálogo del Manual [1], porque la correlación de la Figura 14.1 es gráfica.") + (s.kcTxt ? " Con el efecto de la subbase granular, k_c = " + s.kcTxt + "." : " No se consideró el efecto de la subbase (k_c)."));
    d.tabla("Rangos de CBR y módulo de reacción del catálogo", ["CBR (%)", "k (MPa/m)", "k (pci)"], D_.rigido.subrasante_modulo_k.rangos_catalogo_MR.map(function (r) { return [r.CBR.replace(">=", "mayor o igual a ").replace("<", "menor que "), palabrasRango(r.k_MPa_m), palabrasRango(r.k_pci)]; }), ["*", 110, 110], ["left", "center", "center"], "Fuente: Manual MTC [1], figuras 14.6 a 14.9, págs. 238 a 243.");
    d.p("La subbase granular tiene un espesor mínimo de 15 cm y un CBR mínimo de " + s.cbrSb + " % para el tráfico de diseño (Cuadro 14.6, pág. 231).");
    d.h1("Parámetros de diseño");
    d.tabla("Parámetros AASHTO 93 adoptados para " + tp.id, ["Parámetro", "Valor", "Fuente"], [
      ["Confiabilidad R", p.R + " %", "Cuadro 14.5, pág. 229"], ["Desviación normal Z_R", f(p.Zr, 3), "Cuadro 14.5, pág. 229"], ["Desviación estándar combinada S_o", f(p.So, 2), "Pág. 228"],
      ["Serviciabilidad inicial P_i", f(p.Pi, 2), "Cuadro 14.4, pág. 227"], ["Serviciabilidad final P_t", f(p.Pt, 2), "Cuadro 14.4, pág. 227"], ["ΔPSI", f(p.dPSI, 2), "Cuadro 14.4, pág. 227"],
      ["Módulo de rotura S_c", ent(calc.Sc_psi) + " psi (" + f(s.MRc, 0) + " kg/cm²)", s.propios ? "dato propio" : "Cuadro 14.7, pág. 231"], ["Módulo elástico E_c", ent(calc.Ec_psi) + " psi", "Ec. (2)"],
      ["Módulo de reacción k", ent(calc.k_pci) + " pci", s.kManual ? "ensayo" : "Fig. 14.1 / catálogo"], ["Coeficiente J", f(s.J, 1), "Cuadro 14.10, pág. 233"], ["Coeficiente de drenaje C_d", f(s.Cd, 2), "Cuadro 14.9, pág. 233"]
    ], [190, 120, "*"], ["left", "right", "left"], p.avisos && p.avisos.length ? limpia(p.avisos.join(" ")) : null);
    d.h1("Cálculo del espesor de losa");
    var mt = terminosRig(W18, p, calc, s.Cd, s.J, s.MRc, calc.k_pci, calc.Ec_psi, calc.Sc_psi, calc.D_in), tt = mt.t;
    d.p("Se resolvió la Ec. (1) por iteración para D. La Tabla " + (d.nT + 1) + " evalúa cada término con el espesor que satisface la ecuación, D = " + f(calc.D_in, 3) + " pulg. = " + f(calc.D_cm, 1) + " cm.");
    d.tabla("Verificación de la ecuación de diseño con D = " + f(calc.D_in, 3) + " pulg.", ["Núm.", "Expresión", "Valor"], [
      ["1", "Z_R · S_o = " + f(p.Zr, 3) + " × " + f(p.So, 2), f(tt[0], 4)], ["2", "7.35 · log₁₀(D + 1)", f(tt[1], 4)], ["3", "−0.06", f(tt[2], 4)], ["4", "log₁₀(ΔPSI / 3.0) / [1 + 1.624×10⁷ / (D + 1)^8.46]", f(tt[3], 4)],
      ["5", "(4.22 − 0.32 P_t) · log₁₀[ S_c C_d (D^0.75 − 1.132) / (215.63 J (D^0.75 − 18.42 / (E_c/k)^0.25)) ]", f(tt[4], 4)],
      [{ text: "Σ", bold: true }, { text: "log₁₀ W₁₈ calculado", bold: true }, { text: f(mt.suma, 4), bold: true }], ["", "log₁₀ W₁₈ de diseño = log₁₀(" + ent(W18) + ")", f(mt.objetivo, 4)]
    ], [40, "*", 70], ["center", "left", "right"], "Diferencia entre ambos miembros: " + f(Math.abs(mt.suma - mt.objetivo), 6) + ".");
    d.p([{ text: "Espesor de losa calculado: D = " + f(calc.D_cm, 1) + " cm.", bold: true }, " Se adopta " , { text: s.adoptado + " cm", bold: true }, " (redondeo al centímetro superior; el Manual fija un espesor mínimo de 15 cm, pág. 233)."]);
    var Dad = s.adoptado / 2.54, mta = terminosRig(W18, p, calc, s.Cd, s.J, s.MRc, calc.k_pci, calc.Ec_psi, calc.Sc_psi, Dad), Wadm = Math.pow(10, mta.suma);
    d.p("Con el espesor adoptado D = " + s.adoptado + " cm, la ecuación admite W₁₈ admisible = " + ent(Wadm) + " EE, frente a W₁₈ de diseño = " + ent(W18) + " EE (" + (Wadm >= W18 ? "reserva de " + f((Wadm / W18 - 1) * 100, 1) + " %" : "déficit de " + f((1 - Wadm / W18) * 100, 1) + " %") + ").");
    // curva D vs EE
    var pts = [], i, ee, kdis = calc.k_pci;
    for (i = 0; i <= 70; i++) {
      ee = 75000 * Math.pow(3e7 / 75000, i / 70); var t = C.tpDeEE(D_, ee); if (!t.id) continue; var pp = C.parametrosRigido(D_, t.id), rc = C.resistenciaConcreto(D_, ee);
      var r = C.espesorRigido({ W18: ee, Zr: pp.Zr, So: pp.So, dPSI: pp.dPSI, Pt: pp.Pt, MR_kgcm2: s.propios ? s.MRc : rc.MR_kg_cm2, fc_kgcm2: s.propios ? s.fc : rc.fc_kg_cm2, Cd: s.Cd, J: s.J, k_MPam: s.kEf });
      if (r) pts.push([ee, Math.max(15, r.D_cm)]);
    }
    var key = "J_" + Number(s.J).toFixed(1), cj = D_.rigido.catalogos_losa_cm[key], dots = [];
    if (cj && s.cbr) { var tab = cj.Tp0_a_Tp14 || cj.Tp0_a_Tp4, gk = C.grupoCbrRigido(s.cbr); D_.trafico.cuadro_6_15_pavimentados.rangos_EE.forEach(function (r, idx) { if (r.max && idx < tab[gk].length) dots.push({ x: r.max, y: tab[gk][idx] }); }); }
    var all = pts.map(function (q) { return q[1]; }).concat(dots.map(function (q) { return q.y; })), ymin = Math.floor(Math.min.apply(null, all) / 5) * 5 - 0, ymax = Math.ceil(Math.max.apply(null, all) / 5) * 5 + 2;
    var g1 = chart({ xmin: 75000, xmax: 3e7, xlog: true, ymin: ymin, ymax: ymax, xticks: xticksLog(75000, 3e7), xfmt: function (v) { return ent(v); }, yticks: (function () { var a = []; for (var v = ymin; v <= ymax; v += 5) a.push(v); return a; })(), yd: 0, xlabel: "Ejes equivalentes de 8.2 t (escala logarítmica)", ylabel: "Espesor de losa D (cm)", series: [{ pts: pts, c: "#000" }], dots: dots, mark: { x: W18, y: Math.max(15, calc.D_cm), t: "D = " + f(calc.D_cm, 1) + " cm" }, leyenda: [{ t: "Ec. AASHTO 93, J = " + f(s.J, 1) }].concat(dots.length ? [{ t: "Catálogo (Fig. " + cj.figuras + ")", punto: true }] : []) });
    d.fig(g1.svg, g1.w, "Espesor de losa en función del tránsito con los parámetros del proyecto. Los saltos corresponden al cambio de parámetros y de resistencia del concreto entre rangos de tráfico.");
    d.h1("Estructura de pavimento");
    d.tabla("Estructura adoptada", ["Capa", "Espesor", "Observación"], [["Losa de concreto", s.adoptado + " cm", "MR = " + f(s.MRc, 0) + " kg/cm²; f'c = " + f(s.fc, 0) + " kg/cm²"], ["Subbase granular", "15 cm", "CBR mínimo " + s.cbrSb + " %"], ["Subrasante", "—", s.cbr ? "CBR = " + f(s.cbr, 1) + " %; k = " + f(s.k_MPam, 0) + " MPa/m" : "k = " + f(s.k_MPam, 0) + " MPa/m"]], [120, 80, "*"], ["left", "right", "left"], "Fuente: espesores mínimos del Manual MTC [1], pág. 233 y Cuadro 14.6.");
    var sec = seccionSVG([{ d: s.adoptado, t: "Losa de concreto (f'c = " + f(s.fc, 0) + " kg/cm²)", fill: "#e8e8e8" }, { d: 15, t: "Subbase granular (CBR mínimo " + s.cbrSb + " %)", fill: "#b8b8b8" }], "Subrasante" + (s.cbr ? " (CBR = " + f(s.cbr, 1) + " %)" : ""));
    d.fig(sec.svg, sec.w, "Sección típica de la estructura de pavimento rígido adoptada.");
    d.h1("Comparación con el catálogo del Manual");
    if (s.catRig && !s.catRig.fuera) {
      d.tabla("Losa calculada frente al catálogo", ["Concepto", "Valor"], [["Losa del catálogo (Fig. " + s.catRig.figuras + "), grupo CBR " + s.catRig.grupo + " %, " + tp.id, s.catRig.losa_cm + " cm"], ["Losa calculada con la Ec. (1)", f(calc.D_cm, 1) + " cm"], ["Diferencia", (calc.D_cm - s.catRig.losa_cm >= 0 ? "+" : "") + f(calc.D_cm - s.catRig.losa_cm, 1) + " cm"]], ["*", 110], ["left", "right"], "Fuente: Manual MTC [1], págs. " + s.catRig.paginas.join(" y ") + ".");
      d.p("Las diferencias de hasta 1 cm son atribuibles al redondeo del catálogo y a la discretización de k y de la resistencia del concreto por grupo de tráfico.");
    } else d.p("El catálogo del Manual para J = " + f(s.J, 1) + " no cubre este nivel de tránsito.");
    d.h1("Conclusiones y recomendaciones");
    var conc = ["Para W₁₈ = " + ent(W18) + " EE (" + tp.id + ") y k = " + f(s.k_MPam, 0) + " MPa/m, el espesor de losa calculado es D = " + f(calc.D_cm, 1) + " cm; se adopta " + s.adoptado + " cm sobre subbase granular de 15 cm.", "Se verificó la ecuación de diseño con el espesor adoptado: W₁₈ admisible = " + ent(Wadm) + " EE."];
    (s.avisos || []).forEach(function (a) { conc.push(a.x || a); });
    conc.push("Se recomienda detallar juntas, pasadores y barras de unión según el valor de J adoptado, y controlar el módulo de rotura del concreto y la compactación de la subbase en obra.");
    d.ul(conc);
    firma(d, proy);
    secReferencias(d, ["mtc", "aashto", "trrl", "aci"]);
  }

  /* ---------- definicion del documento y descarga ---------- */
  var D_ = null;
  function definicion(d, tipo, proy) {
    var etq = { flexible: "Diseño de pavimento flexible", rigido: "Diseño de pavimento rígido", trafico: "Estudio de tránsito" }[tipo];
    return {
      info: { title: "Memoria de cálculo — " + etq + " — " + (proy.nombre || ""), author: proy.responsable || "ingenierIA.pe", subject: "Memoria de cálculo de pavimentos" },
      pageBreakBefore: function (nodo, siguientes) { return (nodo.style === "h1" || nodo.style === "h2") && siguientes.length === 0; },
      pageSize: "A4", pageMargins: [70, 75, 70, 70], defaultStyle: { font: "CMU", fontSize: 11, lineHeight: 1.18 },
      header: function (pag) { return pag === 1 ? null : { margin: [70, 30, 70, 0], stack: [{ columns: [{ text: "Memoria de cálculo · " + etq, italics: true, fontSize: 9 }, { text: corto(proy.nombre), italics: true, fontSize: 9, alignment: "right" }] }, { canvas: [{ type: "line", x1: 0, y1: 4, x2: 455, y2: 4, lineWidth: 0.4 }] }] }; },
      footer: function (pag) { return pag === 1 ? null : { text: String(pag - 1), alignment: "center", fontSize: 10, margin: [0, 25, 0, 0] }; },
      styles: {
        tit: { fontSize: 24, bold: true, alignment: "center", characterSpacing: 2 }, sub: { fontSize: 17, alignment: "center", margin: [0, 0, 0, 4] }, sub2: { fontSize: 12, italics: true, alignment: "center" },
        pieport: { fontSize: 9, italics: true, alignment: "center" },
        h1: { fontSize: 14, bold: true, margin: [0, 16, 0, 6], keepWithNext: true }, h1x: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] }, h2: { fontSize: 12, bold: true, margin: [0, 8, 0, 4], keepWithNext: true },
        p: { alignment: "justify", margin: [0, 0, 0, 6] }, cap: { fontSize: 10, margin: [0, 8, 0, 4] }, fuente: { fontSize: 9, italics: true, margin: [0, 0, 0, 10] }, ref: { fontSize: 10 }
      },
      content: d.c
    };
  }
  function registrarLayout() {
    window.pdfMake.tableLayouts = {
      booktabs: {
        hLineWidth: function (i, n) { return i === 0 || i === n.table.body.length ? 1.1 : i === 1 ? 0.55 : 0; }, vLineWidth: function () { return 0; },
        paddingTop: function () { return 3; }, paddingBottom: function () { return 3; }, paddingLeft: function () { return 5; }, paddingRight: function () { return 5; }
      }
    };
  }

  function generar(tipo, snap, proy, o) {
    o = o || {}; var base = o.baseUrl || "";
    return preparar(base).then(function () {
      D_ = snap.D; registrarLayout();
      var d = Doc();
      ({ flexible: memFlexible, rigido: memRigido, trafico: memTrafico })[tipo](snap, proy, d);
      var def = definicion(d, tipo, proy), pdf = window.pdfMake.createPdf(def), nombre = "Memoria_calculo_" + tipo + "_" + slug(proy.nombre) + ".pdf";
      if (o.blob) return new Promise(function (ok) { pdf.getBlob(ok); });
      pdf.download(nombre); return nombre;
    });
  }
  window.Memoria = { generar: generar };
})();
