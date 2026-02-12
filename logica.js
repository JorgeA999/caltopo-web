// ===== VARIABLES GLOBALES =====
let reset = false;
let operacion = null;
let valorAnterior = null;
let modoAngular = "DEG";


const display = document.getElementById("display");
const resultados = document.getElementById("resultados");
const pantalla = display;
let memoria = null;
let operador = null;
let resetPantalla = false;

document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => manejar(btn.textContent.trim()));
});

function manejar(v) {

    /* ===============================
       NÚMEROS (0–9)
       =============================== */
    if (/^[0-9]$/.test(v)) {
        if (reset) display.value = "";
        display.value += v;
        reset = false;
        return;
    }

    /* ===============================
       CARACTERES DIRECTOS
       =============================== */
    if ([",", ".", "°", "'", "''", "(", ")"].includes(v)) {
        display.value += v;
        return;
    }

    /* ===============================
       SIGNO MENOS (NEGATIVOS)
       =============================== */
    if (v === "-") {
        if (
            display.value === "" ||
            display.value.endsWith(",") ||
            display.value.endsWith("(")
        ) {
            display.value += "-";
            return;
        }
        memoria = parseFloat(display.value);
        operador = "-";
        reset = true;
        return;
    }

    /* ===============================
       OPERADORES
       =============================== */
    if (["+","*","/"].includes(v)) {
        memoria = parseFloat(display.value);
        operador = v;
        reset = true;
        return;
    }

    /* ===============================
       BORRAR ÚLTIMO CARÁCTER
       =============================== */
    if (v === "←") {
        display.value = display.value.slice(0, -1);
        return;
    }

    /* ===============================
       IGUAL
       =============================== */
    if (v === "=") {
        calcular();
        return;
    }

    /* ===============================
       LIMPIAR
       =============================== */
    if (v === "C") {
        display.value = "";
        resultados.value = "";
        memoria = operador = null;
        reset = false;
        return;
    }

    /* ===============================
       CONSTANTES Y FUNCIONES
       =============================== */
    if (v === "π") {
        display.value = Math.PI.toFixed(6);
        reset = true;
        return;
    }

    if (v === "x²") display.value = Math.pow(+display.value, 2);
    if (v === "x³") display.value = Math.pow(+display.value, 3);

    if (v === "xʸ") {
        memoria = +display.value;
        operador = "^";
        reset = true;
        return;
    }

    if (v === "√") display.value = Math.sqrt(+display.value);

    function factorial(n) {
        if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
        return "Error";
    }

        let r = 1;
        for (let i = 2; i <= n; i++) {
        r *= i;
        }
        return r;
    }

    if (v === "!") {
    let num = parseFloat(display.value);
    display.value = factorial(num);
    }



/* ===== TRIGONOMETRÍA PROFESIONAL ===== */
if (["sen", "cos", "tan"].includes(v)) {

    let valor = parseFloat(display.value);

    if (isNaN(valor)) {
        display.value = "Error";
        return;
    }

    let ang = (modoAngular === "DEG")
        ? valor * Math.PI / 180
        : valor;

    let resultado;

    switch (v) {

        case "sen":
            resultado = Math.sin(ang);
            break;

        case "cos":
            resultado = Math.cos(ang);
            break;

        case "tan":
            if (Math.abs(Math.cos(ang)) < 1e-12) {
                display.value = "Indef.";
                return;
            }
            resultado = Math.tan(ang);
            break;
    }

    display.value = resultado.toFixed(6);
    reset = true;
    return;
}


    if (v === "log") display.value = Math.log(+display.value).toFixed(6);

    /* ===============================
       CONVERSIONES
       =============================== */
    if (v === "DEC→DMS") decToDms();
    if (v === "DMS→DEC") dmsToDec();

    /* ===============================
       TOPOGRAFÍA
       =============================== */
    if (v === "Az") calcularAzimut();
    if (v === "CAz") contraAzimut();
    if (v === "Ð") distancia();
    if (v === "Δz") deltaZ();
    if (v === "NSθWE") rumbo();

    /* ===============================
       REPORTES
       =============================== */
    if (v === "REP") reporteTopografico();
    if (v === "PDF") exportarPDF();
}



function calcular() {
    let b = parseFloat(display.value);

    if (isNaN(memoria) || isNaN(b)) return;    

    if (operador === "+") display.value = memoria + b;
    if (operador === "-") display.value = memoria - b;
    if (operador === "*") display.value = memoria * b;
    if (operador === "/") display.value = memoria / b;
    if (operador === "^") display.value = Math.pow(memoria, b);
    resetPantalla = true;
}

function decToDms() {
    let val = display.value.trim();
    if (!val) return;

    let decimal = Number(val);
    if (isNaN(decimal)) {
        alert("Ingrese un número decimal válido");
        return;
    }

    decimal = ((decimal % 360) + 360) % 360; // normaliza 0–360

    let g = Math.floor(decimal);
    let mFloat = (decimal - g) * 60;
    let m = Math.floor(mFloat);
    let s = (mFloat - m) * 60;

    display.value = `${g}° ${m}' ${s.toFixed(2)}''`;
}

