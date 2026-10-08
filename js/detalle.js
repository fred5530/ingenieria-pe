/* ingenierIA.pe v2 - detalle de cada tema del explorador
   Para cada tema: explicación larga, cómo se trabaja (pasos) y una figura animada dibujada en vector.
   Las figuras usan datos de muestra, no de un proyecto real. Se editan aquí, en DETALLE.
   Las animaciones están definidas en estilos.css (clases a-in, a-grow, a-pop, a-draw...). */
(function () {
  "use strict";
  var T_ = "#FFFFFF", M_ = "#9A9A9A", S_ = "#161616", S2 = "#1F1F1F", L_ = "#2E2E2E", RED = "#E5513D", PAGE = "#F4F4F4";

  function svg(inner, h) {
    return '<svg viewBox="0 0 480 ' + (h || 300) + '" role="img" aria-hidden="true" class="vis__svg"><defs><pattern id="dp" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#242424"/></pattern></defs>' +
      '<rect width="480" height="' + (h || 300) + '" fill="url(#dp)"/>' + inner + "</svg>";
  }
  function dl(d) { return ' style="--d:' + (d || 0).toFixed(2) + 's"'; }
  function g(cls, d, inner, extra) { return '<g class="' + cls + '"' + dl(d) + (extra || "") + ">" + inner + "</g>"; }
  function t(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.s || 12) + '" fill="' + (o.c || T_) + '" font-weight="' + (o.w || 500) +
      '" text-anchor="' + (o.a || "start") + '"' + (o.sp ? ' letter-spacing="' + o.sp + '"' : "") + ">" + s + "</text>";
  }
  function r(x, y, w, h, f, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r === undefined ? 4 : o.r) + '" fill="' + f + '"' + (o.st ? ' stroke="' + o.st + '" stroke-width="' + (o.sw || 1) + '"' : "") + (o.cls ? ' class="' + o.cls + '"' : "") + (o.d !== undefined ? dl(o.d) : "") + "/>";
  }
  function ln(x1, y1, x2, y2, c, w, dash) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || L_) + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  }
  function title(a, b) { return t(24, 30, a, { s: 12, w: 700 }) + (b ? t(456, 30, b, { s: 10, c: M_, a: "end" }) : ""); }
  function wrap(inner, h) { return svg(inner, h); }

  /* Hoja de documento: líneas que se escriben, haz de revisión y notas que aparecen */
  function doc(a) {
    var s = g("a-in", 0, r(150, 20, 180, 262, PAGE, { r: 6 }) + r(150, 20, 180, 34, "#0D0D0D", { r: 6 }) + r(150, 46, 180, 8, "#0D0D0D", { r: 0 }) + t(240, 42, a.titulo, { s: 11, w: 700, a: "middle" }));
    var y = 70, i;
    for (i = 0; i < a.lineas; i++) { s += g("a-grow", .3 + i * .09, r(164, y, i % 3 === 2 ? 110 : 152, 5, "#CFCFCF", { r: 2 })); y += 12; }
    if (a.tabla) {
      y += 6;
      for (i = 0; i < 4; i++) { s += g("a-in", .9 + i * .1, r(164, y, 152, 16, i === 0 ? "#E4E4E4" : "#FAFAFA", { r: 0, st: "#DADADA" }) + r(170, y + 6, 36, 4, i === 0 ? "#777" : "#BDBDBD", { r: 2 }) + r(228, y + 6, 54, 4, i === 0 ? "#777" : "#BDBDBD", { r: 2 })); y += 16; }
    }
    s += '<g clip-path="url(#pg)"><rect class="a-scan" x="150" y="20" width="180" height="26" fill="' + RED + '" opacity=".22"/></g><clipPath id="pg"><rect x="150" y="20" width="180" height="262" rx="6"/></clipPath>';
    s += g("a-pop", 1.6, r(164, 252, 72, 16, RED, { r: 8 }) + t(200, 263, a.sello, { s: 8, w: 700, a: "middle" }));
    var k, n;
    for (k = 0; k < a.notas.length; k++) {
      n = a.notas[k];
      var left = k % 2 === 0, x0 = left ? 14 : 346, yy = 56 + Math.floor(k / 2) * 98;
      s += ln(left ? 134 : 346, yy + 32, left ? 150 : 330, yy + 32, RED, 1, "3 3");
      s += g("a-in", 1 + k * .25, r(x0, yy, 120, 64, S_, { st: L_, r: 8 }) + t(x0 + 10, yy + 20, n[0], { s: 10, w: 700 }) + t(x0 + 10, yy + 38, n[1], { s: 10, c: M_ }) + t(x0 + 10, yy + 52, n[2] || "", { s: 10, c: M_ }));
    }
    return wrap(s);
  }

  /* Tabla: filas que entran una a una, fila clave que late */
  function tabla(a) {
    var cols = a.cols, total = 0, i, j, acc = 24;
    a.w.forEach(function (x) { total += x; });
    var xs = a.w.map(function (x) { var v = acc; acc += x / total * 432; return v; });
    var s = title(a.titulo, a.nota), y = 46;
    s += g("a-in", 0, r(24, y, 432, 28, "#2A2A2A", { r: 6 }) + cols.map(function (c, k) { return t(xs[k] + 10, y + 18, c, { s: 10, w: 700, c: M_ }); }).join(""));
    y += 30;
    for (i = 0; i < a.filas.length; i++) {
      var hl = a.hl === i, row = r(24, y, 432, 30, hl ? "#3A1A16" : S_, { r: 6, st: hl ? RED : L_ });
      for (j = 0; j < cols.length; j++) row += t(xs[j] + 10, y + 19, a.filas[i][j], { s: 11, c: hl && j === cols.length - 1 ? RED : T_, w: hl ? 700 : 500 });
      s += g(hl ? "a-in a-pulse" : "a-in", .2 + i * .18, row); y += 34;
    }
    if (a.total) { s += g("a-in", .3 + a.filas.length * .18 + .2, r(24, y + 2, 432, 32, T_, { r: 8 }) + t(36, y + 23, a.total[0], { s: 11, w: 700, c: "#0D0D0D" }) + t(444, y + 23, a.total[1], { s: 13, w: 700, a: "end", c: "#0D0D0D" })); y += 38; }
    return wrap(s, y + 22);
  }

  /* Barras: crecen de izquierda a derecha, la clave brilla */
  function barras(a) {
    var s = title(a.titulo, a.nota), max = 0, i, y = 52;
    a.items.forEach(function (x) { if (x[1] > max) max = x[1]; });
    for (i = 0; i < a.items.length; i++) {
      var w = a.items[i][1] / max * 250, hl = i === a.hl;
      s += g("a-in", i * .12, t(24, y + 15, a.items[i][0], { s: 11 }) + r(150, y, 250, 20, "#232323", { r: 5 })) +
        g("a-grow" + (hl ? " a-glow" : ""), .25 + i * .14, r(150, y, w, 20, hl ? RED : T_, { r: 5 })) +
        g("a-in", .8 + i * .14, t(456, y + 15, a.items[i][2], { s: 11, w: 700, a: "end", c: hl ? RED : T_ }));
      y += 34;
    }
    return wrap(s, y + 18);
  }

  /* Cronograma: barras que se dibujan, avance que se llena y línea de hoy que barre */
  function gantt(a) {
    var s = title(a.titulo), i, x0 = 150, wm = 306, n = a.meses.length;
    for (i = 0; i < n; i++) s += t(x0 + i * wm / n + wm / n / 2, 54, a.meses[i], { s: 10, c: M_, a: "middle" }) + ln(x0 + i * wm / n, 62, x0 + i * wm / n, 62 + a.filas.length * 34 + 6, "#262626");
    var y = 68;
    for (i = 0; i < a.filas.length; i++) {
      var f = a.filas[i], bx = x0 + f[1] / 100 * wm, bw = f[2] / 100 * wm;
      s += g("a-in", i * .1, t(24, y + 15, f[0], { s: 11 })) + g("a-grow", .2 + i * .14, r(bx, y, bw, 20, "#3A3A3A", { r: 5 }));
      if (f[3]) s += g("a-grow", .9 + i * .14, r(bx, y, bw * f[3], 20, i < 3 ? RED : T_, { r: 5 }));
      y += 34;
    }
    var hx = x0 + a.hoy / 100 * wm;
    s += '<g class="a-sweep" style="--sx:' + (-(hx - x0)).toFixed(0) + 'px;--d:.5s">' + ln(hx, 58, hx, y + 2, T_, 1.5) + r(hx - 18, y + 4, 36, 16, T_, { r: 8 }) + t(hx, y + 15.5, "HOY", { c: "#0D0D0D", s: 9, w: 700, a: "middle" }) + "</g>";
    return wrap(s, y + 32);
  }

  /* Lista de verificación: cada punto aparece y se marca */
  function check(a) {
    var s = title(a.titulo, a.nota), y = 48, i;
    for (i = 0; i < a.items.length; i++) {
      var it = a.items[i], ok = it[1] === "ok", d = .2 + i * .4;
      var row = r(24, y, 432, 34, ok ? S_ : "#3A1A16", { st: ok ? L_ : RED, r: 8 });
      row += '<circle cx="46" cy="' + (y + 17) + '" r="9" fill="' + (ok ? T_ : RED) + '"/>';
      row += ok ? '<path class="a-draw" style="--len:20;--d:' + (d + .25).toFixed(2) + 's" d="M41 ' + (y + 17) + ' l4 4 l7 -8" stroke="#0D0D0D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                : t(46, y + 21, "!", { s: 12, w: 700, a: "middle" });
      row += t(66, y + 21, it[0], { s: 11, w: ok ? 500 : 700 }) + t(446, y + 21, it[2] || "", { s: 10, c: ok ? M_ : RED, a: "end", w: 600 });
      s += g(ok ? "a-in" : "a-in a-warn", d, row); y += 40;
    }
    return wrap(s, y + 14);
  }

  /* Flujo: entradas -> Claude -> salidas, con paquetes que viajan por las líneas */
  function flujo(a) {
    var s = title(a.titulo), i, ys = [58, 112, 166];
    var dots = "";
    for (i = 0; i < a.entra.length; i++) {
      s += ln(144, ys[i] + 20, 190, 130, L_, 1.4);
      s += g("a-in", i * .15, r(24, ys[i], 120, 40, S_, { st: L_, r: 8 }) + t(84, ys[i] + 24, a.entra[i], { s: 10, a: "middle", w: 600 }));
      dots += '<circle r="3.2" fill="' + T_ + '"><animateMotion dur="2.4s" begin="' + (i * .7 + .8) + 's" repeatCount="indefinite" path="M144 ' + (ys[i] + 20) + ' L190 130"/></circle>';
    }
    s += g("a-in", .5, '<rect class="a-ring" x="190" y="98" width="100" height="64" rx="12" fill="none" stroke="' + RED + '" stroke-width="2"/>' + r(190, 98, 100, 64, "#0D0D0D", { r: 12, st: T_, sw: 1.5 }) + t(240, 126, "Claude", { s: 15, w: 700, a: "middle" }) + t(240, 144, a.motor, { c: M_, s: 9, a: "middle" }));
    for (i = 0; i < a.sale.length; i++) {
      s += ln(290, 130, 336, ys[i] + 20, L_, 1.4);
      s += g("a-in", 1 + i * .2, r(336, ys[i], 120, 40, i === 0 ? "#3A1A16" : S_, { st: i === 0 ? RED : L_, r: 8 }) + t(396, ys[i] + 24, a.sale[i], { s: 10, a: "middle", w: 700, c: i === 0 ? RED : T_ }));
      dots += '<circle r="3.2" fill="' + RED + '"><animateMotion dur="2.4s" begin="' + (i * .7 + 1.4) + 's" repeatCount="indefinite" path="M290 130 L336 ' + (ys[i] + 20) + '"/></circle>';
    }
    s += dots + g("a-in", 1.5, r(24, 232, 432, 38, S_, { r: 8, st: L_ }) + t(240, 255, a.pie, { s: 11, c: M_, a: "middle" }));
    return wrap(s, 290);
  }

  /* Dibujos de ingeniería */
  function modelo(k) {
    var s = "", i;
    if (k === "sap") {
      s += title("Pórtico con carga distribuida", "Deformada x 50") + ln(60, 230, 420, 230, T_, 2);
      for (i = 0; i < 9; i++) s += ln(60 + i * 45, 230, 50 + i * 45, 242, "#444");
      s += '<path d="M100 230 L100 110 L380 110 L380 230" stroke="#555" stroke-width="3" fill="none" stroke-dasharray="5 4"/>';
      s += '<path class="a-draw" style="--len:900;--d:.2s" stroke="' + T_ + '" stroke-width="4" fill="none" stroke-linejoin="round" d="M100 230 L104 112 Q240 128 376 112 L380 230"><animate attributeName="d" dur="4s" begin="1.6s" repeatCount="indefinite" values="M100 230 L104 112 Q240 128 376 112 L380 230;M100 230 L102 112 Q240 119 378 112 L380 230;M100 230 L104 112 Q240 128 376 112 L380 230"/></path>';
      for (i = 0; i < 12; i++) { var x = 112 + i * 23; s += '<g class="a-fall" style="--d:' + (i * .09).toFixed(2) + 's">' + ln(x, 62, x, 98, RED, 1.5) + '<path d="M' + (x - 4) + ' 92 L' + x + ' 100 L' + (x + 4) + ' 92" stroke="' + RED + '" stroke-width="1.5" fill="none"/></g>'; }
      s += ln(100, 58, 380, 58, RED, 1.5) + t(240, 52, "w = 1.2 t/m", { c: RED, s: 11, w: 700, a: "middle" });
      s += g("a-pop", 1.2, r(120, 150, 110, 52, S_, { st: L_, r: 8 }) + t(130, 170, "Mmax", { s: 10, c: M_ }) + t(130, 190, "18.4 t·m", { s: 13, w: 700 }));
      s += g("a-pop", 1.5, r(250, 150, 110, 52, S_, { st: L_, r: 8 }) + t(260, 170, "Desplaz. máx.", { s: 10, c: M_ }) + t(260, 190, "6.2 mm", { s: 13, w: 700, c: RED }));
      s += '<circle cx="100" cy="230" r="5" fill="' + T_ + '"/><circle cx="380" cy="230" r="5" fill="' + T_ + '"/>';
      return wrap(s);
    }
    if (k === "civil") {
      s += title("Eje de vía con puntos y cotas", "Plano de planta");
      for (i = 0; i < 6; i++) s += ln(24, 60 + i * 40, 456, 60 + i * 40, "#232323") + ln(24 + i * 86, 46, 24 + i * 86, 254, "#232323");
      var main = "M40 220 C120 220 150 120 240 130 S360 90 440 70";
      s += '<path d="M40 232 C122 232 160 134 242 144 S362 104 440 84" stroke="#444" stroke-width="2" fill="none" class="a-draw" style="--len:600;--d:.1s"/>';
      s += '<path d="M40 208 C118 208 140 106 238 116 S358 76 440 56" stroke="#444" stroke-width="2" fill="none" class="a-draw" style="--len:600;--d:.2s"/>';
      s += '<path class="a-draw" style="--len:600;--d:.3s" d="' + main + '" stroke="' + T_ + '" stroke-width="3" fill="none"/>';
      var pts = [[40, 220, "0+000", "102.40"], [150, 168, "0+100", "103.15"], [240, 130, "0+200", "104.02"], [360, 96, "0+300", "104.88"], [440, 70, "0+400", "105.50"]];
      pts.forEach(function (p, j) {
        s += g("a-pop", .6 + j * .22, '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" fill="' + (j === 2 ? RED : T_) + '"/>' + t(p[0], p[1] + 22, p[2], { s: 9, a: "middle", c: M_ }) + t(p[0], p[1] - 10, p[3], { s: 9, a: "middle", w: 700 }));
      });
      s += '<circle r="5" fill="' + RED + '"><animateMotion dur="5s" begin="1.8s" repeatCount="indefinite" path="' + main + '"/></circle>';
      s += g("a-in", 1.4, r(24, 246, 150, 40, S_, { st: L_, r: 8 }) + t(34, 263, "Capas: EJE, PUNTOS,", { s: 9, c: M_ }) + t(34, 276, "COTAS, TEXTOS", { s: 9, c: M_ }));
      return wrap(s, 300);
    }
    if (k === "revit") {
      s += title("Modelo base con niveles y ejes");
      [230, 170, 110].forEach(function (y, j) { s += '<line class="a-draw" style="--len:400;--d:' + (j * .15).toFixed(2) + 's" x1="40" y1="' + y + '" x2="440" y2="' + y + '" stroke="' + (j === 0 ? T_ : "#555") + '" stroke-width="' + (j === 0 ? 2 : 1) + '"' + (j ? ' stroke-dasharray="6 4"' : "") + "/>" + t(446, y + 4, "Nivel " + (j + 1), { s: 9, c: M_, a: "end" }); });
      for (i = 0; i < 5; i++) s += g("a-pop", .4 + i * .1, ln(100 + i * 70, 62, 100 + i * 70, 246, "#2E2E2E") + '<circle cx="' + (100 + i * 70) + '" cy="52" r="9" fill="#0D0D0D" stroke="' + T_ + '"/>' + t(100 + i * 70, 56, "ABCDE".charAt(i), { s: 10, w: 700, a: "middle" }));
      s += g("a-growy", .7, r(100, 110, 280, 120, S2, { st: T_, r: 0 }) + ln(100, 170, 380, 170, T_, 1.5));
      for (i = 0; i < 4; i++) s += g("a-pop", 1.2 + i * .12, r(116 + i * 70, 128, 38, 26, "#0D0D0D", { st: M_, r: 2 }) + r(116 + i * 70, 188, 38, 26, "#0D0D0D", { st: M_, r: 2 }));
      s += g("a-pop", 1.8, r(206, 190, 28, 40, RED, { r: 0 })) + g("a-growy", 1.1, r(100, 96, 280, 14, T_, { r: 0 }));
      return wrap(s);
    }
    s += title("Volumetría para presentar");
    s += '<g class="a-bob">' + g("a-growy", .1, '<polygon points="120,130 240,190 240,250 120,190" fill="#2A2A2A" stroke="' + T_ + '" stroke-width="1.5"/>') +
      g("a-growy", .3, '<polygon points="240,190 360,130 360,190 240,250" fill="#1C1C1C" stroke="' + T_ + '" stroke-width="1.5"/>') +
      g("a-in", .55, '<polygon points="240,70 360,130 240,190 120,130" fill="#F4F4F4" stroke="' + T_ + '" stroke-width="1.5"/>') +
      g("a-in", .8, '<polygon points="232,100 312,140 272,160 192,120" fill="#CFCFCF" stroke="#0D0D0D" stroke-width="1.5"/>') +
      g("a-pop", 1.1, '<polygon points="140,160 200,190 200,226 140,196" fill="#0D0D0D" stroke="#555"/><polygon points="270,200 330,170 330,206 270,236" fill="#0D0D0D" stroke="#555"/>') +
      g("a-pop", 1.3, '<polygon points="214,206 236,217 236,247 214,236" fill="' + RED + '"/>') + "</g>";
    s += g("a-in", 1.5, t(400, 90, "Vista 1", { s: 10, c: M_ }) + t(400, 108, "Vista 2", { s: 10, c: M_ }) + t(400, 126, "Vista 3", { s: 10, c: M_ }));
    return wrap(s);
  }

  var DET = {
    formulacion: {
      detalle: "Antes de pedir presupuesto hay que sustentar la inversión. Claude toma tu idea y el diagnóstico, ordena la información por secciones y redacta el borrador con la estructura que pide la guía aplicable. Tú corriges los datos del territorio y decides.",
      pasos: ["Cuentas la idea, el problema y la zona", "Claude arma el diagnóstico y el planteamiento por secciones", "Revisas cifras y supuestos, y pides los ajustes"],
      vis: flujo({ titulo: "De la idea al borrador", entra: ["Idea y diagnóstico", "Datos del territorio", "Lineamientos"], sale: ["Borrador", "Cuadros de apoyo", "Pendientes"], motor: "formulación", pie: "Cada cuadro sale con su fuente, para que la revises." })
    },
    expedientes: {
      detalle: "Un expediente técnico falla cuando los documentos no dicen lo mismo. Claude redacta la memoria descriptiva y las especificaciones, y cruza metrados, planos y presupuesto para avisarte de las diferencias antes de entregar.",
      pasos: ["Cargas planos, metrados y estudios básicos", "Claude redacta memoria y especificaciones", "Corre la revisión cruzada y te lista las inconsistencias"],
      vis: doc({ titulo: "MEMORIA DESCRIPTIVA", lineas: 8, tabla: true, sello: "REVISADO", notas: [["Metrado", "Partida 03.02", "dice 120 m3"], ["Presupuesto", "Partida 03.02", "dice 115 m3"], ["Plano", "Cota N-02", "coincide"], ["EETT", "Concreto fc", "210 kg/cm2"]] })
    },
    tdr: {
      detalle: "Un término de referencia claro evita observaciones y adicionales después. Claude arma el documento completo: antecedentes, alcance, plazo, entregables, perfil del personal, forma de pago y criterios de evaluación, con redacción uniforme.",
      pasos: ["Defines la necesidad, el alcance y el plazo", "Claude propone entregables, perfil y penalidades", "Ajustas y exportas en el formato de la entidad"],
      vis: doc({ titulo: "TÉRMINOS DE REFERENCIA", lineas: 7, tabla: true, sello: "COMPLETO", notas: [["Alcance", "5 entregables", ""], ["Plazo", "60 días calendario", ""], ["Pago", "3 armadas", ""], ["Perfil", "Ing. civil colegiado", ""]] })
    },
    metrados: {
      detalle: "La planilla se arma con fórmulas, no con números pegados: si cambias una medida, se actualizan el parcial, el total y el resumen. Cada línea guarda de dónde sale la medida para poder sustentarla ante la entidad.",
      pasos: ["Indicas partidas, planos y criterio de medición", "Claude arma la planilla con fórmulas vivas", "Tú verificas contra el plano y firmas"],
      vis: tabla({ titulo: "Planilla de metrados", nota: "Datos de muestra", cols: ["Partida", "Und", "Cant.", "Parcial"], w: [4, 1, 1.2, 1.6], filas: [["Excavación de zanjas", "m3", "86.40", "86.40"], ["Concreto f'c=210", "m3", "42.15", "42.15"], ["Acero corrugado", "kg", "3,120", "3,120"], ["Encofrado y desencofrado", "m2", "210.50", "210.50"]], hl: 1, total: ["Partidas medidas", "4 de 4"] })
    },
    presupuesto: {
      detalle: "El presupuesto sale de los metrados y de análisis de precios unitarios con tus insumos. Claude suma por rubros, aplica gastos generales, utilidad e IGV, y te muestra qué rubro pesa más para decidir dónde afinar.",
      pasos: ["Partes de los metrados y precios de mercado", "Claude arma los análisis y el resumen por rubros", "Ves el peso de cada rubro y ajustas"],
      vis: barras({ titulo: "Peso de cada rubro", nota: "Datos de muestra", items: [["Estructuras", 38, "38%"], ["Arquitectura", 24, "24%"], ["Instalaciones", 18, "18%"], ["Gastos generales", 12, "12%"], ["Utilidad", 8, "8%"]], hl: 0 })
    },
    cotizaciones: {
      detalle: "Para el estudio de mercado Claude ordena las cotizaciones recibidas en un solo cuadro comparativo, valida que cotizaron lo mismo y señala el precio de referencia con su sustento.",
      pasos: ["Reúnes las cotizaciones de los proveedores", "Claude las lleva a un cuadro comparable", "Obtienes el precio de referencia y el informe"],
      vis: tabla({ titulo: "Cuadro comparativo", nota: "Datos de muestra", cols: ["Proveedor", "Plazo", "Garantía", "Precio"], w: [3, 1.4, 1.6, 2], filas: [["Proveedor A", "15 d", "12 m", "S/ 48,200"], ["Proveedor B", "20 d", "12 m", "S/ 45,900"], ["Proveedor C", "12 d", "6 m", "S/ 47,100"]], hl: 1, total: ["Precio de referencia", "S/ 47,067"] })
    },
    caratulas: {
      detalle: "Cada expediente lleva carátula, lomo de archivador y separadores con el mismo formato. Con los datos del proyecto, el logo y la foto de la obra, Claude genera las piezas listas para imprimir, también cuando hay varios tomos.",
      pasos: ["Indicas proyecto, entidad, tomo y año", "Subes el logo y la foto de la obra", "Recibes carátula A4, lomo y separadores"],
      vis: doc({ titulo: "EXPEDIENTE TÉCNICO", lineas: 4, tabla: false, sello: "TOMO I", notas: [["Entidad", "Municipalidad", ""], ["Proyecto", "Mejoramiento vial", ""], ["Lomo", "Tomo I de III", ""], ["Foto", "Obra y logo", ""]] })
    },
    ley: {
      detalle: "Las consultas sobre la Ley 32069 y su reglamento se responden con el artículo citado y el procedimiento aplicable a tu caso. Siempre debes verificar contra la norma vigente antes de firmar o presentar.",
      pasos: ["Describes el caso y la fecha de los hechos", "Claude identifica el procedimiento y cita la base legal", "Redacta la carta o el escrito si lo necesitas"],
      vis: flujo({ titulo: "De la consulta a la base legal", entra: ["Tu consulta", "Ley y reglamento", "Fechas"], sale: ["Procedimiento", "Base legal citada", "Borrador"], motor: "Ley 32069", pie: "Verifica siempre contra la norma vigente." })
    },
    bases: {
      detalle: "Antes de ofertar conviene leer las bases con calma. Claude las recorre, extrae los requisitos, marca los puntos de riesgo y te deja redactadas las consultas y observaciones que valga la pena presentar.",
      pasos: ["Cargas las bases y el expediente", "Claude extrae requisitos, plazos y puntos de riesgo", "Te deja listas las consultas y observaciones"],
      vis: check({ titulo: "Lectura de las bases", nota: "Ejemplo", items: [["Experiencia del postor", "ok", "Cumple"], ["Plazo de presentación", "ok", "Verificado"], ["Plan de trabajo exigido", "no", "Consultar"], ["Garantía de seriedad", "ok", "Cumple"]] })
    },
    oferta: {
      detalle: "La oferta se descalifica por detalles. Claude arma la estructura, prepara declaraciones y anexos con los datos de la empresa y corre una lista de verificación contra las bases antes de que presentes.",
      pasos: ["Indicas bases y documentos de la empresa", "Claude arma la oferta y los anexos", "Corres la lista de verificación final"],
      vis: check({ titulo: "Lista de verificación", nota: "Ejemplo", items: [["Declaración jurada firmada", "ok", "Listo"], ["Experiencia acreditada", "ok", "Listo"], ["Anexo de personal clave", "no", "Falta firma"], ["Cronograma de ejecución", "ok", "Listo"]] })
    },
    residencia: {
      detalle: "El residente vive de plazos y de papeles. Claude redacta los asientos del cuaderno de obra, las cartas y los informes, y arma la valorización del mes. Tú mantienes el control de lo que se firma.",
      pasos: ["Le cuentas el avance y lo ocurrido", "Claude redacta asientos, cartas e informes", "Revisas y presentas dentro del plazo"],
      vis: doc({ titulo: "CUADERNO DE OBRA", lineas: 6, tabla: false, sello: "ASIENTO 142", notas: [["Fecha", "Día 85 de obra", ""], ["Avance", "63% acumulado", ""], ["Carta", "Ampliación de plazo", ""], ["Plazo", "Vence en 5 días", ""]] })
    },
    admindirecta: {
      detalle: "En administración directa el control del gasto es la clave. Claude ordena el registro de mano de obra, materiales y equipos contra el presupuesto analítico y redacta los informes mensuales con el avance físico y financiero.",
      pasos: ["Registras avance semanal, personal y materiales", "Claude contrasta contra el presupuesto analítico", "Obtienes el informe mensual con alertas de desvío"],
      vis: barras({ titulo: "Gasto ejecutado vs presupuesto", nota: "Datos de muestra", items: [["Mano de obra", 82, "82%"], ["Materiales", 64, "64%"], ["Equipos", 91, "91%"], ["Servicios", 40, "40%"]], hl: 2 })
    },
    supervision: {
      detalle: "El supervisor responde dentro de plazos que vencen. Claude revisa lo que presenta el contratista contra el contrato y el expediente, redacta el informe mensual y deja listas las opiniones y observaciones.",
      pasos: ["Cargas el documento del contratista", "Claude lo revisa contra contrato y expediente", "Obtienes el informe y las observaciones redactadas"],
      vis: check({ titulo: "Revisión del documento del contratista", nota: "Ejemplo", items: [["Metrados coinciden con el expediente", "ok", "Conforme"], ["Cronograma actualizado", "ok", "Conforme"], ["Sustento del adicional", "no", "Observar"], ["Plazo de respuesta", "ok", "En fecha"]] })
    },
    valorizaciones: {
      detalle: "La valorización mensual se arma con los metrados ejecutados, los adelantos y los reajustes. Claude calcula saldos, controla lo acumulado contra el contrato y deja el resumen listo para la entidad.",
      pasos: ["Indicas los metrados ejecutados del mes", "Claude calcula parcial, acumulado y saldo", "Obtienes la valorización y el resumen para la entidad"],
      vis: tabla({ titulo: "Valorización N° 4", nota: "Datos de muestra", cols: ["Concepto", "Mes", "Acumulado", "Saldo"], w: [3, 1.6, 1.8, 1.6], filas: [["Estructuras", "42,500", "128,300", "71,700"], ["Arquitectura", "18,200", "52,400", "47,600"], ["Instalaciones", "9,800", "21,000", "39,000"]], hl: 0, total: ["Avance acumulado", "58.4%"] })
    },
    cronograma: {
      detalle: "Claude trabaja dentro de Microsoft Project: crea las tareas desde tus partidas, les asigna duración según rendimientos y recursos, las enlaza, calcula la ruta crítica y guarda la línea base. Después actualizas el avance real y el cronograma se recalcula.",
      pasos: ["Indicas partidas, rendimientos, recursos y fecha de inicio", "Claude arma el cronograma, enlaza tareas y marca la ruta crítica", "Guardas la línea base y vas actualizando el avance real"],
      vis: gantt({ titulo: "Cronograma de obra con ruta crítica", meses: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"], hoy: 38, filas: [["Trabajos preliminares", 0, 14, 1], ["Movimiento de tierras", 10, 22, 1], ["Cimentación", 28, 20, 0.6], ["Estructura", 44, 30, 0.1], ["Albañilería y acabados", 64, 26, 0], ["Pruebas y entrega", 86, 14, 0]] })
    },
    planes: {
      detalle: "A partir del cronograma de MS Project, Claude organiza la programación de obra, el calendario de adquisiciones y el plan de trabajo, de modo que las compras lleguen antes de que las partidas lo necesiten.",
      pasos: ["Cargas el cronograma y los metrados", "Claude cruza partidas, recursos y fechas", "Obtienes programación y calendario de adquisiciones"],
      vis: gantt({ titulo: "Programación de obra", meses: ["Ene", "Feb", "Mar", "Abr", "May"], hoy: 46, filas: [["Movimiento de tierras", 0, 24, 1], ["Estructuras", 18, 40, 0.5], ["Arquitectura", 46, 30, 0], ["Instalaciones", 56, 34, 0]] })
    },
    calidad: {
      detalle: "Lo que no está registrado no se puede sustentar. Claude prepara los protocolos y formatos de control con los límites de las especificaciones técnicas, y consolida los resultados de ensayos en un informe de calidad.",
      pasos: ["Indicas las partidas y sus especificaciones", "Claude arma los protocolos y formatos de control", "Registras resultados y obtienes el informe"],
      vis: check({ titulo: "Control de calidad del concreto", nota: "Ejemplo", items: [["Slump dentro del rango", "ok", "4 in"], ["Resistencia a 7 días", "ok", "168 kg/cm2"], ["Protocolo de acero", "ok", "Firmado"], ["Resistencia a 28 días", "no", "Pendiente de ensayo"]] })
    },
    auditoria: {
      detalle: "Una carpeta de obra incompleta se descubre tarde. Claude recorre la carpeta contra la lista de documentos exigidos, detecta faltantes y contradicciones entre documentos, y arma un plan para subsanar.",
      pasos: ["Cargas la carpeta de obra", "Claude la compara con los documentos exigidos", "Recibes el reporte de faltantes y el plan para subsanar"],
      vis: check({ titulo: "Auditoría de la carpeta de obra", nota: "Ejemplo", items: [["Contrato y adendas", "ok", "Completo"], ["Cuaderno de obra", "ok", "Completo"], ["Actas de reunión", "no", "Faltan 2"], ["Valorizaciones firmadas", "no", "Falta N° 3"]] })
    },
    seguimiento: {
      detalle: "Compara el avance real contra la línea base de MS Project y mantiene una matriz con las fechas del contrato, los hitos y los plazos de respuesta, con estado por color. Te avisa antes de que algo venza.",
      pasos: ["Cargas las fechas del contrato y los hitos", "Claude arma la matriz de plazos", "Cambias la fecha de hoy y ves los estados"],
      vis: gantt({ titulo: "Matriz de plazos", meses: ["Mar", "Abr", "May", "Jun", "Jul"], hoy: 52, filas: [["Respuesta a consulta", 30, 26, 1], ["Ampliación de plazo", 46, 24, 0.3], ["Valorización mensual", 58, 18, 0], ["Recepción de obra", 78, 16, 0]] })
    },
    liquidacion: {
      detalle: "Liquidar es sumar todo lo hecho y probarlo. Claude consolida valorizaciones, metrados finales y documentos sustentatorios en los cuadros de liquidación y redacta la memoria, con la carpeta ordenada.",
      pasos: ["Reúnes valorizaciones, actas y sustentos", "Claude arma los cuadros y la memoria de liquidación", "Obtienes la carpeta ordenada para presentar"],
      vis: tabla({ titulo: "Cuadro de liquidación", nota: "Datos de muestra", cols: ["Concepto", "Contrato", "Ejecutado", "Dif."], w: [3, 1.8, 1.8, 1.2], filas: [["Costo directo", "412,000", "415,300", "+3,300"], ["Gastos generales", "49,400", "49,400", "0"], ["Utilidad", "32,900", "33,200", "+300"]], hl: 0, total: ["Monto de la liquidación", "497,900"] })
    },
    cierre: {
      detalle: "El cierre es una lista de lo que debe quedar guardado. Claude arma la lista de cierre con planos post construcción, actas y informe final, y te indica qué falta antes de entregar la carpeta.",
      pasos: ["Reúnes recepción, planos y actas", "Claude contrasta contra la lista de cierre", "Obtienes el informe final y la carpeta de cierre"],
      vis: check({ titulo: "Lista de cierre", nota: "Ejemplo", items: [["Acta de recepción de obra", "ok", "Firmada"], ["Planos post construcción", "ok", "Entregados"], ["Manuales y garantías", "no", "Falta uno"], ["Informe final", "ok", "Redactado"]] })
    },
    sap: {
      detalle: "Claude trabaja dentro de SAP2000: define materiales y secciones, dibuja el modelo, asigna cargas, corre el análisis y lee reacciones, esfuerzos y desplazamientos. Tú verificas el criterio, las combinaciones y firmas la memoria.",
      pasos: ["Indicas geometría, materiales, cargas y norma", "Claude arma el modelo y corre el análisis en SAP2000", "Lee los resultados y redacta la memoria de cálculo"],
      vis: modelo("sap")
    },
    civil3d: {
      detalle: "Con el archivo abierto, Claude dibuja en Civil 3D: crea las capas, traza polilíneas y puntos con sus cotas, inserta textos y tablas, y guarda el plano. Pides en lenguaje común y ves el dibujo aparecer.",
      pasos: ["Pasas coordenadas, medidas y capas", "Claude dibuja en el archivo abierto", "Revisas el plano y lo guardas"],
      vis: modelo("civil")
    },
    revit: {
      detalle: "Claude modela en Revit a partir de tus planos: niveles, ejes, muros, losas y vistas, y prepara los cuadros de cantidades para llevarlos al presupuesto.",
      pasos: ["Pasas planos, niveles y ejes", "Claude crea el modelo base en Revit", "Obtienes vistas y cuadros de cantidades"],
      vis: modelo("revit")
    },
    sketchup: {
      detalle: "Claude arma la volumetría en SketchUp desde planos y cotas, y deja escenas listas para presentar a la entidad o a tu cliente.",
      pasos: ["Pasas planos y cotas", "Claude modela los volúmenes en SketchUp", "Obtienes escenas y vistas para presentar"],
      vis: modelo("sketchup")
    }
  };

  window.DETALLE = DET;
})();
