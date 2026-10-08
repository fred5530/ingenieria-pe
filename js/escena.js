/* ingenierIA.pe v2 - escena isométrica que cambia con el scroll
   Etapa 1: una obra (caseta, puente, reservorio, cobertura metálica y semáforo) va apareciendo pieza por pieza.
   Etapa 2: la obra sale y entra una pila de programas de ingeniería conectados a Claude.
   Dibujo en blanco, gris y negro, con acento rojo, igual que las ilustraciones de Aria.
   En pantallas chicas se dibujan las dos escenas ya armadas, sin animación. */
(function () {
  "use strict";

  var C = { top: "#FAFAFA", r: "#E3E3E3", l: "#CBCBCB", ln: "rgba(13,13,13,.38)", dark: "#131313", dark2: "#232323", red: "#E5513D", sh: "#B4B4B4", mid: "#EDEDED" };

  /* ---------- Geometría isométrica ---------- */
  function Geo(U, V, H, OX, OY) { this.U = U; this.V = V; this.H = H; this.OX = OX; this.OY = OY; }
  Geo.prototype.P = function (x, y, z) { z = z || 0; return [this.OX + (x - y) * this.U, this.OY + (x + y) * this.V - z * this.H]; };
  Geo.prototype.pts = function (c) {
    var self = this;
    return c.map(function (q) { var p = self.P(q[0], q[1], q[2]); return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  };
  Geo.prototype.poly = function (c, fill, stroke, sw) {
    return '<polygon points="' + this.pts(c) + '" fill="' + fill + '" stroke="' + (stroke === undefined ? C.ln : stroke) + '" stroke-width="' + (sw || 1) + '" stroke-linejoin="round"/>';
  };
  Geo.prototype.box = function (x, y, z, w, d, h, col) {
    col = col || {};
    return this.poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], col.t || C.top) +
           this.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], col.r || C.r) +
           this.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], col.l || C.l);
  };
  /* rectángulo dibujado sobre la cara izquierda (plano y = yd, a lo largo de x) */
  Geo.prototype.faceL = function (x, yd, z, w, h, fill, stroke, sw) {
    return this.poly([[x, yd, z], [x + w, yd, z], [x + w, yd, z + h], [x, yd, z + h]], fill, stroke, sw);
  };
  Geo.prototype.shadow = function (x, y, w, d, h, k) {
    var sy = h * (k || .8), sx = -h * .15, a = [];
    var c = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], i, p;
    for (i = 0; i < 4; i++) { a.push(this.P(c[i][0], c[i][1], 0)); a.push(this.P(c[i][0] + sx, c[i][1] + sy, 0)); }
    var hull = convexHull(a);
    return '<polygon points="' + hull.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ") + '" fill="' + C.sh + '" opacity=".55"/>';
  };
  function convexHull(pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop(); return lo.concat(up);
  }

  /* ---------- Escena 1: la obra ---------- */
  function obra() {
    var g = new Geo(44, 25.4, 44, 440, 175), out = [], D = { t: C.dark, r: C.dark, l: C.dark };

    // caseta de obra (atrás a la izquierda)
    out.push({ id: "caseta", d: 1,
      svg: g.shadow(.6, .4, 2.8, 1.8, 1.4, .7) +
        g.box(.6, .4, 0, 2.8, 1.8, 1.3, { r: C.r, l: C.dark }) +
        g.box(.5, .3, 1.3, 3.0, 2.0, .12, { t: C.top, r: C.r, l: C.l }) +
        g.faceL(.9, 2.2, .5, .6, .55, C.dark2, C.red, 1) + g.faceL(1.7, 2.2, .5, .6, .55, C.dark2, C.red, 1) +
        g.faceL(2.6, 2.2, 0, .5, .95, "#050505", C.red, 1) });

    // reservorio (atrás a la derecha)
    var rp = g.P(7.7, 1.7, 0), rx = 1.15 * g.U * 1.4142, ry = 1.15 * g.V * 1.4142, top = rp[1] - 2.0 * g.H;
    out.push({ id: "reservorio", d: 3,
      svg: g.shadow(6.6, .6, 2.2, 2.2, 2.0, .6) +
        '<path d="M' + (rp[0] - rx) + "," + top + " L" + (rp[0] - rx) + "," + rp[1] + " A" + rx + "," + ry + " 0 0 0 " + (rp[0] + rx) + "," + rp[1] + " L" + (rp[0] + rx) + "," + top + ' Z" fill="' + C.l + '" stroke="' + C.ln + '"/>' +
        '<path d="M' + (rp[0] + rx * .35) + "," + (top + ry * .93) + " L" + (rp[0] + rx * .35) + "," + (rp[1] + ry * .93) + " L" + (rp[0] + rx) + "," + rp[1] + " L" + (rp[0] + rx) + "," + top + ' Z" fill="' + C.r + '" stroke="none"/>' +
        '<path d="M' + (rp[0] - rx) + "," + (rp[1] - g.H) + " A" + rx + "," + ry + " 0 0 0 " + (rp[0] + rx) + "," + (rp[1] - g.H) + '" fill="none" stroke="' + C.red + '" stroke-width="1.2" opacity=".85"/>' +
        '<ellipse cx="' + rp[0] + '" cy="' + top + '" rx="' + rx + '" ry="' + ry + '" fill="' + C.top + '" stroke="' + C.ln + '"/>' +
        '<ellipse cx="' + rp[0] + '" cy="' + top + '" rx="' + rx * .78 + '" ry="' + ry * .78 + '" fill="' + C.dark + '"/>' });

    // puente viga losa (en medio, a la izquierda)
    out.push({ id: "puente", d: 2,
      svg: g.shadow(.5, 4.3, 3.9, 1.2, 1.1, .7) +
        g.box(1.1, 4.5, 0, .45, .8, .9, { t: C.top, r: C.r, l: C.l }) + g.box(3.1, 4.5, 0, .45, .8, .9, { t: C.top, r: C.r, l: C.l }) +
        g.box(.5, 4.3, .9, 3.9, 1.2, .26, { t: C.top, r: C.r, l: C.l }) +
        g.poly([[.5, 5.5, 1.16], [4.4, 5.5, 1.16], [4.4, 5.5, 1.5], [.5, 5.5, 1.5]], "none", C.dark, 1.2) +
        g.poly([[.5, 5.5, 1.33], [4.4, 5.5, 1.33]], "none", C.dark, 1) });

    // semáforo (adelante a la derecha del reservorio)
    var lt = function (z, col) { var q = g.P(10.07, 3.0, z); return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.6" fill="' + col + '"/>'; };
    out.push({ id: "semaforo", d: 4,
      svg: g.shadow(9.95, 2.85, .3, .3, 2.2, .6) +
        g.box(10.0, 2.9, 0, .14, .14, 2.2, D) +
        g.box(9.85, 2.82, 1.5, .44, .3, .78, { t: C.dark2, r: C.dark, l: C.dark }) +
        lt(2.15, C.red) + lt(1.9, "#3b3b3b") + lt(1.65, "#3b3b3b") });

    // cobertura metálica (adelante a la derecha)
    var xa = 6.4, xb = 9.4, y0 = 5.0, y1 = 7.4, ym = 6.2, ze = 1.5, zr = 2.15;
    out.push({ id: "cobertura", d: 5,
      svg: g.shadow(xa, y0, xb - xa, y1 - y0, 1.9, .6) +
        g.box(xa + .1, y0 + .1, 0, .14, .14, ze, D) + g.box(xb - .24, y0 + .1, 0, .14, .14, ze, D) +
        g.box(xa + .1, y1 - .24, 0, .14, .14, ze, D) + g.box(xb - .24, y1 - .24, 0, .14, .14, ze, D) +
        g.poly([[xa, y0, ze], [xb, y0, ze], [xb, ym, zr], [xa, ym, zr]], C.top) +
        g.poly([[xa, ym, zr], [xb, ym, zr], [xb, y1, ze], [xa, y1, ze]], C.dark) +
        g.poly([[xb, y0, ze], [xb, y1, ze], [xb, ym, zr]], C.r) +
        g.poly([[xa, ym, zr], [xb, ym, zr]], "none", C.red, 1.4) });

    out.sort(function (a, b) { return a.d - b.d; });
    return out;
  }

  /* ---------- Escena 2: la pila de programas ---------- */
  var SLABS = [
    { n: "MS Project", on: true },
    { n: "SketchUp", on: true },
    { n: "Revit", on: true },
    { n: "Civil 3D", on: true },
    { n: "SAP2000", on: true }
  ];
  function pila() {
    var g = new Geo(42, 24.2, 42, 430, 285), out = [], w = 5.6, d = 3.0, h = .56, step = .82, i;
    out.push({ id: "pilaSombra", base: true, svg: g.shadow(0, 0, w, d, SLABS.length * step + .2, .55) });
    for (i = 0; i < SLABS.length; i++) {
      var s = SLABS[i], z = i * step, s_ = "";
      s_ += g.box(0, 0, z, w, d, h, { t: C.top, r: C.r, l: C.dark });
      // puertos en la cara frontal
      var k, x0 = 3.35;
      for (k = 0; k < 8; k++) s_ += g.faceL(x0 + k * .24, d, z + h * .26, .15, h * .46, C.dark2, C.red, .8);
      // rótulo sobre la cara frontal
      var p = g.P(.3, d, z + h * .3);
      s_ += '<text transform="matrix(0.866 0.5 0 1 ' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ')" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="1.6" fill="' + (s.on ? "#fff" : "#8a8a8a") + '">' + s.n.toUpperCase() + '</text>';
      // línea de estado en la cara derecha
      s_ += g.poly([[w, .35, z + h * .5], [w, d - .35, z + h * .5]], "none", s.on ? C.red : "#9b9b9b", 1.4);
      out.push({ id: "slab" + i, i: i, svg: s_ });
    }
    return out;
  }

  /* ---------- Montaje ---------- */
  function grupo(id, svg) { return '<g id="' + id + '">' + svg + "</g>"; }
  var SITE = obra(), STACK = pila();

  function markup(which) {
    var s = "";
    if (which !== "stack") s += '<g id="g-site">' + SITE.map(function (e) { return grupo("e-" + e.id, e.svg); }).join("") + "</g>";
    if (which !== "site") s += '<g id="g-stack">' + STACK.map(function (e) { return grupo("e-" + e.id, e.svg); }).join("") + "</g>";
    return s;
  }

  var svg = document.getElementById("escena");
  var track = document.getElementById("track");
  if (!svg || !track) return;
  var mql = window.matchMedia("(max-width: 999px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Versión móvil: dos figuras estáticas
  Array.prototype.forEach.call(document.querySelectorAll(".fig-m"), function (f) {
    var which = f.getAttribute("data-fig");
    var vb = which === "site" ? "170 110 700 560" : "230 70 540 560";
    f.innerHTML = '<svg viewBox="' + vb + '" role="presentation">' + markup(which) + "</svg>";
  });

  // Versión de escritorio: una sola escena animada
  svg.innerHTML = markup("both");
  var $ = function (id) { return svg.querySelector("#" + id); };
  var site = $("g-site"), stack = $("g-stack");
  var items = {};
  SITE.forEach(function (e) { items[e.id] = $("e-" + e.id); });
  STACK.forEach(function (e) { items[e.id] = $("e-" + e.id); });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function seg(p, a, b) { return ease((p - a) / (b - a)); }
  function put(el, e, dy) {
    el.setAttribute("opacity", e.toFixed(3));
    el.setAttribute("transform", "translate(0," + ((1 - e) * dy).toFixed(1) + ")");
  }

  // Renders de Canva (opcionales): si existen en assets/img, reemplazan al dibujo SVG
  var stickEl = svg.parentNode, REN = { site: null, stack: null }, WR = null, WPH = null, SCAN = null, TAGS = [];
  var TAGDEF = [["Caseta de obra", 27, 54], ["Puente viga-losa", 33, 28], ["Cobertura metálica", 61, 44], ["Reservorio", 79, 30], ["Semáforo", 87, 57]];
  /* Desktop: el plano de la obra se va "construyendo" de abajo hacia arriba: un barrido rojo revela el render */
  function buildWrap(im) {
    WR = document.createElement("div"); WR.className = "ren ren-wrap";
    var grid = document.createElement("div"); grid.className = "ren-grid";
    var bp = new Image(); bp.className = "ren-bp"; bp.alt = ""; bp.width = 2048; bp.height = 2048; bp.decoding = "async"; bp.src = "assets/img/obra-plano.webp";
    var ph = im.cloneNode(); ph.className = "ren-ph"; WPH = ph;
    SCAN = document.createElement("div"); SCAN.className = "ren-scan";
    WR.appendChild(grid); WR.appendChild(bp); WR.appendChild(ph); WR.appendChild(SCAN);
    TAGDEF.forEach(function (t) {
      var d = document.createElement("div"); d.className = "ren-tag"; d.style.left = t[1] + "%"; d.style.top = t[2] + "%";
      d.style.setProperty("--d", (-Math.random() * 3).toFixed(2) + "s"); d.innerHTML = "<span>" + t[0] + "</span><i></i>"; WR.appendChild(d); TAGS.push({ el: d, y: t[2] });
    });
    stickEl.appendChild(WR); REN.site = WR;
  }
  function renders(which, file) {
    var im = new Image(); im.className = "ren"; im.alt = ""; im.width = 1600; im.height = 1600; im.decoding = "async";
    im.onload = function () {
      if (which !== "site") { REN[which] = im; return; }
      buildWrap(im);
      Array.prototype.forEach.call(document.querySelectorAll('.fig-m[data-fig="' + which + '"]'), function (f) {
        f.innerHTML = "";
        if (which === "site") {
          var v = document.createElement("video"); v.className = "ren-m ren-m--v"; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
          v.width = 1080; v.height = 1080; v.poster = "assets/img/plano-obra.jpg"; v.setAttribute("aria-hidden", "true"); v.tabIndex = -1;
          v.src = v.canPlayType('video/mp4; codecs="avc1.42E01E"') ? "assets/video/plano-obra.mp4" : "assets/video/plano-obra.webm"; f.appendChild(v);
          if ("IntersectionObserver" in window && !reduce) new IntersectionObserver(function (en) {
            var p = en[0].isIntersecting ? v.play() : v.pause(); if (p && p.catch) p.catch(function () {});
          }, { threshold: .25 }).observe(v);
        } else { var c = im.cloneNode(); c.className = "ren-m"; f.appendChild(c); }
      });
      onScroll();
    };
    im.src = "assets/img/" + file;
  }
  renders("site", "obra-isometrica.jpg"); renders("stack", "pila-programas.jpg");


  /* ---------- Pila de programas en 3D (HTML/CSS), con movimiento propio ---------- */
  var PROG = ["SAP2000", "Civil 3D", "Revit", "SketchUp", "MS Project"];
  var P3 = document.createElement("div");
  P3.className = "pila3d"; P3.setAttribute("aria-hidden", "true");
  var worldH = '<div class="pila3d__bob"><div class="pila3d__world">';
  var N = PROG.length, i3;
  for (i3 = 0; i3 < N; i3++) {
    var edge = '<i class="f"></i><i class="r"></i>';
    worldH += '<div class="s3" data-i="' + i3 + '"><div class="s3__edge">' + edge + '</div><div class="s3__top"><span class="s3__port"></span><b>' + PROG[i3] + '</b><em>Conectado a Claude</em></div></div>';
  }
  var corners = [[16, 16], [364, 16], [16, 244], [364, 244]];
  for (i3 = 0; i3 < N - 1; i3++) corners.forEach(function (c, ci) { worldH += '<span class="rod" data-g="' + i3 + '" style="left:' + (c[0] - 190) + 'px;top:' + (c[1] - 130) + 'px;animation-delay:' + (ci * -.45 - i3 * .3) + 's"></span>'; });
  worldH += "</div></div>";
  P3.innerHTML = worldH;
  stickEl.appendChild(P3);
  var s3 = Array.prototype.slice.call(P3.querySelectorAll(".s3")), rods = Array.prototype.slice.call(P3.querySelectorAll(".rod"));
  var worldEl = P3.querySelector(".pila3d__world"), mxp = 0, myp = 0, txp = 0, typ = 0;
  window.addEventListener("pointermove", function (e) { txp = e.clientX / window.innerWidth - .5; typ = e.clientY / window.innerHeight - .5; }, { passive: true });
  var lastP = 0, lastInn = 0;
  function pila3d(p, inn) {
    lastP = p; lastInn = inn; draw3d();
  }
  function draw3d() {
    if (!SL) return;
    var p = lastP, inn = lastInn;
    var k = Math.min(.95, window.innerHeight / 1000, window.innerWidth * .46 / 520);
    var sep = 34 + 70 * seg(p, .70, .98);
    P3.style.opacity = Math.min(1, inn * 1.6).toFixed(3);
    P3.style.setProperty("--k", k.toFixed(3));
    var rz = -38 + (p - .8) * 36 + mxp * 10, rx = 58 - typ * 6;
    worldEl.style.transform = "scale(" + k.toFixed(3) + ") rotateX(" + rx.toFixed(2) + "deg) rotateZ(" + rz.toFixed(2) + "deg)";
    s3.forEach(function (el, i) {
      var e = seg(p, SL[i] ? SL[i][0] : .8, SL[i] ? SL[i][1] : .94);
      var z = (N - 1 - i) * sep + (1 - e) * 260;
      el.style.opacity = e.toFixed(3);
      el.style.transform = "translateZ(" + z.toFixed(1) + "px)";
    });
    rods.forEach(function (el) {
      var g = +el.getAttribute("data-g"), zb = (N - 2 - g) * sep, eAll = Math.min(seg(p, SL[g][0], SL[g][1]), seg(p, SL[g + 1][0], SL[g + 1][1]));
      el.style.height = sep.toFixed(1) + "px"; el.style.opacity = eAll.toFixed(3);
      el.style.transform = "translateZ(" + zb.toFixed(1) + "px) rotateX(90deg)";
    });
  }
  (function ease3() {
    mxp += (txp - mxp) * .06; myp += (typ - myp) * .06;
    if (P3.style.opacity !== "0" && !mql.matches) draw3d();
    requestAnimationFrame(ease3);
  })();

  var T = { caseta: [-.12, 0], puente: [0, .12], reservorio: [.1, .22], cobertura: [.2, .34], semaforo: [.32, .44] };
  var SL = [[.64, .73], [.69, .78], [.74, .83], [.79, .88], [.84, .94]];

  /* movimiento continuo de la obra: parallax por capas, respiración y zoom con el scroll */
  var siteP = 0, siteOut = 0, smx = 0, smy = 0;
  (function sway(now) {
    smx += (mxp - smx) * .08; smy += (myp - smy) * .08;
    if (REN.site && !mql.matches) {
      var tt = (now || 0) / 1000, k = seg(siteP, 0, .46), z = .84 + .2 * k + .015 * Math.sin(tt * .6);
      var tx = (1 - k) * 60 - smx * 22, ty = siteOut * 60 + (1 - k) * 46 + Math.sin(tt * .8) * 5 - smy * 14;
      REN.site.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) scale(" + z.toFixed(4) + ") rotate(" + (smx * .8 + (1 - k) * -1.6).toFixed(2) + "deg)";
      WR.querySelector(".ren-bp").style.transform = "translate(" + (-smx * 16).toFixed(1) + "px," + (-smy * 10).toFixed(1) + "px)";
      WPH.style.transform = "translate(" + (smx * 8).toFixed(1) + "px," + (smy * 5).toFixed(1) + "px)";
    }
    requestAnimationFrame(sway);
  })(0);

  function setScene(p) {
    var id;
    for (id in T) put(items[id], seg(p, T[id][0], T[id][1]), -90);
    var out = seg(p, .58, .70);
    site.setAttribute("opacity", (1 - out).toFixed(3));
    site.setAttribute("transform", "translate(0," + (out * 70).toFixed(1) + ")");
    var inn = seg(p, .62, .78);
    stack.setAttribute("opacity", Math.min(1, inn * 1.4).toFixed(3));
    if (REN.site) {
      site.setAttribute("opacity", "0");
      var w = 100 * seg(p, .02, .40), done = seg(p, .40, .46);
      REN.site.style.opacity = (1 - out).toFixed(3);
      siteP = p; siteOut = out;
      REN.site.style.setProperty("--w", w.toFixed(2));
      WPH.style.opacity = "1";
      SCAN.style.opacity = (w > 1 && w < 99 ? 1 : 0);
      REN.site.querySelector(".ren-bp").style.opacity = (1 - .78 * done).toFixed(3);
      TAGS.forEach(function (t) { var on = w >= 100 - t.y + 3 && out < .3 ? 1 : 0; t.el.classList.toggle("on", !!on); });
    }
    stack.setAttribute("opacity", "0");
    pila3d(p, inn);
    put(items.pilaSombra, seg(p, .64, .90), 0);
    for (var i = 0; i < SL.length; i++) put(items["slab" + i], seg(p, SL[i][0], SL[i][1]), -110);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (mql.matches) return;
      var r = track.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      setScene(reduce ? (p > .5 ? 1 : .55) : p);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  setScene(0); onScroll();
})();
