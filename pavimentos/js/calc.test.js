// node pavimentos/js/calc.test.js  -> comprueba el motor contra valores impresos en el manual
const C = require("./calc.js");
const D = require("../../kb/pavimentos/manual-mtc-2014-tablas.json");
let ok = 0, mal = 0;
function eq(nombre, got, esperado, tol) {
  const pasa = Math.abs(got - esperado) <= tol;
  (pasa ? ok++ : mal++);
  console.log((pasa ? "OK  " : "MAL ") + nombre + ": " + (typeof got === "number" ? got.toFixed(3) : got) + " (esperado " + esperado + " +-" + tol + ")");
}
// Cuadro 6.2: ejemplo impreso r=5 %, n=10 -> 12.58
eq("Fca 5%,10a", C.fca(0.05, 10), 12.58, 0.01);
eq("Fca sin crecimiento", C.fca(0, 20), 20, 1e-9);
// Cuadro 6.2 fila n=20, r=2 -> 24.30 ; r=10 -> 57.28
eq("Fca 2%,20a", C.fca(0.02, 20), 24.30, 0.01);
eq("Fca 10%,20a", C.fca(0.10, 20), 57.28, 0.01);
// Cuadro 6.3: eje simple rueda doble 8.2 t = 1 EE; 16.4 t flexible = 16
eq("EE eje simple RD 8.2t", C.eeEje(D, "flexible", "simple_rueda_doble", 8.2), 1, 1e-9);
eq("EE eje simple RD 16.4t flex", C.eeEje(D, "flexible", "simple_rueda_doble", 16.4), 16, 1e-9);
// Cuadro 6.13: celdas impresas
eq("Fp 50mm PCN100 (psi inflado 111.1)", C.factorPresion(D, 50, 100 / 0.9).Fp, 1.80, 0.005);
eq("Fp 100mm PCN110", C.factorPresion(D, 100, 110 / 0.9).Fp, 1.75, 0.005);
eq("Fp 80mm PCN80", C.factorPresion(D, 80, 80 / 0.9).Fp, 1.00, 0.005);
eq("Fp interpolado 55mm PCN100", C.factorPresion(D, 55, 100 / 0.9).Fp, (1.80 + 1.72) / 2, 0.005);
// rangos Tp
eq("Tp de 1'000,000", C.tpDeEE(D, 1000000).indice, 4, 0);
eq("Tp de 1'000,001", C.tpDeEE(D, 1000001).indice, 5, 0);
eq("Tp de 40'000,000", C.tpDeEE(D, 40000000).indice, 15, 0);
// CBR -> MR (Cuadro 12.5)
eq("MR CBR 6", C.mrDeCbr(6), 8043, 15);
eq("MR CBR 10", C.mrDeCbr(10), 11153, 15);
eq("MR CBR 20", C.mrDeCbr(20), 17380, 25);
eq("MR CBR 30", C.mrDeCbr(30), 22529, 30);
// SN flexible contra Cuadro 12.16 (donde el manual es reproducible: trafico bajo/medio)
[["Tp0", 150000, 0, 2.136], ["Tp1", 300000, 1, 1.625 + 0.0], ["Tp3", 750000, 1, 2.593]].forEach(([tp, W, col, ref]) => {
  const p = C.parametrosFlexible(D, tp), cbr = [6, 10, 20, 30][col];
  const sn = C.snRequerido(W, p.Zr, p.So, p.dPSI, C.mrDeCbr(cbr));
  if (tp === "Tp1") eq("SN Tp1 CBR10 (cat 2.165)", sn, 2.165, 0.05);
  else eq("SN " + tp + " col" + col, sn, ref, 0.05);
});
// rigido: catalogo J=3.2, Tp7, CBR 10-20 -> 23 cm (manual) vs calculo
(function () {
  const tp = "Tp7", p = C.parametrosRigido(D, tp), W = 5e6, r = C.resistenciaConcreto(D, W);
  const res = C.espesorRigido({ W18: W, Zr: p.Zr, So: p.So, dPSI: p.dPSI, Pt: p.Pt, MR_kgcm2: r.MR_kg_cm2, fc_kgcm2: r.fc_kg_cm2, Cd: 1, J: 3.2, k_MPam: 79 });
  eq("Rigido J3.2 Tp7 CBR10-20 (cat 23 cm)", res.D_cm, 23, 1.0);
})();
// catalogo rigido: J=2.8 Tp5 CBR 20-30 -> 16 ; J=3.8 Tp2 CBR>=30 -> 15 ; J=4.0 Tp3 CBR 6-10 -> 19
eq("Cat rigido J2.8 Tp5 CBR25", C.catalogoRigido(D, 2.8, "Tp5", 25).losa_cm, 16, 0);
eq("Cat rigido J3.8 Tp2 CBR35", C.catalogoRigido(D, 3.8, "Tp2", 35).losa_cm, 15, 0);
eq("Cat rigido J4.0 Tp3 CBR8", C.catalogoRigido(D, 4.0, "Tp3", 8).losa_cm, 19, 0);
// Kc: h=0 devuelve K0
eq("Kc h=0", C.kc(0, 10, 5), 5, 1e-9);
console.log("\n" + ok + " correctas, " + mal + " con diferencia");
process.exit(mal ? 1 : 0);
