/* ingenierIA.pe v2 - grafo semántico del hero con forma de cerebro (dos hemisferios, gira lento)
   Nodos con nombre unidos por relaciones, repartidos sobre la superficie en 3D por una relajación previa
   (los relacionados quedan cerca). Clic en un nodo = resalta sus conexiones; se pueden elegir varios.
   Clic en vacío limpia. Se pausa al salir del hero. */
(function () {
  "use strict";
  var cv = document.getElementById("orbita");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TAU = Math.PI * 2, dpr = 1, W = 0, H = 0, S = 1, small = false;
  var RED = "229,81,61", WHITE = "255,255,255", TAUPE = "199,194,193";

  /* tipo: h=hub, e=etapa, t=tema, s=software, k=skill, c=curso */
  var N = [
    ["hub", "ingenierIA.pe", "h"],
    ["antes", "Antes de la obra", "e"], ["durante", "Durante la obra", "e"], ["despues", "Después de la obra", "e"], ["ing", "Ingeniería y modelado", "e"],
    ["form", "Formulación", "t"], ["exp", "Expedientes técnicos", "t"], ["tdr", "TDR", "t"], ["met", "Metrados", "t"], ["pres", "Presupuesto", "t"], ["cot", "Cotizaciones", "t"],
    ["bases", "Bases y ley", "t"], ["of", "Oferta", "t"],
    ["res", "Residencia", "t"], ["sup", "Supervisión", "t"], ["val", "Valorizaciones", "t"], ["crono", "Cronograma", "t"], ["cal", "Calidad", "t"], ["seg", "Seguimiento", "t"],
    ["liq", "Liquidación", "t"], ["cie", "Cierre", "t"], ["aud", "Auditoría", "t"],
    ["calc", "Cálculo estructural", "t"], ["dib", "Dibujo", "t"],
    ["sap", "SAP2000", "s"], ["civ", "Civil 3D", "s"], ["rev", "Revit", "s"], ["ska", "SketchUp", "s"], ["xls", "Excel", "s"], ["doc", "Word", "s"], ["prj", "MS Project", "s"],
    ["kcar", "Skill Carátulas", "k"], ["kmet", "Skill Metrados", "k"], ["kval", "Skill Valorizaciones", "k"], ["kley", "Skill Ley 32069", "k"], ["ksup", "Skill Supervisión", "k"],
    ["c1", "Curso Residente", "c"], ["c2", "Curso Supervisión", "c"], ["c3", "Curso Expedientes", "c"], ["c4", "Curso Cálculo", "c"]
  ];
  var L = [
    ["hub","antes"],["hub","durante"],["hub","despues"],["hub","ing"],
    ["antes","form"],["antes","exp"],["antes","tdr"],["antes","met"],["antes","pres"],["antes","cot"],["antes","bases"],["antes","of"],
    ["durante","res"],["durante","sup"],["durante","val"],["durante","crono"],["durante","cal"],["durante","seg"],
    ["despues","liq"],["despues","cie"],["despues","aud"],
    ["ing","calc"],["ing","dib"],
    ["calc","sap"],["dib","civ"],["ing","rev"],["ing","ska"],["met","xls"],["pres","xls"],["val","xls"],["exp","doc"],["sup","doc"],["tdr","doc"],["liq","doc"],
    ["crono","prj"],["seg","prj"],["res","prj"],
    ["hub","kcar"],["kcar","exp"],["kmet","met"],["kval","val"],["kley","bases"],["ksup","sup"],["hub","kmet"],["hub","kval"],["hub","kley"],["hub","ksup"],
    ["c1","res"],["c2","sup"],["c3","exp"],["c4","calc"],["c1","c2"],["c3","met"],
    ["of","kley"],["cot","pres"],["val","liq"],["form","exp"],["aud","cal"],["seg","crono"]
  ];


  var nodes = [], links = [], byId = {}, sel = {}, nsel = 0, hover = -1, mx = -999, my = -999;
  var ang = 0, vt = 0, boost = 1, wob = 0, px = 0, t0 = performance.now(), last = t0, R = 300, CX = 0, CY = 0, hint = 1;

  /* forma de cerebro: elipsoide con fisura central y circunvoluciones suaves */
  function shape(u) {
    var th = Math.atan2(u[2], u[0]), ph = Math.asin(Math.max(-1, Math.min(1, u[1])));
    var g = 1 + .055 * Math.sin(6 * th + 2 * ph) * Math.cos(5 * ph) + .04 * Math.sin(11 * th - 3 * ph);
    var x = u[0] * 1.12 * g, y = u[1] * .74 * g * (1 - .1 * Math.max(0, -u[1])), z = u[2] * .95 * g;
    x += (x >= 0 ? 1 : -1) * .13 * Math.max(0, .35 + y);
    if (Math.abs(u[0]) < .22 && y > 0) { y -= .09 * (1 - Math.abs(u[0]) / .22) * Math.min(1, y * 2); }
    if (y < -.45) { y += .08 * (-.45 - y); }
    return [x, y, z];
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l; return v; }
  function rndSph() { var z = Math.random() * 2 - 1, a = Math.random() * TAU, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), z, r * Math.sin(a)]; }

  function build() {
    nodes = []; links = []; byId = {};
    var i, j, n;
    for (i = 0; i < N.length; i++) {
      n = { id: N[i][0], label: N[i][1], k: N[i][2], u: rndSph(), deg: 0, nb: [], a: 0, ph: Math.random() * TAU, sp: .3 + Math.random() * .5 };
      byId[n.id] = nodes.length; nodes.push(n);
    }
    for (i = 0; i < L.length; i++) {
      var s = byId[L[i][0]], t = byId[L[i][1]];
      if (s == null || t == null) continue;
      links.push({ s: s, t: t, amb: false }); nodes[s].deg++; nodes[t].deg++; nodes[s].nb.push(t); nodes[t].nb.push(s);
    }
    /* relajación sobre la esfera: los enlaces atraen, todo se repele */
    var it, f, d, dx, dy, dz, l, a, b, v;
    for (it = 0; it < 420; it++) {
      for (i = 0; i < nodes.length; i++) { nodes[i].f = [0, 0, 0]; }
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j];
        dx = a.u[0] - b.u[0]; dy = a.u[1] - b.u[1]; dz = a.u[2] - b.u[2]; d = Math.hypot(dx, dy, dz) + .02;
        f = .0045 / (d * d);
        a.f[0] += dx / d * f; a.f[1] += dy / d * f; a.f[2] += dz / d * f; b.f[0] -= dx / d * f; b.f[1] -= dy / d * f; b.f[2] -= dz / d * f;
      }
      for (i = 0; i < links.length; i++) {
        l = links[i]; a = nodes[l.s]; b = nodes[l.t];
        dx = b.u[0] - a.u[0]; dy = b.u[1] - a.u[1]; dz = b.u[2] - a.u[2]; d = Math.hypot(dx, dy, dz) + .001;
        f = (d - .42) * .05;
        a.f[0] += dx / d * f; a.f[1] += dy / d * f; a.f[2] += dz / d * f; b.f[0] -= dx / d * f; b.f[1] -= dy / d * f; b.f[2] -= dz / d * f;
      }
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i]; v = [n.u[0] + n.f[0] * 3, n.u[1] + n.f[1] * 3, n.u[2] + n.f[2] * 3]; n.u = norm(v);
      }
    }
    /* el hub mira al frente al inicio */
    var h = nodes[0].u, tha = Math.atan2(h[0], h[2]);
    var c = Math.cos(-tha), sn = Math.sin(-tha);
    for (i = 0; i < nodes.length; i++) { var q = nodes[i].u; nodes[i].u = [q[0] * c + q[2] * sn, q[1], -q[0] * sn + q[2] * c]; }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.r = n.k === "h" ? 9 : n.k === "e" ? 6.6 : n.k === "t" ? 2.6 + Math.min(2.4, n.deg * .4) : n.k === "s" ? 4.4 : n.k === "k" ? 4.2 : 3.8;
    }
    /* neuronas de fondo: puntos tenues que dan volumen al cerebro */
    var base = nodes.length, m = small ? 55 : 95;
    for (i = 0; i < m; i++) nodes.push({ id: "a" + i, label: "", k: "a", u: rndSph(), deg: 0, nb: [], a: 0, ph: Math.random() * TAU, sp: .3 + Math.random() * .5, r: 1.5 });
    for (i = base; i < nodes.length; i++) {
      var cand = [];
      for (j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        a = nodes[i].u; b = nodes[j].u;
        cand.push([Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), j]);
      }
      cand.sort(function (p, q) { return p[0] - q[0]; });
      for (j = 0; j < 2; j++) links.push({ s: i, t: cand[j][1], amb: true });
    }
  }

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    small = W < 700;
    R = small ? Math.min(W * .56, H * .36) : Math.min(W * .3, H * .42);
    CX = W * .5; CY = H * (small ? .5 : .5);
  }

  function color(n) { return n.k === "h" || n.k === "k" ? RED : n.k === "s" ? TAUPE : WHITE; }

  function project(t) {
    var ca = Math.cos(ang + px * .5), sa = Math.sin(ang + px * .5), tilt = .22 + Math.sin(t * .23) * .06, ct = Math.cos(tilt), st = Math.sin(tilt), i, n, p, x, y, z, x2, z2, y2, z3, sc;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; p = shape(n.u);
      /* flotación suave de cada punto */
      var fl = 1 + Math.sin(t * n.sp + n.ph) * .018;
      x = p[0] * fl; y = p[1] * fl; z = p[2] * fl;
      x2 = x * ca + z * sa; z2 = -x * sa + z * ca;
      y2 = y * ct - z2 * st; z3 = y * st + z2 * ct;
      sc = 1 / (1 - z3 * .22);
      n.sx = CX + x2 * R * sc; n.sy = CY + y2 * R * sc; n.z = z3; n.sc = sc; n.d = (z3 + 1.1) / 2.2;
    }
  }


  /* franja del mismo grafo dentro de la barra superior */
  var nv = document.getElementById("navgraph"), nctx = nv && nv.getContext ? nv.getContext("2d") : null, NW = 0, NH = 0;
  function nsize() {
    if (!nv) return;
    var r = nv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    NW = r.width; NH = r.height; nv.width = Math.round(NW * d); nv.height = Math.round(NH * d); nctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function drawStrip(t) {
    if (!nctx || !NW) return;
    var RR = Math.max(NW * .3, 360), cx = NW * .5, cy = NH * .5 + RR * .06, ca = Math.cos(ang + px * .5), sa = Math.sin(ang + px * .5), tilt = .22 + Math.sin(t * .23) * .06, ct = Math.cos(tilt), st = Math.sin(tilt), i, n, p, x, y, z, x2, z2, y2, z3, sc, l, a, b;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; p = shape(n.u);
      var fl = 1 + Math.sin(t * n.sp + n.ph) * .018;
      x = p[0] * fl; y = p[1] * fl; z = p[2] * fl;
      x2 = x * ca + z * sa; z2 = -x * sa + z * ca; y2 = y * ct - z2 * st; z3 = y * st + z2 * ct; sc = 1 / (1 - z3 * .22);
      n.nx = cx + x2 * RR * sc; n.ny = cy + y2 * RR * sc; n.nd = (z3 + 1.1) / 2.2; n.nsc = sc;
    }
    nctx.clearRect(0, 0, NW, NH);
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < links.length; i++) {
      l = links[i]; a = nodes[l.s]; b = nodes[l.t];
      if (Math.max(a.ny, b.ny) < -20 || Math.min(a.ny, b.ny) > NH + 20) continue;
      var hot = nsel ? (sel[l.s] || sel[l.t]) : false;
      if ((pass === 1) !== !!hot) continue;
      var dep = (a.nd + b.nd) / 2, al = hot ? .5 + .4 * dep : (l.amb ? .1 : .22) * (.3 + .9 * dep) * Math.min(a.a, b.a);
      nctx.strokeStyle = hot ? "rgba(" + RED + "," + al.toFixed(3) + ")" : "rgba(255,255,255," + al.toFixed(3) + ")";
      nctx.beginPath(); nctx.moveTo(a.nx, a.ny); nctx.lineTo(b.nx, b.ny); nctx.stroke();
    }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (n.ny < -10 || n.ny > NH + 10) continue;
      var isS = !!sel[i], c = color(n), r = Math.max(1.2, n.r * n.nsc * .55) * (isS ? 1.4 : 1);
      nctx.globalAlpha = Math.min(1, (.3 + .7 * n.nd) * n.a);
      nctx.beginPath(); nctx.arc(n.nx, n.ny, r, 0, TAU);
      nctx.fillStyle = isS ? "rgb(" + RED + ")" : "rgba(" + c + "," + (n.k === "a" ? .5 : .9) + ")"; nctx.fill();
    }
    nctx.globalAlpha = 1;
  }

  function related(i) {
    if (!nsel) return true;
    if (sel[i]) return true;
    var nb = nodes[i].nb, k;
    for (k = 0; k < nb.length; k++) if (sel[nb[k]]) return true;
    return false;
  }

  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (document.documentElement.hasAttribute("data-pausa")) dt = 0;
    var t = (now - t0) / 1000, fade = reduce ? 1 : Math.min(1, t / 1.6), i, n, l, a, b;
    var over = mx > -900 && ((my < 70) || (Math.pow((mx - CX) / (R * 1.2), 2) + Math.pow((my - CY) / (R * .95), 2) < 1));
    boost += ((over ? 1.6 : 1) - boost) * Math.min(1, dt * 3);
    vt += dt * boost; t = vt;
    ang += dt * boost * (nsel ? .05 : .09);
    px += ((mx > -900 ? mx / W - .5 : 0) - px) * dt * 1.5;
    project(t);

    /* nodo bajo el cursor (el más cercano al frente) */
    hover = -1; var best = 1e9;
    if (mx > -900) for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (n.k === "a") continue;
      var dx = n.sx - mx, dy = n.sy - my, d2 = dx * dx + dy * dy, rr = (n.r * n.sc + 12);
      if (d2 < rr * rr && d2 - n.z * 40 < best) { best = d2 - n.z * 40; hover = i; }
    }
    document.documentElement.dataset.hot = hover >= 0 && window.scrollY < H * .9 ? "1" : "";

    var hs = {}, hasH = false;
    if (!nsel && hover >= 0) { hasH = true; hs[hover] = 1; for (i = 0; i < nodes[hover].nb.length; i++) hs[nodes[hover].nb[i]] = 1; }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var tg = hasH ? (hs[i] ? 1 : .14) : nsel ? (related(i) ? 1 : .12) : 1;
      n.a += (tg - n.a) * Math.min(1, dt * 7);
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    /* enlaces: primero los tenues, luego los resaltados */
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < links.length; i++) {
      l = links[i]; a = nodes[l.s]; b = nodes[l.t];
      var hot = nsel ? (sel[l.s] || sel[l.t]) : hasH ? (l.s === hover || l.t === hover) : false;
      if ((pass === 1) !== !!hot) continue;
      var dep = (a.d + b.d) / 2, al;
      if (hot) al = .55 + .4 * dep; else al = (l.amb ? .07 : .2) * (.3 + .9 * dep) * Math.min(a.a, b.a) * (nsel || hasH ? 1 : 1);
      ctx.strokeStyle = hot ? "rgba(" + RED + "," + (al * fade).toFixed(3) + ")" : "rgba(255,255,255," + (al * fade).toFixed(3) + ")";
      ctx.lineWidth = hot ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
    /* nodos de atrás hacia adelante */
    var ord = nodes.slice().sort(function (p, q) { return p.z - q.z; });
    ctx.textAlign = "center";
    var hrx = Math.min(W * (small ? .5 : .34), 420), hry = H * (small ? .2 : .24), hy = H * .5;
    for (var oi = 0; oi < ord.length; oi++) {
      n = ord[oi]; i = nodes.indexOf(n);
      var isSel = !!sel[i], c = color(n), r = n.r * n.sc * Math.max(.85, Math.min(1.2, R / 330)) * (isSel ? 1.5 : 1);
      var zx = (n.sx - CX) / hrx, zy = (n.sy - hy) / hry, inText = zx * zx + zy * zy < 1 && !isSel && !(hasH && hs[i]) && !(nsel && related(i));
      var emp0 = isSel || (hasH && hs[i]) || (nsel && related(i));
      var al2 = fade * n.a * (emp0 ? .6 + .4 * n.d : .35 + .65 * n.d) * (inText ? .4 : 1);
      ctx.globalAlpha = al2;
      if (n.k === "h" || n.k === "k" || isSel) { ctx.shadowColor = "rgba(" + RED + ",.8)"; ctx.shadowBlur = isSel ? 22 : n.k === "h" ? 18 : 8; }
      ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, TAU);
      ctx.fillStyle = isSel ? "rgb(" + RED + ")" : "rgba(" + c + "," + (n.k === "t" ? .8 : n.k === "a" ? .55 : 1) + ")"; ctx.fill();
      ctx.shadowBlur = 0;
      if (n.k === "e" || n.k === "c" || isSel) { ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 4, 0, TAU); ctx.strokeStyle = "rgba(" + (isSel ? RED : c) + ",.35)"; ctx.stroke(); }
      if (n.k === "a") continue;
      var emph = isSel || i === hover || (hasH && hs[i]) || (nsel && related(i));
      var showL = emph || (!nsel && !hasH && !inText && n.z > -.15 && (n.k === "h" || n.k === "e" || n.k === "s" || (!small && n.deg > 4)));
      if (showL) {
        ctx.globalAlpha = fade * n.a * (emph ? (.55 + .45 * n.d) : .4 * (.4 + .6 * n.d));
        ctx.font = (n.k === "h" ? "700 14px " : n.k === "e" ? "600 12px " : "500 11px ") + "'DM Sans',system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(n.label, n.sx, n.sy + r + 14);
      }
    }
    ctx.globalAlpha = 1;
    drawStrip(t);
    if (hint > 0 && !nsel) {
      ctx.font = "500 12px 'DM Sans',system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255," + (.42 * fade) + ")"; ctx.textAlign = "center";
      ctx.fillText(small ? "Toca un punto para ver sus conexiones" : "Haz clic en un punto para ver sus conexiones", W / 2, H - 78);
    }
  }

  function stripOnly(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var i, n, t;
    boost += (((mx > -900 && my < 70) ? 1.6 : 1) - boost) * Math.min(1, dt * 3);
    vt += dt * boost; t = vt;
    ang += dt * boost * (nsel ? .05 : .09);
    for (i = 0; i < nodes.length; i++) { n = nodes[i]; n.a += (1 - n.a) * Math.min(1, dt * 7); if (nsel) n.a += ((related(i) ? 1 : .12) - n.a) * Math.min(1, dt * 7); }
    drawStrip(t);
  }

  function loop(now) {
    if (document.hidden) last = now;
    else if (window.scrollY < window.innerHeight * 1.15) frame(now);
    else stripOnly(now);
    requestAnimationFrame(loop);
  }

  function pick(x, y) {
    project(vt);
    var best = -1, bd = 1e9, i, n, dx, dy, d2, rr;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (n.k === "a") continue;
      dx = n.sx - x; dy = n.sy - y; d2 = dx * dx + dy * dy; rr = n.r * n.sc + (small ? 16 : 12);
      if (d2 < rr * rr && d2 - n.z * 40 < bd) { bd = d2 - n.z * 40; best = i; }
    }
    return best;
  }

  function onClick(e) {
    if (window.scrollY > window.innerHeight * .9) return;
    if (e.target.closest && e.target.closest("a,button,input,select,textarea,.nav")) return;
    var i = pick(e.clientX, e.clientY);
    hint = 0;
    if (i < 0) { sel = {}; nsel = 0; return; }
    if (sel[i]) { delete sel[i]; nsel--; } else { sel[i] = 1; nsel++; }
  }

  size(); build(); nsize();
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); nsize(); sel = {}; nsel = 0; build(); }, 150); });
  window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", function () { mx = my = -999; });
  document.addEventListener("click", onClick);
  if (reduce) frame(performance.now() + 3000);
  else requestAnimationFrame(loop);
})();