function dmsToDec() {
    let txt = display.value.trim();

    // Regex robusta para DMS
    let match = txt.match(/(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*''/);
    if (!match) {
        alert("Formato DMS inválido\nEj: 123° 27' 24.12''");
        return;
    }

    let g = parseFloat(match[1]);
    let m = parseFloat(match[2]);
    let s = parseFloat(match[3]);

    if (m >= 60 || s >= 60) {
        alert("Minutos o segundos fuera de rango");
        return;
    }

    let decimal = g + m / 60 + s / 3600;
    display.value = decimal.toFixed(6);
}

function insertar(t) {
    display.value += t;
    display.focus();
}

function exportarPDF() {

    if (!resultados.value.trim()) {
        alert("No hay reporte para exportar");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    /* LOGO */
    const img = new Image();
    img.src = "assets/logo_ctop.png";

    img.onload = () => {

        pdf.addImage(img, "PNG", 15, 10, 25, 25);

        /* ENCABEZADO */
        pdf.setFont("courier", "bold");
        pdf.setFontSize(14);
        pdf.text("CTop Web", 45, 18);

        pdf.setFontSize(10);
        pdf.text("Calculadora Topográfica Profesional", 45, 24);

        pdf.setFont("courier", "normal");
        pdf.text("Autor: Jorge Alirio Mendoza Rincón", 45, 30);

        const fecha = new Date().toLocaleString();
        pdf.text(`Fecha: ${fecha}`, 45, 36);

        pdf.line(15, 40, 195, 40);

        /* CONTENIDO */
let y = 48;
pdf.setFontSize(10);

pdf.text("DATOS DE ENTRADA", 15, y); y += 6;
pdf.text(`E1: ${datosTopo.E1}   N1: ${datosTopo.N1}   Z1: ${datosTopo.Z1}`, 15, y); y += 5;
pdf.text(`E2: ${datosTopo.E2}   N2: ${datosTopo.N2}   Z2: ${datosTopo.Z2}`, 15, y); y += 8;

pdf.text("RESULTADOS TOPOGRÁFICOS", 15, y); y += 6;

pdf.text(`Azimut:           ${datosTopo.az.toFixed(6)}°`, 15, y); y += 5;
pdf.text(`Contraazimut:     ${datosTopo.contra.toFixed(6)}°`, 15, y); y += 5;
pdf.text(`Rumbo:            ${datosTopo.rumbo}`, 15, y); y += 5;
pdf.text(`Distancia H:      ${datosTopo.dH.toFixed(3)} m`, 15, y); y += 5;
pdf.text(`Distancia V:      ${datosTopo.dV.toFixed(3)} m`, 15, y); y += 8;

pdf.text("OBSERVACIONES:", 15, y);


        pdf.save("CTop_Reporte_Topografico.pdf");
    };
}

console.log("display =", display);
console.log("resultados =", resultados);


function calcularAzimut() {
  
  const entrada = display.value.trim();
  const partes = entrada.split(",");

  if (partes.length !== 6) {
    alert("Use formato: E1,N1,Z1,E2,N2,Z2");
    return;
  }

  const [E1, N1, Z1, E2, N2, Z2] = partes.map(Number);

  if ([E1,N1,Z1,E2,N2,Z2].some(isNaN)) {
    alert("Coordenadas inválidas");
    return;
  }

  const dE = E2 - E1;
  const dN = N2 - N1;
  const dZ = Z2 - Z1;

  const distanciaH = Math.sqrt(dE**2 + dN**2);
  const distanciaV = dZ;

  // AZIMUT
  let azRad = Math.atan2(dE, dN);
  let azDeg = azRad * 180 / Math.PI;
  if (azDeg < 0) azDeg += 360;

  // CONTRAAZIMUT
  let contra = azDeg + 180;
  if (contra >= 360) contra -= 360;

  // RUMBO
  const rumboDeg = Math.abs(Math.atan(dE / dN) * 180 / Math.PI);
  let cuadrante = "";
  if (dE >= 0 && dN >= 0) cuadrante = "N E";
  else if (dE >= 0 && dN < 0) cuadrante = "S E";
  else if (dE < 0 && dN < 0) cuadrante = "S O";
  else cuadrante = "N O";

  // DMS
  const aDMS = (deg) => {
    const g = Math.floor(deg);
    const m = Math.floor((deg - g) * 60);
    const s = (((deg - g) * 60 - m) * 60).toFixed(2);
    return `${g}° ${m}' ${s}"`;
  };

  const reporte = `
AZIMUT:            ${aDMS(azDeg)}
AZIMUT DECIMAL:    ${azDeg.toFixed(6)}°
RUMBO:             ${cuadrante} ${aDMS(rumboDeg)}
CONTRAAZIMUT:      ${aDMS(contra)}
DISTANCIA H:       ${distanciaH.toFixed(3)} m
DISTANCIA V:       ${distanciaV.toFixed(3)} m
COORD E:           ${E1} → ${E2}
COORD N:           ${N1} → ${N2}
COTA Z:            ${Z1} → ${Z2}
`;

  resultados.value = reporte;

  
}

function contraAzimut(){}
function distancia(){}
function deltaZ(){}
function rumbo(){}
function reporteTopografico(){}


window.onload = () => {
  display.focus();
};