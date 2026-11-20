/* Interfaz: el usuario elige una plantilla y se abre su formulario. Calculo en calc.js; tablas en kb/pavimentos. */
(function () {
  "use strict";
  var C = window.PavCalc, D = null, app = document.getElementById("app");
  var memo = { ee_flexible: null, ee_rigido: null }; // EE calculado en la plantilla de trafico, para reutilizar

  var PLANTILLAS = [
    { id: "flexible", ico: "🛣️", t: "Pavimento flexible", d: "Carpeta asfáltica, base y subbase granular. Calcula el número estructural (SN) y propone espesores.", m: "AASHTO 93 · Cap. XII del manual" },
    { id: "rigido", ico: "🧱", t: "Pavimento rígido", d: "Losa de concreto sobre subbase granular. Calcula el espesor de losa según transferencia de carga (J).", m: "AASHTO 93 · Cap. XIV del manual" },
    { id: "trafico", ico: "🚛", t: "Tráfico de diseño (EE)", d: "Convierte el conteo de vehículos pesados en ejes equivalentes de 8.2 t y el rango Tp.", m: "Cap. VI del manual" },
    { id: "catalogo", ico: "📋", t: "Catálogo rápido", d: "Con el Tp y el CBR, consulta la estructura del catálogo del manual sin hacer el cálculo completo.", m: "Cuadros 12.16, 12.17 y figuras 14.6 a 14.9" },
    { id: "urbano", ico: "🏙️", t: "Pavimento urbano", d: "Vías urbanas con la norma CE.010. Aún no está: falta cargar la norma y sus tablas.", m: "Próximamente", off: true }
  ];

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(v) { var x = parseFloat(String(v).replace(/,/g, "")); return isNaN(x) ? null : x; }
  function f(x, d) { return x == null || isNaN(x) ? "—" : x.toLocaleString("es-PE", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function ent(x) { return x == null ? "—" : Math.round(x).toLocaleString("es-PE"); }
  function sel(id, opciones, valor) {
    return '<select id="' + id + '">' + opciones.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(valor) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select>";
  }
  function campo(label, control, ayuda) { return '<div class="f"><label>' + label + "</label>" + control + (ayuda ? "<small>" + ayuda + "</small>" : "") + "</div>"; }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ""; }
  function marca(ok, txtOk, txtMal) { return '<span class="tag ' + (ok ? "ok" : "bad") + '">' + (ok ? txtOk : txtMal) + "</span>"; }

  /* ---------- enrutado ---------- */
  function ruta() { return (location.hash || "").replace(/^#\/?/, "") || "inicio"; }
  function render() {
    var r = ruta();
    if (r === "flexible") vistaFlexible();
    else if (r === "rigido") vistaRigido();
    else if (r === "trafico") vistaTrafico();
    else if (r === "catalogo") vistaCatalogo();
    else vistaInicio();
    window.scrollTo(0, 0);
  }
  function barra(titulo) {
    return '<div class="bar"><button class="back" type="button" id="volver">← Cambiar plantilla</button><h2>' + esc(titulo) + "</h2></div>";
  }
  function engancharVolver() { var b = document.getElementById("volver"); if (b) b.onclick = function () { location.hash = "#/"; }; }
  var PIE = '<p class="foot">Referencia de cálculo basada en el Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos (RD 10-2014-MTC/14). No sustituye el diseño del Ingeniero Responsable, que debe verificar la vigencia del manual y los estudios del proyecto.</p>';

  /* ---------- inicio: plantillas ---------- */
  function vistaInicio() {
    app.innerHTML =
      '<h2 class="big">¿Qué quieres diseñar?</h2>' +
      '<p class="lead">Elige una plantilla. Se abrirá el formulario con los datos que pide ese diseño y los resultados se calculan al instante con las tablas del manual MTC.</p>' +
      '<div class="cards">' + PLANTILLAS.map(function (p) {
        return p.off
          ? '<div class="card" aria-disabled="true"><span class="ico">' + p.ico + "</span><h3>" + p.t + "</h3><p>" + p.d + '</p><span class="met">' + p.m + "</span></div>"
          : '<a class="card" href="#/' + p.id + '"><span class="ico">' + p.ico + "</span><h3>" + p.t + "</h3><p>" + p.d + '</p><span class="met">' + p.m + "</span></a>";
      }).join("") + "</div>" + PIE;
  }

  /* ---------- helpers de resultados comunes ---------- */
  function tablaParametros(filas) {
    return '<div class="tbl"><table><tbody>' + filas.map(function (r) {
      return "<tr><th>" + r[0] + '</th><td class="n">' + r[1] + '</td><td class="src">' + (r[2] || "") + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }
  function notas(lista) {
    return lista.filter(Boolean).map(function (n) { return '<p class="nota ' + (n.t || "") + '">' + (n.t ? "⚠ " : "") + (n.x || n) + "</p>"; }).join("");
  }
  function opcionesTp() { return D.trafico.cuadro_6_15_pavimentados.rangos_EE.map(function (r) { return [r.id, r.id + " (" + ent(r.min) + " – " + (r.max ? ent(r.max) : "más") + " EE)"]; }); }

  /* =====================================================================
     PLANTILLA: PAVIMENTO FLEXIBLE
     ===================================================================== */
  function vistaFlexible() {
    var cap = D.flexible.cuadro_12_13_coeficientes_estructurales;
    var opSup = cap.capa_superficial.map(function (x) { return [x.id, x.nombre + (x.a ? " (a1 = " + x.a.toFixed(3) + "/cm)" : " (sin aporte estructural)")]; });
    var opBase = cap.base.map(function (x) { return [x.id, x.nombre + " (a2 = " + x.a.toFixed(3) + "/cm)"]; });
    var opSub = cap.subbase.map(function (x) { return [x.id, x.nombre + " (a3 = " + x.a.toFixed(3) + "/cm)"]; });
    app.innerHTML = barra("Diseño de pavimento flexible") +
      '<div class="aviso">Método AASHTO 93 con los parámetros del manual MTC. Una etapa de 10 o 20 años. El diseño en dos etapas está en las tablas pero aún no en esta calculadora.</div>' +
      '<div class="grid"><form class="panel" id="frm" autocomplete="off">' +
      "<fieldset><legend>1. Tráfico</legend>" +
      campo("Ejes equivalentes de diseño (EE de 8.2 t, carril de diseño)", '<input id="ee" type="number" min="1" step="any" inputmode="decimal" placeholder="ej. 2500000" value="' + (memo.ee_flexible || "") + '">',
        '¿No lo tienes? <a href="#/trafico">Calcúlalo en la plantilla de tráfico</a>.') +
      campo("Periodo de diseño", sel("per", [[10, "10 años"], [20, "20 años"]], 20), "El manual asume 20 años en sus catálogos y recomienda 10 para bajo volumen.") +
      "</fieldset><fieldset><legend>2. Subrasante</legend>" +
      campo("CBR de la subrasante (%)", '<input id="cbr" type="number" min="1" step="any" inputmode="decimal" placeholder="ej. 12">', "Aptas para subrasante: CBR ≥ 6 %.") +
      '<label class="chk"><input type="checkbox" id="mrOn"> Tengo el módulo resiliente de laboratorio</label>' +
      '<div class="f" id="mrBox" hidden><label>MR (psi)</label><input id="mr" type="number" min="1" step="any"></div>' +
      "</fieldset><fieldset><legend>3. Materiales de las capas</legend>" +
      campo("Capa superficial", sel("sup", opSup, "carpeta_caliente")) +
      campo("Base", sel("bas", opBase, "base_cbr80")) +
      campo("Subbase", sel("sub", opSub, "subbase_cbr40")) +
      '<div class="row">' + campo("m2 (drenaje base)", '<input id="m2" type="number" step="0.01" value="1.00">') + campo("m3 (drenaje subbase)", '<input id="m3" type="number" step="0.01" value="1.00">') + "</div>" +
      '<p class="nota">El manual asume m = 1.00 (Cuadro 12.15 da el rango según calidad de drenaje).</p>' +
      '</fieldset></form><div class="panel sticky" id="res"><p class="vac">Completa EE y CBR para ver el diseño.</p></div></div>' + PIE;
    engancharVolver();
    var frm = document.getElementById("frm");
    document.getElementById("mrOn").onchange = function () { document.getElementById("mrBox").hidden = !this.checked; };
    frm.addEventListener("input", calcularFlexible);
    calcularFlexible();
  }

  function calcularFlexible() {
    var res = document.getElementById("res"), ee = num(val("ee")), cbr = num(val("cbr"));
    if (!ee || !cbr) { res.innerHTML = '<p class="vac">Completa EE y CBR para ver el diseño.</p>'; return; }
    var tp = C.tpDeEE(D, ee);
    if (!tp.id) { res.innerHTML = notas([{ t: "b", x: tp.aviso }]); return; }
    var cat = C.categoriaSubrasante(cbr), p = C.parametrosFlexible(D, tp.id);
    var mrManual = document.getElementById("mrOn").checked ? num(val("mr")) : null;
    var MR = mrManual || C.mrDeCbr(cbr), W18 = ee;
    var SNr = C.snRequerido(W18, p.Zr, p.So, p.dPSI, MR);
    var m2 = num(val("m2")) || 1, m3 = num(val("m3")) || 1;
    var avisos = p.avisos.slice();
    if (tp.aviso) avisos.push({ t: "w", x: tp.aviso });
    if (!cat.apta) avisos.push({ t: "b", x: "CBR " + f(cbr, 1) + " % (" + cat.id + " " + cat.nombre + "): el manual no admite esta subrasante sin estabilización de suelos (Estudio Especial). El cálculo siguiente es solo referencial." });
    if (cbr > 30 || (cbr < 6 && !mrManual)) avisos.push({ t: "w", x: "El MR se obtiene de la correlación del Cuadro 12.5, que solo cubre CBR de 6 a 30 %. Fuera de ese rango es una extrapolación: usa el MR de laboratorio." });
    if (document.getElementById("per").value === "10" && ee > 1e6) avisos.push({ t: "w", x: "Para tráfico mayor a 1'000,000 EE el manual usa periodo de 20 años en sus catálogos." });
    if (SNr == null) { res.innerHTML = notas([{ t: "b", x: "No se pudo resolver la ecuación con estos datos." }]); return; }
    var prop = C.proponerFlexible(D, { SNr: SNr, tpId: tp.id, superficie: val("sup"), base: val("bas"), subbase: val("sub"), m2: m2, m3: m3 });
    avisos = avisos.concat(prop.avisos);
    var cf = C.catalogoFlexible(D, tp.id, cbr), min = C.minimosFlexible(D, tp.id);
    var dif = cf.SN != null ? SNr - cf.SN : null;
    var nota12_16 = null;
    if (dif != null && Math.abs(dif) > 0.15) nota12_16 = { t: "w", x: "El SN calculado difiere " + f(Math.abs(dif), 2) + " del Cuadro 12.16. Para tráficos altos el catálogo del manual no se reproduce con los parámetros que el propio manual declara (Cuadros 12.6 a 12.12). Esta calculadora usa los parámetros declarados." };

    res.innerHTML =
      '<div class="kpis"><div class="kpi"><small>Rango de tráfico</small><span class="big-n">' + tp.id + '</span></div>' +
      '<div class="kpi"><small>SN requerido</small><span class="big-n">' + f(SNr, 2) + '</span></div>' +
      '<div class="kpi"><small>Subrasante</small><span class="big-n">' + cat.id + '</span><small>' + cat.nombre + "</small></div></div>" +
      notas(avisos) +
      "<h3 class=\"sec\">Parámetros AASHTO 93 usados</h3>" +
      tablaParametros([
        ["W18 (EE de diseño)", ent(W18), "Cap. VI"],
        ["Confiabilidad R", p.R + " %", "Cuadro 12.6"],
        ["Zr", f(p.Zr, 3), "Cuadro 12.8"],
        ["So", f(p.So, 2), "pág. 136"],
        ["Pi / Pt / ΔPSI", f(p.Pi, 2) + " / " + f(p.Pt, 2) + " / " + f(p.dPSI, 2), "Cuadros 12.10 a 12.12"],
        ["MR (psi)", ent(MR) + (mrManual ? " (laboratorio)" : " (correlación CBR)"), mrManual ? "dato del usuario" : "Cuadro 12.5 (TRRL)"]
      ]) +
      '<h3 class="sec">Propuesta de estructura <small class="src">(edita los espesores)</small></h3>' +
      '<div class="tbl"><table><thead><tr><th>Capa</th><th class="n">a (1/cm)</th><th class="n">m</th><th class="n">Espesor (cm)</th><th class="n">SN capa</th></tr></thead><tbody>' +
      filaCapa("Superficial: " + prop.sup.nombre.split(" (")[0], prop.sup.a || 0, 1, prop.d1, 1, "d1") +
      filaCapa("Base: " + prop.bas.nombre.split(" (")[0], prop.bas.a, m2, prop.d2, 1, "d2") +
      filaCapa("Subbase: " + prop.sub.nombre.split(" (")[0], prop.sub.a, m3, prop.d3, 5, "d3") +
      '<tr><th colspan="4">SN provisto</th><td class="n" id="snProv"></td></tr></tbody></table></div>' +
      '<p id="snEstado"></p>' +
      (min ? '<p class="nota">Mínimos del manual para ' + tp.id + " (Cuadro 12.17): base granular " + min.base + " mm; carpeta en caliente " + min.caliente + " mm" + (min.frio ? ", en frío " + min.frio + " mm" : "") + (min.micropavimento ? ", micropavimento " + min.micropavimento + " mm" : "") + ".</p>" : "") +
      (prop.d3 === 0 ? '<p class="nota">Con los espesores mínimos de carpeta y base el SN ya se cumple: la subbase no es necesaria por cálculo. Verifica el criterio de proyecto.</p>' : "") +
      "<h3 class=\"sec\">Comparación con el catálogo del manual</h3>" +
      (cf.SN != null
        ? tablaParametros([["SN del catálogo (Cuadro 12.16, 20 años)", f(cf.SN, 3), cf.categoria.id + " " + cf.categoria.nombre], ["SN calculado aquí", f(SNr, 3), "diferencia " + (dif >= 0 ? "+" : "") + f(dif, 3)]])
        : '<p class="nota">El catálogo no da SN para esta subrasante (' + cat.id + ").</p>") +
      notas([nota12_16, { x: "La ecuación AASHTO no tiene solución única: el manual pide que el Ingeniero Proyectista analice alternativas de estructura y su comportamiento." }]) +
      '<p class="src">Fuentes: ecuación pág. 131; coeficientes Cuadro 12.13 (pág. 141); espesores mínimos Cuadro 12.17 (pág. 145).</p>';

    var inputs = res.querySelectorAll("input[data-capa]");
    function recalSN() {
      var capas = [];
      inputs.forEach(function (i) {
        var d = num(i.value) || 0;
        capas.push({ a: parseFloat(i.dataset.a), m: parseFloat(i.dataset.m), d_cm: d });
        i.closest("tr").querySelector(".snc").textContent = f(parseFloat(i.dataset.a) * parseFloat(i.dataset.m) * d, 3);
      });
      var sn = C.snCapas(capas);
      document.getElementById("snProv").textContent = f(sn, 3);
      document.getElementById("snEstado").innerHTML = marca(sn + 1e-9 >= SNr, "Cumple: SN provisto ≥ SN requerido (" + f(SNr, 2) + ")", "No cumple: faltan " + f(SNr - sn, 2) + " de SN");
    }
    inputs.forEach(function (i) { i.addEventListener("input", recalSN); });
    recalSN();
  }
  function filaCapa(nombre, a, m, d, paso, id) {
    return "<tr><td>" + esc(nombre) + '</td><td class="n">' + f(a, 3) + '</td><td class="n">' + f(m, 2) + '</td><td class="n"><input data-capa="' + id + '" data-a="' + a + '" data-m="' + m + '" type="number" min="0" step="' + paso + '" value="' + d + '" style="width:86px"></td><td class="n snc"></td></tr>';
  }

  /* =====================================================================
     PLANTILLA: PAVIMENTO RIGIDO
     ===================================================================== */
  function vistaRigido() {
    var opJ = [["2.8", "J = 2.8 · con pasadores, berma de concreto"], ["3.2", "J = 3.2 · con pasadores, berma granular o asfáltica (el que asume el manual)"], ["3.8", "J = 3.8 · sin pasadores, berma de concreto"], ["4.0", "J = 4.0 · sin pasadores, berma granular o asfáltica (hasta 1'000,000 EE)"]];
    app.innerHTML = barra("Diseño de pavimento rígido") +
      '<div class="aviso">Ecuación AASHTO 93 para losa de concreto con los parámetros del manual MTC. Los catálogos del manual son referenciales y no sustituyen al Ingeniero Responsable.</div>' +
      '<div class="grid"><form class="panel" id="frm" autocomplete="off">' +
      "<fieldset><legend>1. Tráfico</legend>" +
      campo("Ejes equivalentes de diseño (EE de 8.2 t, carril de diseño)", '<input id="ee" type="number" min="1" step="any" inputmode="decimal" placeholder="ej. 6000000" value="' + (memo.ee_rigido || "") + '">',
        'En pavimento rígido los factores de EE son distintos (Cuadro 6.4). <a href="#/trafico">Calcúlalo en la plantilla de tráfico</a>.') +
      "</fieldset><fieldset><legend>2. Subrasante y subbase</legend>" +
      campo("CBR de la subrasante (%)", '<input id="cbr" type="number" min="1" step="any" inputmode="decimal" placeholder="ej. 12">', "Se convierte a módulo de reacción k por interpolación de los rangos del catálogo (la Figura 14.1 del manual es gráfica).") +
      '<label class="chk"><input type="checkbox" id="kOn"> Tengo k de ensayo de placa</label>' +
      '<div class="f" id="kBox" hidden><label>k (MPa/m)</label><input id="k" type="number" min="1" step="any"></div>' +
      '<label class="chk"><input type="checkbox" id="kcOn"> Considerar el efecto de la subbase (Kc)</label>' +
      '<div id="kcBox" hidden><div class="row">' + campo("Espesor subbase h (cm)", '<input id="h" type="number" step="1" value="15">') + campo("K1 subbase (kg/cm³)", '<input id="k1" type="number" step="any" placeholder="dato de ensayo">') + "</div></div>" +
      "</fieldset><fieldset><legend>3. Juntas y drenaje</legend>" +
      campo("Transferencia de carga (J)", sel("J", opJ, "3.2")) +
      campo("Coeficiente de drenaje Cd", '<input id="cd" type="number" step="0.01" value="1.00">', "El manual asume 1.00 (rango 0.70 a 1.25, Cuadro 14.9).") +
      "</fieldset><fieldset><legend>4. Concreto</legend>" +
      '<label class="chk"><input type="checkbox" id="cOn"> Usar resistencias propias</label>' +
      '<div id="cBox" hidden><div class="row">' + campo("MR (kg/cm²)", '<input id="mrc" type="number" step="any">') + campo("f\'c (kg/cm²)", '<input id="fc" type="number" step="any">') + "</div></div>" +
      '<p class="nota">Por defecto se usan los valores del Cuadro 14.7 según el tráfico.</p>' +
      '</fieldset></form><div class="panel sticky" id="res"><p class="vac">Completa EE y CBR para ver el diseño.</p></div></div>' + PIE;
    engancharVolver();
    var show = function (chk, box) { document.getElementById(chk).onchange = function () { document.getElementById(box).hidden = !this.checked; }; };
    show("kOn", "kBox"); show("kcOn", "kcBox"); show("cOn", "cBox");
    document.getElementById("frm").addEventListener("input", calcularRigido);
    document.getElementById("frm").addEventListener("change", calcularRigido);
    calcularRigido();
  }

  function calcularRigido() {
    var res = document.getElementById("res"), ee = num(val("ee")), cbr = num(val("cbr"));
    var kManual = document.getElementById("kOn").checked ? num(val("k")) : null;
    if (!ee || (!cbr && !kManual)) { res.innerHTML = '<p class="vac">Completa EE y CBR para ver el diseño.</p>'; return; }
    var tp = C.tpDeEE(D, ee);
    if (!tp.id) { res.innerHTML = notas([{ t: "b", x: tp.aviso }]); return; }
    var p = C.parametrosRigido(D, tp.id), J = parseFloat(val("J")), Cd = num(val("cd")) || 1;
    var avisos = p.avisos.slice();
    if (tp.aviso) avisos.push({ t: "w", x: tp.aviso });
    if (J === 4.0 && ee > 1e6) avisos.push({ t: "b", x: "J = 4.0 (sin pasadores, berma granular) solo aplica hasta 1'000,000 EE (nota de la Figura 14.9). Para este tráfico usa pasadores." });
    if (J === 3.8 && ee > 1e6) avisos.push({ t: "w", x: "El catálogo con J = 3.8 solo llega a Tp4 (1'000,000 EE)." });
    var resC = C.resistenciaConcreto(D, ee), usoProp = document.getElementById("cOn").checked;
    var MRc = usoProp && num(val("mrc")) ? num(val("mrc")) : resC.MR_kg_cm2;
    var fc = usoProp && num(val("fc")) ? num(val("fc")) : resC.fc_kg_cm2;
    var k = kManual || C.kDeCbr(cbr);
    if (!kManual && cbr < 6) avisos.push({ t: "b", x: "CBR " + f(cbr, 1) + " % < 6 %: subrasante no apta sin estabilización (Estudio Especial). El catálogo marca el espesor de estabilización con (*)." });
    var k0kg = k * C.MPAM_A_KGCM3, kEf = k, kcTxt = null;
    if (document.getElementById("kcOn").checked) {
      var h = num(val("h")), K1 = num(val("k1"));
      if (h && K1) { var Kc = C.kc(h, K1, k0kg); kEf = Kc / C.MPAM_A_KGCM3; kcTxt = f(Kc, 2) + " kg/cm³ (" + f(kEf, 0) + " MPa/m)"; }
      else avisos.push({ t: "w", x: "Para usar Kc ingresa h y K1 de la subbase; mientras tanto se usa k de la subrasante." });
    }
    var calc = C.espesorRigido({ W18: ee, Zr: p.Zr, So: p.So, dPSI: p.dPSI, Pt: p.Pt, MR_kgcm2: MRc, fc_kgcm2: fc, Cd: Cd, J: J, k_MPam: kEf });
    if (!calc) { res.innerHTML = notas([{ t: "b", x: "No se pudo resolver la ecuación con estos datos." }]); return; }
    var adoptado = Math.max(15, Math.ceil(calc.D_cm - 1e-9));
    var cbrCat = cbr || 10, cat = C.catalogoRigido(D, J, tp.id, cbrCat);
    var cbrSb = C.cbrMinSubbase(ee);
    if (kManual) avisos.push({ t: "w", x: "Con k ingresado el grupo del catálogo se toma con CBR " + cbrCat + " % (referencial)." });
    res.innerHTML =
      '<div class="kpis"><div class="kpi"><small>Rango de tráfico</small><span class="big-n">' + tp.id + '</span></div>' +
      '<div class="kpi"><small>Losa calculada</small><span class="big-n">' + f(calc.D_cm, 1) + ' cm</span></div>' +
      '<div class="kpi"><small>Losa a adoptar</small><span class="big-n">' + adoptado + ' cm</span><small>mín. 15 cm, redondeo a 1 cm</small></div></div>' +
      notas(avisos) +
      "<h3 class=\"sec\">Parámetros AASHTO 93 usados</h3>" +
      tablaParametros([
        ["W18 (EE de diseño)", ent(ee), "Cap. VI, factores rígido"],
        ["Confiabilidad R / Zr", p.R + " % / " + f(p.Zr, 3), "Cuadro 14.5"],
        ["So", f(p.So, 2), "pág. 228"],
        ["Pi / Pt / ΔPSI", f(p.Pi, 2) + " / " + f(p.Pt, 2) + " / " + f(p.dPSI, 2), "Cuadro 14.4"],
        ["MR concreto / f'c", f(MRc, 0) + " / " + f(fc, 0) + " kg/cm²" + (usoProp ? " (propios)" : ""), "Cuadro 14.7"],
        ["Ec (psi)", ent(calc.Ec_psi), "57,000·√f'c"],
        ["k subrasante", f(k, 0) + " MPa/m (" + ent(k * 3.683) + " pci)" + (kManual ? " (ensayo)" : ""), kManual ? "dato del usuario" : "interpolado del catálogo"],
        kcTxt ? ["Kc con subbase", kcTxt, "pág. 230"] : ["Kc", "no aplicado", ""],
        ["J / Cd", f(J, 1) + " / " + f(Cd, 2), "Cuadros 14.9 y 14.10"]
      ]) +
      "<h3 class=\"sec\">Estructura</h3>" +
      '<div class="tbl"><table><thead><tr><th>Capa</th><th class="n">Espesor</th></tr></thead><tbody><tr><td>Losa de concreto</td><td class="n">' + adoptado + ' cm</td></tr><tr><td>Subbase granular</td><td class="n">15 cm (mínimo del manual)</td></tr></tbody></table></div>' +
      '<p class="nota">CBR mínimo de la subbase granular: ' + cbrSb + " % (Cuadro 14.6).</p>" +
      "<h3 class=\"sec\">Comparación con el catálogo del manual</h3>" +
      (cat && !cat.fuera
        ? tablaParametros([["Losa del catálogo (Fig. " + cat.figuras + ")", cat.losa_cm + " cm", "grupo CBR " + cat.grupo + ", subbase 15 cm"], ["Losa calculada aquí", f(calc.D_cm, 1) + " cm", "diferencia " + f(calc.D_cm - cat.losa_cm, 1) + " cm"]]) + (cat.estabilizar ? '<p class="nota w">⚠ En CBR &lt; 6 % el espesor de estabilización lo define un estudio específico.</p>' : "")
        : '<p class="nota">El catálogo con J = ' + f(J, 1) + " no cubre este tráfico.</p>") +
      '<p class="src">Fuentes: ecuación pág. 234; catálogos págs. 238 a 243.</p>';
  }

  /* =====================================================================
     PLANTILLA: TRAFICO
     ===================================================================== */
  var vehs = [];
  function nuevoVeh() { return { nombre: "Vehículo " + (vehs.length + 1), imd: "", modo: "ejes", fvp: "", ejes: [{ tipo: "simple_rueda_simple", P: "" }, { tipo: "simple_rueda_doble", P: "" }] }; }
  var NOM_EJE = { simple_rueda_simple: "Eje simple, rueda simple", simple_rueda_doble: "Eje simple, rueda doble", tandem_1RS_1RD: "Tándem (1 RS + 1 RD)", tandem_2RD: "Tándem (2 RD)", tridem_2RD_1RS: "Trídem (2 RD + 1 RS)", tridem_3RD: "Trídem (3 RD)" };

  function vistaTrafico() {
    if (!vehs.length) vehs.push(nuevoVeh());
    var filas = D.trafico.cuadro_6_1_factores_direccional_y_carril.filas;
    var opCarril = filas.map(function (r, i) { return [i, r.calzadas + " calzada(s), " + r.sentidos + " sentido(s), " + r.carriles_por_sentido + " carril(es) por sentido"]; });
    app.innerHTML = barra("Tráfico de diseño (EE)") +
      '<div class="aviso">Calcula el número de repeticiones de ejes equivalentes (Nrep) y el rango Tp. Las cargas por eje deben salir del censo de cargas del proyecto, no del ejemplo.</div>' +
      '<div class="grid"><form class="panel" id="frm" autocomplete="off">' +
      "<fieldset><legend>1. Tipo de pavimento</legend>" + campo("Los factores de EE cambian según el tipo", sel("pav", [["flexible", "Flexible / semirrígido (Cuadro 6.3)"], ["rigido", "Rígido (Cuadro 6.4)"]], "flexible")) +
      "</fieldset><fieldset><legend>2. Carril de diseño</legend>" + campo("Sección de la vía (Cuadro 6.1)", sel("carril", opCarril, 5)) +
      '<p class="nota" id="fdfc"></p></fieldset>' +
      "<fieldset><legend>3. Crecimiento</legend>" +
      '<div class="row">' + campo("Periodo n (años)", '<input id="n" type="number" min="1" step="1" value="20">') + campo("Tasa anual r (%)", '<input id="r" type="number" min="0" step="0.1" value="3">') + "</div>" +
      '<p class="nota">El manual indica tasas típicas de 2 % a 6 % (pág. 64).</p></fieldset>' +
      '<fieldset id="fsFp"><legend>4. Presión de neumáticos (solo flexible)</legend>' +
      '<label class="chk"><input type="checkbox" id="fpOn"> Aplicar factor de presión Fp (Cuadro 6.13)</label>' +
      '<div id="fpBox" hidden><div class="row">' + campo("Espesor de rodadura (mm)", '<input id="esp" type="number" step="10" value="100">') + campo("Presión de inflado (psi)", '<input id="psi" type="number" step="1" value="100">') + "</div></div>" +
      '<p class="nota">Sin marcar, Fp = 1.00. En rígido y afirmados siempre es 1.00.</p></fieldset>' +
      "<fieldset><legend>5. Vehículos pesados (buses y camiones)</legend><div id=\"vehs\"></div>" +
      '<button type="button" class="act sec sm" id="addVeh">+ Agregar tipo de vehículo</button></fieldset>' +
      '</form><div class="panel sticky" id="res"><p class="vac">Ingresa al menos un vehículo con IMD y cargas por eje.</p></div></div>' + PIE;
    engancharVolver();
    dibujarVehs();
    var frm = document.getElementById("frm");
    document.getElementById("fpOn").onchange = function () { document.getElementById("fpBox").hidden = !this.checked; };
    document.getElementById("addVeh").onclick = function () { vehs.push(nuevoVeh()); dibujarVehs(); calcularTrafico(); };
    frm.addEventListener("input", function (e) { if (!e.target.dataset.v) calcularTrafico(); });
    frm.addEventListener("change", function () { calcularTrafico(); });
    calcularTrafico();
  }

  function dibujarVehs() {
    var box = document.getElementById("vehs");
    box.innerHTML = vehs.map(function (v, i) {
      return '<div class="veh"><div class="r">' + campo("Nombre", '<input data-v="nombre" data-i="' + i + '" value="' + esc(v.nombre) + '">') +
        campo("IMD (veh/día)", '<input data-v="imd" data-i="' + i + '" type="number" min="0" step="any" value="' + esc(v.imd) + '">') +
        '<button type="button" class="act sec sm" data-del="' + i + '" aria-label="Quitar vehículo">✕</button></div>' +
        '<label class="chk"><input type="checkbox" data-v="modo" data-i="' + i + '"' + (v.modo === "fvp" ? " checked" : "") + '> Ya tengo el factor vehículo pesado (Fvp)</label>' +
        (v.modo === "fvp"
          ? campo("Fvp (EE por vehículo)", '<input data-v="fvp" data-i="' + i + '" type="number" min="0" step="any" value="' + esc(v.fvp) + '">')
          : v.ejes.map(function (e, j) {
            return '<div class="eje">' + sel("x" + i + "_" + j, Object.keys(NOM_EJE).map(function (k) { return [k, NOM_EJE[k]]; }), e.tipo).replace("<select", '<select data-v="eje-tipo" data-i="' + i + '" data-j="' + j + '"') +
              '<input data-v="eje-P" data-i="' + i + '" data-j="' + j + '" type="number" min="0" step="any" placeholder="tn" value="' + esc(e.P) + '"><button type="button" class="act sec sm" data-delej="' + i + "," + j + '" aria-label="Quitar eje">✕</button></div>';
          }).join("") + '<button type="button" class="act sec sm" data-addej="' + i + '">+ Eje</button>') + "</div>";
    }).join("");
    box.querySelectorAll("[data-v]").forEach(function (el) {
      var h = function () {
        var i = +el.dataset.i, v = vehs[i], k = el.dataset.v;
        if (k === "modo") { v.modo = el.checked ? "fvp" : "ejes"; dibujarVehs(); }
        else if (k === "eje-tipo") v.ejes[+el.dataset.j].tipo = el.value;
        else if (k === "eje-P") v.ejes[+el.dataset.j].P = el.value;
        else v[k] = el.value;
        calcularTrafico();
      };
      el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", h);
    });
    box.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { vehs.splice(+b.dataset.del, 1); if (!vehs.length) vehs.push(nuevoVeh()); dibujarVehs(); calcularTrafico(); }; });
    box.querySelectorAll("[data-addej]").forEach(function (b) { b.onclick = function () { vehs[+b.dataset.addej].ejes.push({ tipo: "simple_rueda_doble", P: "" }); dibujarVehs(); }; });
    box.querySelectorAll("[data-delej]").forEach(function (b) { b.onclick = function () { var p = b.dataset.delej.split(","); vehs[+p[0]].ejes.splice(+p[1], 1); dibujarVehs(); calcularTrafico(); }; });
  }

  function calcularTrafico() {
    var res = document.getElementById("res"), pav = val("pav");
    document.getElementById("fsFp").hidden = pav === "rigido";
    var fila = D.trafico.cuadro_6_1_factores_direccional_y_carril.filas[+val("carril")];
    document.getElementById("fdfc").textContent = "Fd = " + f(fila.Fd, 2) + " · Fc = " + f(fila.Fc, 2) + " · Fd × Fc = " + f(fila.ponderado, 2);
    var n = num(val("n")), r = (num(val("r")) || 0) / 100;
    if (!n) { res.innerHTML = '<p class="vac">Ingresa el periodo de diseño.</p>'; return; }
    var Fp = null, fpInfo = null;
    if (pav === "flexible" && document.getElementById("fpOn").checked) { var q = C.factorPresion(D, num(val("esp")) || 50, num(val("psi")) || 80); Fp = q.Fp; fpInfo = q; }
    var avisos = [], lista = [];
    vehs.forEach(function (v) {
      var imd = num(v.imd);
      var fv = v.modo === "fvp" ? num(v.fvp) : (v.ejes.some(function (e) { return num(e.P) > 0; }) ? C.fvp(D, pav, v.ejes.filter(function (e) { return num(e.P) > 0; }).map(function (e) { return { tipo: e.tipo, P: num(e.P) }; })) : null);
      if (imd > 0 && fv != null && fv > 0) lista.push({ nombre: v.nombre, imd: imd, fvp: fv });
    });
    if (!lista.length) { res.innerHTML = '<p class="vac">Ingresa al menos un vehículo con IMD y cargas por eje.</p>'; return; }
    var o = C.nrepEE(lista, { Fd: fila.Fd, Fc: fila.Fc, r: r, n: n, Fp: Fp });
    var tp = C.tpDeEE(D, o.total);
    if (tp.aviso) avisos.push({ t: "w", x: tp.aviso });
    if (tp.id === null) avisos.push({ t: "w", x: "El resultado queda fuera del rango de caminos pavimentados del manual." });
    if (n !== 10 && n !== 20) avisos.push({ x: "El manual trabaja con periodos de 10 y 20 años." });
    var destino = pav === "rigido" ? "rigido" : "flexible";
    memo["ee_" + destino] = Math.round(o.total);
    res.innerHTML =
      '<div class="kpis"><div class="kpi"><small>Nrep EE de 8.2 t</small><span class="big-n">' + ent(o.total) + '</span></div>' +
      '<div class="kpi"><small>Rango de tráfico</small><span class="big-n">' + (tp.id || "—") + '</span></div>' +
      '<div class="kpi"><small>Factor de crecimiento Fca</small><span class="big-n">' + f(o.Fca, 2) + "</span></div></div>" +
      notas(avisos) +
      '<div class="tbl"><table><thead><tr><th>Vehículo</th><th class="n">IMD</th><th class="n">Fvp</th><th class="n">Fp</th><th class="n">EE día-carril</th><th class="n">Nrep EE</th></tr></thead><tbody>' +
      o.filas.map(function (x, i) { return "<tr><td>" + esc(x.nombre) + '</td><td class="n">' + ent(lista[i].imd) + '</td><td class="n">' + f(lista[i].fvp, 3) + '</td><td class="n">' + f(x.Fp, 2) + '</td><td class="n">' + f(x.eeDia, 2) + '</td><td class="n">' + ent(x.nrep) + "</td></tr>"; }).join("") +
      '<tr><th colspan="5">Total</th><td class="n"><b>' + ent(o.total) + "</b></td></tr></tbody></table></div>" +
      '<p class="nota">Nrep = Σ [IMD × Fd × Fc × Fvp × Fp × Fca × 365] (pág. 73). Fca = ((1+r)ⁿ − 1) / r, calculado con la fórmula (la tabla impresa del Cuadro 6.2 trae un valor erróneo para n = 5, r = 3 %).</p>' +
      (fpInfo ? '<p class="nota">Presión de contacto PCN = 0.90 × inflado = ' + f(fpInfo.PCN, 1) + " psi; Fp = " + f(fpInfo.Fp, 2) + " (Cuadro 6.13, interpolado).</p>" : "") +
      '<p><a class="card" style="min-height:0;padding:12px 16px;display:inline-block" href="#/' + destino + '">Usar ' + ent(o.total) + " EE en la plantilla de pavimento " + destino + " →</a></p>" +
      '<p class="src">Fuentes: Cuadros 6.1 a 6.4 y 6.13, págs. 64 a 73.</p>';
  }

  /* =====================================================================
     PLANTILLA: CATALOGO RAPIDO
     ===================================================================== */
  function vistaCatalogo() {
    app.innerHTML = barra("Catálogo rápido de estructuras") +
      '<div class="aviso">Consulta la estructura que el manual propone para un Tp y un CBR. Son catálogos ilustrativos: no sustituyen el diseño.</div>' +
      '<div class="grid"><form class="panel" id="frm" autocomplete="off">' +
      campo("Rango de tráfico", sel("tp", opcionesTp(), "Tp5")) +
      campo("CBR de la subrasante (%)", '<input id="cbr" type="number" min="1" step="any" value="12">') +
      '</form><div class="panel" id="res"></div></div>' + PIE;
    engancharVolver();
    var frm = document.getElementById("frm"), go = function () {
      var tp = val("tp"), cbr = num(val("cbr")), res = document.getElementById("res");
      if (!cbr) { res.innerHTML = '<p class="vac">Ingresa el CBR.</p>'; return; }
      var cf = C.catalogoFlexible(D, tp, cbr), min = C.minimosFlexible(D, tp), cat = cf.categoria, html = "";
      html += '<h3 class="sec">Flexible (20 años)</h3>';
      html += cf.SN != null ? tablaParametros([["Subrasante", cat.id + " " + cat.nombre, "Cuadro 12.4"], ["SN requerido", f(cf.SN, 3), "Cuadro 12.16"]]) : '<p class="nota b">⚠ Subrasante ' + cat.id + " (" + cat.nombre + "): requiere estabilización, Estudio Especial.</p>";
      html += min ? tablaParametros([["Carpeta asfáltica en caliente (mín.)", min.caliente + " mm", "Cuadro 12.17"], ["Base granular (mín.)", min.base + " mm", "Cuadro 12.17"]]) : '<p class="nota">Tp0 no tiene mínimos en el Cuadro 12.17.</p>';
      html += '<h3 class="sec">Rígido (20 años, subbase granular 15 cm)</h3><div class="tbl"><table><thead><tr><th>J</th><th>Condición</th><th class="n">Losa</th><th>Figura</th></tr></thead><tbody>';
      [["2.8", "pasadores + berma de concreto"], ["3.2", "pasadores + berma granular/asfáltica"], ["3.8", "sin pasadores + berma de concreto"], ["4.0", "sin pasadores + berma granular/asfáltica"]].forEach(function (j) {
        var c = C.catalogoRigido(D, j[0], tp, cbr);
        html += "<tr><td>" + j[0] + "</td><td>" + j[1] + '</td><td class="n">' + (c && !c.fuera ? c.losa_cm + " cm" : "no cubre este tráfico") + "</td><td>" + (c ? c.figuras : "") + "</td></tr>";
      });
      html += "</tbody></table></div>" + (cbr < 6 ? '<p class="nota w">⚠ CBR &lt; 6 %: en el catálogo rígido se indica estabilización de suelos (*), definida por estudio específico.</p>' : "");
      res.innerHTML = html;
    };
    frm.addEventListener("input", go); frm.addEventListener("change", go); go();
  }

  /* ---------- arranque ---------- */
  fetch("../kb/pavimentos/manual-mtc-2014-tablas.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
    D = j; window.addEventListener("hashchange", render); render();
  }).catch(function (e) {
    app.innerHTML = '<p class="aviso">No se pudieron cargar las tablas del manual (' + esc(e.message) + "). Abre la página desde un servidor web, no como archivo local.</p>";
  });
})();
