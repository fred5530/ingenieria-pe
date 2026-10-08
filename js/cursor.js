/* ingenierIA.pe v2 - cursor propio: círculo que se invierte según el fondo
   (blanco sobre oscuro, oscuro sobre claro, vía mix-blend-mode: difference). Solo con mouse. */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var el = document.createElement("div");
  el.className = "cur"; el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  document.documentElement.classList.add("has-cur");
  var x = -100, y = -100, cx = -100, cy = -100, big = 0, shown = false, down = false, vx = 0, vy = 0;
  window.addEventListener("pointermove", function (e) {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; cx = x; cy = y; vx = vy = 0; reset(); el.style.opacity = "1"; }
    var t = e.target, hot = document.documentElement.dataset.hot === "1" || (t && t.closest && t.closest("a,button,[role=button],summary,label,.vis__re,.tab,.chip"));
    var txt = t && t.closest && t.closest("input,textarea,select");
    big = hot ? 1 : 0;
    el.style.visibility = txt ? "hidden" : "visible";
  }, { passive: true });
  document.addEventListener("pointerleave", function () { el.style.opacity = "0"; shown = false; });
  window.addEventListener("pointerdown", function () { down = true; });
  window.addEventListener("pointerup", function () { down = false; });
  /* estela naranja: cadena elástica de puntos (cada punto persigue al anterior), dibujada con curvas suaves */
  var tr = document.createElement("canvas"); tr.className = "cur-trail"; tr.setAttribute("aria-hidden", "true");
  document.body.appendChild(tr);
  var s = 1;
  var tc = tr.getContext("2d"), TW = 0, TH = 0, NP = 26, K = .42, ch = [];
  function tsize() { var d = Math.min(2, window.devicePixelRatio || 1); TW = window.innerWidth; TH = window.innerHeight; tr.width = TW * d; tr.height = TH * d; tc.setTransform(d, 0, 0, d, 0, 0); }
  tsize(); window.addEventListener("resize", tsize);
  function reset() { ch = []; for (var i = 0; i < NP; i++) ch.push({ x: cx, y: cy }); }
  reset();
  function trail() {
    tc.clearRect(0, 0, TW, TH);
    if (!shown) return;
    ch[0].x = cx; ch[0].y = cy;
    for (var i = 1; i < NP; i++) {
      var k = K * (1 - i / (NP * 1.6));
      ch[i].x += (ch[i - 1].x - ch[i].x) * k;
      ch[i].y += (ch[i - 1].y - ch[i].y) * k;
    }
    var r0 = 5 * s, st = 1;
    while (st < NP && Math.hypot(ch[st].x - cx, ch[st].y - cy) < r0) st++;
    if (NP - st < 3) return;
    tc.lineCap = "round"; tc.lineJoin = "round";
    for (var j = st; j < NP - 1; j++) {
      var t = 1 - (j - st) / (NP - st - 1), a = ch[j], b = ch[j + 1];
      var mx0 = (a.x + b.x) / 2, my0 = (a.y + b.y) / 2;
      var p = ch[j - 1] || a, mx1 = (p.x + a.x) / 2, my1 = (p.y + a.y) / 2;
      tc.strokeStyle = "rgba(229,81,61," + (Math.pow(t, 1.4) * .95).toFixed(3) + ")";
      tc.lineWidth = .6 + 3.2 * t * t;
      tc.beginPath(); tc.moveTo(mx1, my1); tc.quadraticCurveTo(a.x, a.y, mx0, my0); tc.stroke();
    }
  }
  document.addEventListener("pointerleave", reset);
  (function loop() {
    /* el círculo sigue al mouse con un resorte amortiguado */
    vx = (vx + (x - cx) * .16) * .62; vy = (vy + (y - cy) * .16) * .62;
    cx += vx; cy += vy;
    trail();
    var ts = (big ? 1.7 : 1) * (down ? .85 : 1);
    s += (ts - s) * .22;
    el.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px) translate(-50%,-50%) scale(" + s.toFixed(3) + ")";
    requestAnimationFrame(loop);
  })();
})();
