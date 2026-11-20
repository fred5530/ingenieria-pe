/* Motor de calculo de pavimentos. Todas las tablas salen de kb/pavimentos/manual-mtc-2014-tablas.json
   (Manual de Carreteras: Suelos, Geologia, Geotecnia y Pavimentos, RD 10-2014-MTC/14).
   Sin dependencias: corre en el navegador (window.PavCalc) y en Node (module.exports). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PavCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var log10 = Math.log10;

  /* ---------- utilidades ---------- */
  function biseccion(f, lo, hi) {
    var flo = f(lo), fhi = f(hi);
    if (isNaN(flo) || isNaN(fhi) || flo * fhi > 0) return null;
    for (var i = 0; i < 200; i++) {
      var m = (lo + hi) / 2, fm = f(m);
      if (flo * fm <= 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; }
    }
    return (lo + hi) / 2;
  }
  function redondeaArriba(x, paso) { return Math.ceil(x / paso - 1e-9) * paso; }
  function interp(x, xs, ys) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (var i = 1; i < xs.length; i++) {
      if (x <= xs[i]) { var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + t * (ys[i] - ys[i - 1]); }
    }
  }

  /* ---------- trafico (capitulo VI) ---------- */
  function fca(r, n) { return r > 0 ? (Math.pow(1 + r, n) - 1) / r : n; }

  function tpDeEE(D, ee) {
    var rg = D.trafico.cuadro_6_15_pavimentados.rangos_EE;
    if (!(ee > 0)) return { id: null, aviso: "Ingresa un numero de EE mayor que cero." };
    if (ee <= rg[0].min) return { id: null, aviso: "EE menor o igual a 75,000: el manual lo trata como camino no pavimentado (Cuadro 6.14) o requiere estudio especifico." };
    for (var i = 0; i < rg.length; i++) {
      if (rg[i].max === null || ee <= rg[i].max) {
        var aviso = rg[i].id === "Tp15" ? "Mas de 30'000,000 EE: el manual exige Estudio Especial; los parametros de Tp15 son solo referencia." : null;
        return { id: rg[i].id, indice: i, rango: rg[i], aviso: aviso };
      }
    }
  }

  function eeEje(D, pav, tipoEje, P) {
    var t = pav === "rigido" ? D.trafico.cuadro_6_4_EE_rigido : D.trafico.cuadro_6_3_EE_flexible;
    var e = t.ejes[tipoEje];
    if (!e) throw new Error("Tipo de eje desconocido: " + tipoEje);
    return Math.pow(P / e.Pref, e.exp);
  }
  function fvp(D, pav, ejes) { // ejes: [{tipo, P}] de UN vehiculo representativo
    return ejes.reduce(function (s, e) { return s + eeEje(D, pav, e.tipo, e.P); }, 0);
  }

  function factorPresion(D, espesorMm, presionInfladoPsi) {
    var t = D.trafico.cuadro_6_13_Fp, pcn = 0.9 * presionInfladoPsi;
    var esp = Math.max(50, Math.min(200, espesorMm));
    var claves = Object.keys(t.filas_mm).map(Number).sort(function (a, b) { return a - b; });
    var fila = function (mm) { return interp(pcn, t.PCN_psi, t.filas_mm[String(mm)]); };
    var lo = claves[0], hi = claves[claves.length - 1];
    for (var i = 0; i < claves.length; i++) { if (claves[i] <= esp) lo = claves[i]; }
    for (var j = claves.length - 1; j >= 0; j--) { if (claves[j] >= esp) hi = claves[j]; }
    var v = lo === hi ? fila(lo) : interp(esp, [lo, hi], [fila(lo), fila(hi)]);
    return { Fp: v, PCN: pcn };
  }

  /* vehiculos: [{nombre, imd, fvp}]; opciones: {Fd, Fc, r, n, Fp:[por vehiculo o uno] } */
  function nrepEE(vehiculos, o) {
    var f = fca(o.r, o.n), total = 0, filas = [];
    vehiculos.forEach(function (v) {
      var fp = v.Fp != null ? v.Fp : (o.Fp != null ? o.Fp : 1);
      var eeDia = v.imd * o.Fd * o.Fc * v.fvp * fp;
      var nrep = eeDia * f * 365;
      total += nrep;
      filas.push({ nombre: v.nombre, eeDia: eeDia, nrep: nrep, Fp: fp });
    });
    return { total: total, Fca: f, filas: filas };
  }

  /* ---------- subrasante ---------- */
  function categoriaSubrasante(cbr) {
    if (cbr < 3) return { id: "S0", nombre: "Inadecuada", apta: false };
    if (cbr < 6) return { id: "S1", nombre: "Insuficiente", apta: false };
    if (cbr < 10) return { id: "S2", nombre: "Regular", apta: true, col: 0 };
    if (cbr < 20) return { id: "S3", nombre: "Buena", apta: true, col: 1 };
    if (cbr < 30) return { id: "S4", nombre: "Muy buena", apta: true, col: 2 };
    return { id: "S5", nombre: "Excelente", apta: true, col: 3 };
  }
  function mrDeCbr(cbr) { return 2555 * Math.pow(cbr, 0.64); } // psi; deducida del Cuadro 12.5 (TRRL)

  /* k (MPa/m) desde CBR: interpola en escala log entre los limites superiores de los rangos del catalogo rigido */
  function kDeCbr(cbr) {
    var xs = [Math.log(6), Math.log(10), Math.log(20), Math.log(30)], ys = [52, 63, 79, 105];
    if (cbr < 6) return 52 * Math.pow(cbr / 6, 0.5);
    return interp(Math.log(cbr), xs, ys);
  }
  var MPAM_A_PCI = 3.683, MPAM_A_KGCM3 = 0.0101972;
  function kc(h_cm, K1, K0) { // kg/cm3
    return Math.sqrt(1 + Math.pow(h_cm / 38, 2) * Math.pow(K1 / K0, 2 / 3)) * K0;
  }

  /* ---------- pavimento flexible ---------- */
  function parametrosFlexible(D, tpId) {
    var f = D.flexible, s = f.cuadros_12_10_a_12_12_serviciabilidad.por_Tp, avisos = [];
    var sv = s[tpId];
    if (!sv) { sv = s.Tp1; avisos.push("Tp0 no tiene fila en los Cuadros 12.10 a 12.12: se usaron los valores de Tp1."); }
    return {
      R: f.cuadro_12_6_confiabilidad_una_etapa.por_Tp[tpId],
      Zr: f.cuadro_12_8_Zr_una_etapa.por_Tp[tpId],
      So: f.desviacion_estandar_So.valor_manual,
      Pi: sv.Pi, Pt: sv.Pt, dPSI: sv.dPSI, avisos: avisos
    };
  }
  function snRequerido(W18, Zr, So, dPSI, MR) {
    var g = function (sn) {
      return Zr * So + 9.36 * log10(sn + 1) - 0.2 + log10(dPSI / (4.2 - 1.5)) / (0.4 + 1094 / Math.pow(sn + 1, 5.19)) +
        2.32 * log10(MR) - 8.07 - log10(W18);
    };
    return biseccion(g, 0.05, 20);
  }
  function snCapas(capas) { // capas: [{a, d_cm, m}]
    return capas.reduce(function (s, c) { return s + c.a * c.d_cm * (c.m == null ? 1 : c.m); }, 0);
  }
  function catalogoFlexible(D, tpId, cbr) {
    var cat = categoriaSubrasante(cbr), t = D.flexible.cuadro_12_16_SN_requerido_20_anos.por_Tp[tpId];
    return { SN: (t && cat.apta) ? t[cat.col] : null, categoria: cat };
  }
  function minimosFlexible(D, tpId) {
    return D.flexible.cuadro_12_17_espesores_minimos_mm.por_Tp[tpId] || null;
  }

  /* propuesta automatica: capa superficial y base en su minimo; subbase por diferencia (multiplos de 5 cm) */
  function proponerFlexible(D, o) {
    // o: {SNr, tpId, superficie, base, subbase, m2, m3}
    var cap = D.flexible.cuadro_12_13_coeficientes_estructurales;
    var busca = function (lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; };
    var sup = busca(cap.capa_superficial, o.superficie), bas = busca(cap.base, o.base), sub = busca(cap.subbase, o.subbase);
    var min = minimosFlexible(D, o.tpId), avisos = [];
    var mmSup = 50, mmBase = 150;
    if (min) {
      var clave = { carpeta_caliente: "caliente", carpeta_frio: "frio", micropavimento: "micropavimento" }[o.superficie];
      mmSup = (clave && min[clave]) || (o.superficie === "tsb" || o.superficie === "slurry" ? 0 : min.caliente);
      mmBase = min.base;
    } else avisos.push("Tp0 no tiene espesores minimos en el Cuadro 12.17: se uso 50 mm de capa superficial y 150 mm de base como punto de partida.");
    var d1 = mmSup / 10, d2 = mmBase / 10;
    var sn1 = (sup.a || 0) * d1, sn2 = bas.a * d2 * o.m2;
    var falta = o.SNr - sn1 - sn2, d3 = 0;
    if (falta > 0) d3 = redondeaArriba(falta / (sub.a * o.m3), 5);
    return { d1: d1, d2: d2, d3: d3, avisos: avisos, sup: sup, bas: bas, sub: sub };
  }

  /* ---------- pavimento rigido ---------- */
  function parametrosRigido(D, tpId) {
    var r = D.rigido, avisos = [];
    var sv = r.cuadro_14_4_serviciabilidad.por_Tp[tpId];
    if (!sv) { sv = r.cuadro_14_4_serviciabilidad.por_Tp.Tp1; avisos.push("Tp0 no tiene fila en el Cuadro 14.4: se usaron los valores de Tp1."); }
    var c = r.cuadro_14_5_confiabilidad.por_Tp[tpId];
    return { R: c.R, Zr: c.Zr, So: r.cuadro_14_5_confiabilidad.So, Pi: sv.Pi, Pt: sv.Pt, dPSI: sv.dPSI, avisos: avisos };
  }
  function resistenciaConcreto(D, ee) {
    var f = D.rigido.cuadro_14_7_resistencia_concreto.filas;
    for (var i = 0; i < f.length; i++) { if (f[i].EE_max == null || ee <= f[i].EE_max) return f[i]; }
  }
  function cbrMinSubbase(ee) { return ee <= 15e6 ? 40 : 60; }
  /* D en cm. Unidades internas de AASHTO: pulgadas, psi, pci */
  function espesorRigido(p) {
    // p: {W18, Zr, So, dPSI, Pt, MR_kgcm2, fc_kgcm2, Cd, J, k_MPam}
    var Sc = p.MR_kgcm2 * 14.2233, Ec = 57000 * Math.sqrt(p.fc_kgcm2 * 14.2233), k = p.k_MPam * MPAM_A_PCI;
    var g = function (D) {
      var t = log10(p.dPSI / 3.0) / (1 + 1.624e7 / Math.pow(D + 1, 8.46));
      var a = Sc * p.Cd * (Math.pow(D, 0.75) - 1.132);
      var b = 215.63 * p.J * (Math.pow(D, 0.75) - 18.42 / Math.pow(Ec / k, 0.25));
      return p.Zr * p.So + 7.35 * log10(D + 1) - 0.06 + t + (4.22 - 0.32 * p.Pt) * log10(a / b) - log10(p.W18);
    };
    var d = biseccion(g, 4, 30);
    return d === null ? null : { D_cm: d * 2.54, D_in: d, Ec_psi: Ec, Sc_psi: Sc, k_pci: k };
  }
  function grupoCbrRigido(cbr) { return cbr < 6 ? "<6" : cbr < 10 ? "6-10" : cbr < 20 ? "10-20" : cbr < 30 ? "20-30" : ">=30"; }
  function catalogoRigido(D, J, tpId, cbr) {
    var key = "J_" + Number(J).toFixed(1), c = D.rigido.catalogos_losa_cm[key];
    if (!c) return null;
    var tabla = c.Tp0_a_Tp14 || c.Tp0_a_Tp4, idx = Number(tpId.slice(2));
    var g = grupoCbrRigido(cbr);
    if (idx >= tabla[g].length) return { fuera: true, figuras: c.figuras, paginas: c.paginas };
    return { losa_cm: tabla[g][idx], subbase_cm: 15, grupo: g, figuras: c.figuras, paginas: c.paginas, estabilizar: cbr < 6 };
  }

  return {
    fca: fca, tpDeEE: tpDeEE, eeEje: eeEje, fvp: fvp, factorPresion: factorPresion, nrepEE: nrepEE,
    categoriaSubrasante: categoriaSubrasante, mrDeCbr: mrDeCbr, kDeCbr: kDeCbr, kc: kc,
    MPAM_A_KGCM3: MPAM_A_KGCM3,
    parametrosFlexible: parametrosFlexible, snRequerido: snRequerido, snCapas: snCapas,
    catalogoFlexible: catalogoFlexible, minimosFlexible: minimosFlexible, proponerFlexible: proponerFlexible,
    parametrosRigido: parametrosRigido, resistenciaConcreto: resistenciaConcreto, cbrMinSubbase: cbrMinSubbase,
    espesorRigido: espesorRigido, catalogoRigido: catalogoRigido, grupoCbrRigido: grupoCbrRigido,
    redondeaArriba: redondeaArriba
  };
});
