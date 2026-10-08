/* ingenierIA.pe v2 - interactividad (contenido y comportamiento)
   Todo lo que cambias seguido está en CONFIG, SKILLS y ETAPAS. */
(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  var CONFIG = {
    whatsapp: "51957252957",
    driveUrl: "",                 // pega aquí el enlace de tu carpeta de Drive
    redes: { TikTok: "", Instagram: "", Facebook: "" }  // pega aquí tus enlaces
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function wa(texto) {
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(texto);
  }
  function abrirWa(texto) { window.open(wa(texto), "_blank", "noopener"); }

  /* Teclado en pestañas: flechas izquierda y derecha */
  function teclasTabs(lista) {
    lista.addEventListener("keydown", function (e) {
      var vert = lista.getAttribute("aria-orientation") === "vertical";
      var sig = vert ? "ArrowDown" : "ArrowRight", ant = vert ? "ArrowUp" : "ArrowLeft";
      if (e.key !== sig && e.key !== ant) return;
      var tabs = $$('[role="tab"]', lista);
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var j = (i + (e.key === sig ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].focus();
      tabs[j].click();
      e.preventDefault();
    });
  }
  function marcar(lista, el) {
    $$('[role="tab"]', lista).forEach(function (t) { t.setAttribute("aria-selected", t === el ? "true" : "false"); });
  }

  /* ---------- Enlaces de WhatsApp, año, redes, Drive ---------- */
  $$(".js-wa").forEach(function (a) {
    a.href = wa("Hola, vi tu página ingenierIA.pe y quiero hacerte una consulta.");
  });
  $("#year").textContent = new Date().getFullYear();

  var redes = $("#redes");
  Object.keys(CONFIG.redes).forEach(function (n) {
    if (!CONFIG.redes[n]) return;
    var a = document.createElement("a");
    a.href = CONFIG.redes[n]; a.textContent = n; a.target = "_blank"; a.rel = "noopener";
    redes.appendChild(a);
  });

  var driveBtn = $("#driveBtn");
  if (CONFIG.driveUrl) { driveBtn.href = CONFIG.driveUrl; }
  else {
    driveBtn.classList.add("is-off");
    driveBtn.removeAttribute("href");
    driveBtn.setAttribute("aria-disabled", "true");
    $("#driveNote").hidden = false;
  }

  /* ---------- Pausa de animaciones decorativas ---------- */
  var pausaBtn = $("#pausaBtn");
  if (pausaBtn) pausaBtn.addEventListener("click", function () {
    var on = document.documentElement.hasAttribute("data-pausa");
    if (on) document.documentElement.removeAttribute("data-pausa"); else document.documentElement.setAttribute("data-pausa", "");
    pausaBtn.setAttribute("aria-pressed", on ? "false" : "true");
    pausaBtn.textContent = on ? "Pausar animación" : "Reanudar animación";
  });

  /* ---------- Menú móvil ---------- */
  var toggle = $("#navToggle"), menu = $("#menu");
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) { menu.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); } });
  toggle.addEventListener("click", function () {
    var abierto = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  $$("#menu a").forEach(function (a) {
    a.addEventListener("click", function () { menu.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); });
  });

  /* ---------- Demostración en pantalla dividida ---------- */
  var DEMOS = {
    sap:   { nombre: "Cobertura metálica en SAP2000", app: "SAP2000", file: "assets/video/sap2000-cobertura.mp4", poster: "assets/img/sap2000-cobertura.jpg", cap: "Claude define materiales, secciones y cargas en SAP2000, y corre el análisis." },
    excel: { nombre: "Valorización en Excel", app: "Excel", file: "assets/video/excel-valorizacion.mp4", poster: "assets/img/excel-valorizacion.jpg", cap: "Claude arma la valorización del mes con fórmulas vivas." },
    word:  { nombre: "Informe mensual en Word", app: "Word", file: "assets/video/word-informe.mp4", poster: "assets/img/word-informe.jpg", cap: "Claude redacta el informe con tus plantillas y estilos." },
    project: { nombre: "Cronograma en MS Project", app: "MS Project", file: "assets/video/project-cronograma.mp4", poster: "assets/img/project-cronograma.jpg", cap: "Claude arma el cronograma de obra, enlaza tareas y actualiza el avance real." },
    civil: { nombre: "Planos en Civil 3D", app: "Civil 3D", file: "assets/video/civil3d-dibujo.mp4", poster: "assets/img/civil3d-dibujo.jpg", cap: "Claude dibuja polilíneas, puntos y cuadros en el dibujo abierto." }
  };
  var video = $("#demoVideo"), slot = $("#demoSlot"), btnPausa = $("#demoToggle");
  var pausadoPorUsuario = false;

  function fuente(f) { return video.canPlayType('video/mp4; codecs="avc1.42E01E"') ? f : f.replace(/\.mp4$/, ".webm"); }
  function cargarDemo(k) {
    var d = DEMOS[k];
    $("#demoName").textContent = d.nombre;
    $("#demoCap").textContent = d.cap;
    $("#slotApp").textContent = d.app;
    $("#slotFile").textContent = d.file;
    slot.hidden = false; btnPausa.hidden = true;
    video.removeAttribute("src");
    video.poster = d.poster || "";
    video.src = fuente(d.file);
    video.load();
  }
  video.addEventListener("loadeddata", function () {
    slot.hidden = true; btnPausa.hidden = false;
    if (!reduce && !pausadoPorUsuario) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    btnPausa.textContent = video.paused ? "Reproducir" : "Pausar";
  });
  video.addEventListener("error", function () { slot.hidden = false; btnPausa.hidden = true; });
  btnPausa.addEventListener("click", function () {
    if (video.paused) { pausadoPorUsuario = false; video.play(); btnPausa.textContent = "Pausar"; }
    else { pausadoPorUsuario = true; video.pause(); btnPausa.textContent = "Reproducir"; }
  });
  var demoTabs = $("#demoTabs");
  demoTabs.addEventListener("click", function (e) {
    var t = e.target.closest("[data-demo]"); if (!t) return;
    marcar(demoTabs, t); cargarDemo(t.dataset.demo);
  });
  teclasTabs(demoTabs);
  cargarDemo("sap");

    var SKILLS = [
    { id: "caratulas", nombre: "Skill de carátulas", span: "s-12", tono: "tone-hl", feat: true,
      desc: "Carátula A4, lomo de archivador y separadores para expedientes técnicos, con los datos de tu proyecto." },
    { id: "metrados", nombre: "Skill de metrados", span: "s-5", tono: "",
      desc: "Planillas de metrados con fórmulas vivas, en formato tipo S10, listas para revisar." },
    { id: "valorizaciones", nombre: "Skill de valorizaciones", span: "s-7", tono: "tone-t",
      desc: "Valorización mensual con metrados ejecutados, saldos y resumen para la entidad." },
    { id: "ley", nombre: "Skill de Ley de Contrataciones del Estado", span: "s-7", tono: "",
      desc: "Respuestas con base legal sobre la Ley 32069 y su reglamento: plazos, ampliaciones y adicionales." },
    { id: "contrata", nombre: "Skill de ejecución de obra por contrata", span: "s-5", tono: "tone-p",
      desc: "El procedimiento del residente: cuaderno de obra, ampliaciones de plazo, adicionales, valorizaciones y cartas." },
    { id: "admin", nombre: "Skill de ejecución por administración directa", span: "s-5", tono: "",
      desc: "Informes, control de gastos y documentos de la obra ejecutada por administración directa." },
    { id: "supervision", nombre: "Skill de supervisión", span: "s-7", tono: "tone-t",
      desc: "Revisión de documentos del contratista, informes mensuales y opiniones dentro del plazo." }
  ];
/* ---------- Explorador por etapa ---------- */
  // vista: "metrados", "presupuesto" o "plazos".
  var ETAPAS = [
    { id: "antes", nombre: "Antes de la obra", items: [
      { id: "formulacion", nombre: "Formulación de proyectos", resumen: "Ordena la idea de inversión y arma los documentos de formulación.",
        entra: ["Idea y diagnóstico", "Datos del territorio", "Lineamientos aplicables"], sale: ["Borrador del documento", "Cuadros de apoyo", "Lista de pendientes"] },
      { id: "expedientes", nombre: "Expedientes técnicos", resumen: "Memoria descriptiva, especificaciones técnicas y revisión de consistencia entre documentos.",
        entra: ["Planos y metrados", "Estudios básicos", "Plantilla de la entidad"], sale: ["Memoria descriptiva", "Especificaciones técnicas", "Índice y revisión cruzada"] },
      { id: "tdr", nombre: "TDR", resumen: "Términos de referencia con estructura ordenada y requisitos claros.",
        entra: ["Necesidad y alcance", "Plazo y entregables", "Perfil requerido"], sale: ["TDR completo", "Requisitos y forma de pago", "Criterios de evaluación"] },
      { id: "metrados", nombre: "Metrados", vista: "metrados", resumen: "Planillas con fórmulas vivas, sin valores pegados. Prueba el formato con datos de ejemplo.",
        entra: ["Planos", "Lista de partidas", "Criterios de medición"], sale: ["Planilla en Excel", "Resumen por partida", "Sustento de cada medida"] },
      { id: "presupuesto", nombre: "Presupuesto", vista: "presupuesto", resumen: "Presupuesto referencial por rubros. Toca un rubro para ver su peso.",
        entra: ["Metrados", "Precios de mercado", "Gastos generales y utilidad"], sale: ["Presupuesto en Excel", "Análisis de precios unitarios", "Resumen por rubros"] },
      { id: "cotizaciones", nombre: "Cotizaciones", resumen: "Estudio de mercado y cuadro comparativo de proveedores.",
        entra: ["Alcance y planos", "Lista de proveedores", "Precios anteriores"], sale: ["Cuadro comparativo", "Estudio de mercado", "Precio de referencia"] },
      { id: "caratulas", nombre: "Carátulas", resumen: "Carátula A4, lomo de archivador y separadores para el expediente.",
        entra: ["Datos del proyecto", "Logo y foto de la obra", "Cantidad de tomos"], sale: ["Carátula A4", "Lomo de archivador", "Separadores"] },
      { id: "ley", nombre: "Ley de Contrataciones", resumen: "Consultas sobre la Ley 32069 y su reglamento, con base legal citada. Verifica siempre contra la norma vigente.",
        entra: ["Tu consulta y el caso", "Ley y reglamento", "Fechas relevantes"], sale: ["Procedimiento aplicable", "Base legal citada", "Borrador del documento"] },
      { id: "bases", nombre: "Revisión de bases", resumen: "Lectura de las bases para encontrar requisitos, riesgos y puntos a consultar.",
        entra: ["Bases del procedimiento", "Expediente técnico", "Tu experiencia y plazos"], sale: ["Lista de requisitos", "Puntos de riesgo", "Consultas y observaciones a redactar"] },
      { id: "oferta", nombre: "Oferta técnica", resumen: "Estructura de la oferta y lista de verificación antes de presentar.",
        entra: ["Bases", "Documentos de la empresa", "Experiencia"], sale: ["Estructura de la oferta", "Declaraciones y anexos", "Lista de verificación"] }
    ] },
    { id: "durante", nombre: "Durante la obra", items: [
      { id: "residencia", nombre: "Residencia de obra", resumen: "Cuaderno de obra, cartas e informes dentro del plazo.",
        entra: ["Contrato y cronograma", "Cuaderno de obra", "Avance del mes"], sale: ["Asientos del cuaderno", "Cartas e informes", "Valorización del mes"] },
      { id: "admindirecta", nombre: "Administración directa", resumen: "Informes y control de gastos de la obra por administración directa.",
        entra: ["Expediente y presupuesto analítico", "Mano de obra y materiales", "Avance semanal"], sale: ["Informes mensuales", "Control de gastos", "Registro del avance"] },
      { id: "supervision", nombre: "Supervisión", resumen: "Revisión de lo que presenta el contratista y respuesta dentro del plazo.",
        entra: ["Documentos del contratista", "Contrato y expediente", "Avance verificado"], sale: ["Informe mensual", "Opinión sobre ampliaciones y adicionales", "Observaciones al contratista"] },
      { id: "valorizaciones", nombre: "Valorizaciones", resumen: "Valorización mensual con saldos y resumen para la entidad.",
        entra: ["Metrados ejecutados", "Contrato y presupuesto", "Adelantos y reajustes"], sale: ["Valorización en Excel", "Resumen para la entidad", "Control de saldos"] },
      { id: "cronograma", nombre: "Cronograma en MS Project", vista: "", resumen: "Cronograma de obra con tareas enlazadas, ruta crítica y avance real, armado dentro de Microsoft Project.",
        entra: ["Partidas y metrados", "Rendimientos y recursos", "Fecha de inicio y plazo"], sale: ["Cronograma .mpp", "Ruta crítica", "Línea base y avance"] },
      { id: "planes", nombre: "Planes de obra", resumen: "Programación y calendarios de adquisiciones ordenados a partir del cronograma en MS Project.",
        entra: ["Cronograma", "Metrados", "Recursos"], sale: ["Programación", "Calendario de adquisiciones", "Plan de trabajo"] },
      { id: "calidad", nombre: "Control de calidad", resumen: "Formatos y registros para sustentar la calidad de lo ejecutado.",
        entra: ["Especificaciones técnicas", "Ensayos y protocolos"], sale: ["Formatos de control", "Registro de pruebas", "Informe de calidad"] },
      { id: "auditoria", nombre: "Auditoría de documentación", resumen: "Revisa la carpeta de obra y detecta faltantes e inconsistencias.",
        entra: ["Carpeta de obra", "Lista de documentos exigidos"], sale: ["Reporte de faltantes", "Inconsistencias entre documentos", "Plan para subsanar"] },
      { id: "seguimiento", nombre: "Seguimiento y monitoreo", vista: "plazos", resumen: "Seguimiento del avance contra la línea base en MS Project y matriz de plazos con alertas. Cambia la fecha de hoy y mira cómo cambian los estados.",
        entra: ["Fechas del contrato", "Hitos", "Calendario"], sale: ["Matriz de plazos", "Alertas de vencimiento", "Informe de seguimiento"] }
    ] },
    { id: "despues", nombre: "Después de la obra", items: [
      { id: "liquidacion", nombre: "Liquidación técnica y financiera", resumen: "Cuadros y memoria de liquidación con la carpeta ordenada.",
        entra: ["Valorizaciones", "Documentos sustentatorios", "Acta de recepción"], sale: ["Cuadros de liquidación", "Memoria de liquidación", "Carpeta ordenada"] },
      { id: "cierre", nombre: "Cierre de proyecto", resumen: "Lista de cierre e informe final del proyecto.",
        entra: ["Documentos de recepción", "Planos post construcción", "Informe final"], sale: ["Lista de cierre", "Informe final", "Carpeta de cierre"] }
    ] },
    { id: "ingenieria", nombre: "Ingeniería y modelado", items: [
      { id: "sap", nombre: "Cálculo con SAP2000", resumen: "Claude modela, asigna cargas, corre el análisis y lee resultados. Tú verificas y firmas.",
        entra: ["Geometría y cargas", "Materiales y secciones", "Normas aplicables"], sale: ["Modelo en SAP2000", "Reacciones y desplazamientos", "Memoria de cálculo"] },
      { id: "civil3d", nombre: "Dibujo en Civil 3D", resumen: "Claude dibuja en el archivo abierto: capas, polilíneas, puntos, cotas y tablas.",
        entra: ["Coordenadas y medidas", "Capas del proyecto"], sale: ["Polilíneas y puntos", "Cuadros y textos", "Plano guardado"] },
      { id: "revit", nombre: "Modelado en Revit", resumen: "Modelado BIM con Claude, .", entra: ["Planos de arquitectura", "Niveles y ejes"], sale: ["Modelo base", "Vistas y cuadros"] },
      { id: "sketchup", nombre: "Modelado en SketchUp", resumen: "Volumetría y modelado 3D con Claude, .", entra: ["Planos y cotas"], sale: ["Modelo 3D", "Vistas para presentar"] }
    ] }
  ];

  var etapaTabs = $("#etapaTabs"), chips = $("#temaChips"), panel = $("#temaPanel");
  var etapaActual = 0, temaActual = 0;

  var ICONOS = {
    antes: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    durante: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    despues: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    ingenieria: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'
  };
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var lastDir = 0;
  function renderEtapas() {
    etapaTabs.innerHTML = ETAPAS.map(function (e, i) {
      var dots = e.items.map(function (_, k) { return '<i style="transition-delay:' + (k * 28) + 'ms"></i>'; }).join("");
      return '<button type="button" class="stage" role="tab" aria-selected="' + (i === etapaActual) + '" data-etapa="' + i + '">' +
        '<span class="stage__top"><span class="stage__n">' + pad2(i + 1) + '</span><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[e.id] || "") + '</svg></span>' +
        '<span class="stage__t">' + e.nombre + '</span>' +
        '<span class="stage__c">' + e.items.length + ' temas</span>' +
        '<span class="stage__dots" aria-hidden="true">' + dots + '</span></button>';
    }).join("");
  }
  function renderChips() {
    chips.innerHTML = '<i class="cat__ind" aria-hidden="true"></i>' + ETAPAS[etapaActual].items.map(function (t, i) {
      return '<button class="topic" role="tab" style="--i:' + i + '" aria-selected="' + (i === temaActual) + '" data-tema="' + i + '"><span class="topic__n">' + pad2(i + 1) + '</span><span class="topic__t">' + t.nombre + '</span><span class="topic__a" aria-hidden="true">&rarr;</span></button>';
    }).join("");
    requestAnimationFrame(moverInd);
  }
  function moverInd() {
    var ind = chips.querySelector(".cat__ind"), sel = chips.querySelector('[aria-selected="true"]');
    if (!ind || !sel) return;
    ind.style.height = sel.offsetHeight + "px";
    ind.style.transform = "translateY(" + sel.offsetTop + "px)";
    if (chips.scrollWidth > chips.clientWidth + 2 && chips.scrollTo) chips.scrollTo({ left: sel.offsetLeft - (chips.clientWidth - sel.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }
  window.addEventListener("resize", moverInd);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverInd);
  function lista(a) { return "<ul>" + a.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }

  function renderTema() {
    var t = ETAPAS[etapaActual].items[temaActual], d = (window.DETALLE || {})[t.id] || {};
    var n = ETAPAS[etapaActual].items.length;
    var html = '<div class="tema__top"><div class="tema__meta"><span>' + ETAPAS[etapaActual].nombre + '</span><span class="tema__count"><b>' + pad2(temaActual + 1) + "</b> / " + pad2(n) + '</span></div><h3>' + t.nombre + "</h3><p>" + t.resumen + '</p>' +
      '<div class="tema__nav"><button class="nbtn" type="button" data-dir="-1" aria-label="Tema anterior">&larr;</button><button class="nbtn" type="button" data-dir="1" aria-label="Tema siguiente">&rarr;</button></div></div>';
    html += (d.vis ? '<figure class="vis"><div class="vis__top"><span><i></i>Ejemplo animado</span><button class="vis__re" type="button">Ver de nuevo</button></div>' + d.vis + '<figcaption>Ejemplo ilustrativo con datos de muestra</figcaption></figure>' : "") +
      '<div class="tema__cols"><div class="tema__txt">' + (d.detalle ? "<p>" + d.detalle + "</p>" : "") + "</div>" +
      (d.pasos ? '<div><h4 class="lbl">Cómo se trabaja</h4><ol class="pasos">' + d.pasos.map(function (x, k) { return '<li style="--i:' + k + '">' + x + "</li>"; }).join("") + "</ol></div>" : "") + "</div>";
    html += '<div class="etimg" id="etImg" hidden></div>';
    if (t.vista === "metrados") html += vistaMetrados();
    if (t.vista === "presupuesto") html += vistaPresupuesto();
    if (t.vista === "plazos") html += vistaPlazos();
    html += '<div class="io"><div class="io__box"><h4>Tú entregas</h4>' + lista(t.entra) + '</div><div class="io__mid" aria-hidden="true"><b>Claude</b></div><div class="io__box"><h4>Recibes</h4>' + lista(t.sale) + "</div></div>" +
      '<div class="tema__foot"><a class="btn btn--ink" href="' + wa("Hola, quiero consultar sobre: " + t.nombre + ".") + '" target="_blank" rel="noopener">Escríbeme por WhatsApp</a></div>';
    panel.innerHTML = html;
    if (!reduce && panel.animate) panel.animate([{ opacity: 0, transform: lastDir ? "translateX(" + lastDir * 28 + "px)" : "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.23,1,.32,1)" });
    // imagen de la etapa hecha en Canva (opcional): assets/img/etapa-<id>.jpg
    var im = new Image(); im.alt = ""; im.width = 800; im.height = 800; im.loading = "lazy"; im.decoding = "async";
    im.onload = function () { var b = $("#etImg"); if (b) { b.innerHTML = ""; b.appendChild(im); b.hidden = false; } };
    im.src = "assets/img/etapa-" + ETAPAS[etapaActual].id + ".jpg";
    if (t.vista === "metrados") bindMetrados();
    if (t.vista === "presupuesto") bindPresupuesto();
    if (t.vista === "plazos") bindPlazos();
  }

  function ir(dir) {
    var n = ETAPAS[etapaActual].items.length, t = temaActual + dir, cambia = false;
    if (t >= n) { etapaActual = (etapaActual + 1) % ETAPAS.length; t = 0; cambia = true; }
    else if (t < 0) { etapaActual = (etapaActual - 1 + ETAPAS.length) % ETAPAS.length; t = ETAPAS[etapaActual].items.length - 1; cambia = true; }
    temaActual = t; lastDir = dir;
    if (cambia) { renderEtapas(); renderChips(); } else { marcar(chips, chips.querySelectorAll(".topic")[t]); moverInd(); }
    renderTema();
    var nb = panel.querySelector('.nbtn[data-dir="' + dir + '"]'); if (nb) nb.focus();
  }
  panel.addEventListener("click", function (e) {
    var nb = e.target.closest(".nbtn"); if (nb) { ir(+nb.dataset.dir); return; }
    var b = e.target.closest(".vis__re"); if (!b) return;
    var s = panel.querySelector(".vis__svg"); if (s) s.outerHTML = s.outerHTML;
  });

  etapaTabs.addEventListener("click", function (e) {
    var b = e.target.closest("[data-etapa]"); if (!b) return;
    etapaActual = +b.dataset.etapa; temaActual = 0; lastDir = 0;
    marcar(etapaTabs, b); renderChips(); renderTema();
  });
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tema]"); if (!b) return;
    lastDir = (+b.dataset.tema > temaActual) ? 1 : (+b.dataset.tema < temaActual ? -1 : 0);
    temaActual = +b.dataset.tema; marcar(chips, b); moverInd(); renderTema();
  });
  /* foco de luz que sigue al mouse en la tarjeta principal */
  var catMain = $("#catMain"), spot = 0;
  if (catMain && window.matchMedia("(hover: hover) and (pointer: fine)").matches) catMain.addEventListener("pointermove", function (e) {
    if (spot) return; spot = requestAnimationFrame(function () {
      spot = 0; var r = catMain.getBoundingClientRect();
      catMain.style.setProperty("--sx", (e.clientX - r.left) + "px"); catMain.style.setProperty("--sy", (e.clientY - r.top) + "px");
    });
  }, { passive: true });
  teclasTabs(etapaTabs); teclasTabs(chips);

  /* Vista: metrados con fórmulas vivas */
  var FILAS = [["Zapata Z-1", 4, 1.2, 1.2, 0.5], ["Columna C-1", 4, 0.3, 0.3, 2.8], ["Viga V-1", 2, 4, 0.25, 0.4]];
  function vistaMetrados() {
    var filas = FILAS.map(function (f, i) {
      return "<tr><td>" + f[0] + "</td>" + [1, 2, 3, 4].map(function (c) {
        return '<td class="num"><input class="cellin" type="number" min="0" step="0.01" value="' + f[c] + '" data-f="' + i + '" data-c="' + c + '" aria-label="' + ["", "Cantidad", "Largo", "Ancho", "Alto"][c] + " de " + f[0] + '"></td>';
      }).join("") + '<td class="num" id="mp' + i + '">0.00</td></tr>';
    }).join("");
    return '<div class="vista"><div class="vista__head"><strong>Concreto f\'c = 210 kg/cm2</strong><small>Datos de ejemplo. Cambia una medida y mira el total.</small></div>' +
      '<div class="tablewrap"><table><thead><tr><th>Descripción</th><th class="num">Cant.</th><th class="num">Largo</th><th class="num">Ancho</th><th class="num">Alto</th><th class="num">Parcial (m3)</th></tr></thead><tbody>' + filas +
      '</tbody><tfoot><tr><th colspan="5">Total</th><td class="num" id="mtTotal">0.00</td></tr></tfoot></table></div></div>';
  }
  function bindMetrados() {
    var inputs = $$(".cellin", panel);
    function calc() {
      var total = 0;
      FILAS.forEach(function (f, i) {
        var v = $$('[data-f="' + i + '"]', panel).map(function (x) { return parseFloat(x.value) || 0; });
        var p = v[0] * v[1] * v[2] * v[3]; total += p;
        $("#mp" + i).textContent = p.toFixed(2);
      });
      $("#mtTotal").textContent = total.toFixed(2);
    }
    inputs.forEach(function (i) { i.addEventListener("input", calc); });
    calc();
  }

  /* Vista: presupuesto por rubros (mapa de áreas) */
  var RUBROS = [
    [{ n: "Estructuras", p: 34, c: "#FFFFFF" }, { n: "Obras preliminares", p: 10, c: "#E6E6E6" }],
    [{ n: "Arquitectura", p: 21, c: "#D6D6D6" }, { n: "Instalaciones sanitarias", p: 12, c: "#C6C6C6" }],
    [{ n: "Instalaciones eléctricas", p: 9, c: "#B6B6B6" }, { n: "Gastos generales y utilidad", p: 14, c: "#A6A6A6" }]
  ];
  var BASE = 1250000;
  function vistaPresupuesto() {
    var cols = RUBROS.map(function (col) {
      var suma = col.reduce(function (a, r) { return a + r.p; }, 0);
      return '<div class="tm__col" style="flex:' + suma + '">' + col.map(function (r) {
        return '<button class="tm__cell" type="button" style="flex:' + r.p + ';background:' + r.c + '" data-n="' + r.n + '" data-p="' + r.p + '">' + r.n + "<small>" + r.p + " %</small></button>";
      }).join("") + "</div>";
    }).join("");
    return '<div class="vista"><div class="vista__head"><strong>Presupuesto referencial por rubros</strong><small>Datos de ejemplo</small></div><div class="tm">' + cols + '</div><p class="tm__info" id="tmInfo" aria-live="polite">Toca un rubro para ver su peso.</p></div>';
  }
  function bindPresupuesto() {
    function info(b) {
      var monto = Math.round(BASE * b.dataset.p / 100).toLocaleString("es-PE");
      $("#tmInfo").textContent = b.dataset.n + ": " + b.dataset.p + " % del presupuesto, S/ " + monto + " (ejemplo).";
    }
    $$(".tm__cell", panel).forEach(function (b) {
      ["click", "mouseenter", "focus"].forEach(function (ev) { b.addEventListener(ev, function () { info(b); }); });
    });
  }

  /* Vista: matriz de plazos */
  var HITOS = [["Presentar la valorización del mes", 3], ["Anotar y sustentar la ampliación de plazo", 9], ["Entregar el informe mensual", 14], ["Solicitar la recepción de obra", 40]];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function desdeIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var baseHoy = new Date(); baseHoy.setHours(0, 0, 0, 0);
  function vistaPlazos() {
    return '<div class="vista"><div class="vista__head"><label class="hoy">Fecha de hoy <input type="date" id="hoyIn" value="' + iso(baseHoy) + '"></label><small>Fechas de ejemplo</small></div>' +
      '<div class="tablewrap"><table><thead><tr><th>Hito</th><th>Fecha límite</th><th class="num">Días</th><th>Estado</th></tr></thead><tbody id="plBody"></tbody></table></div></div>';
  }
  function bindPlazos() {
    var inp = $("#hoyIn");
    function pintar() {
      var hoy = desdeIso(inp.value || iso(baseHoy));
      $("#plBody").innerHTML = HITOS.map(function (h) {
        var lim = new Date(baseHoy); lim.setDate(lim.getDate() + h[1]);
        var dias = Math.round((lim - hoy) / 86400000);
        var est = dias < 0 ? ["est--u", "Vencido"] : dias <= 5 ? ["est--u", "Urgente"] : dias <= 15 ? ["est--p", "Próximo"] : ["est--o", "En plazo"];
        return "<tr><td>" + h[0] + "</td><td>" + lim.toLocaleDateString("es-PE") + '</td><td class="num">' + dias + '</td><td><span class="est ' + est[0] + '">' + est[1] + "</span></td></tr>";
      }).join("");
    }
    inp.addEventListener("input", pintar); pintar();
  }

  renderEtapas(); renderChips(); renderTema();

  
/* ---------- Formularios que abren WhatsApp ---------- */
  function error(campo, msg) {
    var f = campo.closest(".field"), e = $(".err", f);
    f.classList.toggle("has-err", !!msg); if (e) e.textContent = msg || "";
  }
  $("#formCurso").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var n = $("#cNombre"); error(n, "");
    if (!n.value.trim()) { error(n, "Escribe tu nombre."); n.focus(); return; }
    abrirWa("Hola, soy " + n.value.trim() + ". Quiero anotarme en la lista de espera de: " + $("#cCurso").value + ".");
  });
  $("#formServ").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var rol = $("#sRol"), nec = $("#sNecesito"), ok = true;
    error(rol, ""); error(nec, "");
    if (!rol.value) { error(rol, "Elige tu rol."); ok = false; }
    if (!nec.value) { error(nec, "Elige qué necesitas."); if (ok) nec.focus(); ok = false; }
    if (!ok) { if (!rol.value) rol.focus(); return; }
    var v = function (id, d) { return ($(id).value || "").trim() || d; };
    var msg = "Contrato: " + v("#sContrato", "no indicado") + " | Mi rol: " + rol.value + " | Fase: " + $("#sFase").value +
      " / Necesito: " + nec.value + (v("#sPara", "") ? " para " + v("#sPara", "") : "") +
      " / Salida: " + $("#sSalida").value + " | Adjunto: lo envío por este chat" +
      " / Restricciones: " + v("#sRestr", "ninguna") + " / Notas: " + v("#sNotas", "sin notas");
    abrirWa(msg);
  });

  /* ---------- Contacto y redes en el pie ---------- */
  (function () {
    var cont = $("#redes");
    var a = document.createElement("a");
    a.href = wa("Hola, vi tu página ingenierIA.pe y quiero hacerte una consulta.");
    a.textContent = "WhatsApp"; a.target = "_blank"; a.rel = "noopener";
    cont.insertBefore(a, cont.firstChild);
  })();

  /* ---------- Skills en filas ---------- */
  var skillsList = $("#skillsList");
  SKILLS.forEach(function (k) {
    var li = document.createElement("li");
    li.innerHTML = '<div class="skillrow"><b>' + k.nombre + "</b><span>" + k.desc + "</span></div>" +
      '<div class="skillside"><span class="badge badge--disp">Disponible</span>' +
      '<button class="btn btn--sm" type="button" data-pedir="' + k.id + '">Quiero esta skill</button></div>';
    skillsList.appendChild(li);
  });
  skillsList.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var k = SKILLS.filter(function (s) { return s.id === b.dataset.pedir; })[0]; if (!k) return;
    var nom = k.nombre.replace("Skill", "skill");
    abrirWa("Hola, quiero la " + nom + "" + ". ¿Cómo la recibo?");
  });

  /* ---------- Cifras de la tarjeta (se calculan solas desde los datos) ---------- */
  (function () {
    var total = 0, listos = 0;
    ETAPAS.forEach(function (e) { e.items.forEach(function () { total++; listos++; }); });
    var card = $("#statCard");
    $("#statN").textContent = total;
    $("#statCap").textContent = "Temas por etapa, de la formulación a la liquidación";
    card.style.setProperty("--w", "0%");
    var mayor = Math.max.apply(null, ETAPAS.map(function (e) { return e.items.length; }));
    $("#stageBars").innerHTML = ETAPAS.map(function (e) {
      return '<div class="brow"><p><span>' + e.nombre + "</span><b>" + e.items.length + '</b></p><div class="bar"><i style="--w:' + (e.items.length / mayor * 100).toFixed(1) + '%"></i></div></div>';
    }).join("");
    $$("i", card).forEach(function (i) { var w = i.style.getPropertyValue("--w"); i.dataset.w = w; });
    var obs = null;
    function lanzar() { $$("i", card).forEach(function (i) { i.classList.add("on"); }); }
    if ("IntersectionObserver" in window && !reduce) {
      obs = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { lanzar(); obs.disconnect(); } }, { threshold: .4 });
      obs.observe(card);
    } else lanzar();
  })();

  /* ---------- Calculadora de ahorro ---------- */

  /* ---------- Aparición al hacer scroll ---------- */
  var objetivos = $$(".sec .split__txt, .sec .gc--split > :not(.split__txt), .card--layers, .card--stat, .model, .contact__link, .fig-m");
  if ("IntersectionObserver" in window && !reduce) {
    var rv = new IntersectionObserver(function (ents) {
      var k = 0;
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.style.setProperty("--d", Math.min(k++, 4) * 60 + "ms");
        t.classList.add("is-vis");
        setTimeout(function () { t.classList.remove("rv"); t.style.removeProperty("--d"); }, 1500);
        rv.unobserve(t);
      });
    }, { threshold: .08, rootMargin: "0px 0px -5% 0px" });
    objetivos.forEach(function (el) { el.classList.add("rv"); rv.observe(el); });
  }


  /* ---------- Cursos: reveal, filtro por rol, elegir curso, tilt ---------- */
  (function () {
    var grid = $("#cursosList"); if (!grid) return;
    var cards = [].slice.call(grid.querySelectorAll(".ccard"));
    var sel = $("#cCurso"), form = $("#formCurso");
    if (reduce || !("IntersectionObserver" in window)) grid.classList.add("is-in");
    else {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { grid.classList.add("is-in"); io.disconnect(); }
      }, { threshold: .12 });
      io.observe(grid);
    }
    var cnt = $("#cCount");
    function filtrar(rol) {
      var vis = [];
      cards.forEach(function (c) {
        var ok = rol === "todos" || c.dataset.roles.split(" ").indexOf(rol) > -1;
        c.hidden = !ok; c.classList.remove("is-wide");
        if (ok) { vis.push(c); c.classList.remove("is-pop"); void c.offsetWidth; c.classList.add("is-pop"); c.style.setProperty("--i", vis.length - 1); }
      });
      if (vis.length % 2 === 1 && window.matchMedia("(min-width: 700px)").matches) vis[vis.length - 1].classList.add("is-wide");
      if (cnt) cnt.textContent = rol === "todos" ? "5 cursos" : vis.length + (vis.length === 1 ? " curso para ti" : " cursos para ti");
    }
    var botones = [].slice.call(document.querySelectorAll(".cfilter button"));
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var rol = b.dataset.rol;
        botones.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        filtrar(rol);
      });
    });
    function marcar(nombre) {
      cards.forEach(function (c) { c.classList.toggle("is-picked", c.dataset.curso === nombre); });
    }
    cards.forEach(function (c) {
      $(".ccard__cta", c).addEventListener("click", function () {
        sel.value = c.dataset.curso; marcar(c.dataset.curso);
        form.classList.remove("pulse"); void form.offsetWidth; form.classList.add("pulse");
        if (window.matchMedia("(max-width: 999px)").matches) form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        setTimeout(function () { $("#cNombre").focus({ preventScroll: true }); }, reduce ? 0 : 350);
      });
    });
    sel.addEventListener("change", function () { marcar(sel.value); });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
      cards.forEach(function (c) {
        c.addEventListener("pointermove", function (e) {
          var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          c.style.setProperty("--ry", ((px - .5) * 4).toFixed(2) + "deg");
          c.style.setProperty("--rx", ((.5 - py) * 3).toFixed(2) + "deg");
          c.style.setProperty("--sx", (px * 100).toFixed(1) + "%");
          c.style.setProperty("--sy", (py * 100).toFixed(1) + "%");
        });
        c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
      });
    }
  })();


  /* ---------- La barra se oculta al bajar y vuelve al subir ---------- */
  (function () {
    var nav = $("#nav"), y0 = window.scrollY, tick = false, heroEl = $("#inicio");
    function tono() {}
    window.addEventListener("scroll", function () {
      tono();
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var y = window.scrollY, dy = y - y0;
        if (Math.abs(dy) < 8) return;
        var abierto = menu.classList.contains("is-open");
        
        y0 = y;
      });
    }, { passive: true });
  })();
})();
