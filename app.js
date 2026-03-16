const STORAGE_PROVEEDORES = "pv_proveedores";
const STORAGE_MOVIMIENTOS = "pv_movimientos";
const STORAGE_CLIENTES = "pv_clientes";
const STORAGE_PRECIOS = "pv_precios";
const STORAGE_PRECIOS_BRUCELOSIS = "pv_precios_brucelosis";
const STORAGE_PRECIOS_HISTORIAL = "pv_precios_historial";
const STORAGE_PRECIO_TERNERO = "pv_precio_ternero";
const STORAGE_VACUNADORES = "pv_vacunadores";
const STORAGE_VACUNACIONES = "pv_vacunaciones";
const STORAGE_COBROS = "pv_cobros";
const STORAGE_PAGOS_VAC = "pv_pagos_vacunadores";
const STORAGE_ACTAS_OMITIDAS = "pv_actas_omitidas";
const STORAGE_ACTAS_ENTREGA = "pv_actas_entrega";
const STORAGE_ACTAS_RECEPCION = "pv_actas_recepcion";
let proveedores = [];
let movimientos = [];
let clientes = [];
let vacunadores = [];
let vacunaciones = [];
let actasEntrega = [];
let actasRecepcion = [];
let actaEntregaEditandoId = null;
let actaRecepcionEditandoId = null;
let ultimaActaEntregaData = { entregador: "", aftMarca: "", aftSerie: "", aftVenc: "", bruMarca: "", bruSerie: "", bruVenc: "" };
let ultimaActaRecepcionData = { recibidor: "" };
let preciosAftosa = {
  precioProducto: 0,
  costoOperativo: 0,
  costoCoordinacion: 0,
  manoObraOrganizado: 0,
  manoObraAbierto: 0,
  movilidadPorKm: 0,
};
let preciosBrucelosis = {
  precioProducto: 0,
  costoOperativo: 0,
  costoCoordinacion: 0,
  manoObraOrganizado: 0,
  manoObraAbierto: 0,
  movilidadPorKm: 0,
};
let tipoPrecioActual = "aftosa";
let preciosHistorial = [];
let historialEditandoId = null;
let ultimoPeriodoVac = "";
let ultimoTipoVac = "";
let ultimaFechaVac = "";
let cobroEditandoId = null;
let pagoVacEditandoId = null;
let chequesTemporales = [];
let transfCobroTemporales = [];
let lotesCompraTemporales = [];
let transfPagoVacTemporales = [];
let chequesPagoVacTemporales = [];
let precioTernero = 0;

function parseNumeroLocal(v) {
  if (typeof v !== "string") {
    return Number(v) || 0;
  }
  const t = v.replace(",", ".").trim();
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function formatearRenspa(digits) {
  const d = String(digits || "")
    .replace(/\D+/g, "")
    .slice(0, 2 + 3 + 1 + 5 + 2);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 6);
  const p4 = d.slice(6, 11);
  const p5 = d.slice(11, 13);
  let out = "";
  if (p1) out += p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "." + p4;
  if (p5) out += "/" + p5;
  return out;
}

function calcularTotalesPrecio(p) {
  const base =
    (Number(p.precioProducto) || 0) +
    (Number(p.costoOperativo) || 0) +
    (Number(p.costoCoordinacion) || 0);
  const totalOrganizado = base + (Number(p.manoObraOrganizado) || 0);
  const totalAbierto = base + (Number(p.manoObraAbierto) || 0);
  return {
    base,
    totalOrganizado,
    totalAbierto,
  };
}

function renderPrecios() {
  const form = document.getElementById("form-precio-vacuna");
  if (form) {
    const selTipo = document.getElementById("tipo-precio-vacuna");
    if (selTipo) {
      selTipo.value =
        tipoPrecioActual === "brucelosis" ? "brucelosis" : "aftosa";
    }
    const p =
      tipoPrecioActual === "brucelosis" ? preciosBrucelosis : preciosAftosa;
    form.precioProducto.value =
      p.precioProducto > 0 ? p.precioProducto : "";
    form.costoOperativo.value =
      p.costoOperativo > 0 ? p.costoOperativo : "";
    form.costoCoordinacion.value =
      p.costoCoordinacion > 0 ? p.costoCoordinacion : "";
    form.manoObraOrganizado.value =
      p.manoObraOrganizado > 0 ? p.manoObraOrganizado : "";
    form.manoObraAbierto.value =
      p.manoObraAbierto > 0 ? p.manoObraAbierto : "";
    form.movilidadPorKm.value =
      p.movilidadPorKm > 0 ? p.movilidadPorKm : "";
    const inputPrecioTernero = document.getElementById("precio-ternero");
    const inputRelacionTerneroAftosa = document.getElementById("relacion-ternero-aftosa");
    if (inputPrecioTernero) {
      inputPrecioTernero.value = precioTernero > 0 ? precioTernero : "";
    }
  }
  const celdaPrecioProductoAft = document.getElementById(
    "celda-precio-producto-aftosa"
  );
  const celdaPrecioProductoBru = document.getElementById(
    "celda-precio-producto-brucelosis"
  );
  const celdaCostoOperativoAft = document.getElementById(
    "celda-costo-operativo-aftosa"
  );
  const celdaCostoOperativoBru = document.getElementById(
    "celda-costo-operativo-brucelosis"
  );
  const celdaCostoCoordinacionAft = document.getElementById(
    "celda-costo-coordinacion-aftosa"
  );
  const celdaCostoCoordinacionBru = document.getElementById(
    "celda-costo-coordinacion-brucelosis"
  );
  const celdaManoObraOrgAft = document.getElementById(
    "celda-mano-obra-organizado-aftosa"
  );
  const celdaManoObraOrgBru = document.getElementById(
    "celda-mano-obra-organizado-brucelosis"
  );
  const celdaManoObraAbAft = document.getElementById(
    "celda-mano-obra-abierto-aftosa"
  );
  const celdaManoObraAbBru = document.getElementById(
    "celda-mano-obra-abierto-brucelosis"
  );
  const celdaTotalOrgAft = document.getElementById(
    "celda-total-organizado-aftosa"
  );
  const celdaTotalOrgBru = document.getElementById(
    "celda-total-organizado-brucelosis"
  );
  const celdaTotalAbAft = document.getElementById("celda-total-abierto-aftosa");
  const celdaTotalAbBru = document.getElementById(
    "celda-total-abierto-brucelosis"
  );
  const celdaMovilidadAft = document.getElementById("celda-movilidad-aftosa");
  const celdaMovilidadBru = document.getElementById("celda-movilidad-brucelosis");
  const celdaCostoVacunaAft = document.getElementById(
    "celda-costo-vacuna-aftosa"
  );
  const celdaCostoVacunaBru = document.getElementById(
    "celda-costo-vacuna-brucelosis"
  );
  const celdaResPrecioProdAft = document.getElementById(
    "celda-res-precio-producto-aftosa"
  );
  const celdaResPrecioProdBru = document.getElementById(
    "celda-res-precio-producto-brucelosis"
  );
  const celdaResManoOrgAft = document.getElementById(
    "celda-res-mano-obra-organizado-aftosa"
  );
  const celdaResManoOrgBru = document.getElementById(
    "celda-res-mano-obra-organizado-brucelosis"
  );
  const celdaResManoAbAft = document.getElementById(
    "celda-res-mano-obra-abierto-aftosa"
  );
  const celdaResManoAbBru = document.getElementById(
    "celda-res-mano-obra-abierto-brucelosis"
  );
  const celdaResFinalOrgAft = document.getElementById(
    "celda-res-final-organizado-aftosa"
  );
  const celdaResFinalOrgBru = document.getElementById(
    "celda-res-final-organizado-brucelosis"
  );
  const celdaResFinalAbAft = document.getElementById(
    "celda-res-final-abierto-aftosa"
  );
  const celdaResFinalAbBru = document.getElementById(
    "celda-res-final-abierto-brucelosis"
  );
  const totA = calcularTotalesPrecio(preciosAftosa);
  const totB = calcularTotalesPrecio(preciosBrucelosis);
  if (celdaPrecioProductoAft)
    celdaPrecioProductoAft.textContent = (Number(preciosAftosa.precioProducto) || 0).toFixed(2);
  if (celdaPrecioProductoBru)
    celdaPrecioProductoBru.textContent = (Number(preciosBrucelosis.precioProducto) || 0).toFixed(2);
  if (celdaCostoOperativoAft)
    celdaCostoOperativoAft.textContent = (Number(preciosAftosa.costoOperativo) || 0).toFixed(2);
  if (celdaCostoOperativoBru)
    celdaCostoOperativoBru.textContent = (Number(preciosBrucelosis.costoOperativo) || 0).toFixed(2);
  if (celdaCostoCoordinacionAft)
    celdaCostoCoordinacionAft.textContent = (Number(preciosAftosa.costoCoordinacion) || 0).toFixed(2);
  if (celdaCostoCoordinacionBru)
    celdaCostoCoordinacionBru.textContent = (Number(preciosBrucelosis.costoCoordinacion) || 0).toFixed(2);
  if (celdaCostoVacunaAft)
    celdaCostoVacunaAft.textContent = totA.base.toFixed(2);
  if (celdaCostoVacunaBru)
    celdaCostoVacunaBru.textContent = totB.base.toFixed(2);
  if (celdaManoObraOrgAft)
    celdaManoObraOrgAft.textContent = (Number(preciosAftosa.manoObraOrganizado) || 0).toFixed(2);
  if (celdaManoObraOrgBru)
    celdaManoObraOrgBru.textContent = (Number(preciosBrucelosis.manoObraOrganizado) || 0).toFixed(2);
  if (celdaManoObraAbAft)
    celdaManoObraAbAft.textContent = (Number(preciosAftosa.manoObraAbierto) || 0).toFixed(2);
  if (celdaManoObraAbBru)
    celdaManoObraAbBru.textContent = (Number(preciosBrucelosis.manoObraAbierto) || 0).toFixed(2);
  if (celdaTotalOrgAft)
    celdaTotalOrgAft.textContent = totA.totalOrganizado.toFixed(2);
  if (celdaTotalOrgBru)
    celdaTotalOrgBru.textContent = totB.totalOrganizado.toFixed(2);
  if (celdaTotalAbAft) celdaTotalAbAft.textContent = totA.totalAbierto.toFixed(2);
  if (celdaTotalAbBru) celdaTotalAbBru.textContent = totB.totalAbierto.toFixed(2);
  if (celdaMovilidadAft)
    celdaMovilidadAft.textContent = (Number(preciosAftosa.movilidadPorKm) || 0).toFixed(2);
  if (celdaMovilidadBru)
    celdaMovilidadBru.textContent = (Number(preciosBrucelosis.movilidadPorKm) || 0).toFixed(2);
  if (celdaResPrecioProdAft)
    celdaResPrecioProdAft.textContent = totA.base.toFixed(2);
  if (celdaResPrecioProdBru)
    celdaResPrecioProdBru.textContent = totB.base.toFixed(2);
  if (celdaResManoOrgAft)
    celdaResManoOrgAft.textContent = (Number(preciosAftosa.manoObraOrganizado) || 0).toFixed(2);
  if (celdaResManoOrgBru)
    celdaResManoOrgBru.textContent = (Number(preciosBrucelosis.manoObraOrganizado) || 0).toFixed(2);
  if (celdaResManoAbAft)
    celdaResManoAbAft.textContent = (Number(preciosAftosa.manoObraAbierto) || 0).toFixed(2);
  if (celdaResManoAbBru)
    celdaResManoAbBru.textContent = (Number(preciosBrucelosis.manoObraAbierto) || 0).toFixed(2);
  if (celdaResFinalOrgAft)
    celdaResFinalOrgAft.textContent = totA.totalOrganizado.toFixed(2);
  if (celdaResFinalOrgBru)
    celdaResFinalOrgBru.textContent = totB.totalOrganizado.toFixed(2);
  if (celdaResFinalAbAft)
    celdaResFinalAbAft.textContent = totA.totalAbierto.toFixed(2);
  if (celdaResFinalAbBru)
    celdaResFinalAbBru.textContent = totB.totalAbierto.toFixed(2);
  const inputRelacionTerneroAftosa = document.getElementById("relacion-ternero-aftosa");
  if (inputRelacionTerneroAftosa) {
    const denom = totA.totalOrganizado || 0;
    if (precioTernero > 0 && denom > 0) {
      inputRelacionTerneroAftosa.value = (precioTernero / denom).toFixed(2);
    } else {
      inputRelacionTerneroAftosa.value = "";
    }
  }
}

function renderHistorialPrecios() {
  const tbody = document.getElementById("tbody-precios-historial");
  if (!tbody) return;
  const inputDesde = document.getElementById("filtro-historial-desde");
  const inputHasta = document.getElementById("filtro-historial-hasta");
  const desde = inputDesde && inputDesde.value ? inputDesde.value : "";
  const hasta = inputHasta && inputHasta.value ? inputHasta.value : "";
  const copia = [...preciosHistorial]
    .filter((h) => {
      if (!h.fecha) return false;
      if (desde && h.fecha < desde) return false;
      if (hasta && h.fecha > hasta) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.fecha === b.fecha) return (b.creadoEn || 0) - (a.creadoEn || 0);
      return (b.fecha || "").localeCompare(a.fecha || "");
    });
  if (!copia.length) {
    tbody.innerHTML =
      '<tr><td colspan="6">No hay historial de precios guardado. Cargá precios y usá "Guardar historial".</td></tr>';
    return;
  }
  tbody.innerHTML = copia
    .map((h) => {
      const totA = calcularTotalesPrecio(h.aftosa || {});
      const totB = calcularTotalesPrecio(h.brucelosis || {});
      return `<tr data-id="${h.id}">
<td>${h.fecha || ""}</td>
<td>${totA.totalOrganizado.toFixed(2)}</td>
<td>${totA.totalAbierto.toFixed(2)}</td>
<td>${totB.totalOrganizado.toFixed(2)}</td>
<td>${totB.totalAbierto.toFixed(2)}</td>
<td>
  <button type="button" data-action="edit-hist" class="icon-btn" title="Editar">✎</button>
  <button type="button" data-action="delete-hist" class="icon-btn icon-danger" title="Eliminar">🗑</button>
</td>
</tr>`;
    })
    .join("");
}

function recalcularImportesVacunacion() {
  const totalAft =
    Number((document.getElementById("aft-total") || {}).value) || 0;
  const terBru =
    Number((document.getElementById("bru-terneras") || {}).value) || 0;
  const selTipoMano = document.getElementById("fact-mano-tipo");
  const selManoSiNo = document.getElementById("fact-mano-si-no");
  let tipoMano = "organizado";
  let sinManoPorTipo = false;
  if (selTipoMano && selTipoMano.value) {
    if (selTipoMano.value === "abierto") {
      tipoMano = "abierto";
    } else if (selTipoMano.value === "sin") {
      sinManoPorTipo = true;
    }
  }
  const sinManoPorBoton = selManoSiNo && selManoSiNo.value === "no";
  const sinMano = sinManoPorTipo || sinManoPorBoton;

  const selAftosaSiNo = document.getElementById("fact-aftosa-si-no");
  const inclAftosa = selAftosaSiNo ? selAftosaSiNo.value === "si" : true;
  const selBrucelosisSiNo = document.getElementById("fact-brucelosis-si-no");
  const inclBrucelosis = selBrucelosisSiNo ? selBrucelosisSiNo.value === "si" : true;

  const totA = calcularTotalesPrecio(preciosAftosa);
  const totB = calcularTotalesPrecio(preciosBrucelosis);
  const baseAft = totA.base || 0;
  const baseBru = totB.base || 0;
  const manoAftPorDosis =
    sinMano
      ? 0
      : tipoMano === "abierto"
        ? Number(preciosAftosa.manoObraAbierto) || 0
        : Number(preciosAftosa.manoObraOrganizado) || 0;
  const manoBruPorDosis =
    sinMano
      ? 0
      : tipoMano === "abierto"
        ? Number(preciosBrucelosis.manoObraAbierto) || 0
        : Number(preciosBrucelosis.manoObraOrganizado) || 0;

  const impVacAft = inclAftosa ? totalAft * baseAft : 0;
  const impManoAft = totalAft * manoAftPorDosis;
  const totalVacAft = impVacAft + impManoAft;

  const impVacBru = inclBrucelosis ? terBru * baseBru : 0;
  const impManoBru = terBru * manoBruPorDosis;
  const totalVacBru = impVacBru + impManoBru;

  const selMov = document.getElementById("fact-movilidad-si-no");
  const inputKm = document.getElementById("fact-movilidad-km");
  const km =
    selMov && selMov.value === "si"
      ? Number(inputKm && inputKm.value ? inputKm.value : 0) || 0
      : 0;
  const precioMovKm = Number(preciosAftosa.movilidadPorKm) || 0;
  const impMov = km * precioMovKm;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val !== undefined && val !== null ? val.toFixed(2) : "";
  };
  setVal("fact-aftosa-importe-vacuna", impVacAft);
  setVal("fact-aftosa-importe-mano", impManoAft);
  setVal("fact-aftosa-total", totalVacAft);
  setVal("fact-brucelosis-importe-vacuna", impVacBru);
  setVal("fact-brucelosis-importe-mano", impManoBru);
  setVal("fact-brucelosis-total", totalVacBru);
  setVal("fact-movilidad-importe", impMov);
  const totalGeneral = totalVacAft + totalVacBru + impMov;
  setVal("fact-total-vacunacion", totalGeneral);
}
let proveedorSeleccionadoId = null;
let proveedorEditandoId = null;
let ultimoAnioVac = new Date().getFullYear();
let movimientoEditandoId = null;
let movimientoEditandoTipo = null;
let clienteEditandoId = null;
let vacunacionEditandoId = null;
let ultimaProvinciaCliente = "";
const filtros = {
  fechaDesde: "",
  fechaHasta: "",
  vacuna: "",
  tipo: "",
  comprobante: "",
  precioMin: "",
  precioMax: "",
  importeMin: "",
  importeMax: "",
};
const filtrosClientes = {
  renspa: "",
  nombre: "",
  documento: "",
  localidad: "",
  departamento: "",
  provincia: "",
};

const filtrosVacunaciones = {
  fecha: "",
  acta: "",
  renspa: "",
  factura: "",
  nombre: "",
  localidad: "",
  departamento: "",
  periodo: "",
  tipo: "",
  vacunador: "",
  anio: "",
  sigsa: "",
};

function toTitleCase(s) {
  const t = String(s);
  return t.split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function activateSection(sectionName) {
  const sections = document.querySelectorAll(".section");
  const buttons = document.querySelectorAll(".nav-button");
  let activeSection = null;
  sections.forEach((section) => {
    if (section.dataset.section === sectionName) {
      section.classList.remove("hidden");
      activeSection = section;
    } else {
      section.classList.add("hidden");
    }
  });
  buttons.forEach((button) => {
    if (button.dataset.section === sectionName) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
  if (activeSection && typeof activeSection.scrollIntoView === "function") {
    try {
      activeSection.scrollIntoView({ block: "start", behavior: "auto" });
    } catch (_) {
      activeSection.scrollIntoView(true);
    }
  }

  // Refrescar vistas al activar secciones específicas
  if (sectionName === "finanzas") {
    renderFinanzasGlobales();
  } else if (sectionName === "informes") {
    renderInformesGlobales();
  } else if (sectionName === "vacunadores") {
    renderVacunadores();
  } else if (sectionName === "clientes") {
    renderClientes();
  }
}

function cargarDesdeStorage() {
  const jp = (raw, fb) => {
    if (!raw) return fb;
    try {
      const v = JSON.parse(raw);
      return v == null ? fb : v;
    } catch (_) {
      return fb;
    }
  };
  const rawProv = localStorage.getItem(STORAGE_PROVEEDORES);
  const rawMov = localStorage.getItem(STORAGE_MOVIMIENTOS);
  const rawCli = localStorage.getItem(STORAGE_CLIENTES);
  const rawPreA = localStorage.getItem(STORAGE_PRECIOS);
  const rawPreB = localStorage.getItem(STORAGE_PRECIOS_BRUCELOSIS);
  const rawHist = localStorage.getItem(STORAGE_PRECIOS_HISTORIAL);
  const rawVac = localStorage.getItem(STORAGE_VACUNADORES);
  const rawVacRegs = localStorage.getItem(STORAGE_VACUNACIONES);
  const rawCobros = localStorage.getItem(STORAGE_COBROS);
  const rawTer = localStorage.getItem(STORAGE_PRECIO_TERNERO);
  const rawActasOmit = localStorage.getItem(STORAGE_ACTAS_OMITIDAS);
  const rawPagosVac = localStorage.getItem(STORAGE_PAGOS_VAC);
  const rawActasEntrega = localStorage.getItem(STORAGE_ACTAS_ENTREGA);
  const rawActasRecepcion = localStorage.getItem(STORAGE_ACTAS_RECEPCION);
  const prov = jp(rawProv, []);
  const mov = jp(rawMov, []);
  const cli = jp(rawCli, []);
  const prA = jp(rawPreA, null);
  const prB = jp(rawPreB, null);
  const hist = jp(rawHist, []);
  const vac = jp(rawVac, []);
  const vacRegs = jp(rawVacRegs, []);
  const cob = jp(rawCobros, []);
  const omit = jp(rawActasOmit, []);
  const pagos = jp(rawPagosVac, []);
  const actasEnt = jp(rawActasEntrega, []);
  const actasRec = jp(rawActasRecepcion, []);
  proveedores = Array.isArray(prov) ? prov : [];
  movimientos = Array.isArray(mov) ? mov : [];
  clientes = Array.isArray(cli) ? cli : [];
  vacunadores = Array.isArray(vac) ? vac : [];
  vacunaciones = Array.isArray(vacRegs) ? vacRegs : [];
  cobros = Array.isArray(cob) ? cob : [];
  actasOmitidas = Array.isArray(omit) ? omit : [];
  pagosVacunadores = Array.isArray(pagos) ? pagos : [];
  actasEntrega = Array.isArray(actasEnt) ? actasEnt : [];
  actasRecepcion = Array.isArray(actasRec) ? actasRec : [];
  if (prA && typeof prA === "object") {
    preciosAftosa = {
      precioProducto: Number(prA.precioProducto) || 0,
      costoOperativo: Number(prA.costoOperativo) || 0,
      costoCoordinacion: Number(prA.costoCoordinacion) || 0,
      manoObraOrganizado: Number(prA.manoObraOrganizado) || 0,
      manoObraAbierto: Number(prA.manoObraAbierto) || 0,
      movilidadPorKm: Number(prA.movilidadPorKm) || 0,
    };
  }
  if (prB && typeof prB === "object") {
    preciosBrucelosis = {
      precioProducto: Number(prB.precioProducto) || 0,
      costoOperativo: Number(prB.costoOperativo) || 0,
      costoCoordinacion: Number(prB.costoCoordinacion) || 0,
      manoObraOrganizado: Number(prB.manoObraOrganizado) || 0,
      manoObraAbierto: Number(prB.manoObraAbierto) || 0,
      movilidadPorKm: Number(prB.movilidadPorKm) || 0,
    };
  }
  preciosHistorial = Array.isArray(hist) ? hist : [];
  precioTernero = rawTer ? Number(rawTer) || 0 : 0;
  if (vacunaciones.length) {
    const ult = vacunaciones[vacunaciones.length - 1];
    ultimoPeriodoVac = ult.periodo || "";
    ultimoTipoVac = ult.tipoVacunacion || "";
    ultimaFechaVac = ult.fecha || "";
    ultimoAnioVac = ult.anio || new Date().getFullYear();
  }
  let vacCambioIds = false;
  vacunadores.forEach((v, idx) => {
    if (typeof v.id !== "number") {
      v.id = Date.now() + idx;
      vacCambioIds = true;
    }
  });
  if (vacCambioIds) {
    guardarVacunadores();
  }

  let cambioMayusculas = false;
  clientes.forEach(c => {
    const n = (c.nombre || "").toUpperCase();
    const e = (c.establecimiento || "").toUpperCase();
    const l = (c.localidad || "").toUpperCase();
    const d = (c.departamento || "").toUpperCase();
    if (n !== c.nombre || e !== c.establecimiento || l !== c.localidad || d !== c.departamento) {
      c.nombre = n;
      c.establecimiento = e;
      c.localidad = l;
      c.departamento = d;
      cambioMayusculas = true;
    }
  });
  if (cambioMayusculas) {
    guardarClientes();
  }
}

function guardarPrecios() {
  localStorage.setItem(STORAGE_PRECIOS, JSON.stringify(preciosAftosa));
  localStorage.setItem(STORAGE_PRECIOS_BRUCELOSIS, JSON.stringify(preciosBrucelosis));
}

function guardarPreciosHistorial() {
  localStorage.setItem(STORAGE_PRECIOS_HISTORIAL, JSON.stringify(preciosHistorial));
}

function guardarProveedores() {
  localStorage.setItem(STORAGE_PROVEEDORES, JSON.stringify(proveedores));
  renderListaProveedores();
}

function guardarMovimientos() {
  localStorage.setItem(STORAGE_MOVIMIENTOS, JSON.stringify(movimientos));
  actualizarListas();
  renderResumenGlobalVacunas();
  renderResumenPorVacunaGlobal();
  renderHistorial();
}

function guardarClientes() {
  localStorage.setItem(STORAGE_CLIENTES, JSON.stringify(clientes));
  actualizarListasClientes();
}

function guardarVacunadores() {
  localStorage.setItem(STORAGE_VACUNADORES, JSON.stringify(vacunadores));
  actualizarListas();
}

function guardarVacunaciones() {
  localStorage.setItem(STORAGE_VACUNACIONES, JSON.stringify(vacunaciones));
  renderActasPendientesCobro();
  renderDashboardVacunador();
}

function guardarCobros() {
  localStorage.setItem(STORAGE_COBROS, JSON.stringify(cobros));
  renderCobros();
  renderActasPendientesCobro();
}

function guardarActasOmitidas() {
  localStorage.setItem(STORAGE_ACTAS_OMITIDAS, JSON.stringify(actasOmitidas));
  renderActasPendientesCobro();
}

function guardarPagosVacunadores() {
  localStorage.setItem(STORAGE_PAGOS_VAC, JSON.stringify(pagosVacunadores));
  renderPagosVacunadores();
}

function guardarActasEntrega() {
  localStorage.setItem(STORAGE_ACTAS_ENTREGA, JSON.stringify(actasEntrega));
  renderDashboardVacunador();
}

function guardarActasRecepcion() {
  localStorage.setItem(STORAGE_ACTAS_RECEPCION, JSON.stringify(actasRecepcion));
  renderDashboardVacunador();
}

function actualizarListasClientes() {
  const setRen = new Set();
  const setNom = new Set();
  const setDoc = new Set();
  const setLoc = new Set();
  const setDep = new Set();
  const setProv = new Set();
  clientes.forEach((c) => {
    if (c.renspa) setRen.add(c.renspa);
    if (c.nombre) setNom.add(toTitleCase(c.nombre));
    if (c.documento) setDoc.add(String(c.documento).trim());
    if (c.localidad) setLoc.add(c.localidad);
    if (c.departamento) setDep.add(c.departamento);
    if (c.provincia) setProv.add(c.provincia);
  });
  poblarDatalist(
    "dl-cli-renspa",
    Array.from(setRen).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-cli-nombre",
    Array.from(setNom).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-cli-documento",
    Array.from(setDoc).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-cli-localidad",
    Array.from(setLoc).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-cli-departamento",
    Array.from(setDep).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-cli-provincia",
    Array.from(setProv).sort((a, b) => a.localeCompare(b, "es"))
  );
}

function renderVacunadores() {
  const tbody = document.getElementById("tbody-vacunadores");
  if (!tbody) return;
  const filas = vacunadores
    .slice()
    .sort((a, b) => {
      const na = (a.nombre || "").toLowerCase();
      const nb = (b.nombre || "").toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    });
  tbody.innerHTML = filas
    .map((v) => {
      return `<tr data-id="${v.id}">
<td>${v.nombre || ""}</td>
<td>${v.documento || ""}</td>
<td>${v.localidad || ""}</td>
<td>${v.departamento || ""}</td>
<td>${v.condicionIva || ""}</td>
<td>
  <button type="button" data-action="edit-vac" class="icon-btn" title="Editar">✎</button>
  <button type="button" data-action="delete-vac" class="icon-btn icon-danger" title="Eliminar">🗑</button>
</td>
</tr>`;
    })
    .join("");
  actualizarSelectVacunadoresVacunacion();
}

function actualizarSelectVacunadoresVacunacion() {
  const sel = document.getElementById("vac-vacunador");
  if (!sel) return;
  const valorActual = sel.value;
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Seleccionar vacunador";
  sel.appendChild(opt0);
  vacunadores
    .slice()
    .sort((a, b) => {
      const na = (a.nombre || "").toLowerCase();
      const nb = (b.nombre || "").toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    })
    .forEach((v) => {
      const opt = document.createElement("option");
      opt.value = String(v.id);
      opt.textContent = v.nombre || "";
      sel.appendChild(opt);
    });
  if (valorActual) {
    sel.value = valorActual;
  }

  // También actualizar el select de vacunador en el formulario de clientes
  const selCli = document.getElementById("cli-vacunador");
  if (selCli) {
    const valCliActual = selCli.value;
    selCli.innerHTML = '<option value="">Ninguno (Predeterminado)</option>';
    vacunadores
      .slice()
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = String(v.id);
        opt.textContent = v.nombre || "";
        selCli.appendChild(opt);
      });
    if (valCliActual) selCli.value = valCliActual;
  }
}

function renderVacunaciones() {
  const tbody = document.getElementById("tbody-vacunaciones");
  if (!tbody) return;
  const items = vacunaciones
    .slice()
    .filter((v) => {
      if (filtrosVacunaciones.fecha) {
        if ((v.fecha || "") !== filtrosVacunaciones.fecha) return false;
      }
      if (filtrosVacunaciones.acta) {
        const val = (v.acta || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.acta.toLowerCase())) return false;
      }
      if (filtrosVacunaciones.renspa) {
        const val = (v.renspa || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.renspa.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.nombre) {
        const val = (v.nombreCli || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.nombre.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.localidad) {
        const val = (v.localidadCli || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.localidad.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.departamento) {
        const val = (v.departamentoCli || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.departamento.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.anio) {
        if (Number(v.anio) !== Number(filtrosVacunaciones.anio)) return false;
      }
      if (filtrosVacunaciones.periodo) {
        if ((v.periodo || "") !== filtrosVacunaciones.periodo) return false;
      }
      if (filtrosVacunaciones.tipo) {
        if ((v.tipoVacunacion || "") !== filtrosVacunaciones.tipo) return false;
      }
      if (filtrosVacunaciones.vacunador) {
        const val = (v.vacunadorNombre || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.vacunador.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.factura) {
        const val = (v.nroFactura || "").toLowerCase();
        if (!val.includes(filtrosVacunaciones.factura.toLowerCase()))
          return false;
      }
      if (filtrosVacunaciones.sigsa) {
        if ((v.sigsa || "no") !== filtrosVacunaciones.sigsa) return false;
      }
      if (v.estado === "anulada") return false;
      return true;
    })
    .sort((a, b) => {
      if (a.fecha === b.fecha) return (a.id || 0) - (b.id || 0);
      return (a.fecha || "").localeCompare(b.fecha || "");
    });
  tbody.innerHTML = items
    .map((v) => {
      const aftTotal = v.aftosa && typeof v.aftosa.total === "number"
        ? v.aftosa.total
        : 0;
      const bruTerneras = v.brucelosis && typeof v.brucelosis.terneras === "number"
        ? v.brucelosis.terneras
        : 0;
      return `<tr data-id="${v.id}">
<td>${v.fecha || ""}</td>
<td>${v.acta || ""}</td>
<td>${v.nroFactura || ""}</td>
<td>${v.renspa || ""}</td>
<td>${v.nombreCli || ""}</td>
<td>${v.localidadCli || ""}</td>
<td>${v.departamentoCli || ""}</td>
<td>${v.periodo || ""}</td>
<td>${v.anio || ""}</td>
<td>${v.tipoVacunacion || ""}</td>
<td>${v.vacunadorNombre || ""}</td>
<td>${aftTotal}</td>
<td>${bruTerneras}</td>
<td>
  <button type="button" data-action="edit-vac-reg" class="icon-btn" title="Editar">✎</button>
  <button type="button" data-action="delete-vac-reg" class="icon-btn icon-danger" title="Eliminar">🗑</button>
</td>
</tr>`;
    })
    .join("");
}

function renderCobros() {
  const tbody = document.getElementById("tbody-cobros");
  if (!tbody) return;
  const filas = cobros
    .slice()
    .sort((a, b) => {
      if (a.fechaCobro === b.fechaCobro) return (a.id || 0) - (b.id || 0);
      return (a.fechaCobro || "").localeCompare(b.fechaCobro || "");
    });
  if (!filas.length) {
    tbody.innerHTML =
      '<tr><td colspan="9">No hay cobros cargados. Completá el formulario y guardá el primer cobro.</td></tr>';
    return;
  }
  tbody.innerHTML = filas
    .map((c) => {
      try {
        let forma = "";
        if (c.pagada === "si") {
          const medios = [];
          if (c.importeEfectivo > 0) medios.push("Efectivo");
          if (c.transferencias && c.transferencias.length > 0) medios.push("Transf.");
          if (c.cheques && c.cheques.length > 0) medios.push("Cheques");

          if (medios.length > 1) {
            forma = medios.join(" + ");
          } else if (medios.length === 1) {
            forma = medios[0];
          } else {
            forma = c.formaPago || "Mixto";
          }
        }
        let rendicionAsociada = c.rendicion || "-";
        if (rendicionAsociada === "-" && c.acta) {
          const pagoAsoc = pagosVacunadores.find((p) => {
            if (Array.isArray(p.actas)) {
              return p.actas.some(a => String(a.acta).trim() === String(c.acta).trim());
            }
            return String(p.acta).trim() === String(c.acta).trim();
          });
          if (pagoAsoc && pagoAsoc.rendicion) {
            rendicionAsociada = pagoAsoc.rendicion;
          }
        }
        return `<tr data-id="${c.id}">
  <td>${c.fechaCobro || ""}</td>
  <td>${c.acta || ""}</td>
  <td>${c.factura || ""}</td>
  <td>${c.renspa || ""}</td>
  <td>${c.nombre || ""}</td>
  <td>${typeof c.importeActa === "number" ? c.importeActa.toFixed(2) : ""}</td>
  <td>${rendicionAsociada}</td>
  <td>${c.pagada === "si" ? "Sí" : "No"}</td>
  <td>${forma}</td>
  <td>
    <button type="button" data-action="edit-cobro" class="icon-btn" title="Editar">✎</button>
    <button type="button" data-action="delete-cobro" class="icon-btn icon-danger" title="Eliminar">🗑</button>
  </td>
  </tr>`;
      } catch (err) {
        console.error("Error al renderizar cobro:", c, err);
        return `<tr><td colspan="10" style="color:red;">Error en registro ID ${c.id}</td></tr>`;
      }
    })
    .join("");
}

function calcularComponentesActa(v) {
  if (!v) {
    return { manoObra: 0, movilidad: 0, total: 0, totalActa: 0 };
  }
  const totalAft =
    v.aftosa && typeof v.aftosa === "object"
      ? Number(v.aftosa.total || 0)
      : 0;
  const terBru =
    v.brucelosis && typeof v.brucelosis === "object"
      ? Number(v.brucelosis.terneras || 0)
      : 0;
  const totA = calcularTotalesPrecio(preciosAftosa);
  const totB = calcularTotalesPrecio(preciosBrucelosis);
  const baseAft = totA.base || 0;
  const baseBru = totB.base || 0;
  const tipoMano = v.manoObraTipo || "organizado";
  const incluirMano = !!v.manoObraIncluida && tipoMano !== "sin";
  const manoAftPorDosis = incluirMano
    ? tipoMano === "abierto"
      ? Number(preciosAftosa.manoObraAbierto) || 0
      : Number(preciosAftosa.manoObraOrganizado) || 0
    : 0;
  const manoBruPorDosis = incluirMano
    ? tipoMano === "abierto"
      ? Number(preciosBrucelosis.manoObraAbierto) || 0
      : Number(preciosBrucelosis.manoObraOrganizado) || 0
    : 0;
  const impManoAft = totalAft * manoAftPorDosis;
  const impManoBru = terBru * manoBruPorDosis;
  const manoObra = impManoAft + impManoBru;
  const impVacAft = totalAft * baseAft;
  const impVacBru = terBru * baseBru;
  const totalSinMov = impVacAft + impVacBru + manoObra;
  const totalActa =
    typeof v.importeActa === "number" ? v.importeActa : totalSinMov;
  const incluirMov = !!v.movilidadIncluida;
  const km =
    incluirMov && v.movilidadKm && typeof v.movilidadKm === "number"
      ? v.movilidadKm
      : 0;
  const precioMovKm = Number(preciosAftosa.movilidadPorKm) || 0;
  const movilidad = incluirMov ? km * precioMovKm : 0;
  const total = manoObra + movilidad;
  return {
    manoObra,
    movilidad,
    total,
    totalActa,
  };
}

let actasPagoTemp = [];

function renderPagoVacSeleccion() {
  const tbody = document.getElementById("tbody-pago-vac-seleccion");
  const inputMano = document.getElementById("pago-vac-imp-mano");
  const inputMov = document.getElementById("pago-vac-imp-mov");
  const inputTot = document.getElementById("pago-vac-imp-total");
  if (tbody) {
    if (!actasPagoTemp.length) {
      tbody.innerHTML =
        '<tr><td colspan="4">No hay actas agregadas al pago.</td></tr>';
    } else {
      tbody.innerHTML = actasPagoTemp
        .map(
          (a) =>
            `<tr data-acta="${String(a.acta).replace(/"/g, "&quot;")}">
  <td>${a.acta}</td>
  <td>${a.vacunadorNombre || "S/D"}</td>
  <td>${a.total.toFixed(2)}</td>
  <td><button type="button" class="icon-btn icon-danger" data-action="pago-vac-quitar" title="Quitar">➖</button></td>
</tr>`
        )
        .join("");
    }
  }
  const sumaMano = actasPagoTemp.reduce((acc, a) => acc + (a.manoObra || 0), 0);
  const sumaMov = actasPagoTemp.reduce((acc, a) => acc + (a.movilidad || 0), 0);
  const sumaTot = actasPagoTemp.reduce((acc, a) => acc + (a.total || 0), 0);
  if (inputMano) inputMano.value = sumaMano ? sumaMano.toFixed(2) : "";
  if (inputMov) inputMov.value = sumaMov ? sumaMov.toFixed(2) : "";
  if (inputTot) inputTot.value = sumaTot ? sumaTot.toFixed(2) : "";
}

function agregarActaAPago(acta) {
  const a = (acta || "").trim();
  if (!a) return;
  if (actasPagoTemp.find((x) => String(x.acta) === a)) return;
  const selVac = document.getElementById("pago-vac-vacunador");
  const vacId = selVac && selVac.value ? Number(selVac.value) : null;
  let reg = vacunaciones.find((v) => {
    if (String(v.acta || "").trim() !== a) return false;
    if (vacId && v.vacunadorId !== vacId) return false;
    return true;
  });
  if (!reg) {
    reg = vacunaciones.find((v) => String(v.acta || "").trim() === a);
  }
  if (!reg) return;
  const comp = calcularComponentesActa(reg);
  if (!(comp.manoObra > 0 || comp.movilidad > 0)) {
    console.warn("Acta con importes en $0:", a);
  }
  actasPagoTemp.push({
    acta: a,
    vacunadorNombre: reg.vacunadorNombre || "S/D",
    manoObra: comp.manoObra || 0,
    movilidad: comp.movilidad || 0,
    total: comp.total || 0,
  });
  renderPagoVacSeleccion();
  renderActasPorVacunador();
}

function quitarActaDePago(acta) {
  const a = (acta || "").trim();
  actasPagoTemp = actasPagoTemp.filter((x) => String(x.acta) !== a);
  renderPagoVacSeleccion();
  renderActasPorVacunador();
}

function renderActasPorVacunador() {
  const tbody = document.getElementById("tbody-pago-vac-actas");
  if (!tbody) return;
  const selVac = document.getElementById("pago-vac-vacunador");
  const vacunadorId =
    selVac && selVac.value ? Number(selVac.value) : null;
  let lista = vacunaciones.slice();
  if (vacunadorId) {
    lista = lista.filter((v) => v.vacunadorId === vacunadorId);
  }
  lista = lista.filter((v) => v.acta);
  const actasPagadas = new Set();
  pagosVacunadores.forEach((p) => {
    if (Array.isArray(p.actas) && p.actas.length) {
      p.actas.forEach((x) => {
        const a = String((x && x.acta) || "").trim();
        if (a) actasPagadas.add(a);
      });
    } else {
      const a = String(p.acta || "").trim();
      if (a) actasPagadas.add(a);
    }
  });
  lista = lista.filter((v) => {
    const acta = String(v.acta || "").trim();
    if (!acta) return false;
    if (actasPagadas.has(acta)) return false;
    if (v.estado === "anulada") return false;
    if (actasPagoTemp.find((x) => String(x.acta) === acta)) return false;
    return true;
  });
  lista = lista.filter((v) => {
    const comp = calcularComponentesActa(v);
    return comp.manoObra > 0 || comp.movilidad > 0;
  });
  lista.sort((a, b) => {
    const fa = a.fecha || "";
    const fb = b.fecha || "";
    if (fa === fb) {
      const aa = String(a.acta || "");
      const ab = String(b.acta || "");
      return aa.localeCompare(ab, "es");
    }
    return fa.localeCompare(fb, "es");
  });
  if (!lista.length) {
    tbody.innerHTML =
      '<tr><td colspan="7">No hay actas para mostrar.</td></tr>';
    return;
  }
  tbody.innerHTML = lista
    .map((v) => {
      const acta = String(v.acta || "").trim();
      const comp = calcularComponentesActa(v);
      return `<tr data-acta="${acta.replace(/"/g, "&quot;")}">
<td>${v.fecha || ""}</td>
<td>${acta}</td>
<td>${v.vacunadorNombre || ""}</td>
<td>${comp.manoObra.toFixed(2)}</td>
<td>${comp.movilidad.toFixed(2)}</td>
<td>${comp.total.toFixed(2)}</td>
<td><button type="button" data-action="pago-vac-cargar" class="icon-btn" title="Cargar pago">➕</button></td>
</tr>`;
    })
    .join("");
}

function renderPagosVacunadores() {
  const tbody = document.getElementById("tbody-pagos-vacunadores");
  if (!tbody) return;
  const filas = pagosVacunadores
    .slice()
    .sort((a, b) => {
      const fa = a.fechaPago || "";
      const fb = b.fechaPago || "";
      if (fa === fb) {
        const va = a.vacunadorNombre || "";
        const vb = b.vacunadorNombre || "";
        return va.localeCompare(vb, "es");
      }
    })
    .map((p) => {
      const total = Number(p.importeTotal) || 0;
      const mano = Number(p.importeManoObra) || 0;
      const mov = Number(p.importeMovilidad) || 0;
      let colActa = "";
      if (Array.isArray(p.actas) && p.actas.length) {
        if (p.actas.length === 1) {
          colActa = String(p.actas[0].acta || "");
        } else {
          colActa = `Múltiples (${p.actas.length})`;
        }
      } else {
        colActa = p.acta || "";
      }
      let txtForma = "";
      if (p.pagada === "si") {
        const medios = [];
        if (p.importeEfectivo > 0) medios.push("Efec.");
        if (p.transferencias && p.transferencias.length > 0) medios.push("Transf.");
        if (p.cheques && p.cheques.length > 0) medios.push("Cheq.");

        if (medios.length > 1) {
          txtForma = medios.join(" + ");
        } else if (medios.length === 1) {
          txtForma = medios[0];
        } else {
          txtForma = p.formaPago || "Paga";
        }
      }
      return `<tr data-id="${p.id}">
<td>${p.fechaPago || ""}</td>
<td>${p.vacunadorNombre || ""}</td>
<td>${colActa}</td>
<td>${p.rendicion || ""}</td>
<td>${mano.toFixed(2)}</td>
<td>${mov.toFixed(2)}</td>
<td>${total.toFixed(2)}</td>
<td>${p.pagada === "si" ? "Paga" : "Impaga"}</td>
<td>${txtForma}</td>
<td>
  <button type="button" data-action="edit-pago-vac" class="icon-btn" title="Editar">✎</button>
  <button type="button" data-action="delete-pago-vac" class="icon-btn icon-danger" title="Eliminar">🗑</button>
</td>
</tr>`;
    })
    .join("");
  tbody.innerHTML = filas;
}

function renderActasPendientesCobro() {
  const tbody = document.getElementById("tbody-actas-pendientes");
  if (!tbody) return;
  const actasCobradas = new Set(
    cobros
      .map((c) => String(c.acta || "").trim())
      .filter((a) => a)
  );
  const filas = vacunaciones
    .slice()
    .filter((v) => {
      // Si enviamos vacio el acta, permitimos que aparezca pero con un aviso
      const acta = String(v.acta || "").trim();
      if (actasCobradas.has(acta) && acta !== "") return false;
      if (v.estado === "anulada") return false;
      if (acta !== "" && actasOmitidas.includes(acta)) return false;
      return true;
    })
    .sort((a, b) => {
      const fa = a.fecha || "";
      const fb = b.fecha || "";
      if (fa === fb) {
        const aa = String(a.acta || "");
        const ab = String(b.acta || "");
        return aa.localeCompare(ab, "es");
      }
      return fa.localeCompare(fb, "es");
    });
  if (!filas.length) {
    tbody.innerHTML =
      '<tr><td colspan="6">No hay actas pendientes de cobro.</td></tr>';
    return;
  }
  tbody.innerHTML = filas
    .map((v) => {
      const acta = String(v.acta || "").trim();
      const impNum = Number(v.importeActa) || 0;
      const importe = impNum > 0 ? impNum.toFixed(2) : "";
      return `<tr data-acta="${acta.replace(/"/g, "&quot;")}">
<td>${v.fecha || ""}</td>
<td>${acta || '<span class="helper-text">S/N</span>'}</td>
<td>${v.renspa || ""}</td>
<td>${v.nombreCli || ""}</td>
<td>${importe}</td>
<td>
<button type="button" data-action="cargar-cobro-acta" class="icon-btn" title="Cargar cobro">➕</button>
<button type="button" data-action="omitir-acta-pendiente" class="icon-btn icon-danger" title="Sacar de pendientes">➖</button>
</td>
</tr>`;
    })
    .join("");
}

function poblarDatalist(id, valores) {
  const dl = document.getElementById(id);
  if (!dl) return;
  dl.innerHTML = "";
  valores.forEach((v) => {
    if (!v) return;
    const opt = document.createElement("option");
    opt.value = v;
    dl.appendChild(opt);
  });
}

function actualizarListas() {
  const tipoVacuna = new Set();
  const marca = new Set();
  const serie = new Set();
  const fechaVenc = new Set();
  const comprador = new Set();
  const receptor = new Set();
  const entregadorSet = new Set();
  const recibidorSet = new Set();
  const marcaAftosa = new Set();
  const serieAftosa = new Set();
  const vencAftosa = new Set();
  const marcaBrucelosis = new Set();
  const serieBrucelosis = new Set();
  const vencBrucelosis = new Set();
  movimientos.forEach((m) => {
    const processItem = (itemVacuna, itemMarca, itemSerie, itemVenc) => {
      if (itemVacuna) tipoVacuna.add(String(itemVacuna).trim().toUpperCase());
      if (itemMarca) marca.add(itemMarca);
      if (itemSerie) serie.add(itemSerie);
      if (itemVenc) fechaVenc.add(itemVenc);

      const vac = String(itemVacuna || "").trim().toUpperCase();
      if (vac.includes("AFTOSA")) {
        if (itemMarca) marcaAftosa.add(itemMarca);
        if (itemSerie) serieAftosa.add(itemSerie);
        if (itemVenc) vencAftosa.add(itemVenc);
      }
      if (vac.includes("BRUCE") || vac.includes("BRUCEL")) {
        if (itemMarca) marcaBrucelosis.add(itemMarca);
        if (itemSerie) serieBrucelosis.add(itemSerie);
        if (itemVenc) vencBrucelosis.add(itemVenc);
      }
    };

    // Process top-level movement data
    processItem(m.vacuna, m.marca, m.serie, m.fechaVencimiento);

    // Process lots if they exist
    if (m.lotes && Array.isArray(m.lotes)) {
      m.lotes.forEach(l => {
        processItem(m.vacuna, m.marca, l.serie, l.fechaVencimiento || l.vencimiento);
      });
    }

    if (m.comprador) comprador.add(m.comprador);
    if (m.receptor) receptor.add(m.receptor);
  });
  actasEntrega.forEach((a) => {
    if (a.entregador) entregadorSet.add(toTitleCase(a.entregador));
  });
  actasRecepcion.forEach((a) => {
    if (a.recibidor) recibidorSet.add(toTitleCase(a.recibidor));
  });
  poblarDatalist(
    "dl-tipo-vacuna",
    Array.from(tipoVacuna).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-marca",
    Array.from(marca).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-serie",
    Array.from(serie).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-fecha-venc",
    Array.from(fechaVenc).sort()
  );
  poblarDatalist(
    "dl-comprador",
    Array.from(comprador).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-receptor",
    Array.from(receptor).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-entregador",
    Array.from(entregadorSet).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-recibidor",
    Array.from(recibidorSet).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-aft-marca",
    Array.from(marcaAftosa).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-aft-serie",
    Array.from(serieAftosa).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-aft-venc",
    Array.from(vencAftosa).sort()
  );
  poblarDatalist(
    "dl-bru-marca",
    Array.from(marcaBrucelosis).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-bru-serie",
    Array.from(serieBrucelosis).sort((a, b) => a.localeCompare(b, "es"))
  );
  poblarDatalist(
    "dl-bru-venc",
    Array.from(vencBrucelosis).sort()
  );

  // Poblar selectores de vacunadores
  const selectVacEnt = document.getElementById("ent-vacunador");
  const selectVacRec = document.getElementById("rec-vacunador");
  const optionsVac = ['<option value="">Seleccionar</option>'].concat(
    vacunadores
      .slice()
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
      .map((v) => `<option value="${v.id}">${v.nombre}</option>`)
  );
  if (selectVacEnt) selectVacEnt.innerHTML = optionsVac.join("");
  if (selectVacRec) selectVacRec.innerHTML = optionsVac.join("");

  const selectVacCliente = document.getElementById("cli-vacunador");
  const optionsVacCliente = ['<option value="">Ninguno</option>'].concat(
    vacunadores
      .slice()
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
      .map((v) => `<option value="${v.id}">${v.nombre}</option>`)
  );
  if (selectVacCliente) selectVacCliente.innerHTML = optionsVacCliente.join("");

  const filtroEntVac = document.getElementById("filtro-ent-vacunador");
  const filtroRecVac = document.getElementById("filtro-rec-vacunador");
  const filtroDashVac = document.getElementById("filtro-vacunador-dashboard");
  const filtroDetVac = document.getElementById("filtro-det-vac-vacunador");
  const optionsFiltroVac = ['<option value="">Todos los vacunadores</option>'].concat(
    vacunadores
      .slice()
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
      .map((v) => `<option value="${v.id}">${v.nombre}</option>`)
  );
  if (filtroEntVac) filtroEntVac.innerHTML = optionsFiltroVac.join("");
  if (filtroRecVac) filtroRecVac.innerHTML = optionsFiltroVac.join("");
  if (filtroDetVac) {
    filtroDetVac.innerHTML = ['<option value="">Seleccionar vacunador</option>'].concat(
      vacunadores
        .slice()
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
        .map((v) => `<option value="${v.id}">${v.nombre}</option>`)
    ).join("");
  }

  const optionsDashVac = ['<option value="">Seleccione un Vacunador</option>'].concat(
    vacunadores
      .slice()
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
      .map((v) => `<option value="${v.id}">${v.nombre}</option>`)
  );
  if (filtroDashVac) filtroDashVac.innerHTML = optionsDashVac.join("");
}

function renderResumenGlobalVacunas() {
  const panel = document.getElementById("panel-vacunas-der");
  if (!panel) return;
  // vacuna -> proveedorId -> totales
  const agrupado = {};
  movimientos.forEach((m) => {
    if (!m.vacuna) return;
    const vacuna = String(m.vacuna).trim().toUpperCase();
    if (!agrupado[vacuna]) agrupado[vacuna] = {};
    const provId = m.proveedorId;
    if (!agrupado[vacuna][provId]) agrupado[vacuna][provId] = { compra: 0, entrega: 0 };
    const cantidad = Number(m.cantidadDosis) || 0;
    if (m.tipo === "compra") agrupado[vacuna][provId].compra += cantidad;
    if (m.tipo === "entrega") agrupado[vacuna][provId].entrega += cantidad;
  });
  const vacunas = Object.keys(agrupado).sort((a, b) => a.localeCompare(b, "es"));
  const partes = [];
  vacunas.forEach((vac) => {
    const filas = Object.entries(agrupado[vac]).map(([provId, tot]) => {
      const prov = proveedores.find((p) => p.id === Number(provId));
      return {
        provId: Number(provId),
        laboratorio: prov ? prov.razonSocial || `#${provId}` : `#${provId}`,
        compra: tot.compra || 0,
        entrega: tot.entrega || 0,
      };
    });
    filas.sort((a, b) => a.laboratorio.localeCompare(b.laboratorio, "es"));
    let totalCompra = 0;
    let totalEntrega = 0;
    const filasHtml = filas
      .map((f) => {
        const saldo = f.compra - f.entrega;
        totalCompra += f.compra;
        totalEntrega += f.entrega;
        return `<tr data-prov="${f.provId}" data-vac="${vac}">
          <td>${f.laboratorio}</td>
          <td>${f.compra}</td>
          <td>${f.entrega}</td>
          <td>${saldo}</td>
          <td>
            <button type="button" data-action="agg-edit" class="icon-btn" title="Editar último movimiento">✎</button>
            <button type="button" data-action="agg-delete" class="icon-btn icon-danger" title="Eliminar último movimiento">🗑</button>
            <button type="button" data-action="agg-ver" class="icon-btn" title="Ver movimientos">🔎</button>
          </td>
        </tr>`;
      })
      .join("");
    const saldoTotal = totalCompra - totalEntrega;
    const bloque = `
      <div class="vbox">
        <h4>Tipo de vacuna: ${vac}
          <button type="button" class="icon-btn" data-action="vac-rename" data-vac="${vac}" title="Renombrar tipo de vacuna">✎</button>
          <button type="button" class="icon-btn icon-danger" data-action="vac-delete" data-vac="${vac}" title="Eliminar tipo de vacuna">🗑</button>
        </h4>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr><th>Laboratorio</th><th>Compra</th><th>Recepción</th><th>Saldo</th><th></th></tr>
            </thead>
            <tbody>${filasHtml}</tbody>
            <tfoot>
              <tr><th>Totales</th><th>${totalCompra}</th><th>${totalEntrega}</th><th>${saldoTotal}</th><th></th></tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    partes.push(bloque);
  });
  panel.innerHTML = partes.join("") || '<p class="helper-text">Sin movimientos para mostrar.</p>';
}

function calcularTotalesProveedor(proveedorId) {
  const movProv = movimientos.filter((m) => m.proveedorId === proveedorId);
  let compradas = 0;
  let entregadas = 0;
  movProv.forEach((m) => {
    const cantidad = Number(m.cantidadDosis) || 0;
    if (m.tipo === "compra") {
      compradas += cantidad;
    } else if (m.tipo === "entrega") {
      entregadas += cantidad;
    }
  });
  return {
    compradas,
    entregadas,
    saldo: compradas - entregadas,
  };
}

function renderProveedores() {
  const tbody = document.getElementById("tbody-proveedores");
  if (!tbody) return;
  tbody.innerHTML = "";
  proveedores.forEach((p) => {
    const totales = calcularTotalesProveedor(p.id);
    const tr = document.createElement("tr");
    tr.dataset.id = String(p.id);
    tr.className = "row-selectable" + (p.id === proveedorSeleccionadoId ? " row-selected" : "");
    tr.innerHTML = `
      <td>${p.razonSocial || ""}</td>
      <td>${totales.compradas}</td>
      <td>${totales.entregadas}</td>
      <td>${totales.saldo}</td>
      <td>
        <button type="button" data-action="edit-prov" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-prov" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  actualizarFiltroProveedores();
}

function aplicarValoresPorDefectoCliente() {
  const form = document.getElementById("form-cliente");
  if (!form) return;
  if (!ultimaProvinciaCliente && clientes.length) {
    const ultimo = clientes[clientes.length - 1];
    ultimaProvinciaCliente = ultimo.provincia || "";
  }
  if (ultimaProvinciaCliente && !form.provincia.value) {
    form.provincia.value = ultimaProvinciaCliente;
  }
}

function aplicarValoresPorDefectoVacunacion() {
  const form = document.getElementById("form-vacunacion");
  if (!form) return;
  const selPeriodo = document.getElementById("vac-periodo");
  const selTipo = document.getElementById("vac-tipo-vacunacion");
  const inputFecha = document.getElementById("vac-fecha");
  const inputAnio = document.getElementById("vac-anio");
  if (selPeriodo && ultimoPeriodoVac) {
    selPeriodo.value = ultimoPeriodoVac;
  }
  if (inputAnio && ultimoAnioVac) {
    inputAnio.value = ultimoAnioVac;
  }
  if (selTipo && ultimoTipoVac) {
    selTipo.value = ultimoTipoVac;
  }
  if (inputFecha && ultimaFechaVac) {
    inputFecha.value = ultimaFechaVac;
  }
}

function renderClientes() {
  const tbody = document.getElementById("tbody-clientes");
  if (!tbody) return;
  tbody.innerHTML = "";
  const filtrados = clientes
    .slice()
    .filter((c) => {
      if (filtrosClientes.renspa) {
        const v = (c.renspa || "").toLowerCase();
        if (!v.includes(filtrosClientes.renspa.toLowerCase())) return false;
      }
      if (filtrosClientes.nombre) {
        const v = (c.nombre || "").toLowerCase();
        if (!v.includes(filtrosClientes.nombre.toLowerCase())) return false;
      }
      if (filtrosClientes.documento) {
        const v = (c.documento || "").toLowerCase();
        if (!v.includes(filtrosClientes.documento.toLowerCase())) return false;
      }
      if (filtrosClientes.localidad) {
        const v = (c.localidad || "").toLowerCase();
        if (!v.includes(filtrosClientes.localidad.toLowerCase())) return false;
      }
      if (filtrosClientes.departamento) {
        const v = (c.departamento || "").toLowerCase();
        if (!v.includes(filtrosClientes.departamento.toLowerCase())) return false;
      }
      if (filtrosClientes.provincia) {
        const v = (c.provincia || "").toLowerCase();
        if (!v.includes(filtrosClientes.provincia.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => (a.renspa || "").localeCompare(b.renspa || "", "es"));
  filtrados.forEach((c) => {
    const tr = document.createElement("tr");
    tr.dataset.id = String(c.id);
    let vacunadorDeCliente = "Ninguno";
    if (c.vacunadorId) {
      // Comparación robusta convirtiendo a string
      const vacObj = vacunadores.find(v => String(v.id) === String(c.vacunadorId));
      if (vacObj) vacunadorDeCliente = vacObj.nombre;
    }
    tr.innerHTML = `
      <td>${c.renspa || ""}</td>
      <td>${c.nombre || ""}</td>
      <td>${c.documento || ""}</td>
      <td>${c.establecimiento || ""}</td>
      <td>${c.localidad || ""}</td>
      <td>${c.departamento || ""}</td>
      <td>${c.provincia || ""}</td>
      <td>${vacunadorDeCliente}</td>
      <td>
        <button type="button" data-action="view-cli" class="icon-btn" title="Ver">🔍</button>
        <button type="button" data-action="edit-cli" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-cli" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderListaProveedores() {
  const ids = ["lista-proveedores", "lista-proveedores-compra", "lista-proveedores-entrega"];
  const html =
    proveedores
      .slice()
      .sort((a, b) => (a.razonSocial || "").localeCompare(b.razonSocial || "", "es"))
      .map(
        (p) =>
          `<div class="prov-item" data-id="${p.id}">
            <span>${p.razonSocial || ""}</span>
            <button type="button" class="icon-btn" data-action="sel-prov" title="Seleccionar proveedor">✔</button>
          </div>`
      )
      .join("") || '<p class="helper-text">No hay proveedores cargados.</p>';
  ids.forEach((id) => {
    const cont = document.getElementById(id);
    if (!cont) return;
    cont.innerHTML = html;
  });
}

function renderResumenPorVacunaGlobal() {
  const tbodySaldos = document.querySelector("#tabla-saldos-vacunas tbody");
  if (!tbodySaldos) return;
  const porVacuna = {};
  movimientos.forEach((m) => {
    const clave = String(m.vacuna || "").trim().toUpperCase();
    if (!clave) return;
    if (!porVacuna[clave]) {
      porVacuna[clave] = { compradas: 0, entregadas: 0 };
    }
    const cantidad = Number(m.cantidadDosis) || 0;
    if (m.tipo === "compra") {
      porVacuna[clave].compradas += cantidad;
    } else if (m.tipo === "entrega") {
      porVacuna[clave].entregadas += cantidad;
    }
  });
  tbodySaldos.innerHTML = "";
  Object.keys(porVacuna)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach((vacuna) => {
      const info = porVacuna[vacuna];
      const saldo = info.compradas - info.entregadas;
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${vacuna}</td>
      <td>${info.compradas}</td>
      <td>${info.entregadas}</td>
      <td>${saldo}</td>
    `;
      tbodySaldos.appendChild(tr);
    });
}

function renderResumenYMovimientos() {
  const textoSinProveedor = document.getElementById("texto-sin-proveedor");
  const proveedorActual = document.getElementById("proveedor-actual");
  const proveedorNombre = document.getElementById("proveedor-actual-nombre");
  const tbodyMov = document.querySelector("#tabla-movimientos tbody");
  const formCompra = document.getElementById("form-compra");
  const formEntrega = document.getElementById("form-entrega");
  if (!tbodyMov || !formCompra || !formEntrega) {
    return;
  }
  if (!proveedorSeleccionadoId && proveedores.length) {
    seleccionarProveedor(proveedores[0].id);
    return;
  }
  if (!proveedorSeleccionadoId) {
    if (textoSinProveedor) textoSinProveedor.classList.remove("hidden");
    if (proveedorActual) proveedorActual.classList.add("hidden");
    tbodyMov.innerHTML = "";
    [formCompra, formEntrega].forEach((f) => {
      Array.from(f.elements).forEach((el) => {
        el.disabled = true;
      });
    });
    return;
  }
  const prov = proveedores.find((p) => p.id === proveedorSeleccionadoId);
  if (!prov) {
    proveedorSeleccionadoId = null;
    renderResumenYMovimientos();
    return;
  }
  if (textoSinProveedor) textoSinProveedor.classList.add("hidden");
  if (proveedorActual) proveedorActual.classList.remove("hidden");
  if (proveedorNombre) proveedorNombre.textContent = prov.razonSocial || "";
  [formCompra, formEntrega].forEach((f) => {
    Array.from(f.elements).forEach((el) => {
      el.disabled = false;
    });
  });
  const movProv = movimientos
    .filter((m) => m.proveedorId === proveedorSeleccionadoId)
    .filter((m) => {
      if (filtros.fechaDesde && m.fecha && m.fecha < filtros.fechaDesde) {
        return false;
      }
      if (filtros.fechaHasta && m.fecha && m.fecha > filtros.fechaHasta) {
        return false;
      }
      if (filtros.vacuna) {
        const textoVacuna = (m.vacuna || "").toLowerCase();
        if (!textoVacuna.includes(filtros.vacuna.toLowerCase())) {
          return false;
        }
      }
      if (filtros.tipo && m.tipo !== filtros.tipo) {
        return false;
      }
      if (filtros.comprobante) {
        const comp = `${m.factura || ""} ${m.remito || ""}`.toLowerCase();
        if (!comp.includes(filtros.comprobante.toLowerCase())) {
          return false;
        }
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (a.fecha === b.fecha) {
        return a.creadoEn - b.creadoEn;
      }
      return a.fecha < b.fecha ? 1 : -1;
    });
  tbodyMov.innerHTML = "";
  movProv.forEach((m) => {
    const comprobante = m.tipo === "compra" ? m.factura || "" : m.remito || "";
    const realizaRecibe = m.tipo === "compra" ? (m.comprador || "") : (m.receptor || "");
    const pDose = m.tipo === "compra" && m.precioDosis ? `$${Number(m.precioDosis).toFixed(2)}` : "-";
    const pTotal = m.tipo === "compra" && m.importeFactura ? `$${Number(m.importeFactura).toFixed(2)}` : "-";

    const tr = document.createElement("tr");
    tr.dataset.id = String(m.id);
    tr.innerHTML = `
      <td>${m.fecha || ""}</td>
      <td>${comprobante}</td>
      <td>${m.vacuna || ""}</td>
      <td>${m.marca || ""}</td>
      <td>${m.serie || ""}</td>
      <td>${m.fechaVencimiento || ""}</td>
      <td>${m.cantidadDosis}</td>
      <td>${realizaRecibe}</td>
      <td>${m.tipo === "compra" ? "Compra" : "Recepción"}</td>
      <td>
        <button type="button" data-action="edit-mov" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-mov" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbodyMov.appendChild(tr);
  });
}

function renderHistorial() {
  const tbody = document.querySelector("#tabla-historial tbody");
  if (!tbody) return;
  const filas = movimientos
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  tbody.innerHTML = "";
  filas.forEach((m) => {
    const prov = proveedores.find((p) => p.id === m.proveedorId);
    const laboratorio = prov ? prov.razonSocial || "" : "";

    const pDose = m.tipo === "compra" && m.precioDosis ? `$${Number(m.precioDosis).toFixed(2)}` : "-";
    const pTotal = m.tipo === "compra" && m.importeFactura ? `$${Number(m.importeFactura).toFixed(2)}` : "-";

    const tr = document.createElement("tr");
    tr.dataset.id = String(m.id);
    const comprobante = m.tipo === "compra" ? m.factura || "" : m.remito || "";
    tr.innerHTML = `
      <td>${m.fecha || ""}</td>
      <td>${laboratorio}</td>
      <td>${m.vacuna || ""}</td>
      <td>${m.marca || ""}</td>
      <td>${m.serie || ""}</td>
      <td>${m.fechaVencimiento || ""}</td>
      <td>${m.cantidadDosis || 0}</td>
      <td>${m.tipo === "compra" ? "Compra" : "Recepción"}</td>
      <td>${comprobante}</td>
      <td>
        <button type="button" data-action="edit-mov" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-mov" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function seleccionarProveedor(id) {
  proveedorSeleccionadoId = id;
  const filas = document.querySelectorAll("#tbody-proveedores tr");
  filas.forEach((tr) => {
    if (String(tr.dataset.id) === String(id)) {
      tr.classList.add("row-selected");
    } else {
      tr.classList.remove("row-selected");
    }
  });
  const filtroProveedor = document.getElementById("filtro-proveedor");
  if (filtroProveedor) {
    filtroProveedor.value = id ? String(id) : "";
  }
  renderResumenYMovimientos();
}

function renderLotesCompraTemporales() {
  const tbody = document.getElementById("tbody-compra-lotes");
  if (!tbody) return;
  tbody.innerHTML = lotesCompraTemporales.map((l, index) => `
    <tr>
      <td>${l.serie}</td>
      <td>${l.vencimiento}</td>
      <td>${l.cantidad}</td>
      <td style="text-align:center;"><button type="button" class="secondary" onclick="eliminarLoteCompra(${index})">X</button></td>
    </tr>
  `).join("");
}
function eliminarLoteCompra(index) {
  lotesCompraTemporales.splice(index, 1);
  renderLotesCompraTemporales();
}

function renderTransfCobroTemporales() {
  const tbody = document.getElementById("tbody-cobro-transferencias");
  if (!tbody) return;
  tbody.innerHTML = transfCobroTemporales.map((t, index) => `
    <tr>
      <td>$${t.monto.toFixed(2)}</td>
      <td>${t.numero}</td>
      <td>${t.bancoOrigen}</td>
      <td>${t.bancoDestino}</td>
      <td>${t.fondoDestino}</td>
      <td style="text-align:center;">
        <button type="button" class="icon-btn" onclick="editarTransfCobro(${index})" title="Editar">✎</button>
        <button type="button" class="icon-btn icon-danger" onclick="eliminarTransfCobro(${index})" title="Eliminar">🗑</button>
      </td>
    </tr>
  `).join("");
}
function eliminarTransfCobro(index) {
  transfCobroTemporales.splice(index, 1);
  renderTransfCobroTemporales();
}
function editarTransfCobro(index) {
  const t = transfCobroTemporales[index];
  document.getElementById("cobro-transf-monto").value = t.monto;
  document.getElementById("cobro-transf-origen").value = (t.bancoOrigen || "");
  document.getElementById("cobro-transf-numero").value = (t.numero || "");
  document.getElementById("cobro-transf-destino").value = (t.bancoDestino || "");
  document.getElementById("cobro-transf-fondo-destino").value = (t.fondoDestino || "");
  transfCobroTemporales.splice(index, 1);
  renderTransfCobroTemporales();
}

function renderChequesCobroTemporales() {
  const tbody = document.getElementById("tbody-cheques");
  if (!tbody) return;
  tbody.innerHTML = chequesTemporales.map((c, index) => `
    <tr>
      <td>${c.banco}</td>
      <td>${c.numero}</td>
      <td>${c.fechaCheque}</td>
      <td>${c.fechaCobro}</td>
      <td>$${c.importe.toFixed(2)}</td>
      <td>${c.destino}</td>
      <td style="text-align:center;">
        <button type="button" class="icon-btn" onclick="editarChequeCobro(${index})" title="Editar">✎</button>
        <button type="button" class="icon-btn icon-danger" onclick="eliminarChequeCobro(${index})" title="Eliminar">🗑</button>
      </td>
    </tr>
  `).join("");
}
function eliminarChequeCobro(index) {
  chequesTemporales.splice(index, 1);
  renderChequesCobroTemporales();
}
function editarChequeCobro(index) {
  const c = chequesTemporales[index];
  document.getElementById("cheque-banco").value = c.banco;
  document.getElementById("cheque-numero").value = c.numero;
  document.getElementById("cheque-fecha").value = (c.fechaCheque || "");
  document.getElementById("cheque-fecha-cobro").value = (c.fechaCobro || "");
  document.getElementById("cheque-importe").value = c.importe;
  document.getElementById("cheque-destino").value = (c.destino || "");
  chequesTemporales.splice(index, 1);
  renderChequesCobroTemporales();
}

function renderTransfPagoVacTemporales() {
  const tbody = document.getElementById("tbody-pago-vac-transferencias");
  if (!tbody) return;
  tbody.innerHTML = transfPagoVacTemporales.map((t, index) => `
    <tr>
      <td>$${t.monto.toFixed(2)}</td>
      <td>${t.numero}</td>
      <td>${t.bancoOrigen}</td>
      <td>${t.bancoDestino}</td>
      <td style="text-align:center;">
        <button type="button" class="icon-btn" onclick="editarTransfPagoVac(${index})" title="Editar">✎</button>
        <button type="button" class="icon-btn icon-danger" onclick="eliminarTransfPagoVac(${index})" title="Eliminar">🗑</button>
      </td>
    </tr>
  `).join("");
}
function eliminarTransfPagoVac(index) {
  transfPagoVacTemporales.splice(index, 1);
  renderTransfPagoVacTemporales();
}
function editarTransfPagoVac(index) {
  const t = transfPagoVacTemporales[index];
  document.getElementById("pago-vac-transf-monto").value = t.monto;
  document.getElementById("pago-vac-transf-origen").value = (t.bancoOrigen || "");
  document.getElementById("pago-vac-transf-numero").value = (t.numero || "");
  document.getElementById("pago-vac-transf-destino").value = (t.bancoDestino || "");
  transfPagoVacTemporales.splice(index, 1);
  renderTransfPagoVacTemporales();
}

function renderChequesPagoVacTemporales() {
  const tbody = document.getElementById("tbody-pago-vac-cheques-v2");
  if (!tbody) return;
  tbody.innerHTML = chequesPagoVacTemporales.map((c, index) => `
    <tr>
      <td>${c.banco}</td>
      <td>${c.numero}</td>
      <td>${c.fechaCheque}</td>
      <td>${c.fechaCobro}</td>
      <td>$${c.importe.toFixed(2)}</td>
      <td>${c.destino}</td>
      <td style="text-align:center;">
        <button type="button" class="icon-btn" onclick="editarChequePagoVac(${index})" title="Editar">✎</button>
        <button type="button" class="icon-btn icon-danger" onclick="eliminarChequePagoVac(${index})" title="Eliminar">🗑</button>
      </td>
    </tr>
  `).join("");
}
function eliminarChequePagoVac(index) {
  chequesPagoVacTemporales.splice(index, 1);
  renderChequesPagoVacTemporales();
}
function editarChequePagoVac(index) {
  const c = chequesPagoVacTemporales[index];
  document.getElementById("pago-vac-cheque-banco").value = c.banco;
  document.getElementById("pago-vac-cheque-numero").value = c.numero;
  document.getElementById("pago-vac-cheque-fecha-cheque").value = (c.fechaCheque || "");
  document.getElementById("pago-vac-cheque-fecha-cobro").value = (c.fechaCobro || "");
  document.getElementById("pago-vac-cheque-importe").value = c.importe;
  document.getElementById("pago-vac-cheque-destino").value = (c.destino || "");
  chequesPagoVacTemporales.splice(index, 1);
  renderChequesPagoVacTemporales();
}

function validarDestinos(tipo) {
  if (tipo === "cobro") {
    const efMonto = Number(document.getElementById("cobro-efectivo-monto")?.value) || 0;
    const efDestino = (document.getElementById("cobro-efectivo-destino")?.value || "").trim();
    if (efMonto > 0 && !efDestino) {
      alert("Completá el destino de los fondos en EFECTIVO.");
      return false;
    }
    const hasTransf = transfCobroTemporales.length > 0;
    if (hasTransf) {
      for (let t of transfCobroTemporales) {
        if (!String(t.fondoDestino || "").trim()) {
          alert("Al menos una transferencia no tiene DESTINO (Fondo).");
          return false;
        }
      }
    }
    const hasCheques = chequesTemporales.length > 0;
    if (hasCheques) {
      for (let c of chequesTemporales) {
        if (!String(c.destino || "").trim()) {
          alert("Al menos un cheque no tiene DESTINO.");
          return false;
        }
      }
    }
  } else {
    // pago-vac
    const hasCheques = chequesPagoVacTemporales.length > 0;
    if (hasCheques) {
      for (let c of chequesPagoVacTemporales) {
        if (!String(c.destino || "").trim()) {
          alert("Al menos un cheque no tiene DESTINO.");
          return false;
        }
      }
    }
  }
  return true;
}

function handleEditarCobro(id) {
  const item = cobros.find((c) => c.id === id);
  if (!item) return;
  activateSection("cobro");
  const formCobro = document.getElementById("form-cobro");
  if (!formCobro) return;

  const inputFecha = document.getElementById("cobro-fecha");
  const inputActa = document.getElementById("cobro-acta");
  const inputRend = document.getElementById("cobro-rendicion");
  const inputImp = document.getElementById("cobro-importe");
  const inputR = document.getElementById("cobro-renspa");
  const inputN = document.getElementById("cobro-nombre");
  const selPagada = document.getElementById("cobro-pagada");
  if (inputFecha) inputFecha.value = item.fechaCobro || "";
  if (inputActa) inputActa.value = item.acta || "";
  if (inputRend) inputRend.value = item.rendicion || "";
  if (inputImp)
    inputImp.value =
      typeof item.importeActa === "number"
        ? item.importeActa.toFixed(2)
        : "";
  if (inputR) inputR.value = item.renspa || "";
  if (inputN) inputN.value = item.nombre || "";
  if (selPagada) selPagada.value = item.pagada || "no";
  cobroEditandoId = id;

  const inputEfMonto = document.getElementById("cobro-efectivo-monto");
  const inputEfDest = document.getElementById("cobro-efectivo-destino");
  if (inputEfMonto) inputEfMonto.value = typeof item.importeEfectivo === "number" ? item.importeEfectivo.toFixed(2) : "";
  if (inputEfDest) inputEfDest.value = item.efectivoDestino || "";

  transfCobroTemporales = Array.isArray(item.transferencias)
    ? item.transferencias.slice()
    : [];
  renderTransfCobroTemporales();

  actualizarUIFormaPago();
  chequesTemporales = Array.isArray(item.cheques)
    ? item.cheques.slice()
    : [];
  const tbodyCheques = document.getElementById("tbody-cheques");
  if (tbodyCheques) {
    tbodyCheques.innerHTML = "";
    chequesTemporales.forEach((ch) => {
      const trCh = document.createElement("tr");
      trCh.innerHTML = `<td>${ch.banco || ""}</td>
<td>${ch.numero || ""}</td>
<td>${ch.fechaCheque || ""}</td>
<td>${ch.fechaCobro || ""}</td>
<td>${typeof ch.importe === "number" ? ch.importe.toFixed(2) : ""}</td>
<td>${ch.destino || ""}</td>`;
      tbodyCheques.appendChild(trCh);
    });
  }
  const btnSubmit = formCobro.querySelector("button[type='submit']");
  if (btnSubmit) btnSubmit.textContent = "Actualizar cobro";
  formCobro.scrollIntoView({ behavior: "smooth" });
}

function handleEliminarCobro(id) {
  if (!confirm("¿Eliminar este cobro?")) return;
  cobros = cobros.filter((c) => c.id !== id);
  guardarCobros();
  renderCobros();
  renderFinanzasGlobales();
}

function handleEditarPagoVac(id) {
  const item = pagosVacunadores.find((c) => c.id === id);
  if (!item) return;
  activateSection("pagos-vacunadores");
  const formPagoVac = document.getElementById("form-pago-vacunador");
  if (!formPagoVac) return;

  const inputFecha = document.getElementById("pago-vac-fecha");
  const selVac = document.getElementById("pago-vac-vacunador");
  const inputRend = document.getElementById("pago-vac-rendicion");
  const selPagoVacEstado = document.getElementById("pago-vac-estado");
  const selPagoVacForma = document.getElementById("pago-vac-forma");

  if (inputFecha) inputFecha.value = item.fechaPago || "";
  if (selVac) selVac.value = item.vacunadorId || "";
  if (inputRend) inputRend.value = item.rendicion || "";
  if (selPagoVacEstado) selPagoVacEstado.value = item.pagada || "no";

  pagoVacEditandoId = id;

  const inputEfMonto = document.getElementById("pago-vac-efectivo-monto");
  if (inputEfMonto) inputEfMonto.value = typeof item.importeEfectivo === "number" ? item.importeEfectivo.toFixed(2) : "";

  transfPagoVacTemporales = Array.isArray(item.transferencias)
    ? item.transferencias.slice()
    : [];
  renderTransfPagoVacTemporales();
  actualizarUIPagoVacForma();

  chequesPagoVacTemporales = Array.isArray(item.cheques) ? item.cheques.slice() : [];
  const tbodyChequesP = document.querySelector("#tabla-pago-vac-cheques tbody");
  if (tbodyChequesP) {
    tbodyChequesP.innerHTML = "";
    chequesPagoVacTemporales.forEach((ch) => {
      const trCh = document.createElement("tr");
      trCh.innerHTML = `<td>${ch.banco || ""}</td>
<td>${ch.numero || ""}</td>
<td>${ch.fechaCheque || ""}</td>
<td>${ch.fechaCobro || ""}</td>
<td>${typeof ch.importe === "number" ? ch.importe.toFixed(2) : ""}</td>
<td>${ch.destino || ""}</td>`;
      tbodyChequesP.appendChild(trCh);
    });
  }

  if (Array.isArray(item.actas)) {
    actasPagoTemp = item.actas.map(a => ({
      acta: a.acta,
      manoObra: Number(a.importeManoObra) || 0,
      movilidad: Number(a.importeMovilidad) || 0,
      total: Number(a.importeTotal) || 0
    }));
  } else {
    actasPagoTemp = [{
      acta: item.acta,
      manoObra: Number(item.importeManoObra) || 0,
      movilidad: Number(item.importeMovilidad) || 0,
      total: Number(item.importeTotal) || 0
    }];
  }

  const btnSubmit = formPagoVac.querySelector("button[type='submit']");
  if (btnSubmit) btnSubmit.textContent = "Actualizar pago";

  renderPagoVacSeleccion();
  renderActasPorVacunador();
  formPagoVac.scrollIntoView({ behavior: "smooth" });
}

function handleEliminarPagoVac(id) {
  if (!confirm("¿Eliminar este pago?")) return;
  pagosVacunadores = pagosVacunadores.filter((c) => c.id !== id);
  guardarPagosVacunadores();
  renderPagosVacunadores();
  renderFinanzasGlobales();
}

function actualizarDatalistDestinos() {
  const destinos = new Set(["Caja", "Banco", "Caja Rural", "Cheques en Cartera"]); // Defaults
  if (typeof cobros !== "undefined") {
    cobros.forEach((c) => {
      if (c.efectivoDestino) destinos.add(c.efectivoDestino);
      if (c.transferencias)
        c.transferencias.forEach((t) => {
          if (t.fondoDestino) destinos.add(t.fondoDestino);
        });
      if (c.cheques)
        c.cheques.forEach((ch) => {
          if (ch.destino) destinos.add(ch.destino);
        });
    });
  }
  if (typeof pagosVacunadores !== "undefined") {
    pagosVacunadores.forEach((p) => {
      if (p.efectivoDestino) destinos.add(p.efectivoDestino);
      if (p.transferencias)
        p.transferencias.forEach((t) => {
          if (t.fondoDestino) destinos.add(t.fondoDestino);
        });
      if (p.cheques)
        p.cheques.forEach((ch) => {
          if (ch.destino) destinos.add(ch.destino);
        });
    });
  }
  poblarDatalist("dl-destinos", Array.from(destinos).sort());
}

function registrarEventos() {
  const hoy = new Date().toISOString().slice(0, 10);
  const inputsFecha = document.querySelectorAll('input[type="date"]');
  inputsFecha.forEach((input) => {
    if (!input.value && !input.id.includes("filtro")) {
      input.value = hoy;
    }
  });
  const navButtons = document.querySelectorAll(".nav-button");
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateSection(button.dataset.section);
    });
  });

  const btnDetVac = document.getElementById("btn-generar-det-vac");
  if (btnDetVac) {
    btnDetVac.addEventListener("click", renderInformeVacunadorDetalle);
  }
  const formularios = document.querySelectorAll("form");
  formularios.forEach((form) => {
    form.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const target = e.target;
      if (!target || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      const focusables = Array.from(
        form.querySelectorAll(
          'input, select, textarea, button:not([type="submit"])'
        )
      ).filter(
        (el) => !el.disabled && el.type !== "hidden" && el.offsetParent !== null
      );
      const idx = focusables.indexOf(target);
      if (idx === -1) return;
      const siguiente = focusables[idx + 1];
      if (siguiente && typeof siguiente.focus === "function") {
        siguiente.focus();
      }
    });
  });
  const btnProvCompra = document.getElementById("btn-proveedor-compra");
  if (btnProvCompra) {
    btnProvCompra.addEventListener("click", () => {
      const panel = document.getElementById("lista-proveedores-compra");
      if (!panel) return;
      panel.classList.toggle("hidden");
    });
  }
  const btnProvEntrega = document.getElementById("btn-proveedor-entrega");
  if (btnProvEntrega) {
    btnProvEntrega.addEventListener("click", () => {
      const panel = document.getElementById("lista-proveedores-entrega");
      if (!panel) return;
      panel.classList.toggle("hidden");
    });
  }
  ["lista-proveedores", "lista-proveedores-compra", "lista-proveedores-entrega"].forEach((id) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || btn.dataset.action !== "sel-prov") return;
      const item = e.target.closest(".prov-item");
      if (!item) return;
      const provId = Number(item.getAttribute("data-id"));
      if (!provId) return;
      seleccionarProveedor(provId);
      ["lista-proveedores", "lista-proveedores-compra", "lista-proveedores-entrega"].forEach((pid) => {
        const p = document.getElementById(pid);
        if (p) p.classList.add("hidden");
      });
    });
  });
  const formProveedor = document.getElementById("form-proveedor");
  if (formProveedor) {
    formProveedor.addEventListener("submit", (e) => {
      e.preventDefault();
      const razonSocial = formProveedor.razonSocial.value.trim();
      const direccion = formProveedor.direccion.value.trim();
      const cuit = (formProveedor.cuit && formProveedor.cuit.value.trim()) || "";
      const tipoInscripcion = formProveedor.tipoInscripcion.value;
      if (!razonSocial) {
        alert("La razón social es obligatoria.");
        return;
      }
      if (proveedorEditandoId) {
        const existente = proveedores.find((p) => p.id === proveedorEditandoId);
        if (existente) {
          existente.razonSocial = razonSocial;
          existente.direccion = direccion;
          existente.cuit = cuit;
          existente.tipoInscripcion = tipoInscripcion;
        }
        proveedorEditandoId = null;

        const btnSubmit = document.getElementById("btn-submit-proveedor");
        if (btnSubmit) btnSubmit.textContent = "Guardar proveedor";
        const btnCancel = document.getElementById("btn-cancelar-edicion-prov");
        if (btnCancel) btnCancel.classList.add("hidden");
      } else {
        const nuevo = {
          id: Date.now(),
          razonSocial,
          direccion,
          cuit,
          tipoInscripcion,
        };
        proveedores.push(nuevo);
      }
      guardarProveedores();
      formProveedor.reset();
      renderProveedores();
      renderResumenYMovimientos();
    });
  }
  const formCliente = document.getElementById("form-cliente");
  if (formCliente) {
    const inputRenspa = formCliente.renspa;
    const maskRenspa = (digits) => {
      const d = digits.replace(/\D+/g, "").slice(0, 2 + 3 + 1 + 5 + 2);
      const p1 = d.slice(0, 2);
      const p2 = d.slice(2, 5);
      const p3 = d.slice(5, 6);
      const p4 = d.slice(6, 11);
      const p5 = d.slice(11, 13);
      let out = "";
      if (p1) out += p1;
      if (p2) out += "." + p2;
      if (p3) out += "." + p3;
      if (p4) out += "." + p4;
      if (p5) out += "/" + p5;
      return out;
    };
    if (inputRenspa) {
      inputRenspa.addEventListener("input", (e) => {
        if (e.inputType === "insertReplacementText") return;
        const val = inputRenspa.value;
        const formatted = maskRenspa(val);
        if (val !== formatted) {
          inputRenspa.value = formatted;
          inputRenspa.setSelectionRange(inputRenspa.value.length, inputRenspa.value.length);
        }
        const r = inputRenspa.value.trim();
        const coincide = clientes.find((c) => (c.renspa || "") === r);
        if (coincide) {
          formCliente.nombre.value = (coincide.nombre || "").toUpperCase();
          formCliente.documento.value = coincide.documento || "";
          formCliente.establecimiento.value = (coincide.establecimiento || "").toUpperCase();
          formCliente.localidad.value = (coincide.localidad || "").toUpperCase();
          formCliente.departamento.value = (coincide.departamento || "").toUpperCase();
          formCliente.provincia.value = coincide.provincia || "";
          if (formCliente.vacunadorId) formCliente.vacunadorId.value = coincide.vacunadorId || "";
          clienteEditandoId = coincide.id;
          formCliente.dataset.clearedOnce = "0";
        } else {
          // Si no encontramos match, tratamos de autocompletar el Departamento por los primeros dígitos del RENSPA
          const deptMap = {
            "21.005": "Banda",
            "21.007": "Capital",
            "21.025": "San Martin",
            "21.023": "Robles",
            "21.014": "Loreto",
            "21.010": "Figueroa",
            "21.027": "Silipica",
            "21.026": "Sarmiento"
          };
          const prefijo = r.substring(0, 6); // Ej: 21.005
          let deptoMapeado = deptMap[prefijo] || "";

          if (formCliente.dataset.clearedOnce !== "1") {
            formCliente.nombre.value = "";
            formCliente.documento.value = "";
            formCliente.establecimiento.value = "";
            formCliente.localidad.value = "";
            // Si hay depto mapeado lo ponemos, sino limpiamos
            formCliente.departamento.value = deptoMapeado ? deptoMapeado : "";
            if (formCliente.vacunadorId) formCliente.vacunadorId.value = "";
            clienteEditandoId = null;
            formCliente.dataset.clearedOnce = "1";
          } else {
            // Si ya fue limpiado, solo reevaluamos el departamento autocompletado dinámicamente si el usuario lo borra o cambia
            if (deptoMapeado && !formCliente.departamento.value) {
              formCliente.departamento.value = deptoMapeado;
            }
          }
        }
      });
      inputRenspa.addEventListener("blur", () => {
        inputRenspa.value = maskRenspa(inputRenspa.value);
      });
    }
    ["nombre", "establecimiento", "localidad", "departamento"].forEach((n) => {
      const f = formCliente[n];
      if (!f) return;
      f.addEventListener("input", () => {
        const v = f.value;
        const nv = v.toUpperCase();
        if (nv !== v) {
          f.value = nv;
          f.setSelectionRange(f.value.length, f.value.length);
        }
      });
      f.addEventListener("blur", () => {
        f.value = f.value.toUpperCase();
      });
    });
    formCliente.addEventListener("submit", (e) => {
      e.preventDefault();
      const renspa = formCliente.renspa.value.trim();
      const nombre = formCliente.nombre.value.trim().toUpperCase();
      const documento = formCliente.documento.value.trim();
      const establecimiento = formCliente.establecimiento.value.trim().toUpperCase();
      const localidad = formCliente.localidad.value.trim().toUpperCase();
      const departamento = formCliente.departamento.value.trim().toUpperCase();
      const provincia = formCliente.provincia.value.trim();
      const vacunadorId = formCliente.vacunadorId ? formCliente.vacunadorId.value : "";
      if (!renspa || !nombre) {
        alert("Completá N° de RENSPA/UP y Nombre.");
        return;
      }
      const patronRenspa = /^[0-9]{2}\.[0-9]{3}\.[0-9]\.[0-9]{5}\/[0-9]{2}$/;
      if (!patronRenspa.test(renspa)) {
        alert("El RENSPA debe tener el formato dd.ddd.d.ddddd/yy");
        return;
      }
      ultimaProvinciaCliente = provincia;
      if (clienteEditandoId) {
        const existente = clientes.find((c) => c.id === clienteEditandoId);
        if (existente) {
          existente.renspa = renspa;
          existente.nombre = nombre;
          existente.documento = documento;
          existente.establecimiento = establecimiento;
          existente.localidad = localidad;
          existente.departamento = departamento;
          existente.provincia = provincia;
          existente.vacunadorId = parseInt(vacunadorId) || "";
        }
        clienteEditandoId = null;
      } else {
        const nuevo = {
          id: Date.now(),
          renspa,
          nombre,
          documento,
          establecimiento,
          localidad,
          departamento,
          provincia,
          vacunadorId: parseInt(vacunadorId) || "",
        };
        clientes.push(nuevo);
      }
      guardarClientes();
      filtrosClientes.renspa = "";
      filtrosClientes.nombre = "";
      filtrosClientes.documento = "";
      filtrosClientes.localidad = "";
      filtrosClientes.departamento = "";
      filtrosClientes.provincia = "";
      const idsCli = [
        "filtro-cli-renspa",
        "filtro-cli-nombre",
        "filtro-cli-documento",
        "filtro-cli-localidad",
        "filtro-cli-departamento",
        "filtro-cli-provincia",
      ];
      idsCli.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      formCliente.reset();
      formCliente.dataset.clearedOnce = "0";
      renderClientes();
      aplicarValoresPorDefectoCliente();
    });

    const btnImportarCsv = document.getElementById("btn-importar-clientes-csv");
    const inputImportarCsv = document.getElementById("input-importar-clientes-csv");
    if (btnImportarCsv && inputImportarCsv) {
      btnImportarCsv.addEventListener("click", () => inputImportarCsv.click());
      inputImportarCsv.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          importarClientesCSV(file);
        }
        inputImportarCsv.value = "";
      });
    }
  }
  const formVacunador = document.getElementById("form-vacunador");
  if (formVacunador) {
    formVacunador.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = formVacunador.nombre.value.trim();
      const documento = formVacunador.documento.value.trim();
      const localidad = formVacunador.localidad.value.trim();
      const departamento = formVacunador.departamento.value.trim();
      const condicionIva = formVacunador.condicionIva.value;
      if (!nombre) {
        alert("Completá el nombre del vacunador.");
        return;
      }
      const idExistenteAttr = formVacunador.getAttribute("data-edit-id");
      if (idExistenteAttr) {
        const idExistente = Number(idExistenteAttr);
        const existente = vacunadores.find((v) => v.id === idExistente);
        if (existente) {
          existente.nombre = nombre;
          existente.documento = documento;
          existente.localidad = localidad;
          existente.departamento = departamento;
          existente.condicionIva = condicionIva;
        }
      } else {
        const nuevo = {
          id: Date.now(),
          nombre,
          documento,
          localidad,
          departamento,
          condicionIva,
        };
        vacunadores.push(nuevo);
      }
      formVacunador.removeAttribute("data-edit-id");
      guardarVacunadores();
      formVacunador.reset();
      renderVacunadores();
    });
  }
  const tbodyVac = document.getElementById("tbody-vacunadores");
  if (tbodyVac) {
    tbodyVac.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const vac = vacunadores.find((v) => v.id === id);
      if (!vac) return;
      if (boton.dataset.action === "edit-vac") {
        const form = document.getElementById("form-vacunador");
        if (!form) return;
        form.nombre.value = vac.nombre || "";
        form.documento.value = vac.documento || "";
        form.localidad.value = vac.localidad || "";
        form.departamento.value = vac.departamento || "";
        form.condicionIva.value = vac.condicionIva || "";
        form.setAttribute("data-edit-id", String(id));
        return;
      }
      if (boton.dataset.action === "delete-vac") {
        if (!confirm("¿Eliminar este vacunador?")) return;
        vacunadores = vacunadores.filter((v) => v.id !== id);
        const form = document.getElementById("form-vacunador");
        if (form && form.getAttribute("data-edit-id") === String(id)) {
          form.reset();
          form.removeAttribute("data-edit-id");
        }
        guardarVacunadores();
        renderVacunadores();
      }
    });
  }
  const tbodyCli = document.getElementById("tbody-clientes");
  if (tbodyCli) {
    tbodyCli.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const cli = clientes.find((c) => c.id === id);
      if (!cli) return;
      if (boton.dataset.action === "view-cli") {
        const form = document.getElementById("form-cliente");
        if (!form) return;
        form.renspa.value = cli.renspa || "";
        form.nombre.value = (cli.nombre || "").toUpperCase();
        form.documento.value = cli.documento || "";
        form.establecimiento.value = (cli.establecimiento || "").toUpperCase();
        formCliente.localidad.value = (cli.localidad || "").toUpperCase();
        formCliente.departamento.value = (cli.departamento || "").toUpperCase();
        formCliente.provincia.value = cli.provincia || "";
        if (formCliente.vacunadorId) formCliente.vacunadorId.value = cli.vacunadorId || "";
        clienteEditandoId = null;
        return;
      }
      if (boton.dataset.action === "edit-cli") {
        const form = document.getElementById("form-cliente");
        if (!form) return;
        form.renspa.value = cli.renspa || "";
        form.nombre.value = (cli.nombre || "").toUpperCase();
        form.documento.value = cli.documento || "";
        form.establecimiento.value = (cli.establecimiento || "").toUpperCase();
        formCliente.localidad.value = (cli.localidad || "").toUpperCase();
        formCliente.departamento.value = (cli.departamento || "").toUpperCase();
        formCliente.provincia.value = cli.provincia || "";
        if (formCliente.vacunadorId) formCliente.vacunadorId.value = cli.vacunadorId || "";
        clienteEditandoId = id;
        return;
      }
      if (boton.dataset.action === "delete-cli") {
        if (!confirm("¿Eliminar este cliente?")) return;
        clientes = clientes.filter((c) => c.id !== id);
        if (clienteEditandoId === id) {
          clienteEditandoId = null;
        }
        guardarClientes();
        renderClientes();
        aplicarValoresPorDefectoCliente();
      }
    });
  }
  const tbodyProv = document.getElementById("tbody-proveedores");
  if (tbodyProv) {
    tbodyProv.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      if (boton && boton.dataset.action === "edit-prov") {
        const prov = proveedores.find((p) => p.id === id);
        const form = document.getElementById("form-proveedor");
        if (prov && form) {
          form.razonSocial.value = prov.razonSocial || "";
          form.direccion.value = prov.direccion || "";
          if (form.cuit) form.cuit.value = prov.cuit || "";
          form.tipoInscripcion.value = prov.tipoInscripcion || "";
          proveedorEditandoId = id;

          const btnSubmit = document.getElementById("btn-submit-proveedor");
          if (btnSubmit) btnSubmit.textContent = "Actualizar proveedor";

          const btnCancel = document.getElementById("btn-cancelar-edicion-prov");
          if (btnCancel) {
            btnCancel.classList.remove("hidden");
            btnCancel.onclick = () => {
              form.reset();
              proveedorEditandoId = null;
              if (btnSubmit) btnSubmit.textContent = "Guardar proveedor";
              btnCancel.classList.add("hidden");
              renderProveedores(); // quitamos seleccion visual
            };
          }

          seleccionarProveedor(id);
        }
        return;
      }
      if (boton && boton.dataset.action === "delete-prov") {
        if (!confirm("¿Eliminar este proveedor y sus movimientos?")) return;
        proveedores = proveedores.filter((p) => p.id !== id);
        movimientos = movimientos.filter((m) => m.proveedorId !== id);
        if (proveedorSeleccionadoId === id) {
          proveedorSeleccionadoId = null;
        }
        guardarProveedores();
        guardarMovimientos();
        renderProveedores();
        renderResumenYMovimientos();
        return;
      }
      seleccionarProveedor(id);
    });
  }
  const formCompra = document.getElementById("form-compra");
  if (formCompra) {
    const calcFrascosCompra = () => {
      const c = Number(formCompra.cantidadDosis.value) || 0;
      const d = Number(formCompra.dosisPorFrasco.value) || 125;
      if (formCompra.frascos) formCompra.frascos.value = d > 0 ? Math.ceil(c / d) : 0;
    };
    if (formCompra.cantidadDosis) formCompra.cantidadDosis.addEventListener("input", calcFrascosCompra);
    if (formCompra.dosisPorFrasco) formCompra.dosisPorFrasco.addEventListener("input", calcFrascosCompra);


    const btnAddLote = document.getElementById("btn-compra-agregar-lote");
    if (btnAddLote) {
      btnAddLote.addEventListener("click", () => {
        const serie = document.getElementById("compra-lote-serie").value.trim();
        const venc = document.getElementById("compra-lote-venc").value;
        const cant = Number(document.getElementById("compra-lote-cant").value) || 0;

        if (!serie || cant <= 0) {
          alert("Ingresá serie y cantidad válida para el lote.");
          return;
        }

        lotesCompraTemporales.push({ serie, fechaVencimiento: venc, cantidad: cant });

        // Actualizar total de dosis si el campo cantidad está vacío o se quiere sincronizar
        const currentCant = Number(inputCantC.value) || 0;
        const totalLotes = lotesCompraTemporales.reduce((acc, l) => acc + l.cantidad, 0);
        if (totalLotes > currentCant) {
          inputCantC.value = totalLotes;
          inputCantC.dispatchEvent(new Event("input"));
        }

        renderLotesCompraTemporales();

        // Limpiar sub-campos
        document.getElementById("compra-lote-serie").value = "";
        document.getElementById("compra-lote-venc").value = "";
        document.getElementById("compra-lote-cant").value = "";
      });
    }

    formCompra.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!proveedorSeleccionadoId) {
        alert("Primero seleccioná un proveedor.");
        return;
      }
      const fecha = formCompra.fecha.value;
      const factura = formCompra.factura.value.trim();
      const vacuna = formCompra.vacuna.value.trim().toUpperCase();
      const marca = formCompra.marca.value.trim();
      const serie = formCompra.serie.value.trim();
      const fechaVencimiento = formCompra.fechaVencimiento.value || "";
      const comprador = formCompra.comprador.value.trim();
      const cantidad = Number(formCompra.cantidadDosis.value);
      const dosisPorFrasco = Number(formCompra.dosisPorFrasco.value) || 125;
      const frascos = Math.ceil(cantidad / dosisPorFrasco) || 0;
      const precioDosis = null;
      const importeFactura = null;

      if (!fecha || !factura || !vacuna || !cantidad || cantidad <= 0) {
        alert("Completá fecha, factura, vacuna y cantidad de dosis.");
        return;
      }

      const lotes = lotesCompraTemporales.length > 0 ? lotesCompraTemporales.slice() : null;

      if (movimientoEditandoId && movimientoEditandoTipo === "compra") {
        const movExistente = movimientos.find((m) => m.id === movimientoEditandoId);
        if (movExistente) {
          movExistente.fecha = fecha;
          movExistente.factura = factura;
          movExistente.vacuna = vacuna;
          movExistente.marca = marca;
          movExistente.serie = serie;
          movExistente.fechaVencimiento = fechaVencimiento;
          movExistente.comprador = comprador;
          movExistente.cantidadDosis = cantidad;
          movExistente.dosisPorFrasco = dosisPorFrasco;
          movExistente.frascos = frascos;
          movExistente.lotes = lotes;
        }
        movimientoEditandoId = null;
        movimientoEditandoTipo = null;
        const btnS = document.getElementById("btn-submit-compra");
        if (btnS) btnS.textContent = "Registrar compra";
      } else {
        const mov = {
          id: Date.now(),
          proveedorId: proveedorSeleccionadoId,
          tipo: "compra",
          fecha,
          factura,
          vacuna,
          marca,
          serie,
          fechaVencimiento,
          comprador,
          precioDosis,
          importeFactura,
          cantidadDosis: cantidad,
          dosisPorFrasco: dosisPorFrasco,
          frascos: frascos,
          lotes,
          creadoEn: Date.now(),
        };
        movimientos.push(mov);
      }
      guardarMovimientos();
      lotesCompraTemporales = [];
      renderLotesCompraTemporales();
      formCompra.reset();
      renderProveedores();
      renderResumenYMovimientos();
      renderResumenGlobalVacunas();
      alert("Compra registrada.");
    });
  }
  const formEntrega = document.getElementById("form-entrega");
  if (formEntrega) {
    const calcFrascosEntrega = () => {
      const c = Number(formEntrega.cantidadDosis.value) || 0;
      const d = Number(formEntrega.dosisPorFrasco.value) || 125;
      if (formEntrega.frascos) formEntrega.frascos.value = d > 0 ? Math.ceil(c / d) : 0;
    };
    if (formEntrega.cantidadDosis) formEntrega.cantidadDosis.addEventListener("input", calcFrascosEntrega);
    if (formEntrega.dosisPorFrasco) formEntrega.dosisPorFrasco.addEventListener("input", calcFrascosEntrega);

    formEntrega.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!proveedorSeleccionadoId) {
        alert("Primero seleccioná un proveedor.");
        return;
      }
      const fecha = formEntrega.fecha.value;
      const vacuna = formEntrega.vacuna.value.trim().toUpperCase();
      const receptor = formEntrega.receptor.value.trim();
      const marca = formEntrega.marca.value.trim();
      const serie = formEntrega.serie.value.trim();
      const remito = formEntrega.remito.value.trim();
      const fechaVencimiento = formEntrega.fechaVencimiento.value || "";
      const cantidad = Number(formEntrega.cantidadDosis.value);
      const dosisPorFrasco = Number(formEntrega.dosisPorFrasco.value) || 125;
      const frascos = Math.ceil(cantidad / dosisPorFrasco) || 0;
      if (!fecha || !vacuna || !receptor || !cantidad || cantidad <= 0) {
        alert("Completá fecha, vacuna, nombre del receptor y cantidad de dosis.");
        return;
      }
      if (movimientoEditandoId && movimientoEditandoTipo === "entrega") {
        const movExistente = movimientos.find((m) => m.id === movimientoEditandoId);
        if (movExistente) {
          movExistente.fecha = fecha;
          movExistente.vacuna = vacuna;
          movExistente.marca = marca;
          movExistente.serie = serie;
          movExistente.remito = remito;
          movExistente.fechaVencimiento = fechaVencimiento;
          movExistente.receptor = receptor;
          movExistente.cantidadDosis = cantidad;
        }
        movimientoEditandoId = null;
        movimientoEditandoTipo = null;
      } else {
        const mov = {
          id: Date.now(),
          proveedorId: proveedorSeleccionadoId,
          tipo: "entrega",
          fecha,
          factura: "",
          vacuna,
          marca,
          serie,
          remito,
          fechaVencimiento,
          receptor,
          cantidadDosis: cantidad,
          creadoEn: Date.now(),
        };
        movimientos.push(mov);
      }
      guardarMovimientos();
      formEntrega.reset();
      renderProveedores();
      renderResumenYMovimientos();
    });
  }
  const tbodyMov = document.querySelector("#tabla-movimientos tbody");
  if (tbodyMov) {
    tbodyMov.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const mov = movimientos.find((m) => m.id === id);
      if (!mov) return;
      if (boton.dataset.action === "delete-mov") {
        if (!confirm("¿Confirmás eliminar este movimiento?")) return;
        movimientos = movimientos.filter((m) => m.id !== id);
        guardarMovimientos();
        renderProveedores();
        renderResumenYMovimientos();
        renderHistorial();
        return;
      }
      if (boton.dataset.action === "edit-mov") {
        if (!confirm("¿Confirmás editar este movimiento?")) return;
        if (mov.tipo === "compra") {
          const form = document.getElementById("form-compra");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.factura.value = mov.factura || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.comprador.value = mov.comprador || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            form.precioDosis.value = mov.precioDosis != null ? mov.precioDosis : "";
            form.importeFactura.value = mov.importeFactura != null ? mov.importeFactura : "";
            movimientoEditandoId = id;
            movimientoEditandoTipo = "compra";
            seleccionarProveedor(mov.proveedorId);
          }
        } else {
          const form = document.getElementById("form-entrega");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.remito.value = mov.remito || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.receptor.value = mov.receptor || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            movimientoEditandoId = id;
            movimientoEditandoTipo = "entrega";
            seleccionarProveedor(mov.proveedorId);
          }
        }
      }
    });
  }
  const tbodyHist = document.querySelector("#tabla-historial tbody");
  if (tbodyHist) {
    tbodyHist.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const mov = movimientos.find((m) => m.id === id);
      if (!mov) return;
      if (boton.dataset.action === "delete-mov") {
        if (!confirm("¿Confirmás eliminar este movimiento?")) return;
        movimientos = movimientos.filter((m) => m.id !== id);
        guardarMovimientos();
        renderProveedores();
        renderResumenYMovimientos();
        renderHistorial();
        return;
      }
      if (boton.dataset.action === "edit-mov") {
        if (!confirm("¿Confirmás editar este movimiento?")) return;
        if (mov.tipo === "compra") {
          const form = document.getElementById("form-compra");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.factura.value = mov.factura || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.comprador.value = mov.comprador || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            if (form.dosisPorFrasco) form.dosisPorFrasco.value = mov.dosisPorFrasco || 125;
            if (form.frascos) form.frascos.value = mov.frascos || 0;
            form.precioDosis.value = mov.precioDosis != null ? mov.precioDosis : "";
            form.importeFactura.value = mov.importeFactura != null ? mov.importeFactura : "";
            movimientoEditandoId = id;
            movimientoEditandoTipo = "compra";
            seleccionarProveedor(mov.proveedorId);
          }
        } else {
          const form = document.getElementById("form-entrega");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.remito.value = mov.remito || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.receptor.value = mov.receptor || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            if (form.dosisPorFrasco) form.dosisPorFrasco.value = mov.dosisPorFrasco || 125;
            if (form.frascos) form.frascos.value = mov.frascos || 0;
            movimientoEditandoId = id;
            movimientoEditandoTipo = "entrega";
            seleccionarProveedor(mov.proveedorId);
          }
        }
      }
    });
  }
  const tbodyCobros = document.getElementById("tbody-cobros");
  if (tbodyCobros) {
    tbodyCobros.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const item = cobros.find((c) => c.id === id);
      if (!item) return;
      if (boton.dataset.action === "delete-cobro") {
        handleEliminarCobro(id);
        return;
      }
      if (boton.dataset.action === "edit-cobro") {
        handleEditarCobro(id);
      }
    });
  }
  const tbodyActasPend = document.getElementById("tbody-actas-pendientes");
  if (tbodyActasPend) {
    tbodyActasPend.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.acta) return;
      const acta = tr.dataset.acta;
      if (boton.dataset.action === "cargar-cobro-acta") {
        const inputActaCobro = document.getElementById("cobro-acta");
        if (inputActaCobro) {
          inputActaCobro.value = acta;
          inputActaCobro.dispatchEvent(new Event("blur"));
        }
        const secCobro = document.querySelector(
          '.nav-button[data-section="cobro"]'
        );
        if (secCobro) {
          secCobro.click();
        }
        return;
      }
      if (boton.dataset.action === "omitir-acta-pendiente") {
        if (
          !confirm(
            "¿Sacar esta acta de la lista de pendientes sin registrar cobro?"
          )
        ) {
          return;
        }
        const actaStr = String(acta || "").trim();
        if (actaStr && !actasOmitidas.includes(actaStr)) {
          actasOmitidas.push(actaStr);
          guardarActasOmitidas();
        }
        return;
      }
    });
  }
  const panelAgg = document.getElementById("panel-vacunas-der");
  if (panelAgg) {
    panelAgg.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.action === "vac-rename" || btn.dataset.action === "vac-delete") {
        const vac = btn.getAttribute("data-vac") || "";
        if (!vac) return;
        if (btn.dataset.action === "vac-rename") {
          const nuevo = prompt("Nuevo nombre para el tipo de vacuna:", vac);
          if (!nuevo || nuevo.trim() === "" || nuevo === vac) return;
          const nombreNuevo = nuevo.trim();
          movimientos.forEach((m) => {
            if (m.vacuna === vac) m.vacuna = nombreNuevo;
          });
          guardarMovimientos();
          renderResumenYMovimientos();
          renderHistorial();
          renderResumenGlobalVacunas();
        } else if (btn.dataset.action === "vac-delete") {
          if (!confirm("¿Eliminar todos los movimientos de este tipo de vacuna?")) return;
          movimientos = movimientos.filter((m) => m.vacuna !== vac);
          guardarMovimientos();
          renderProveedores();
          renderResumenYMovimientos();
          renderHistorial();
          renderResumenGlobalVacunas();
        }
        return;
      }
      const tr = e.target.closest("tr");
      if (!tr) return;
      const provId = Number(tr.getAttribute("data-prov"));
      const vac = tr.getAttribute("data-vac") || "";
      if (!provId || !vac) return;
      if (btn.dataset.action === "agg-ver") {
        seleccionarProveedor(provId);
        const filtroVac = document.getElementById("filtro-vacuna");
        if (filtroVac) filtroVac.value = vac;
        filtros.vacuna = vac;
        renderResumenYMovimientos();
        return;
      }
      if (btn.dataset.action === "agg-edit") {
        const cand = movimientos
          .filter((m) => m.proveedorId === provId && m.vacuna === vac)
          .slice()
          .sort((a, b) => (a.fecha === b.fecha ? b.creadoEn - a.creadoEn : a.fecha < b.fecha ? 1 : -1));
        if (!cand.length) return;
        const mov = cand[0];
        if (!confirm("¿Confirmás editar el último movimiento de este laboratorio y vacuna?")) return;
        if (mov.tipo === "compra") {
          const form = document.getElementById("form-compra");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.factura.value = mov.factura || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.comprador.value = mov.comprador || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            form.precioDosis.value = mov.precioDosis != null ? mov.precioDosis : "";
            form.importeFactura.value = mov.importeFactura != null ? mov.importeFactura : "";
            movimientoEditandoId = mov.id;
            movimientoEditandoTipo = "compra";
            seleccionarProveedor(mov.proveedorId);
          }
        } else {
          const form = document.getElementById("form-entrega");
          if (form) {
            form.fecha.value = mov.fecha || "";
            form.vacuna.value = mov.vacuna || "";
            form.marca.value = mov.marca || "";
            form.serie.value = mov.serie || "";
            form.remito.value = mov.remito || "";
            form.fechaVencimiento.value = mov.fechaVencimiento || "";
            form.receptor.value = mov.receptor || "";
            form.cantidadDosis.value = mov.cantidadDosis || "";
            movimientoEditandoId = mov.id;
            movimientoEditandoTipo = "entrega";
            seleccionarProveedor(mov.proveedorId);
          }
        }
        return;
      }
      if (btn.dataset.action === "agg-delete") {
        const cand = movimientos
          .filter((m) => m.proveedorId === provId && m.vacuna === vac)
          .slice()
          .sort((a, b) => (a.fecha === b.fecha ? b.creadoEn - a.creadoEn : a.fecha < b.fecha ? 1 : -1));
        if (!cand.length) return;
        const mov = cand[0];
        if (!confirm("¿Confirmás eliminar el último movimiento de este laboratorio y vacuna?")) return;
        movimientos = movimientos.filter((m) => m.id !== mov.id);
        guardarMovimientos();
        renderProveedores();
        renderResumenYMovimientos();
        renderHistorial();
        renderResumenGlobalVacunas();
      }
    });
  }
  const serieInput = document.getElementById("entrega-serie");
  const marcaInput = document.getElementById("entrega-marca");
  const fechaVencInput = document.getElementById("entrega-fecha-venc");
  function autocompletarVencimiento() {
    const serie = (serieInput && serieInput.value.trim()) || "";
    const marca = (marcaInput && marcaInput.value.trim()) || "";
    if (!serie) return;
    const candidatos = movimientos
      .filter((m) => m.tipo === "compra")
      .filter((m) => {
        if ((m.serie || "").trim() !== serie) return false;
        if (marca && (m.marca || "").trim() !== marca) return false;
        return true;
      })
      .slice()
      .sort((a, b) => b.creadoEn - a.creadoEn);
    if (candidatos.length && fechaVencInput) {
      const venc = candidatos[0].fechaVencimiento || "";
      if (venc) {
        fechaVencInput.value = venc;
      }
    }
  }
  if (serieInput) {
    serieInput.addEventListener("blur", autocompletarVencimiento);
    serieInput.addEventListener("change", autocompletarVencimiento);
  }
  if (marcaInput) {
    marcaInput.addEventListener("blur", autocompletarVencimiento);
    marcaInput.addEventListener("change", autocompletarVencimiento);
  }
  const filtroProveedor = document.getElementById("filtro-proveedor");
  if (filtroProveedor) {
    filtroProveedor.addEventListener("change", (e) => {
      const valor = e.target.value;
      proveedorSeleccionadoId = valor ? Number(valor) : null;
      renderProveedores();
      renderResumenYMovimientos();
    });
  }
  const filtroFechaDesde = document.getElementById("filtro-fecha-desde");
  if (filtroFechaDesde) {
    filtroFechaDesde.addEventListener("change", (e) => {
      filtros.fechaDesde = e.target.value || "";
      renderResumenYMovimientos();
    });
  }
  const filtroFechaHasta = document.getElementById("filtro-fecha-hasta");
  if (filtroFechaHasta) {
    filtroFechaHasta.addEventListener("change", (e) => {
      filtros.fechaHasta = e.target.value || "";
      renderResumenYMovimientos();
    });
  }
  const filtroVacuna = document.getElementById("filtro-vacuna");
  if (filtroVacuna) {
    filtroVacuna.addEventListener("input", (e) => {
      filtros.vacuna = e.target.value || "";
      renderResumenYMovimientos();
    });
  }
  const filtroTipoMov = document.getElementById("filtro-tipo-mov");
  if (filtroTipoMov) {
    filtroTipoMov.addEventListener("change", (e) => {
      filtros.tipo = e.target.value || "";
      renderResumenYMovimientos();
    });
  }
  const filtroComprobante = document.getElementById("filtro-comprobante");
  if (filtroComprobante) {
    filtroComprobante.addEventListener("input", (e) => {
      filtros.comprobante = e.target.value || "";
      renderResumenYMovimientos();
    });
  }
  const filtroPrecioMin = document.getElementById("filtro-precio-min");
  if (filtroPrecioMin) {
    filtroPrecioMin.addEventListener("input", (e) => {
      const val = e.target.value;
      filtros.precioMin = val !== "" ? Number(val) : "";
      renderResumenYMovimientos();
    });
  }
  const filtroPrecioMax = document.getElementById("filtro-precio-max");
  if (filtroPrecioMax) {
    filtroPrecioMax.addEventListener("input", (e) => {
      const val = e.target.value;
      filtros.precioMax = val !== "" ? Number(val) : "";
      renderResumenYMovimientos();
    });
  }
  const filtroImporteMin = document.getElementById("filtro-importe-min");
  if (filtroImporteMin) {
    filtroImporteMin.addEventListener("input", (e) => {
      const val = e.target.value;
      filtros.importeMin = val !== "" ? Number(val) : "";
      renderResumenYMovimientos();
    });
  }
  const filtroImporteMax = document.getElementById("filtro-importe-max");
  if (filtroImporteMax) {
    filtroImporteMax.addEventListener("input", (e) => {
      const val = e.target.value;
      filtros.importeMax = val !== "" ? Number(val) : "";
      renderResumenYMovimientos();
    });
  }
  const btnAplicarFiltros = document.getElementById("btn-aplicar-filtros");
  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener("click", () => {
      const fp = document.getElementById("filtro-proveedor");
      proveedorSeleccionadoId = fp && fp.value ? Number(fp.value) : proveedorSeleccionadoId;
      const fd = document.getElementById("filtro-fecha-desde");
      const fh = document.getElementById("filtro-fecha-hasta");
      const fv = document.getElementById("filtro-vacuna");
      const ft = document.getElementById("filtro-tipo-mov");
      const fc = document.getElementById("filtro-comprobante");
      const fpm = document.getElementById("filtro-precio-min");
      const fpx = document.getElementById("filtro-precio-max");
      const fim = document.getElementById("filtro-importe-min");
      const fix = document.getElementById("filtro-importe-max");
      filtros.fechaDesde = fd && fd.value ? fd.value : "";
      filtros.fechaHasta = fh && fh.value ? fh.value : "";
      filtros.vacuna = fv && fv.value ? fv.value : "";
      filtros.tipo = ft && ft.value ? ft.value : "";
      filtros.comprobante = fc && fc.value ? fc.value : "";
      filtros.precioMin = fpm && fpm.value !== "" ? Number(fpm.value) : "";
      filtros.precioMax = fpx && fpx.value !== "" ? Number(fpx.value) : "";
      filtros.importeMin = fim && fim.value !== "" ? Number(fim.value) : "";
      filtros.importeMax = fix && fix.value !== "" ? Number(fix.value) : "";
      renderResumenYMovimientos();
    });
  }
  const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener("click", () => {
      filtros.fechaDesde = "";
      filtros.fechaHasta = "";
      filtros.vacuna = "";
      filtros.tipo = "";
      filtros.comprobante = "";
      filtros.precioMin = "";
      filtros.precioMax = "";
      filtros.importeMin = "";
      filtros.importeMax = "";
      const ids = [
        "filtro-fecha-desde",
        "filtro-fecha-hasta",
        "filtro-vacuna",
        "filtro-tipo-mov",
        "filtro-comprobante",
        "filtro-precio-min",
        "filtro-precio-max",
        "filtro-importe-min",
        "filtro-importe-max",
      ];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === "SELECT") {
          el.value = "";
        } else {
          el.value = "";
        }
      });
      renderResumenYMovimientos();
    });
  }

  const inputFiltroCliRenspa = document.getElementById("filtro-cli-renspa");
  if (inputFiltroCliRenspa) {
    inputFiltroCliRenspa.addEventListener("input", (e) => {
      if (e.inputType === "insertReplacementText") return;
      const val = inputFiltroCliRenspa.value;
      const formatted = formatearRenspa(val);
      if (val !== formatted) {
        inputFiltroCliRenspa.value = formatted;
      }
    });
  }

  const btnAplicarFiltrosCli = document.getElementById("btn-aplicar-filtros-cli");
  if (btnAplicarFiltrosCli) {
    btnAplicarFiltrosCli.addEventListener("click", () => {
      const fr = document.getElementById("filtro-cli-renspa");
      const fn = document.getElementById("filtro-cli-nombre");
      const fd = document.getElementById("filtro-cli-documento");
      const fl = document.getElementById("filtro-cli-localidad");
      const fdep = document.getElementById("filtro-cli-departamento");
      const fpv = document.getElementById("filtro-cli-provincia");
      filtrosClientes.renspa = fr && fr.value ? fr.value.trim() : "";
      filtrosClientes.nombre = fn && fn.value ? fn.value.trim() : "";
      filtrosClientes.documento = fd && fd.value ? fd.value.trim() : "";
      filtrosClientes.localidad = fl && fl.value ? fl.value.trim() : "";
      filtrosClientes.departamento = fdep && fdep.value ? fdep.value.trim() : "";
      filtrosClientes.provincia = fpv && fpv.value ? fpv.value.trim() : "";
      renderClientes();
    });
  }
  const btnLimpiarFiltrosCli = document.getElementById("btn-limpiar-filtros-cli");
  if (btnLimpiarFiltrosCli) {
    btnLimpiarFiltrosCli.addEventListener("click", () => {
      filtrosClientes.renspa = "";
      filtrosClientes.nombre = "";
      filtrosClientes.documento = "";
      filtrosClientes.localidad = "";
      filtrosClientes.departamento = "";
      filtrosClientes.provincia = "";
      const idsCli = [
        "filtro-cli-renspa",
        "filtro-cli-nombre",
        "filtro-cli-documento",
        "filtro-cli-localidad",
        "filtro-cli-departamento",
        "filtro-cli-provincia",
      ];
      idsCli.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      renderClientes();
    });
  }
  const formPrecios = document.getElementById("form-precio-vacuna");
  if (formPrecios) {
    const selTipo = document.getElementById("tipo-precio-vacuna");
    if (selTipo) {
      selTipo.addEventListener("change", () => {
        tipoPrecioActual =
          selTipo.value === "brucelosis" ? "brucelosis" : "aftosa";
        renderPrecios();
      });
    }
    const inputPrecioTer = document.getElementById("precio-ternero");
    if (inputPrecioTer) {
      const handler = () => {
        precioTernero = parseNumeroLocal(inputPrecioTer.value);
        localStorage.setItem(STORAGE_PRECIO_TERNERO, String(precioTernero || 0));
        renderPrecios();
      };
      inputPrecioTer.addEventListener("input", handler);
      inputPrecioTer.addEventListener("change", handler);
    }
    formPrecios.addEventListener("submit", (e) => {
      e.preventDefault();
      const p =
        tipoPrecioActual === "brucelosis" ? preciosBrucelosis : preciosAftosa;
      p.precioProducto = parseNumeroLocal(formPrecios.precioProducto.value);
      p.costoOperativo = parseNumeroLocal(formPrecios.costoOperativo.value);
      p.costoCoordinacion = parseNumeroLocal(
        formPrecios.costoCoordinacion.value
      );
      p.manoObraOrganizado = parseNumeroLocal(
        formPrecios.manoObraOrganizado.value
      );
      p.manoObraAbierto = parseNumeroLocal(
        formPrecios.manoObraAbierto.value
      );
      p.movilidadPorKm = parseNumeroLocal(formPrecios.movilidadPorKm.value);
      guardarPrecios();
      renderPrecios();
    });
  }
  const btnHistorialPrecios = document.getElementById(
    "btn-guardar-historial-precios"
  );
  if (btnHistorialPrecios) {
    btnHistorialPrecios.addEventListener("click", () => {
      const inputFecha = document.getElementById("historial-fecha");
      if (!inputFecha) return;
      const fecha = inputFecha.value;
      if (!fecha) {
        alert("Seleccioná una fecha para el historial de precios.");
        return;
      }
      const aft = {
        precioProducto: preciosAftosa.precioProducto,
        costoOperativo: preciosAftosa.costoOperativo,
        costoCoordinacion: preciosAftosa.costoCoordinacion,
        manoObraOrganizado: preciosAftosa.manoObraOrganizado,
        manoObraAbierto: preciosAftosa.manoObraAbierto,
        movilidadPorKm: preciosAftosa.movilidadPorKm,
      };
      const bru = {
        precioProducto: preciosBrucelosis.precioProducto,
        costoOperativo: preciosBrucelosis.costoOperativo,
        costoCoordinacion: preciosBrucelosis.costoCoordinacion,
        manoObraOrganizado: preciosBrucelosis.manoObraOrganizado,
        manoObraAbierto: preciosBrucelosis.manoObraAbierto,
        movilidadPorKm: preciosBrucelosis.movilidadPorKm,
      };
      if (historialEditandoId) {
        const existente = preciosHistorial.find(
          (h) => h.id === historialEditandoId
        );
        if (existente) {
          existente.fecha = fecha;
          existente.aftosa = aft;
          existente.brucelosis = bru;
        }
        historialEditandoId = null;
      } else {
        const nuevo = {
          id: Date.now(),
          fecha,
          aftosa: aft,
          brucelosis: bru,
          creadoEn: Date.now(),
        };
        preciosHistorial.push(nuevo);
      }
      guardarPreciosHistorial();
      renderHistorialPrecios();
      inputFecha.value = "";
    });
    const inputFiltroDesde = document.getElementById("filtro-historial-desde");
    const inputFiltroHasta = document.getElementById("filtro-historial-hasta");
    const handlerFiltroHist = () => {
      renderHistorialPrecios();
    };
    if (inputFiltroDesde) {
      inputFiltroDesde.addEventListener("change", handlerFiltroHist);
    }
    if (inputFiltroHasta) {
      inputFiltroHasta.addEventListener("change", handlerFiltroHist);
    }
  }
  const formVacunacion = document.getElementById("form-vacunacion");
  if (formVacunacion) {
    const camposAftosa = [
      "aft-vacas",
      "aft-toros",
      "aft-vaquillonas",
      "aft-novillos",
      "aft-novillitos",
      "aft-toritos",
      "aft-terneras",
      "aft-terneros",
    ];
    const inputTotal = document.getElementById("aft-total");
    const recalcularTotal = () => {
      let suma = 0;
      camposAftosa.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const v = Number(el.value) || 0;
        suma += v;
      });
      if (inputTotal) {
        inputTotal.value = suma;
      }
      recalcularImportesVacunacion();
    };
    camposAftosa.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", recalcularTotal);
        el.addEventListener("change", recalcularTotal);
      }
    });
    const inputRenspaVac = document.getElementById("vac-renspa");
    if (inputRenspaVac) {
      inputRenspaVac.addEventListener("input", (e) => {
        if (e.inputType === "insertReplacementText") return;
        const val = inputRenspaVac.value;
        const formatted = formatearRenspa(val);
        if (val !== formatted) {
          inputRenspaVac.value = formatted;
        }
      });
      inputRenspaVac.addEventListener("blur", () => {
        const r = inputRenspaVac.value.trim();
        if (!r) return;
        const cli = clientes.find((c) => (c.renspa || "") === r);
        const nom = document.getElementById("vac-nombre-cli");
        const est = document.getElementById("vac-establecimiento");
        const loc = document.getElementById("vac-localidad-cli");
        const dep = document.getElementById("vac-departamento-cli");
        if (cli) {
          if (nom) nom.value = toTitleCase(cli.nombre || "");
          if (est) est.value = toTitleCase(cli.establecimiento || "");
          if (loc) loc.value = toTitleCase(cli.localidad || "");
          if (dep) dep.value = toTitleCase(cli.departamento || "");
          const selVacunador = document.getElementById("vac-vacunador");
          if (selVacunador) selVacunador.value = cli.vacunadorId || "";
        } else {
          if (nom) nom.value = "";
          if (est) est.value = "";
          if (loc) loc.value = "";
          if (dep) dep.value = "";
          const selVacunador = document.getElementById("vac-vacunador");
          if (selVacunador) selVacunador.value = "";
        }
      });
    }
    const bruTernerasInput = document.getElementById("bru-terneras");
    if (bruTernerasInput) {
      const handlerBru = () => {
        recalcularImportesVacunacion();
      };
      bruTernerasInput.addEventListener("input", handlerBru);
      bruTernerasInput.addEventListener("change", handlerBru);
    }
    const selManoSiNo = document.getElementById("fact-mano-si-no");
    if (selManoSiNo) {
      selManoSiNo.addEventListener("change", () => {
        recalcularImportesVacunacion();
      });
    }
    const selTipoMano = document.getElementById("fact-mano-tipo");
    if (selTipoMano) {
      selTipoMano.addEventListener("change", () => {
        recalcularImportesVacunacion();
      });
    }
    const selMov = document.getElementById("fact-movilidad-si-no");
    const inputKm = document.getElementById("fact-movilidad-km");
    if (selMov) {
      selMov.addEventListener("change", () => {
        recalcularImportesVacunacion();
      });
    }
    if (inputKm) {
      const handlerKm = () => {
        recalcularImportesVacunacion();
      };
      inputKm.addEventListener("input", handlerKm);
      inputKm.addEventListener("change", handlerKm);
    }
    const selAftosaSiNo = document.getElementById("fact-aftosa-si-no");
    if (selAftosaSiNo) {
      selAftosaSiNo.addEventListener("change", () => recalcularImportesVacunacion());
    }
    const selBrucelosisSiNo = document.getElementById("fact-brucelosis-si-no");
    if (selBrucelosisSiNo) {
      selBrucelosisSiNo.addEventListener("change", () => recalcularImportesVacunacion());
    }
    formVacunacion.addEventListener("submit", (e) => {
      e.preventDefault();
      const selPeriodo = document.getElementById("vac-periodo");
      const selEstado = document.getElementById("vac-estado");
      const selTipo = document.getElementById("vac-tipo-vacunacion");
      const inputFecha = document.getElementById("vac-fecha");
      const inputAnio = document.getElementById("vac-anio");
      const inputActa = document.getElementById("vac-acta");
      const inputRenspa = document.getElementById("vac-renspa");
      const inputNom = document.getElementById("vac-nombre-cli");
      const inputEst = document.getElementById("vac-establecimiento");
      const inputLoc = document.getElementById("vac-localidad-cli");
      const inputDep = document.getElementById("vac-departamento-cli");
      const selVacunador = document.getElementById("vac-vacunador");
      const periodo = selPeriodo ? selPeriodo.value : "";
      const estado = selEstado ? selEstado.value : "vigente";
      const tipoVacunacion = selTipo ? selTipo.value : "";
      const fecha = inputFecha ? inputFecha.value : "";
      const anio = inputAnio ? inputAnio.value.trim() : "";
      const acta = inputActa ? inputActa.value.trim() : "";
      const renspa = inputRenspa ? inputRenspa.value.trim() : "";
      const nombreCli = inputNom ? inputNom.value.trim() : "";
      const establecimiento = inputEst ? inputEst.value.trim() : "";
      const localidadCli = inputLoc ? inputLoc.value.trim() : "";
      const departamentoCli = inputDep ? inputDep.value.trim() : "";
      const vacunadorId =
        selVacunador && selVacunador.value
          ? Number(selVacunador.value)
          : null;
      const factNroValue = (document.getElementById("fact-nro-factura") || {}).value || "";
      const factSigsaValue = (document.getElementById("fact-sigsa") || { value: "no" }).value || "no";

      if (vacunadorId) {
        const vac = vacunadores.find((v) => v.id === vacunadorId);
        if (vac) {
          vacunadorNombre = vac.nombre || "";
        }
      }
      if (!periodo || !tipoVacunacion || !fecha || !renspa) {
        alert("Completá período, tipo de vacunación, fecha y RENSPA.");
        return;
      }
      recalcularTotal();
      const aft = {
        vacas: Number((document.getElementById("aft-vacas") || {}).value) || 0,
        toros: Number((document.getElementById("aft-toros") || {}).value) || 0,
        vaquillonas:
          Number((document.getElementById("aft-vaquillonas") || {}).value) || 0,
        novillos:
          Number((document.getElementById("aft-novillos") || {}).value) || 0,
        novillitos:
          Number((document.getElementById("aft-novillitos") || {}).value) || 0,
        toritos:
          Number((document.getElementById("aft-toritos") || {}).value) || 0,
        terneras:
          Number((document.getElementById("aft-terneras") || {}).value) || 0,
        terneros:
          Number((document.getElementById("aft-terneros") || {}).value) || 0,
        total: Number((document.getElementById("aft-total") || {}).value) || 0,
        marca:
          (document.getElementById("aft-marca") || { value: "" }).value.trim() ||
          "",
        serie:
          (document.getElementById("aft-serie") || { value: "" }).value.trim() ||
          "",
      };
      const bru = {
        terneras:
          Number((document.getElementById("bru-terneras") || {}).value) || 0,
        marca:
          (document.getElementById("bru-marca") || { value: "" }).value.trim() ||
          "",
        serie:
          (document.getElementById("bru-serie") || { value: "" }).value.trim() ||
          "",
      };
      if (!aft.total && !bru.terneras) {
        alert("Cargá al menos una cantidad en aftosa o brucelosis.");
        return;
      }
      if (aft.marca || aft.serie) {
        const existeAft = movimientos.some((m) => {
          if (m.tipo !== "compra") return false;
          const marca = (m.marca || "").trim();
          const serie = (m.serie || "").trim();
          return (
            (!aft.marca || marca === aft.marca) &&
            (!aft.serie || serie === aft.serie)
          );
        });
        if (!existeAft) {
          alert("La marca y serie de aftosa no existen en compras de proveedores.");
          return;
        }
      }
      if (bru.marca || bru.serie) {
        const existeBru = movimientos.some((m) => {
          if (m.tipo !== "compra") return false;
          const marca = (m.marca || "").trim();
          const serie = (m.serie || "").trim();
          return (
            (!bru.marca || marca === bru.marca) &&
            (!bru.serie || serie === bru.serie)
          );
        });
        if (!existeBru) {
          alert(
            "La marca y serie de brucelosis no existen en compras de proveedores."
          );
          return;
        }
      }
      ultimoPeriodoVac = periodo;
      ultimoTipoVac = tipoVacunacion;
      ultimaFechaVac = fecha;
      ultimoAnioVac = anio;
      const selTipoMano = document.getElementById("fact-mano-tipo");
      const selManoSiNo = document.getElementById("fact-mano-si-no");
      const selMov = document.getElementById("fact-movilidad-si-no");
      const inputKm = document.getElementById("fact-movilidad-km");
      let manoObraTipo = "organizado";
      let manoObraIncluida = true;
      if (selTipoMano && selTipoMano.value) {
        manoObraTipo = selTipoMano.value;
      }
      const sinManoPorTipo = manoObraTipo === "sin";
      const sinManoPorBoton = selManoSiNo && selManoSiNo.value === "no";
      if (sinManoPorTipo || sinManoPorBoton) {
        manoObraIncluida = false;
      }
      const movilidadIncluida = selMov && selMov.value === "si";
      const movilidadKm =
        movilidadIncluida && inputKm && inputKm.value
          ? Number(inputKm.value) || 0
          : 0;
      if (vacunacionEditandoId) {
        const existente = vacunaciones.find(
          (v) => v.id === vacunacionEditandoId
        );
        if (existente) {
          existente.periodo = periodo;
          existente.estado = estado;
          existente.tipoVacunacion = tipoVacunacion;
          existente.fecha = fecha;
          existente.anio = anio;
          existente.acta = acta;
          existente.nroFactura = factNroValue;
          existente.sigsa = factSigsaValue;
          existente.renspa = renspa;
          existente.nombreCli = nombreCli;
          existente.establecimiento = establecimiento;
          existente.localidadCli = localidadCli;
          existente.departamentoCli = departamentoCli;
          existente.vacunadorId = vacunadorId;
          existente.vacunadorNombre = vacunadorNombre;
          existente.aftosa = aft;
          existente.brucelosis = bru;
          existente.manoObraTipo = manoObraTipo;
          existente.manoObraIncluida = manoObraIncluida;
          existente.movilidadIncluida = movilidadIncluida;
          existente.movilidadKm = movilidadKm;
        }
        vacunacionEditandoId = null;
      } else {
        const registro = {
          id: Date.now(),
          periodo,
          estado,
          tipoVacunacion,
          fecha,
          anio,
          acta,
          nroFactura: factNroValue,
          sigsa: factSigsaValue,
          renspa,
          nombreCli,
          establecimiento,
          localidadCli,
          departamentoCli,
          vacunadorId,
          vacunadorNombre,
          aftosa: aft,
          brucelosis: bru,
          importeActa:
            Number(
              (document.getElementById("fact-total-vacunacion") || {}).value
            ) || 0,
          manoObraTipo,
          manoObraIncluida,
          movilidadIncluida,
          movilidadKm,
        };
        vacunaciones.push(registro);
      }
      guardarVacunaciones();
      if (inputActa) inputActa.value = "";
      if (inputRenspa) inputRenspa.value = "";
      if (inputNom) inputNom.value = "";
      if (inputEst) inputEst.value = "";
      if (inputLoc) inputLoc.value = "";
      if (inputDep) inputDep.value = "";
      const factNro = document.getElementById("fact-nro-factura");
      if (factNro) factNro.value = "";
      const factSigsa = document.getElementById("fact-sigsa");
      if (factSigsa) factSigsa.value = "no";
      recalcularImportesVacunacion();
      camposAftosa.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      if (inputTotal) inputTotal.value = "";
      const bruTer = document.getElementById("bru-terneras");
      const bruMarca = document.getElementById("bru-marca");
      const bruSerie = document.getElementById("bru-serie");
      if (bruTer) bruTer.value = "";
      if (bruMarca) bruMarca.value = "";
      if (bruSerie) bruSerie.value = "";
      if (selVacunador) selVacunador.value = "";
      recalcularImportesVacunacion();
      aplicarValoresPorDefectoVacunacion();
      renderVacunaciones();
      alert("Vacunación guardada.");
    });
  }
  const btnAplicarFiltrosVac = document.getElementById(
    "btn-aplicar-filtros-vac"
  );
  if (btnAplicarFiltrosVac) {
    btnAplicarFiltrosVac.addEventListener("click", () => {
      const ff = document.getElementById("filtro-vac-fecha");
      const fa = document.getElementById("filtro-vac-acta");
      const fr = document.getElementById("filtro-vac-renspa");
      const fn = document.getElementById("filtro-vac-nombre");
      const fl = document.getElementById("filtro-vac-localidad");
      const fd = document.getElementById("filtro-vac-departamento");
      const fp = document.getElementById("filtro-vac-periodo");
      const ft = document.getElementById("filtro-vac-tipo");
      const fva = document.getElementById("filtro-vac-factura");
      const fsig = document.getElementById("filtro-vac-sigsa");
      const fv = document.getElementById("filtro-vac-vacunador");
      const fa_nio = document.getElementById("filtro-vac-anio");
      filtrosVacunaciones.anio = fa_nio && fa_nio.value ? fa_nio.value : "";
      filtrosVacunaciones.fecha = ff && ff.value ? ff.value : "";
      filtrosVacunaciones.acta = fa && fa.value ? fa.value.trim() : "";
      filtrosVacunaciones.renspa = fr && fr.value ? fr.value.trim() : "";
      filtrosVacunaciones.nombre = fn && fn.value ? fn.value.trim() : "";
      filtrosVacunaciones.localidad = fl && fl.value ? fl.value.trim() : "";
      filtrosVacunaciones.departamento = fd && fd.value ? fd.value.trim() : "";
      filtrosVacunaciones.periodo = fp ? fp.value : "";
      filtrosVacunaciones.tipo = ft ? ft.value : "";
      filtrosVacunaciones.factura = fva ? fva.value.trim() : "";
      filtrosVacunaciones.sigsa = fsig ? fsig.value : "";
      filtrosVacunaciones.vacunador = fv ? fv.value.trim() : "";
      renderVacunaciones();
    });
  }
  const btnLimpiarFiltrosVac = document.getElementById(
    "btn-limpiar-filtros-vac"
  );
  if (btnLimpiarFiltrosVac) {
    btnLimpiarFiltrosVac.addEventListener("click", () => {
      filtrosVacunaciones.fecha = "";
      filtrosVacunaciones.acta = "";
      filtrosVacunaciones.renspa = "";
      filtrosVacunaciones.nombre = "";
      filtrosVacunaciones.localidad = "";
      filtrosVacunaciones.departamento = "";
      filtrosVacunaciones.periodo = "";
      filtrosVacunaciones.tipo = "";
      filtrosVacunaciones.factura = "";
      filtrosVacunaciones.sigsa = "";
      filtrosVacunaciones.vacunador = "";
      filtrosVacunaciones.anio = "";
      const idsVac = [
        "filtro-vac-anio",
        "filtro-vac-fecha",
        "filtro-vac-acta",
        "filtro-vac-factura",
        "filtro-vac-renspa",
        "filtro-vac-nombre",
        "filtro-vac-localidad",
        "filtro-vac-departamento",
        "filtro-vac-periodo",
        "filtro-vac-tipo",
        "filtro-vac-factura",
        "filtro-vac-sigsa",
        "filtro-vac-vacunador",
      ];
      idsVac.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = "";
      });
      renderVacunaciones();
    });
  }
  const tbodyVacRegs = document.getElementById("tbody-vacunaciones");
  if (tbodyVacRegs) {
    tbodyVacRegs.addEventListener("click", (e) => {
      const boton = e.target.closest("button");
      const tr = e.target.closest("tr");
      if (!boton || !tr || !tr.dataset.id) return;
      const id = Number(tr.dataset.id);
      const item = vacunaciones.find((v) => v.id === id);
      if (!item) return;
      if (boton.dataset.action === "edit-vac-reg") {
        const selPeriodo = document.getElementById("vac-periodo");
        const selEstado = document.getElementById("vac-estado");
        const selTipo = document.getElementById("vac-tipo-vacunacion");
        const inputAnio = document.getElementById("vac-anio");
        const inputFecha = document.getElementById("vac-fecha");
        const inputActa = document.getElementById("vac-acta");
        const inputRenspa = document.getElementById("vac-renspa");
        const inputNom = document.getElementById("vac-nombre-cli");
        const inputEst = document.getElementById("vac-establecimiento");
        const inputLoc = document.getElementById("vac-localidad-cli");
        const inputDep = document.getElementById("vac-departamento-cli");
        const selVacunador = document.getElementById("vac-vacunador");
        if (selPeriodo) selPeriodo.value = item.periodo || "";
        if (selEstado) selEstado.value = item.estado || "vigente";
        if (selTipo) selTipo.value = item.tipoVacunacion || "";
        if (inputAnio) inputAnio.value = item.anio || "";
        if (inputFecha) inputFecha.value = item.fecha || "";
        if (inputActa) inputActa.value = item.acta || "";
        if (inputRenspa) inputRenspa.value = item.renspa || "";
        if (inputNom) inputNom.value = item.nombreCli || "";
        if (inputEst) inputEst.value = item.establecimiento || "";
        if (inputLoc) inputLoc.value = item.localidadCli || "";
        if (inputDep) inputDep.value = item.departamentoCli || "";
        if (selVacunador) {
          selVacunador.value = item.vacunadorId
            ? String(item.vacunadorId)
            : "";
        }
        const setNum = (idCampo, val) => {
          const el = document.getElementById(idCampo);
          if (el) el.value = val ? String(val) : "";
        };
        const aft = item.aftosa || {};
        setNum("aft-vacas", aft.vacas);
        setNum("aft-toros", aft.toros);
        setNum("aft-vaquillonas", aft.vaquillonas);
        setNum("aft-novillos", aft.novillos);
        setNum("aft-novillitos", aft.novillitos);
        setNum("aft-toritos", aft.toritos);
        setNum("aft-terneras", aft.terneras);
        setNum("aft-terneros", aft.terneros);
        setNum("aft-total", aft.total);
        const aftMarca = document.getElementById("aft-marca");
        const aftSerie = document.getElementById("aft-serie");
        if (aftMarca) aftMarca.value = aft.marca || "";
        if (aftSerie) aftSerie.value = aft.serie || "";
        const bru = item.brucelosis || {};
        setNum("bru-terneras", bru.terneras);
        const bruMarca = document.getElementById("bru-marca");
        const bruSerie = document.getElementById("bru-serie");
        if (bruMarca) bruMarca.value = bru.marca || "";
        if (bruSerie) bruSerie.value = bru.serie || "";
        vacunacionEditandoId = id;
        recalcularImportesVacunacion();
        return;
      }
      if (boton.dataset.action === "delete-vac-reg") {
        if (!confirm("¿Eliminar este registro de vacunación?")) return;
        vacunaciones = vacunaciones.filter((v) => v.id !== id);
        if (vacunacionEditandoId === id) {
          vacunacionEditandoId = null;
        }
        guardarVacunaciones();
        renderVacunaciones();
      }
    });
  }
  const inputCobroActa = document.getElementById("cobro-acta");
  if (inputCobroActa) {
    inputCobroActa.addEventListener("blur", () => {
      const acta = inputCobroActa.value.trim();
      const inputImp = document.getElementById("cobro-importe");
      const inputR = document.getElementById("cobro-renspa");
      const inputN = document.getElementById("cobro-nombre");
      if (!acta) {
        if (inputImp) inputImp.value = "";
        if (inputR) inputR.value = "";
        if (inputN) inputN.value = "";
        return;
      }
      const reg = vacunaciones.find(
        (v) => String(v.acta || "").trim() === acta
      );
      if (!reg) {
        if (inputImp) inputImp.value = "";
        if (inputR) inputR.value = "";
        if (inputN) inputN.value = "";
        return;
      }
      if (inputImp) {
        const comp = calcularComponentesActa(reg);
        inputImp.value = comp.totalActa ? comp.totalActa.toFixed(2) : "0.00";
      }
      if (inputR) inputR.value = reg.renspa || "";
      if (inputN) inputN.value = reg.nombreCli || "";
    });
  }
  const inputCobroRenspa = document.getElementById("cobro-renspa");
  if (inputCobroRenspa) {
    const actualizarActasParaRenspa = (renspaVal) => {
      const r = (renspaVal || "").trim();
      const actas = vacunaciones
        .filter((v) => (v.renspa || "") === r && v.acta)
        .map((v) => String(v.acta || "").trim())
        .filter((a) => a);
      const unicas = Array.from(new Set(actas)).sort((a, b) =>
        a.localeCompare(b, "es")
      );
      poblarDatalist("dl-cobro-actas", unicas);
    };
    inputCobroRenspa.addEventListener("input", () => {
      const val = inputCobroRenspa.value;
      const nuevo = formatearRenspa(val);
      inputCobroRenspa.value = nuevo;
      inputCobroRenspa.setSelectionRange(
        inputCobroRenspa.value.length,
        inputCobroRenspa.value.length
      );
      const r = inputCobroRenspa.value.trim();
      const cli = clientes.find((c) => (c.renspa || "") === r);
      const inputNombreCobro = document.getElementById("cobro-nombre");
      if (cli && inputNombreCobro && !inputNombreCobro.value) {
        inputNombreCobro.value = toTitleCase(cli.nombre || "");
      }
      actualizarActasParaRenspa(r);
    });
    inputCobroRenspa.addEventListener("blur", () => {
      inputCobroRenspa.value = formatearRenspa(inputCobroRenspa.value);
      const r = inputCobroRenspa.value.trim();
      actualizarActasParaRenspa(r);
      const inputActa = document.getElementById("cobro-acta");
      if (inputActa && !inputActa.value && r) {
        const actasRelacionadas = vacunaciones
          .filter((v) => (v.renspa || "") === r && v.acta)
          .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "", "es"));
        if (actasRelacionadas.length > 0) {
          const ultima = actasRelacionadas[actasRelacionadas.length - 1];
          inputActa.value = ultima.acta;
          inputActa.dispatchEvent(new Event("blur"));
        }
      }
    });
  }
  const selCobroPagada = document.getElementById("cobro-pagada");
  const bloqueEfectivo = document.getElementById("bloque-cobro-efectivo");
  const bloqueTransf = document.getElementById("bloque-cobro-transferencia");
  const bloqueCheques = document.getElementById("bloque-cobro-cheques");
  const actualizarUIFormaPago = () => {
    const pagada = selCobroPagada ? selCobroPagada.value : "no";
    const mostrar = pagada === "si";
    const hintPagada = document.getElementById("hint-cobro-pagada");
    if (hintPagada) {
      if (mostrar) hintPagada.classList.remove("hidden");
      else hintPagada.classList.add("hidden");
    }
    if (bloqueEfectivo) {
      if (mostrar) bloqueEfectivo.classList.remove("hidden");
      else bloqueEfectivo.classList.add("hidden");
    }
    if (bloqueTransf) {
      if (mostrar) bloqueTransf.classList.remove("hidden");
      else bloqueTransf.classList.add("hidden");
    }
    if (bloqueCheques) {
      if (mostrar) bloqueCheques.classList.remove("hidden");
      else bloqueCheques.classList.add("hidden");
    }
  };
  if (selCobroPagada) {
    selCobroPagada.addEventListener("change", () => {
      actualizarUIFormaPago();
    });
  }
  actualizarUIFormaPago();
  const btnAgregarCheque = document.getElementById("btn-agregar-cheque");
  if (btnAgregarCheque) {
    btnAgregarCheque.addEventListener("click", () => {
      const banco = (document.getElementById("cheque-banco") || {}).value || "";
      const numero = (document.getElementById("cheque-numero") || {}).value || "";
      const fechaCheque = (document.getElementById("cheque-fecha") || {}).value || "";
      const fechaCobro = (document.getElementById("cheque-fecha-cobro") || {}).value || "";
      const importeVal = (document.getElementById("cheque-importe") || {}).value || "";
      const importe = Number(importeVal) || 0;
      const destino = (document.getElementById("cheque-destino") || {}).value || "";
      if (!banco || !numero || !fechaCheque || !importe) {
        alert("Completá banco, número, fecha del cheque e importe.");
        return;
      }
      chequesTemporales.push({ banco, numero, fechaCheque, fechaCobro, importe, destino });
      renderChequesCobroTemporales();
      ["cheque-banco", "cheque-numero", "cheque-fecha", "cheque-fecha-cobro", "cheque-importe", "cheque-destino"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    });
  }
  const btnAgregarTransfCobro = document.getElementById("btn-cobro-agregar-transf");
  if (btnAgregarTransfCobro) {
    btnAgregarTransfCobro.addEventListener("click", () => {
      const monto = Number(document.getElementById("cobro-transf-monto")?.value) || 0;
      const bancoOrigen = document.getElementById("cobro-transf-origen")?.value || "";
      const numero = document.getElementById("cobro-transf-numero")?.value || "";
      const bancoDestino = document.getElementById("cobro-transf-destino")?.value || "";
      const fondoDestino = document.getElementById("cobro-transf-fondo-destino")?.value || "";
      if (monto <= 0) {
        alert("Ingresá un monto válido para la transferencia.");
        return;
      }
      transfCobroTemporales.push({ monto, bancoOrigen, numero, bancoDestino, fondoDestino });
      renderTransfCobroTemporales();
      ["cobro-transf-monto", "cobro-transf-origen", "cobro-transf-numero", "cobro-transf-destino", "cobro-transf-fondo-destino"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    });
  }
  const selPagoVacEstado = document.getElementById("pago-vac-estado");
  const bloquePagoVacEfectivo = document.getElementById("bloque-pago-vac-efectivo");
  const bloquePagoVacTransf = document.getElementById("bloque-pago-vac-transferencia");
  const bloquePagoVacCheques = document.getElementById("bloque-pago-vac-cheques");
  const actualizarUIPagoVacForma = () => {
    const pagada = selPagoVacEstado ? selPagoVacEstado.value : "no";
    const mostrar = pagada === "si";
    const hintPagada = document.getElementById("hint-pago-vac-pagada");
    if (hintPagada) {
      if (mostrar) hintPagada.classList.remove("hidden");
      else hintPagada.classList.add("hidden");
    }
    if (bloquePagoVacEfectivo) {
      if (mostrar) bloquePagoVacEfectivo.classList.remove("hidden");
      else bloquePagoVacEfectivo.classList.add("hidden");
    }
    if (bloquePagoVacTransf) {
      if (mostrar) bloquePagoVacTransf.classList.remove("hidden");
      else bloquePagoVacTransf.classList.add("hidden");
    }
    if (bloquePagoVacCheques) {
      if (mostrar) bloquePagoVacCheques.classList.remove("hidden");
      else bloquePagoVacCheques.classList.add("hidden");
    }
  };
  if (selPagoVacEstado) {
    selPagoVacEstado.addEventListener("change", () => {
      actualizarUIPagoVacForma();
    });
  }
  actualizarUIPagoVacForma();
  const btnPagoVacAgregarCheque = document.getElementById("btn-pago-vac-agregar-cheque");
  if (btnPagoVacAgregarCheque) {
    btnPagoVacAgregarCheque.addEventListener("click", () => {
      const banco = (document.getElementById("pago-vac-cheque-banco") || {}).value || "";
      const numero = (document.getElementById("pago-vac-cheque-numero") || {}).value || "";
      const fechaCheque = (document.getElementById("pago-vac-cheque-fecha-cheque") || {}).value || "";
      const fechaCobro = (document.getElementById("pago-vac-cheque-fecha-cobro") || {}).value || "";
      const importeVal = (document.getElementById("pago-vac-cheque-importe") || {}).value || "";
      const importe = Number(importeVal) || 0;
      const destino = (document.getElementById("pago-vac-cheque-destino") || {}).value || "";
      if (!banco || !numero || !fechaCheque || !importe) {
        alert("Completá banco, número, fecha del cheque e importe.");
        return;
      }
      chequesPagoVacTemporales.push({ banco, numero, fechaCheque, fechaCobro, importe, destino });
      renderChequesPagoVacTemporales();
      ["pago-vac-cheque-banco", "pago-vac-cheque-numero", "pago-vac-cheque-fecha-cheque", "pago-vac-cheque-fecha-cobro", "pago-vac-cheque-importe", "pago-vac-cheque-destino"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    });
  }
  const btnPagoVacAgregarTransf = document.getElementById("btn-pago-vac-agregar-transf");
  if (btnPagoVacAgregarTransf) {
    btnPagoVacAgregarTransf.addEventListener("click", () => {
      const monto = Number(document.getElementById("pago-vac-transf-monto")?.value) || 0;
      const bancoOrigen = document.getElementById("pago-vac-transf-origen")?.value || "";
      const numero = document.getElementById("pago-vac-transf-numero")?.value || "";
      const bancoDestino = document.getElementById("pago-vac-transf-destino")?.value || "";
      if (monto <= 0) {
        alert("Ingresá un monto válido.");
        return;
      }
      transfPagoVacTemporales.push({ monto, bancoOrigen, numero, bancoDestino });
      renderTransfPagoVacTemporales();
      ["pago-vac-transf-monto", "pago-vac-transf-origen", "pago-vac-transf-numero", "pago-vac-transf-destino"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    });
  }
  const ids = [
    "pago-vac-cheque-banco",
    "pago-vac-cheque-numero",
    "pago-vac-cheque-fecha-cheque",
    "pago-vac-cheque-fecha-cobro",
    "pago-vac-cheque-importe",
    "pago-vac-cheque-destino",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const formCobro = document.getElementById("form-cobro");
  if (formCobro) {
    formCobro.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputFecha = document.getElementById("cobro-fecha");
      const inputActaCobro = document.getElementById("cobro-acta");
      const inputRend = document.getElementById("cobro-rendicion");
      const inputImp = document.getElementById("cobro-importe");
      const inputR = document.getElementById("cobro-renspa");
      const inputN = document.getElementById("cobro-nombre");
      const fechaCobro = inputFecha ? inputFecha.value : "";
      const actaCobro = inputActaCobro ? inputActaCobro.value.trim() : "";
      const rendicion = inputRend ? inputRend.value.trim() : "";
      const renspaCobro = inputR ? inputR.value.trim() : "";
      const nombreCobro = inputN ? inputN.value.trim() : "";
      const importeActa =
        inputImp && inputImp.value ? Number(inputImp.value) || 0 : 0;
      const pagada = selCobroPagada ? selCobroPagada.value : "no";
      if (!fechaCobro || !actaCobro) {
        alert("Completá fecha de cobro y número de acta.");
        return;
      }

      let importeEfectivo = 0;
      let efectivoDestino = "";
      let transferencias = [];
      let cheques = [];

      if (pagada === "si") {
        if (!validarDestinos("cobro")) return;

        importeEfectivo = Number((document.getElementById("cobro-efectivo-monto") || {}).value) || 0;
        efectivoDestino = (document.getElementById("cobro-efectivo-destino") || {}).value || "";

        transferencias = transfCobroTemporales.slice();
        cheques = chequesTemporales.slice();
      }

      if (cobroEditandoId) {
        const existente = cobros.find((c) => c.id === cobroEditandoId);
        if (existente) {
          existente.fechaCobro = fechaCobro;
          existente.acta = actaCobro;
          existente.rendicion = rendicion;
          existente.renspa = renspaCobro;
          existente.nombre = nombreCobro;
          existente.importeActa = importeActa;
          existente.pagada = pagada;
          existente.importeEfectivo = importeEfectivo;
          existente.efectivoDestino = efectivoDestino;
          existente.transferencias = transferencias;
          existente.cheques = cheques;
        }
        cobroEditandoId = null;
      } else {
        const registroCobro = {
          id: Date.now(),
          fechaCobro,
          acta: actaCobro,
          rendicion,
          renspa: renspaCobro,
          nombre: nombreCobro,
          importeActa,
          pagada,
          importeEfectivo,
          efectivoDestino,
          transferencias,
          cheques,
        };
        cobros.push(registroCobro);
      }
      guardarCobros();
      chequesTemporales = [];
      transfCobroTemporales = [];
      renderChequesCobroTemporales();
      renderTransfCobroTemporales();
      actualizarDatalistDestinos();
      formCobro.reset();
      actualizarUIFormaPago();
      renderCobros();
      renderActasPendientesCobro();
      renderFinanzasGlobales();
      alert("Cobro guardado.");
    });
  }
  const formPagoVac = document.getElementById("form-pago-vacunador");
  if (formPagoVac) {
    const selVac = document.getElementById("pago-vac-vacunador");
    if (selVac) {
      const opciones = ['<option value="">Seleccionar vacunador</option>'];
      vacunadores
        .slice()
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
        .forEach((v) => {
          opciones.push(
            `<option value="${v.id}">${v.nombre || ""}</option>`
          );
        });
      selVac.innerHTML = opciones.join("");
      selVac.addEventListener("change", () => {
        actasPagoTemp = [];
        renderPagoVacSeleccion();
        renderActasPorVacunador();
        const ractas = vacunaciones
          .filter(
            (v) =>
              (!selVac.value ||
                v.vacunadorId === Number(selVac.value)) &&
              v.acta
          )
          .map((v) => String(v.acta || "").trim())
          .filter((a) => a);
        const unicas = Array.from(new Set(ractas)).sort((a, b) =>
          a.localeCompare(b, "es")
        );
        poblarDatalist("dl-pago-vac-actas", unicas);
      });
    }
    const inputActaPago = document.getElementById("pago-vac-acta");
    if (inputActaPago) {
      inputActaPago.addEventListener("blur", () => {
        const acta = inputActaPago.value.trim();
        if (!acta) return;
        agregarActaAPago(acta);
        inputActaPago.value = "";
      });
    }
    const btnAgregarActa = document.getElementById("btn-pago-vac-agregar-acta");
    if (btnAgregarActa) {
      btnAgregarActa.addEventListener("click", () => {
        const input = document.getElementById("pago-vac-acta");
        const acta = input ? input.value.trim() : "";
        if (!acta) return;
        agregarActaAPago(acta);
        if (input) input.value = "";
      });
    }
    const tbodyActasPago = document.getElementById("tbody-pago-vac-actas");
    if (tbodyActasPago) {
      tbodyActasPago.addEventListener("click", (e) => {
        const boton = e.target.closest("button");
        const tr = e.target.closest("tr");
        if (!boton || !tr || !tr.dataset.acta) return;
        if (boton.dataset.action !== "pago-vac-cargar") return;
        const acta = tr.dataset.acta;
        agregarActaAPago(acta);
      });
    }
    const tbodySel = document.getElementById("tbody-pago-vac-seleccion");
    if (tbodySel) {
      tbodySel.addEventListener("click", (e) => {
        const boton = e.target.closest("button");
        const tr = e.target.closest("tr");
        if (!boton || !tr || !tr.dataset.acta) return;
        if (boton.dataset.action !== "pago-vac-quitar") return;
        quitarActaDePago(tr.dataset.acta);
      });
    }
    function generarNumeroRendicion() {
      if (!pagosVacunadores || !pagosVacunadores.length) return "R-0001";
      let maxNum = 0;
      pagosVacunadores.forEach(p => {
        if (p.rendicion && p.rendicion.startsWith("R-")) {
          const numStr = p.rendicion.substring(2);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      maxNum++;
      return "R-" + maxNum.toString().padStart(4, "0");
    }

    formPagoVac.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputFecha = document.getElementById("pago-vac-fecha");
      const selVac = document.getElementById("pago-vac-vacunador");
      const inputRend = document.getElementById("pago-vac-rendicion");
      const fechaPago = inputFecha ? inputFecha.value : "";
      const vacunadorId = selVac && selVac.value ? Number(selVac.value) : null;
      let rendicion = inputRend ? inputRend.value.trim() : "";
      if (!rendicion) {
        rendicion = generarNumeroRendicion();
        if (inputRend) inputRend.value = rendicion;
      }
      const importeMano = actasPagoTemp.reduce((acc, a) => acc + (a.manoObra || 0), 0);
      const importeMov = actasPagoTemp.reduce((acc, a) => acc + (a.movilidad || 0), 0);
      const importeTotal = actasPagoTemp.reduce((acc, a) => acc + (a.total || 0), 0);
      const pagada = selPagoVacEstado ? selPagoVacEstado.value : "no";
      if (!fechaPago || !vacunadorId) {
        alert("Completá la fecha de pago y el vacunador.");
        return;
      }
      if (!actasPagoTemp.length) {
        alert("Agregá al menos un N° de acta al pago.");
        return;
      }

      let importeEfectivo = 0;
      let efectivoDestino = "";
      let transferencias = [];
      let cheques = [];

      if (pagada === "si") {
        if (!validarDestinos("pago-vac")) return;
        importeEfectivo = Number((document.getElementById("pago-vac-efectivo-monto") || {}).value) || 0;
        efectivoDestino = (document.getElementById("pago-vac-efectivo-destino") || {}).value || "";
        transferencias = transfPagoVacTemporales.slice();
        cheques = chequesPagoVacTemporales.slice();
      }

      let vacunadorNombre = "";
      if (vacunadorId) {
        const vac = vacunadores.find((v) => v.id === vacunadorId);
        if (vac) vacunadorNombre = vac.nombre || "";
      }
      let registroPago;
      if (pagoVacEditandoId) {
        registroPago = pagosVacunadores.find(p => p.id === pagoVacEditandoId);
        if (registroPago) {
          registroPago.fechaPago = fechaPago;
          registroPago.vacunadorId = vacunadorId;
          registroPago.vacunadorNombre = vacunadorNombre;
          registroPago.rendicion = rendicion;
          registroPago.actas = actasPagoTemp.map((a) => ({
            acta: a.acta,
            importeManoObra: a.manoObra,
            importeMovilidad: a.movilidad,
            importeTotal: a.total,
          }));
          registroPago.importeManoObra = importeMano;
          registroPago.importeMovilidad = importeMov;
          registroPago.importeTotal = importeTotal;
          registroPago.pagada = pagada;
          registroPago.importeEfectivo = importeEfectivo;
          registroPago.efectivoDestino = efectivoDestino;
          registroPago.transferencias = transferencias;
          registroPago.cheques = cheques;
        }
        pagoVacEditandoId = null;
        const btnSubmit = document.querySelector("#form-pago-vacunador button[type='submit']");
        if (btnSubmit) btnSubmit.textContent = "Guardar pago";
      } else {
        registroPago = {
          id: Date.now(),
          fechaPago,
          vacunadorId,
          vacunadorNombre,
          rendicion,
          actas: actasPagoTemp.map((a) => ({
            acta: a.acta,
            importeManoObra: a.manoObra,
            importeMovilidad: a.movilidad,
            importeTotal: a.total,
          })),
          importeManoObra: importeMano,
          importeMovilidad: importeMov,
          importeTotal,
          pagada,
          importeEfectivo,
          efectivoDestino,
          transferencias,
          cheques,
        };
        pagosVacunadores.push(registroPago);
      }
      guardarPagosVacunadores();
      actasPagoTemp = [];
      renderPagoVacSeleccion();
      chequesPagoVacTemporales = [];
      transfPagoVacTemporales = [];
      renderChequesPagoVacTemporales();
      renderTransfPagoVacTemporales();
      actualizarDatalistDestinos();
      formPagoVac.reset();
      actualizarUIPagoVacForma();
      renderActasPorVacunador();
      renderPagosVacunadores();
      renderFinanzasGlobales();
      alert("Pago guardado.");
    });

    const tbodyPagosVac = document.getElementById("tbody-pagos-vacunadores");
    if (tbodyPagosVac) {
      tbodyPagosVac.addEventListener("click", (e) => {
        const boton = e.target.closest("button");
        const tr = e.target.closest("tr");
        if (!boton || !tr || !tr.dataset.id) return;
        const id = Number(tr.dataset.id);
        const item = pagosVacunadores.find((c) => c.id === id);
        if (!item) return;

        if (boton.dataset.action === "delete-pago-vac") {
          handleEliminarPagoVac(id);
          return;
        }

        if (boton.dataset.action === "edit-pago-vac") {
          handleEditarPagoVac(id);
        }
      });
    }

    // Eventos Finanzas
    const financeTables = [
      "tbody-finanzas-efectivo",
      "tbody-finanzas-cheques",
      "tbody-finanzas-transferencias"
    ];
    financeTables.forEach(idTable => {
      const tb = document.getElementById(idTable);
      if (tb) {
        tb.addEventListener("click", (e) => {
          const btn = e.target.closest("button");
          if (!btn || !btn.dataset.action || !btn.dataset.id) return;
          const id = Number(btn.dataset.id);
          const action = btn.dataset.action;

          if (action === "edit-fin-cobro") handleEditarCobro(id);
          if (action === "delete-fin-cobro") handleEliminarCobro(id);
          if (action === "edit-fin-pago") handleEditarPagoVac(id);
          if (action === "delete-fin-pago") handleEliminarPagoVac(id);
        });
      }
    });
  }
}
const tbodyPreciosHist = document.getElementById("tbody-precios-historial");
if (tbodyPreciosHist) {
  tbodyPreciosHist.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    const tr = e.target.closest("tr");
    if (!boton || !tr || !tr.dataset.id) return;
    const id = Number(tr.dataset.id);
    const item = preciosHistorial.find((h) => h.id === id);
    if (!item) return;
    if (boton.dataset.action === "edit-hist") {
      const inputFecha = document.getElementById("historial-fecha");
      if (inputFecha) {
        inputFecha.value = item.fecha || "";
      }
      preciosAftosa = {
        precioProducto: Number(item.aftosa && item.aftosa.precioProducto) || 0,
        costoOperativo: Number(item.aftosa && item.aftosa.costoOperativo) || 0,
        costoCoordinacion:
          Number(item.aftosa && item.aftosa.costoCoordinacion) || 0,
        manoObraOrganizado:
          Number(item.aftosa && item.aftosa.manoObraOrganizado) || 0,
        manoObraAbierto:
          Number(item.aftosa && item.aftosa.manoObraAbierto) || 0,
        movilidadPorKm:
          Number(item.aftosa && item.aftosa.movilidadPorKm) || 0,
      };
      preciosBrucelosis = {
        precioProducto:
          Number(item.brucelosis && item.brucelosis.precioProducto) || 0,
        costoOperativo:
          Number(item.brucelosis && item.brucelosis.costoOperativo) || 0,
        costoCoordinacion:
          Number(item.brucelosis && item.brucelosis.costoCoordinacion) || 0,
        manoObraOrganizado:
          Number(item.brucelosis && item.brucelosis.manoObraOrganizado) || 0,
        manoObraAbierto:
          Number(item.brucelosis && item.brucelosis.manoObraAbierto) || 0,
        movilidadPorKm:
          Number(item.brucelosis && item.brucelosis.movilidadPorKm) || 0,
      };
      renderPrecios();
      historialEditandoId = id;
      return;
    }
    if (boton.dataset.action === "delete-hist") {
      if (!confirm("¿Eliminar este registro de historial de precios?")) return;
      preciosHistorial = preciosHistorial.filter((h) => h.id !== id);
      if (historialEditandoId === id) {
        historialEditandoId = null;
      }
      guardarPreciosHistorial();
      renderHistorialPrecios();
    }
  });
}

// --- EVENTOS BACKUP Y PORTABILIDAD ---
const btnExportar = document.getElementById("btn-exportar-datos");
if (btnExportar) {
  btnExportar.addEventListener("click", exportarDatos);
}
const btnImportar = document.getElementById("btn-importar-datos");
const inputImportar = document.getElementById("input-importar-datos");
if (btnImportar && inputImportar) {
  btnImportar.addEventListener("click", () => inputImportar.click());
  inputImportar.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      importarDatos(file);
    }
  });
}

function exportarDatos() {
  const data = {
    pv_proveedores: localStorage.getItem("pv_proveedores"),
    pv_movimientos: localStorage.getItem("pv_movimientos"),
    pv_clientes: localStorage.getItem("pv_clientes"),
    pv_precios: localStorage.getItem("pv_precios"),
    pv_precios_brucelosis: localStorage.getItem("pv_precios_brucelosis"),
    pv_precios_historial: localStorage.getItem("pv_precios_historial"),
    pv_precio_ternero: localStorage.getItem("pv_precio_ternero"),
    pv_vacunadores: localStorage.getItem("pv_vacunadores"),
    pv_vacunaciones: localStorage.getItem("pv_vacunaciones"),
    pv_cobros: localStorage.getItem("pv_cobros"),
    pv_pagos_vacunadores: localStorage.getItem("pv_pagos_vacunadores"),
    pv_actas_omitidas: localStorage.getItem("pv_actas_omitidas"),
    pv_actas_entrega: localStorage.getItem("pv_actas_entrega"),
    pv_actas_recepcion: localStorage.getItem("pv_actas_recepcion")
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ahora = new Date();
  const fechaStr = ahora.toISOString().slice(0, 10);
  const tiempoStr = ahora.getHours().toString().padStart(2, '0') +
    ahora.getMinutes().toString().padStart(2, '0');
  a.href = url;
  a.download = `backup_vacunacion_${fechaStr}_${tiempoStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    alert("✅ ¡Copia de seguridad generada!\n\nEl archivo se ha guardado en tu carpeta de 'Descargas' (Downloads).\n\nPuedes llevar este archivo a otra computadora para recuperar tus datos.");
  }, 100);
  URL.revokeObjectURL(url);
}

function importarDatos(archivo) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      // Validación básica
      if (!data.pv_clientes && !data.pv_vacunaciones) {
        alert("El archivo no es un respaldo válido de esta aplicación.");
        return;
      }

      if (confirm("⚠️ ATENCIÓN: Se van a SOBRESCRIBIR todos los datos actuales con la información de este archivo de respaldo.\n\n¿Estás seguro de continuar?")) {
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            localStorage.setItem(key, data[key]);
          }
        });
        alert("✅ ¡Datos recuperados con éxito!\nLa aplicación se reiniciará para cargar los cambios.");
        location.reload();
      }
    } catch (err) {
      alert("❌ Error al procesar el archivo. Asegúrate de seleccionar un archivo .json de respaldo válido.");
      console.error(err);
    }
  };
  reader.readAsText(archivo);
}

function importarClientesCSV(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const csv = e.target.result;
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) {
      alert("El archivo está vacío o no tiene el formato correcto (requiere cabecera).");
      return;
    }

    let importados = 0;
    let duplicados = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[;,]/);
      if (parts.length < 2) continue;

      const renspa = parts[0].trim();
      const nombre = parts[1].trim().toUpperCase();
      const documento = (parts[2] || "").trim();
      const establecimiento = (parts[3] || "").trim().toUpperCase();
      const localidad = (parts[4] || "").trim().toUpperCase();
      const departamento = (parts[5] || "").trim().toUpperCase();
      const provincia = (parts[6] || "").trim().toUpperCase();
      const vacunadorNombreCSV = (parts[7] || "").trim().toUpperCase();

      if (!renspa || !nombre) continue;

      const existe = clientes.find((c) => c.renspa === renspa);
      if (existe) {
        duplicados++;
        continue;
      }

      let vacunadorId = "";
      if (vacunadorNombreCSV) {
        const v = vacunadores.find(vac => (vac.nombre || "").toUpperCase() === vacunadorNombreCSV);
        if (v) vacunadorId = v.id;
      }

      const nuevo = {
        id: Date.now() + i,
        renspa,
        nombre,
        documento,
        establecimiento,
        localidad,
        departamento,
        provincia,
        vacunadorId,
      };
      clientes.push(nuevo);
      importados++;
    }

    if (importados > 0) {
      guardarClientes();
      renderClientes();
      renderActasPendientesCobro(); // Added this line
      actualizarListas();
      alert(
        `✅ Se importaron ${importados} clientes correctamente.${duplicados > 0
          ? `\n\n⚠️ Se omitieron ${duplicados} por RENSPA duplicado.`
          : ""
        }`
      );
    } else if (duplicados > 0) {
      alert(
        `No se importó nada. Se encontraron ${duplicados} RENSPAs que ya existen.`
      );
    } else {
      alert("No se encontraron datos válidos para importar.");
    }
  };
  reader.readAsText(file, "UTF-8");
}

function renderDashboardVacunador() {
  const content = document.getElementById("dashboard-vacunador-content");
  const select = document.getElementById("filtro-vacunador-dashboard");
  if (!content || !select) return;

  const vacId = Number(select.value);
  if (!vacId) {
    content.classList.add("hidden");
    return;
  }
  content.classList.remove("hidden");

  const filtroActa = (document.getElementById("filtro-dash-vac-acta")?.value || "").toLowerCase();
  const filtroDesde = document.getElementById("filtro-dash-vac-desde")?.value || "";
  const filtroHasta = document.getElementById("filtro-dash-vac-hasta")?.value || "";

  let aftEntregadas = 0, aftEntregadasF = 0, aftDevueltas = 0, aftDevueltasF = 0, aftAplicadas = 0;
  let bruEntregadas = 0, bruEntregadasF = 0, bruDevueltas = 0, bruDevueltasF = 0, bruAplicadas = 0;

  let totalCobrar = 0;
  let totalPagado = 0;

  const historial = [];
  const historialFinanzas = [];

  actasEntrega.forEach(a => {
    if (a.vacunadorId !== vacId) return;

    const pasaFiltro = (!filtroActa || (a.acta && a.acta.toLowerCase().includes(filtroActa))) &&
      (!filtroDesde || a.fecha >= filtroDesde) &&
      (!filtroHasta || a.fecha <= filtroHasta);

    if (pasaFiltro) {
      aftEntregadas += Number(a.aftDosis) || 0;
      aftEntregadasF += Number(a.aftFrascos) || 0;
      bruEntregadas += Number(a.bruDosis) || 0;
      bruEntregadasF += Number(a.bruFrascos) || 0;

      historial.push({
        timestamp: a.id,
        fecha: a.fecha,
        tipo: "Entrega",
        acta: a.acta,
        vacuna: [a.aftDosis ? "Aftosa" : "", a.bruDosis ? "Brucelosis" : ""].filter(Boolean).join(" / "),
        marca: [a.aftMarca, a.bruMarca].filter(Boolean).join(" / "),
        serie: [a.aftSerie, a.bruSerie].filter(Boolean).join(" / "),
        dosis: `${a.aftDosis || 0} / ${a.bruDosis || 0}`,
        frascos: `${a.aftFrascos || 0} / ${a.bruFrascos || 0}`,
        cantActas: a.cantActas || 0,
        numeracion: `${a.numDesde || ""} - ${a.numHasta || ""}`
      });
    }
  });

  actasRecepcion.forEach(a => {
    if (a.vacunadorId !== vacId) return;

    const pasaFiltro = (!filtroActa || (a.acta && a.acta.toLowerCase().includes(filtroActa))) &&
      (!filtroDesde || a.fecha >= filtroDesde) &&
      (!filtroHasta || a.fecha <= filtroHasta);

    if (pasaFiltro) {
      aftDevueltas += Number(a.aftDosis) || 0;
      aftDevueltasF += Number(a.aftFrascos) || 0;
      bruDevueltas += Number(a.bruDosis) || 0;
      bruDevueltasF += Number(a.bruFrascos) || 0;

      historial.push({
        timestamp: a.id,
        fecha: a.fecha,
        tipo: "Recepción",
        acta: a.acta,
        vacuna: [a.aftDosis ? "Aftosa" : "", a.bruDosis ? "Brucelosis" : ""].filter(Boolean).join(" / "),
        marca: "-",
        serie: "-",
        dosis: `${a.aftDosis || 0} / ${a.bruDosis || 0}`,
        frascos: `${a.aftFrascos || 0} / ${a.bruFrascos || 0}`,
        cantActas: a.cantActas || 0,
        numeracion: `${a.numDesde || ""} - ${a.numHasta || ""}`
      });
    }
  });

  vacunaciones.forEach(v => {
    if (v.vacunadorId !== vacId) return;
    if (v.estado === "anulada") return;

    const pasaFiltro = (!filtroActa || (v.acta && v.acta.toLowerCase().includes(filtroActa))) &&
      (!filtroDesde || v.fecha >= filtroDesde) &&
      (!filtroHasta || v.fecha <= filtroHasta);

    if (pasaFiltro) {
      const dosisAft = Number((v.aftosa && v.aftosa.total) || 0);
      const dosisBru = Number((v.brucelosis && v.brucelosis.terneras) || 0);
      aftAplicadas += dosisAft;
      bruAplicadas += dosisBru;

      historial.push({
        timestamp: v.id,
        fecha: v.fecha,
        tipo: "Vacunación",
        acta: v.acta,
        vacuna: [dosisAft ? "Aftosa" : "", dosisBru ? "Brucelosis" : ""].filter(Boolean).join(" / "),
        marca: [v.aftosa && v.aftosa.marca, v.brucelosis && v.brucelosis.marca].filter(Boolean).join(" / "),
        serie: [v.aftosa && v.aftosa.serie, v.brucelosis && v.brucelosis.serie].filter(Boolean).join(" / "),
        dosis: `${dosisAft} / ${dosisBru}`,
        frascos: "-",
        cantActas: 1,
        numeracion: v.acta
      });

      // Cálculos FINANCIEROS por aplicación de vacunas (Deuda a favor del vacunador)
      const comp = calcularComponentesActa(v);
      if (comp.manoObra > 0 || comp.movilidad > 0) {
        totalCobrar += comp.total;
        historialFinanzas.push({
          timestamp: v.id,
          fecha: v.fecha,
          tipo: "Honorarios Generados",
          acta: v.acta,
          manoObra: comp.manoObra,
          movilidad: comp.movilidad,
          total: comp.total,
          esPago: false
        });
      }
    }
  });

  pagosVacunadores.forEach(p => {
    if (p.vacunadorId !== vacId) return;

    // Check if the payment matches filters. For payments, we match against multiple actas if there are multiple.
    let matcheaActa = false;
    let actasRef = [];
    if (Array.isArray(p.actas) && p.actas.length) {
      actasRef = p.actas.map(a => a.acta);
      matcheaActa = p.actas.some(a => !filtroActa || (a.acta && a.acta.toLowerCase().includes(filtroActa)));
    } else {
      actasRef = [p.acta || ""];
      matcheaActa = !filtroActa || (p.acta && p.acta.toLowerCase().includes(filtroActa));
    }

    const pasaFiltro = matcheaActa &&
      (!filtroDesde || p.fechaPago >= filtroDesde) &&
      (!filtroHasta || p.fechaPago <= filtroHasta);

    if (pasaFiltro && p.pagada === "si") {
      const gMano = Number(p.importeManoObra) || 0;
      const gMov = Number(p.importeMovilidad) || 0;
      const gTot = Number(p.importeTotal) || 0;

      totalPagado += gTot;

      historialFinanzas.push({
        timestamp: p.id,
        fecha: p.fechaPago,
        tipo: "Pago Recibido",
        acta: actasRef.join(", "),
        manoObra: gMano,
        movilidad: gMov,
        total: gTot,
        esPago: true
      });
    }
  });

  const $ = id => document.getElementById(id);
  $("dash-aft-entregadas").textContent = `${aftEntregadas} (${aftEntregadasF} F)`;
  $("dash-aft-aplicadas").textContent = `${aftAplicadas}`;
  $("dash-aft-devueltas").textContent = `${aftDevueltas} (${aftDevueltasF} F)`;
  $("dash-aft-stock").textContent = `${aftEntregadas - aftAplicadas - aftDevueltas} (${aftEntregadasF - aftDevueltasF} F)`;

  $("dash-bru-entregadas").textContent = `${bruEntregadas} (${bruEntregadasF} F)`;
  $("dash-bru-aplicadas").textContent = `${bruAplicadas}`;
  $("dash-bru-devueltas").textContent = `${bruDevueltas} (${bruDevueltasF} F)`;
  $("dash-bru-stock").textContent = `${bruEntregadas - bruAplicadas - bruDevueltas} (${bruEntregadasF - bruDevueltasF} F)`;

  $("dash-finanzas-cobrar").textContent = `$${totalCobrar.toFixed(2)}`;
  $("dash-finanzas-pagado").textContent = `$${totalPagado.toFixed(2)}`;
  $("dash-finanzas-saldo").textContent = `$${(totalCobrar - totalPagado).toFixed(2)}`;

  historial.sort((a, b) => {
    if (a.fecha === b.fecha) return b.timestamp - a.timestamp;
    return b.fecha.localeCompare(a.fecha);
  });

  const tbody = $("tbody-dashboard-vacunador");
  if (tbody) {
    if (!historial.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="helper-text" style="text-align:center;">No hay movimientos físicos para este vacunador.</td></tr>';
    } else {
      tbody.innerHTML = historial.map(h => `
        <tr>
          <td>${h.fecha || ""}</td>
          <td>${h.tipo || ""}</td>
          <td>${h.acta || ""}</td>
          <td>${h.vacuna || ""}</td>
          <td>${h.marca || ""}</td>
          <td>${h.serie || ""}</td>
          <td>${h.dosis || ""}</td>
          <td>${h.frascos || ""}</td>
          <td>${h.cantActas || ""}</td>
          <td>${h.numeracion || ""}</td>
        </tr>
      `).join("");
    }
  }

  historialFinanzas.sort((a, b) => {
    if (a.fecha === b.fecha) return b.timestamp - a.timestamp;
    return b.fecha.localeCompare(a.fecha);
  });

  const tbodyFinanzas = $("tbody-dashboard-vacunador-finanzas");
  if (tbodyFinanzas) {
    if (!historialFinanzas.length) {
      tbodyFinanzas.innerHTML = '<tr><td colspan="6" class="helper-text" style="text-align:center;">No hay movimientos financieros para este vacunador.</td></tr>';
    } else {
      tbodyFinanzas.innerHTML = historialFinanzas.map(h => `
        <tr>
          <td>${h.fecha || ""}</td>
          <td><span style="color: ${h.esPago ? '#2e7d32' : '#1565c0'}; font-weight: bold;">${h.tipo || ""}</span></td>
          <td>${h.acta || ""}</td>
          <td>$${h.manoObra.toFixed(2)}</td>
          <td>$${h.movilidad.toFixed(2)}</td>
          <td><strong>$${h.total.toFixed(2)}</strong></td>
        </tr>
      `).join("");
    }
  }
}

function renderInformesGlobales() {
  const tbodyGlobal = document.getElementById("tbody-informe-global");
  const tbodyVenc = document.getElementById("tbody-informe-vencimientos");
  const inputDesde = document.getElementById("filtro-informe-desde");
  const inputHasta = document.getElementById("filtro-informe-hasta");
  if (!tbodyGlobal || !tbodyVenc) return;

  const desde = inputDesde && inputDesde.value ? inputDesde.value : "";
  const hasta = inputHasta && inputHasta.value ? inputHasta.value : "";

  const resumen = {
    Aftosa: { compradas: 0, recepcionadas: 0, devueltas: 0, entregadas: 0, aplicadas: 0 },
    Brucelosis: { compradas: 0, recepcionadas: 0, devueltas: 0, entregadas: 0, aplicadas: 0 }
  };

  movimientos.forEach(m => {
    if (desde && m.fecha < desde) return;
    if (hasta && m.fecha > hasta) return;

    const dosis = Number(m.cantidadDosis) || Number(m.cantidad) || 0;

    if (m.tipo === "compra") {
      if (m.vacuna.toLowerCase().includes("aftosa")) resumen.Aftosa.compradas += dosis;
      if (m.vacuna.toLowerCase().includes("brucelosis")) resumen.Brucelosis.compradas += dosis;
    } else if (m.tipo === "entrega") {
      if (m.vacuna.toLowerCase().includes("aftosa")) resumen.Aftosa.recepcionadas += dosis;
      if (m.vacuna.toLowerCase().includes("brucelosis")) resumen.Brucelosis.recepcionadas += dosis;
    }
  });

  actasRecepcion.forEach(a => {
    if (desde && a.fecha < desde) return;
    if (hasta && a.fecha > hasta) return;
    resumen.Aftosa.devueltas += Number(a.aftDosis) || 0;
    resumen.Brucelosis.devueltas += Number(a.bruDosis) || 0;
  });

  actasEntrega.forEach(a => {
    if (desde && a.fecha < desde) return;
    if (hasta && a.fecha > hasta) return;
    resumen.Aftosa.entregadas += Number(a.aftDosis) || 0;
    resumen.Brucelosis.entregadas += Number(a.bruDosis) || 0;
  });

  vacunaciones.forEach(v => {
    if (v.estado === "anulada") return;
    if (desde && v.fecha < desde) return;
    if (hasta && v.fecha > hasta) return;
    resumen.Aftosa.aplicadas += Number(v.aftosa?.total) || 0;
    resumen.Brucelosis.aplicadas += Number(v.brucelosis?.terneras) || 0;
  });

  const renderFila = (nombre, r) => {
    const enProveedor = r.compradas - r.recepcionadas;
    const enHeladera = r.recepcionadas - r.entregadas + r.devueltas;
    const stockVacunadores = r.entregadas - r.aplicadas - r.devueltas;
    return `
      <tr>
        <td>${nombre}</td>
        <td>${r.compradas}</td>
        <td>${r.recepcionadas}</td>
        <td>${enProveedor}</td>
        <td><strong>${enHeladera}</strong></td>
        <td>${r.entregadas}</td>
        <td>${r.devueltas}</td>
        <td>${r.aplicadas}</td>
        <td><strong>${stockVacunadores}</strong></td>
      </tr>
    `;
  };

  tbodyGlobal.innerHTML = renderFila("Aftosa", resumen.Aftosa) + renderFila("Brucelosis", resumen.Brucelosis);

  // Estadísticas de Establecimientos y UPs en Resumen Global
  const gralUnicosRenspas = new Set();
  const gralUnicosUPs = new Set();
  vacunaciones.forEach(v => {
    if (v.estado === "anulada") return;
    if (desde && v.fecha < desde) return;
    if (hasta && v.fecha > hasta) return;
    if (v.renspa) {
      const full = v.renspa.trim();
      if (full) {
        gralUnicosUPs.add(full);
        const raiz = full.split("/")[0].trim();
        if (raiz) gralUnicosRenspas.add(raiz);
      }
    }
  });
  const elRenspa = document.getElementById("gral-unicos-renspa");
  const elUP = document.getElementById("gral-unicos-up");
  if (elRenspa) elRenspa.textContent = gralUnicosRenspas.size;
  if (elUP) elUP.textContent = gralUnicosUPs.size;

  const lotes = new Map();

  const agregarLoteMap = (vac, mrc, ser, ven, cant) => {
    if (!vac) return;
    const v_name = String(vac).toLowerCase().includes("aftosa") ? "Aftosa" : (String(vac).toLowerCase().includes("brucelosis") ? "Brucelosis" : String(vac));
    const m_name = (mrc || "").trim() || "S/D";
    const s = (ser || "").trim() || "S/D";
    const v = (ven || "").trim() || "S/D";
    
    // Evitar agregar items que no tienen información de serie ni vencimiento
    if (s === "S/D" && v === "S/D") return;

    const key = `${v_name}|${m_name}|${s}|${v}`;
    if (!lotes.has(key)) {
      lotes.set(key, { vacuna: v_name, marca: m_name, serie: s, vencimiento: v, total: 0 });
    }
    lotes.get(key).total += Number(cant) || 0;
  };

  movimientos.forEach(m => {
    if (m.lotes && Array.isArray(m.lotes)) {
      m.lotes.forEach(l => {
        agregarLoteMap(m.vacuna, m.marca, l.serie, l.fechaVencimiento || l.vencimiento, l.cantidad || l.cantidadDosis);
      });
    } else {
      agregarLoteMap(m.vacuna, m.marca, m.serie, m.fechaVencimiento, m.cantidad || m.cantidadDosis);
    }
  });

  actasEntrega.forEach(a => {
    if (a.aftDosis > 0 || (a.aftSerie || "").trim() || (a.aftVenc || "").trim()) {
      agregarLoteMap("Aftosa", a.aftMarca, a.aftSerie, a.aftVenc, a.aftDosis);
    }
    if (a.bruDosis > 0 || (a.bruSerie || "").trim() || (a.bruVenc || "").trim()) {
      agregarLoteMap("Brucelosis", a.bruMarca, a.bruSerie, a.bruVenc, a.bruDosis);
    }
  });

  const arrLotes = Array.from(lotes.values());
  arrLotes.sort((a, b) => {
    if (a.vacuna !== b.vacuna) return a.vacuna.localeCompare(b.vacuna);
    if (a.vencimiento === "S/D") return 1;
    if (b.vencimiento === "S/D") return -1;
    return a.vencimiento.localeCompare(b.vencimiento);
  });

  if (arrLotes.length === 0) {
    tbodyVenc.innerHTML = '<tr><td colspan="5" class="helper-text" style="text-align:center;">No hay lotes registrados.</td></tr>';
  } else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const msPorDia = 1000 * 60 * 60 * 24;

    tbodyVenc.innerHTML = arrLotes.map(L => {
      let diffStr = "-";
      let warning = false;
      if (L.vencimiento !== "S/D") {
        const parts = L.vencimiento.split("-");
        if (parts.length === 3) {
          const vDate = new Date(parts[0], parts[1] - 1, parts[2]);
          const diffDays = Math.ceil((vDate - hoy) / msPorDia);
          diffStr = diffDays.toString();
          if (diffDays <= 30) warning = true;
        }
      }
      const rowStyle = warning ? 'background-color: #ffebee; color: #b71c1c;' : '';
      return `
        <tr style="${rowStyle}">
          <td>${L.vacuna}</td>
          <td>${L.marca}</td>
          <td>${L.serie}</td>
          <td>${L.vencimiento === "S/D" ? "-" : L.vencimiento}</td>
          <td><strong>${diffStr}</strong></td>
          <td>
            <button type="button" class="icon-btn" data-action="edit-lote" data-vacuna="${L.vacuna}" data-marca="${L.marca}" data-serie="${L.serie}" data-venc="${L.vencimiento}" title="Editar Lote">✎</button>
            <button type="button" class="icon-btn icon-danger" data-action="delete-lote" data-vacuna="${L.vacuna}" data-marca="${L.marca}" data-serie="${L.serie}" data-venc="${L.vencimiento}" title="Borrar (Limpiar Serie) Lote">🗑</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Lógica para botones de edición/borrado de lotes en Control de Vencimientos
  tbodyVenc.removeEventListener("click", handleLotesClick); // Evitar duplicar listeners si se llama repetidamente
  tbodyVenc.addEventListener("click", handleLotesClick);
}

function handleLotesClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const oldVacuna = btn.dataset.vacuna;
  const oldMarca = btn.dataset.marca;
  const oldSerie = btn.dataset.serie;
  const oldVenc = btn.dataset.venc;

  const normalizeStr = (str) => (str || "").trim();
  const eq = (a, b) => normalizeStr(a) === normalizeStr(b);
  const eqOrSd = (a, b) => {
    if (normalizeStr(b) === "S/D") return normalizeStr(a) === "";
    return eq(a, b);
  };
  const isMatchMovimiento = (m, pSerie, pVenc) => eqOrSd(m.serie, pSerie) && eqOrSd(m.fechaVencimiento || m.vencimiento, pVenc) && eqOrSd(m.marca, oldMarca) && (String(m.vacuna).toLowerCase() === "aftosa" ? oldVacuna === "Aftosa" : (String(m.vacuna).toLowerCase() === "brucelosis" ? oldVacuna === "Brucelosis" : eq(m.vacuna, oldVacuna)));
  const isMatchLoteArray = (l, m, pSerie, pVenc) => eqOrSd(l.serie, pSerie) && eqOrSd(l.fechaVencimiento || l.vencimiento, pVenc) && eqOrSd(m.marca, oldMarca) && (String(m.vacuna).toLowerCase() === "aftosa" ? oldVacuna === "Aftosa" : (String(m.vacuna).toLowerCase() === "brucelosis" ? oldVacuna === "Brucelosis" : eq(m.vacuna, oldVacuna)));
  const isMatchActaEntregaAftosa = (a, pSerie, pVenc) => eqOrSd(a.aftSerie, pSerie) && eqOrSd(a.aftVenc, pVenc) && eqOrSd(a.aftMarca, oldMarca) && oldVacuna === "Aftosa";
  const isMatchActaEntregaBrucelosis = (a, pSerie, pVenc) => eqOrSd(a.bruSerie, pSerie) && eqOrSd(a.bruVenc, pVenc) && eqOrSd(a.bruMarca, oldMarca) && oldVacuna === "Brucelosis";

  if (btn.dataset.action === "edit-lote") {
    const newSerie = prompt("Ingresá la nueva Serie/Lote:", oldSerie !== "S/D" ? oldSerie : "");
    if (newSerie === null) return; // Cancelado
    const newVenc = prompt("Ingresá el nuevo Vencimiento (YYYY-MM-DD):", oldVenc !== "S/D" ? oldVenc : "");
    if (newVenc === null) return; // Cancelado

    let modificado = false;

    // Actualizar movimientos
    movimientos.forEach(m => {
      if (m.lotes && Array.isArray(m.lotes)) {
        m.lotes.forEach(l => {
          if (isMatchLoteArray(l, m, oldSerie, oldVenc)) {
            l.serie = newSerie;
            if (l.fechaVencimiento !== undefined) l.fechaVencimiento = newVenc;
            if (l.vencimiento !== undefined) l.vencimiento = newVenc;
            modificado = true;
          }
        });
      } else {
        if (isMatchMovimiento(m, oldSerie, oldVenc)) {
          m.serie = newSerie;
          m.fechaVencimiento = newVenc;
          modificado = true;
        }
      }
    });

    // Actualizar Actas de Entrega
    actasEntrega.forEach(a => {
      if (isMatchActaEntregaAftosa(a, oldSerie, oldVenc)) {
        a.aftSerie = newSerie;
        a.aftVenc = newVenc;
        modificado = true;
      }
      if (isMatchActaEntregaBrucelosis(a, oldSerie, oldVenc)) {
        a.bruSerie = newSerie;
        a.bruVenc = newVenc;
        modificado = true;
      }
    });

    if (modificado) {
      guardarMovimientos();
      guardarActasEntrega();
      renderInformesGlobales();
      alert("Lote actualizado exitosamente.");
    } else {
      alert("No se encontró el lote para actualizar.");
    }

  } else if (btn.dataset.action === "delete-lote") {
    if (!confirm(`¿Estás seguro de limpiar la información de este lote (${oldSerie})?\nEsto borrará la serie y el vencimiento de todas las compras y entregas, pero NO modificará las dosis.`)) return;
    
    let modificado = false;

    // Limpiar en movimientos
    movimientos.forEach(m => {
      if (m.lotes && Array.isArray(m.lotes)) {
        m.lotes.forEach(l => {
          if (isMatchLoteArray(l, m, oldSerie, oldVenc)) {
            l.serie = "";
            if (l.fechaVencimiento !== undefined) l.fechaVencimiento = "";
            if (l.vencimiento !== undefined) l.vencimiento = "";
            modificado = true;
          }
        });
      } else {
        if (isMatchMovimiento(m, oldSerie, oldVenc)) {
          m.serie = "";
          m.fechaVencimiento = "";
          modificado = true;
        }
      }
    });

    // Limpiar en Actas de Entrega
    actasEntrega.forEach(a => {
      if (isMatchActaEntregaAftosa(a, oldSerie, oldVenc)) {
        a.aftSerie = "";
        a.aftVenc = "";
        modificado = true;
      }
      if (isMatchActaEntregaBrucelosis(a, oldSerie, oldVenc)) {
        a.bruSerie = "";
        a.bruVenc = "";
        modificado = true;
      }
    });

    if (modificado) {
      guardarMovimientos();
      guardarActasEntrega();
      renderInformesGlobales();
      alert("Información del lote removida exitosamente.");
    } else {
       alert("No se encontró el lote para limpiar.");
    }
  }

  // --- NUEVOS CUADROS GLOBALES (Categorías, Departamentos, Vacunadores) ---
  const tbodyCat = document.getElementById("tbody-informe-categorias");
  const tbodyDep = document.getElementById("tbody-informe-departamentos");
  const tbodyVac = document.getElementById("tbody-informe-vacunadores");

  if (tbodyCat) {
    const sumCat = {
      aftVacas: 0, aftToros: 0, aftVaquillonas: 0, aftNovillos: 0, aftNovillitos: 0, aftToritos: 0, aftTerneras: 0, aftTerneros: 0,
      bruTerneras: 0
    };

    vacunaciones.forEach(v => {
      if (v.estado === "anulada") return;
      if (desde && v.fecha < desde) return;
      if (hasta && v.fecha > hasta) return;

      sumCat.aftVacas += Number(v.aftosa?.vacas) || 0;
      sumCat.aftToros += Number(v.aftosa?.toros) || 0;
      sumCat.aftVaquillonas += Number(v.aftosa?.vaquillonas) || 0;
      sumCat.aftNovillos += Number(v.aftosa?.novillos) || 0;
      sumCat.aftNovillitos += Number(v.aftosa?.novillitos) || 0;
      sumCat.aftToritos += Number(v.aftosa?.toritos) || 0;
      sumCat.aftTerneras += Number(v.aftosa?.terneras) || 0;
      sumCat.aftTerneros += Number(v.aftosa?.terneros) || 0;
      sumCat.bruTerneras += Number(v.brucelosis?.terneras) || 0;
    });

    tbodyCat.innerHTML = `
      <tr>
        <td><strong>Aftosa</strong></td>
        <td>${sumCat.aftVacas}</td>
        <td>${sumCat.aftToros}</td>
        <td>${sumCat.aftVaquillonas}</td>
        <td>${sumCat.aftNovillos}</td>
        <td>${sumCat.aftNovillitos}</td>
        <td>${sumCat.aftToritos}</td>
        <td>${sumCat.aftTerneras}</td>
        <td>${sumCat.aftTerneros}</td>
        <td><strong>${sumCat.aftVacas + sumCat.aftToros + sumCat.aftVaquillonas + sumCat.aftNovillos + sumCat.aftNovillitos + sumCat.aftToritos + sumCat.aftTerneras + sumCat.aftTerneros}</strong></td>
      </tr>
      <tr>
        <td><strong>Brucelosis</strong></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>${sumCat.bruTerneras}</td>
        <td>-</td>
        <td><strong>${sumCat.bruTerneras}</strong></td>
      </tr>
    `;
  }


  if (tbodyDep) {
    const deptos = new Map();
    vacunaciones.forEach(v => {
      if (v.estado === "anulada") return;
      if (desde && v.fecha < desde) return;
      if (hasta && v.fecha > hasta) return;

      // Buscar el departamento cruzando con el ID/Renspa o tomando el string directo (si hubiere)
      // Como no se guarda directamente, buscamos en clientes.
      const renspa = (v.renspa || "").trim().toLowerCase();
      let deptoName = "Sin Departamento";
      const cli = clientes.find(c => (c.renspa || "").trim().toLowerCase() === renspa);
      if (cli && cli.departamento) {
        deptoName = cli.departamento;
      }

      if (!deptos.has(deptoName)) deptos.set(deptoName, { aft: 0, bru: 0 });
      deptos.get(deptoName).aft += Number(v.aftosa?.total) || 0;
      deptos.get(deptoName).bru += Number(v.brucelosis?.terneras) || 0;
    });

    if (deptos.size === 0) {
      tbodyDep.innerHTML = '<tr><td colspan="3" class="helper-text" style="text-align:center;">No hay vacunaciones en el periodo.</td></tr>';
    } else {
      let html = "";
      deptos.forEach((val, key) => {
        html += `<tr><td>${key}</td><td>${val.aft}</td><td>${val.bru}</td></tr>`;
      });
      tbodyDep.innerHTML = html;
    }
  }

  if (tbodyVac) {
    const vMap = new Map();

    actasEntrega.forEach(a => {
      if (desde && a.fecha < desde) return;
      if (hasta && a.fecha > hasta) return;
      if (!vMap.has(a.vacunadorId)) vMap.set(a.vacunadorId, { entAft: 0, entBru: 0, devAft: 0, devBru: 0, aplAft: 0, aplBru: 0, entAftF: 0, entBruF: 0, devAftF: 0, devBruF: 0 });
      vMap.get(a.vacunadorId).entAft += Number(a.aftDosis) || 0;
      vMap.get(a.vacunadorId).entBru += Number(a.bruDosis) || 0;
      vMap.get(a.vacunadorId).entAftF += Number(a.aftFrascos) || 0;
      vMap.get(a.vacunadorId).entBruF += Number(a.bruFrascos) || 0;
    });

    actasRecepcion.forEach(a => {
      if (desde && a.fecha < desde) return;
      if (hasta && a.fecha > hasta) return;
      if (!vMap.has(a.vacunadorId)) vMap.set(a.vacunadorId, { entAft: 0, entBru: 0, devAft: 0, devBru: 0, aplAft: 0, aplBru: 0, entAftF: 0, entBruF: 0, devAftF: 0, devBruF: 0 });
      vMap.get(a.vacunadorId).devAft += Number(a.aftDosis) || 0;
      vMap.get(a.vacunadorId).devBru += Number(a.bruDosis) || 0;
      vMap.get(a.vacunadorId).devAftF += Number(a.aftFrascos) || 0;
      vMap.get(a.vacunadorId).devBruF += Number(a.bruFrascos) || 0;
    });

    vacunaciones.forEach(v => {
      if (v.estado === "anulada") return;
      if (desde && v.fecha < desde) return;
      if (hasta && v.fecha > hasta) return;
      if (!vMap.has(v.vacunadorId)) vMap.set(v.vacunadorId, { entAft: 0, entBru: 0, devAft: 0, devBru: 0, aplAft: 0, aplBru: 0, entAftF: 0, entBruF: 0, devAftF: 0, devBruF: 0 });
      vMap.get(v.vacunadorId).aplAft += Number(v.aftosa?.total) || 0;
      vMap.get(v.vacunadorId).aplBru += Number(v.brucelosis?.terneras) || 0;
    });

    if (vMap.size === 0) {
      tbodyVac.innerHTML = '<tr><td colspan="9" class="helper-text" style="text-align:center;">No hay movimientos en el periodo.</td></tr>';
    } else {
      let html = "";
      vMap.forEach((val, key) => {
        const vacObj = vacunadores.find(x => x.id === key);
        const name = vacObj ? vacObj.nombre : "Desconocido";
        const stAft = val.entAft - val.aplAft - val.devAft;
        const stBru = val.entBru - val.aplBru - val.devBru;
        const stAftF = val.entAftF - val.devAftF;
        const stBruF = val.entBruF - val.devBruF;
        html += `<tr>
          <td>${name}</td>
          <td>${val.entAft} <small>(${val.entAftF} F)</small></td>
          <td>${val.entBru} <small>(${val.entBruF} F)</small></td>
          <td>${val.aplAft}</td>
          <td>${val.aplBru}</td>
          <td>${val.devAft} <small>(${val.devAftF} F)</small></td>
          <td>${val.devBru} <small>(${val.devBruF} F)</small></td>
          <td><strong>${stAft} <small>(${stAftF} F)</small></strong></td>
          <td><strong>${stBru} <small>(${stBruF} F)</small></strong></td>
        </tr>`;
      });
      tbodyVac.innerHTML = html;
    }
  }
}

function renderInformeVacunadorDetalle() {
  const selectVac = document.getElementById("filtro-det-vac-vacunador");
  const inputDesde = document.getElementById("filtro-det-vac-desde");
  const inputHasta = document.getElementById("filtro-det-vac-hasta");
  const contenedor = document.getElementById("resultado-det-vac");

  if (!selectVac || !inputDesde || !inputHasta || !contenedor) return;

  const vId = selectVac.value ? Number(selectVac.value) : null;
  const desde = inputDesde.value;
  const hasta = inputHasta.value;

  if (!vId) {
    alert("Seleccioná un vacunador para generar el informe.");
    return;
  }

  contenedor.classList.remove("hidden");

  const stats = {
    Aftosa: { ent: 0, apl: 0, dev: 0 },
    Brucelosis: { ent: 0, apl: 0, dev: 0 }
  };

  const actsEnt = [];
  const actsUsed = [];
  const actsAnuladas = [];

  actasEntrega.forEach(a => {
    if (a.vacunadorId !== vId) return;
    if (desde && a.fecha < desde) return;
    if (hasta && a.fecha > hasta) return;

    stats.Aftosa.ent += Number(a.aftDosis) || 0;
    stats.Brucelosis.ent += Number(a.bruDosis) || 0;

    if (a.numDesde && a.numHasta) {
      actsEnt.push({ desde: Number(a.numDesde), hasta: Number(a.numHasta), cant: Number(a.cantActas) });
    }
  });

  actasRecepcion.forEach(a => {
    if (a.vacunadorId !== vId) return;
    if (desde && a.fecha < desde) return;
    if (hasta && a.fecha > hasta) return;

    stats.Aftosa.dev += Number(a.aftDosis) || 0;
    stats.Brucelosis.dev += Number(a.bruDosis) || 0;
  });

  vacunaciones.forEach(v => {
    if (v.vacunadorId !== vId) return;
    if (desde && v.fecha < desde) return;
    if (hasta && v.fecha > hasta) return;

    if (v.estado === "anulada") {
      actsAnuladas.push(v);
    } else {
      stats.Aftosa.apl += Number(v.aftosa?.total) || 0;
      stats.Brucelosis.apl += Number(v.brucelosis?.terneras) || 0;
      if (v.acta) actsUsed.push(v.acta);
    }
  });

  // Render Dosis
  const tbodyDosis = document.getElementById("tbody-det-vac-dosis");
  if (tbodyDosis) {
    tbodyDosis.innerHTML = `
      <tr>
        <td>Aftosa</td>
        <td>${stats.Aftosa.ent}</td>
        <td>${stats.Aftosa.apl}</td>
        <td>${stats.Aftosa.dev}</td>
        <td><strong>${stats.Aftosa.ent - stats.Aftosa.apl - stats.Aftosa.dev}</strong></td>
      </tr>
      <tr>
        <td>Brucelosis</td>
        <td>${stats.Brucelosis.ent}</td>
        <td>${stats.Brucelosis.apl}</td>
        <td>${stats.Brucelosis.dev}</td>
        <td><strong>${stats.Brucelosis.ent - stats.Brucelosis.apl - stats.Brucelosis.dev}</strong></td>
      </tr>
    `;
  }

  // Render Acts
  const tbodyActas = document.getElementById("tbody-det-vac-actas");
  if (tbodyActas) {
    const totalEnt = actsEnt.reduce((acc, curr) => acc + curr.cant, 0);
    const ranges = actsEnt.map(r => `${r.desde}-${r.hasta}`).join(", ") || "-";
    const usedCount = actsUsed.length;
    const anuladasCount = actsAnuladas.length;

    tbodyActas.innerHTML = `
      <tr>
        <td>Actas Entregadas (Rangos)</td>
        <td>${ranges}</td>
      </tr>
      <tr>
        <td>Cantidad de Actas Entregadas</td>
        <td>${totalEnt}</td>
      </tr>
      <tr>
        <td>Cantidad de Actas Usadas (Vigentes)</td>
        <td>${usedCount}</td>
      </tr>
      <tr>
        <td>Cantidad de Actas Anuladas</td>
        <td>${anuladasCount}</td>
      </tr>
      <tr>
        <td><strong>Cantidad de Actas Restantes</strong></td>
        <td><strong>${totalEnt - usedCount - anuladasCount}</strong></td>
      </tr>
    `;
  }

  // Render Anuladas
  const tbodyAnuladas = document.getElementById("tbody-det-vac-anuladas");
  if (tbodyAnuladas) {
    if (actsAnuladas.length === 0) {
      tbodyAnuladas.innerHTML = '<tr><td colspan="4" class="helper-text" style="text-align:center;">No hay actas anuladas en este periodo.</td></tr>';
    } else {
      tbodyAnuladas.innerHTML = actsAnuladas.map(a => `
        <tr>
          <td>${a.fecha || ""}</td>
          <td>${a.acta || ""}</td>
          <td>${a.estado || ""}</td>
          <td>${a.observaciones || "-"}</td>
        </tr>
      `).join("");
    }
  }
}

function renderInformeClientesSinVac() {
  const tbody = document.getElementById("tbody-informe-cli-sin-vac");
  if (!tbody) return;

  const desde = document.getElementById("filtro-cli-sin-vac-desde")?.value;
  const hasta = document.getElementById("filtro-cli-sin-vac-hasta")?.value;
  const filtroRenspa = (document.getElementById("filtro-cli-sin-vac-renspa")?.value || "").trim().toLowerCase();
  const filtroNombre = (document.getElementById("filtro-cli-sin-vac-nombre")?.value || "").trim().toLowerCase();

  const vacsFiltradas = vacunaciones.filter(v => {
    if (v.estado === "anulada") return false;
    if (desde && v.fecha < desde) return false;
    if (hasta && v.fecha > hasta) return false;
    return true;
  });

  const renspasVacunados = new Set(vacsFiltradas.map(v => (v.renspa || "").trim().toLowerCase()));

  const clientesSinVac = clientes.filter(c => {
    const renspa = (c.renspa || "").trim().toLowerCase();
    const nombre = (c.nombre || "").trim().toLowerCase();

    if (!renspa) return false;
    if (renspasVacunados.has(renspa)) return false;

    if (filtroRenspa && !renspa.includes(filtroRenspa)) return false;
    if (filtroNombre && !nombre.includes(filtroNombre)) return false;

    return true;
  }).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));

  if (clientesSinVac.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="helper-text" style="text-align:center;">Todos los clientes tienen vacunación registrada en el período.</td></tr>';
    return;
  }

  tbody.innerHTML = clientesSinVac.map(c => {
    let vacunadorDeCliente = "Ninguno";
    if (c.vacunadorId) {
      const vacObj = vacunadores.find(v => v.id === c.vacunadorId);
      if (vacObj) vacunadorDeCliente = vacObj.nombre;
    }
    return `
      <tr>
        <td>${c.renspa || ""}</td>
        <td>${c.nombre || ""}</td>
        <td>${c.documento || ""}</td>
        <td>${c.establecimiento || ""}</td>
        <td>${c.localidad || ""}</td>
        <td>${c.departamento || ""}</td>
        <td>${vacunadorDeCliente}</td>
      </tr>
    `;
  }).join("");
}

function renderInformeClientesVac() {
  const tbody = document.getElementById("tbody-informe-cli-vac");
  if (!tbody) return;

  const campania = document.getElementById("filtro-cli-vac-campania")?.value;
  const anio = document.getElementById("filtro-cli-vac-anio")?.value;
  const desde = document.getElementById("filtro-cli-vac-desde")?.value;
  const hasta = document.getElementById("filtro-cli-vac-hasta")?.value;
  const busqueda = (document.getElementById("filtro-cli-vac-busqueda")?.value || "").toLowerCase();

  const vacsFiltradas = vacunaciones.filter(v => {
    if (v.estado === "anulada") return false;
    if (campania && v.periodo !== campania) return false;
    if (anio && String(v.anio) !== String(anio)) return false;
    if (desde && v.fecha < desde) return false;
    if (hasta && v.fecha > hasta) return false;

    if (busqueda) {
      const matchRenspa = (v.renspa || "").toLowerCase().includes(busqueda);
      const matchNombre = (v.nombreCli || "").toLowerCase().includes(busqueda);
      if (!matchRenspa && !matchNombre) return false;
    }

    return true;
  }).sort((a, b) => {
    if (a.fecha === b.fecha) return (a.id || 0) - (b.id || 0);
    return a.fecha.localeCompare(b.fecha);
  });

  if (vacsFiltradas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="helper-text" style="text-align:center;">No hay clientes vacunados que coincidan con los filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = vacsFiltradas.map(v => {
    const aftTotal = v.aftosa && typeof v.aftosa.total === "number" ? v.aftosa.total : 0;
    const bruTerneras = v.brucelosis && typeof v.brucelosis.terneras === "number" ? v.brucelosis.terneras : 0;
    // Intentar buscar el cliente para traer el establecimiento si no estuviera en vacunacion
    let establecimiento = v.establecimiento || "-";
    if (establecimiento === "-") {
      const cli = clientes.find(c => (c.renspa || "").trim().toLowerCase() === (v.renspa || "").trim().toLowerCase());
      if (cli && cli.establecimiento) establecimiento = cli.establecimiento;
    }

    return `
      <tr>
        <td>${v.fecha || ""}</td>
        <td>${v.acta || ""}</td>
        <td>${v.renspa || ""}</td>
        <td>${v.nombreCli || ""}</td>
        <td>${establecimiento}</td>
        <td>${v.vacunadorNombre || ""}</td>
        <td>${aftTotal}</td>
        <td>${bruTerneras}</td>
      </tr>
    `;
  }).join("");
}

function renderFinanzasGlobales() {
  const tbodyEfectivo = document.getElementById("tbody-finanzas-efectivo");
  const tbodyCheques = document.getElementById("tbody-finanzas-cheques");
  const tbodyTransferencias = document.getElementById("tbody-finanzas-transferencias");
  const tbodyRendiciones = document.getElementById("tbody-finanzas-rendiciones");

  const totalGralElement = document.getElementById("finanzas-total-general");
  const totalEfElement = document.getElementById("finanzas-total-efectivo");
  const totalChElement = document.getElementById("finanzas-total-cheques");
  const totalTrElement = document.getElementById("finanzas-total-transferencias");

  const desde = document.getElementById("filtro-finanzas-desde")?.value;
  const hasta = document.getElementById("filtro-finanzas-hasta")?.value;
  const fFactura = (document.getElementById("filtro-finanzas-factura")?.value || "").toLowerCase();
  const fActa = (document.getElementById("filtro-finanzas-acta")?.value || "").toLowerCase();
  const fRenspa = (document.getElementById("filtro-finanzas-renspa")?.value || "").toLowerCase();
  const fCheque = (document.getElementById("filtro-finanzas-cheque")?.value || "").toLowerCase();
  const fFecCobroDesde = document.getElementById("filtro-finanzas-fec-cobro-desde")?.value;
  const fFecCobroHasta = document.getElementById("filtro-finanzas-fec-cobro-hasta")?.value;

  if (!tbodyEfectivo) return;

  let totEfectivo = 0;
  let totCheques = 0;
  let totTransferencias = 0;

  const filasEfectivo = [];
  const filasCheques = [];
  const filasTransferencias = [];

  // Analizamos los Cobros a Clientes (INGRESOS)
  cobros.forEach(c => {
    const actFec = c.fechaCobro || c.fecha || "";
    const matchRegDate = (!desde || actFec >= desde) && (!hasta || actFec <= hasta);

    let renspa = "-";
    let nombre = "-";
    const vRef = vacunaciones.find(v => String(v.acta).trim() === String(c.acta).trim());
    if (vRef) {
      renspa = vRef.renspa || "-";
      nombre = vRef.nombreCli || "-";
    }

    if (fActa && !String(c.acta).toLowerCase().includes(fActa)) return;
    if (fRenspa && !renspa.toLowerCase().includes(fRenspa)) return;
    const nFact = (vRef?.nroFactura || "-").toLowerCase();
    if (fFactura && !nFact.includes(fFactura)) return;

    // Efectivo
    const impEf = Number(c.importeEfectivo) || 0;
    if (impEf > 0 && matchRegDate) {
      if (!fCheque && !fFecCobroDesde && !fFecCobroHasta) {
        totEfectivo += impEf;
        filasEfectivo.push(`
          <tr>
            <td>${actFec}</td>
            <td>${c.acta}</td>
            <td>${vRef?.nroFactura || "-"}</td>
            <td>${renspa}</td>
            <td>${nombre}</td>
            <td>${c.efectivoDestino || "Caja"}</td>
            <td style="color:#2e7d32;">$${impEf.toFixed(2)}</td>
            <td>
              <button type="button" data-action="edit-fin-cobro" data-id="${c.id}" class="icon-btn" title="Editar">✎</button>
              <button type="button" data-action="delete-fin-cobro" data-id="${c.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
            </td>
          </tr>
        `);
      }
    }

    // Cheques
    if (c.cheques && Array.isArray(c.cheques) && c.cheques.length > 0) {
      c.cheques.forEach(ch => {
        const matchChequeNum = !fCheque || String(ch.numero).toLowerCase().includes(fCheque);
        const dChD = fFecCobroDesde || desde;
        const dChH = fFecCobroHasta || hasta;
        const matchFec = (!dChD || ch.fechaCobro >= dChD) && (!dChH || ch.fechaCobro <= dChH);

        if (matchChequeNum && matchFec) {
          const imp = Number(ch.importe) || 0;
          totCheques += imp;
          filasCheques.push(`
            <tr>
              <td>${actFec}</td>
              <td>${c.acta}</td>
              <td>${vRef?.nroFactura || "-"}</td>
              <td>${renspa}</td>
              <td>${nombre}</td>
              <td>${ch.banco || "-"}</td>
              <td>${ch.numero || "-"}</td>
              <td>${ch.fechaCheque || "-"}</td>
              <td>${ch.fechaCobro || "-"}</td>
              <td>${ch.destino || "-"}</td>
              <td style="color:#2e7d32;">$${imp.toFixed(2)}</td>
              <td>
                <button type="button" data-action="edit-fin-cobro" data-id="${c.id}" class="icon-btn" title="Editar">✎</button>
                <button type="button" data-action="delete-fin-cobro" data-id="${c.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
              </td>
            </tr>
          `);
        }
      });
    }

    // Transferencias
    if (c.transferencias && Array.isArray(c.transferencias) && c.transferencias.length > 0 && matchRegDate) {
      c.transferencias.forEach(t => {
        if (!fCheque && !fFecCobroDesde && !fFecCobroHasta) {
          const imp = Number(t.monto) || 0;
          totTransferencias += imp;
          filasTransferencias.push(`
            <tr>
              <td>${actFec}</td>
              <td>${c.acta}</td>
              <td>${vRef?.nroFactura || "-"}</td>
              <td>${renspa}</td>
              <td>${nombre}</td>
              <td>${t.numero || "-"}</td>
              <td>${t.bancoOrigen || "-"}</td>
              <td>${t.bancoDestino || "-"}</td>
              <td style="color:#2e7d32;">$${imp.toFixed(2)}</td>
              <td>
                <button type="button" data-action="edit-fin-cobro" data-id="${c.id}" class="icon-btn" title="Editar">✎</button>
                <button type="button" data-action="delete-fin-cobro" data-id="${c.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
              </td>
            </tr>
          `);
        }
      });
    }
  });

  // Analizamos los Pagos a Vacunadores (EGRESOS)
  pagosVacunadores.forEach(p => {
    if (p.pagada !== "si") return;
    const actFec = p.fechaPago || p.fecha || "";
    const matchRegDate = (!desde || actFec >= desde) && (!hasta || actFec <= hasta);

    const nombre = p.vacunadorNombre || "-";

    if (fFactura && fFactura !== "-") return;
    if (fRenspa && fRenspa !== "-") return;
    if (fActa) {
      const matchA = p.actas && p.actas.some(a => String(a.acta).toLowerCase().includes(fActa));
      if (!matchA) return;
    }

    // Efectivo
    const impEf = Number(p.importeEfectivo) || 0;
    if (impEf > 0 && matchRegDate) {
      if (!fCheque && !fFecCobroDesde && !fFecCobroHasta) {
        totEfectivo -= impEf;
        filasEfectivo.push(`
          <tr style="background-color: #fff0f0;">
            <td>${actFec}</td>
            <td>PAGO VAC.</td>
            <td>-</td>
            <td>-</td>
            <td>${nombre}</td>
            <td>${p.efectivoDestino || "Caja"}</td>
            <td style="color:#d32f2f;">- $${impEf.toFixed(2)}</td>
            <td>
              <button type="button" data-action="edit-fin-pago" data-id="${p.id}" class="icon-btn" title="Editar">✎</button>
              <button type="button" data-action="delete-fin-pago" data-id="${p.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
            </td>
          </tr>
        `);
      }
    }

    // Cheques
    if (p.cheques && Array.isArray(p.cheques) && p.cheques.length > 0) {
      p.cheques.forEach(ch => {
        const matchChequeNum = !fCheque || String(ch.numero).toLowerCase().includes(fCheque);
        const dChD = fFecCobroDesde || desde;
        const dChH = fFecCobroHasta || hasta;
        const matchFec = (!dChD || ch.fechaCobro >= dChD) && (!dChH || ch.fechaCobro <= dChH);

        if (matchChequeNum && matchFec) {
          const imp = Number(ch.importe) || 0;
          totCheques -= imp;
          filasCheques.push(`
            <tr style="background-color: #fff0f0;">
              <td>${actFec}</td>
              <td>PAGO VAC.</td>
              <td>-</td>
              <td>-</td>
              <td>${nombre}</td>
              <td>${ch.banco || "-"}</td>
              <td>${ch.numero || "-"}</td>
              <td>${ch.fechaCheque || "-"}</td>
              <td>${ch.fechaCobro || "-"}</td>
              <td>${ch.destino || "-"}</td>
              <td style="color:#d32f2f;">- $${imp.toFixed(2)}</td>
              <td>
                <button type="button" data-action="edit-fin-pago" data-id="${p.id}" class="icon-btn" title="Editar">✎</button>
                <button type="button" data-action="delete-fin-pago" data-id="${p.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
              </td>
            </tr>
          `);
        }
      });
    }

    // Transferencias
    if (p.transferencias && Array.isArray(p.transferencias) && p.transferencias.length > 0 && matchRegDate) {
      p.transferencias.forEach(t => {
        if (!fCheque && !fFecCobroDesde && !fFecCobroHasta) {
          const imp = Number(t.monto) || 0;
          totTransferencias -= imp;
          filasTransferencias.push(`
            <tr style="background-color: #fff0f0;">
              <td>${actFec}</td>
              <td>PAGO VAC.</td>
              <td>-</td>
              <td>-</td>
              <td>${nombre}</td>
              <td>${t.numero || "-"}</td>
              <td>${t.bancoOrigen || "-"}</td>
              <td>${t.bancoDestino || "-"}</td>
              <td style="color:#d32f2f;">- $${imp.toFixed(2)}</td>
              <td>
                <button type="button" data-action="edit-fin-pago" data-id="${p.id}" class="icon-btn" title="Editar">✎</button>
                <button type="button" data-action="delete-fin-pago" data-id="${p.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
              </td>
            </tr>
          `);
        }
      });
    }
  });

  if (filasEfectivo.length === 0) tbodyEfectivo.innerHTML = '<tr><td colspan="8" class="helper-text" style="text-align:center;">No hay ingresos en efectivo</td></tr>';
  else tbodyEfectivo.innerHTML = filasEfectivo.join("");

  if (filasCheques.length === 0) tbodyCheques.innerHTML = '<tr><td colspan="12" class="helper-text" style="text-align:center;">No hay ingresos en cheques</td></tr>';
  else tbodyCheques.innerHTML = filasCheques.join("");

  if (filasTransferencias.length === 0) tbodyTransferencias.innerHTML = '<tr><td colspan="10" class="helper-text" style="text-align:center;">No hay ingresos en transferencias</td></tr>';
  else tbodyTransferencias.innerHTML = filasTransferencias.join("");

  totalEfElement.textContent = `$${totEfectivo.toFixed(2)}`;
  totalChElement.textContent = `$${totCheques.toFixed(2)}`;
  totalTrElement.textContent = `$${totTransferencias.toFixed(2)}`;
  totalGralElement.textContent = `$${(totEfectivo + totCheques + totTransferencias).toFixed(2)}`;

  const totalNetoElement = document.getElementById("finanzas-neto-rendiciones");
  const filtroRendTexto = (document.getElementById("filtro-rendiciones-texto")?.value || "").toLowerCase();
  let netoGral = 0;

  // Análisis de Rendiciones Consolidadas (Agrupando Cobros y Pagos)
  const rendMap = new Map();

  // 1. Agrupar Cobros por Rendicion
  cobros.forEach(c => {
    const rNum = c.rendicion || "";
    if (!rNum) return;

    const actFec = c.fechaCobro || c.fecha || "";
    if (desde && actFec && actFec < desde) return;
    if (hasta && actFec && actFec > hasta) return;

    if (!rendMap.has(rNum)) {
      rendMap.set(rNum, { cobros: 0, pagos: 0 });
    }
    const impEf = Number(c.importeEfectivo) || 0;
    const impTr = c.transferencias ? c.transferencias.reduce((s, t) => s + (Number(t.monto) || 0), 0) : 0;
    const impCh = c.cheques ? c.cheques.reduce((s, ch) => s + (Number(ch.importe) || 0), 0) : 0;
    const totalF = impEf + impTr + impCh;
    const impFinal = totalF > 0 ? totalF : (Number(c.importeActa) || 0);
    rendMap.get(rNum).cobros += impFinal;
  });

  // 2. Agrupar Pagos a Vacunadores por Rendicion
  pagosVacunadores.forEach(p => {
    const rNum = p.rendicion || "";
    if (!rNum) return;
    if (p.pagada !== "si") return;

    const actFec = p.fechaPago || p.fecha || "";
    if (desde && actFec && actFec < desde) return;
    if (hasta && actFec && actFec > hasta) return;

    if (!rendMap.has(rNum)) {
      rendMap.set(rNum, { cobros: 0, pagos: 0 });
    }
    const pagoVacu = Number(p.importeTotal) || 0;
    rendMap.get(rNum).pagos += pagoVacu;
  });

  const filasRendiciones = [];
  rendMap.forEach((val, key) => {
    if (filtroRendTexto && !key.toLowerCase().includes(filtroRendTexto)) return;
    const neto = val.cobros - val.pagos;
    netoGral += neto;
    filasRendiciones.push(`
      <tr>
        <td><strong>${key}</strong></td>
        <td>$${val.cobros.toFixed(2)}</td>
        <td style="color:#d32f2f;">- $${val.pagos.toFixed(2)}</td>
        <td><strong>$${neto.toFixed(2)}</strong></td>
        <td>
           <button type="button" class="icon-btn" data-action="ver-detalle-rendicion" data-rend="${key}" title="Ver Detalle / Imprimir">🔎</button>
           <button type="button" class="icon-btn icon-danger" data-action="delete-rendicion" data-rend="${key}" title="Eliminar Rendición (Liberar cobros/pagos)">🗑</button>
        </td>
      </tr>
    `);
  });

  if (totalNetoElement) totalNetoElement.textContent = `$${netoGral.toFixed(2)}`;

  if (filasRendiciones.length === 0) tbodyRendiciones.innerHTML = '<tr><td colspan="5" class="helper-text" style="text-align:center;">No hay rendiciones para el periodo</td></tr>';
  else {
    tbodyRendiciones.innerHTML = filasRendiciones.join("");
    // Registrar eventos para la nueva tabla
    tbodyRendiciones.querySelectorAll('button[data-action="delete-rendicion"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const rNum = btn.dataset.rend;
        if (confirm(`¿Estás seguro de "Eliminar" la Rendición ${rNum}? \n\nEsto solo borrará el número identificador en todos los cobros y pagos asociados, liberándolos para volver a rendirlos. No borra los registros de cobro ni de pago.`)) {
          cobros.forEach(c => { if (c.rendicion === rNum) c.rendicion = ""; });
          pagosVacunadores.forEach(p => { if (p.rendicion === rNum) p.rendicion = ""; });
          guardarCobros();
          guardarPagosVacunadores();
          renderFinanzasGlobales();
          renderCobros(); // Refrescar tablas si están visibles
          renderPagosVacunadores();
          alert(`Rendición ${rNum} eliminada y registros liberados.`);
        }
      });
    });
    // Registrar eventos para ver detalle
    tbodyRendiciones.querySelectorAll('button[data-action="ver-detalle-rendicion"]').forEach(btn => {
      btn.addEventListener("click", () => {
        imprimirDetalleRendicion(btn.dataset.rend);
      });
    });
  }
}

function imprimirDetalleRendicion(rNum) {
  const modal = document.getElementById("modal-detalle-rendicion");
  const titulo = document.getElementById("modal-rend-titulo");
  const body = document.getElementById("modal-rend-body");
  if (!modal || !body) return;

  titulo.textContent = `Detalle de Rendición: ${rNum}`;
  document.body.classList.add("printing-settlement");
  modal.classList.remove("hidden");
  body.innerHTML = "<p>Cargando detalle...</p>";

  const cobrosRend = cobros.filter(c => c.rendicion === rNum);
  const pagosRend = pagosVacunadores.filter(p => p.rendicion === rNum && p.pagada === "si");

  let totalCobros = 0;
  let totalPagos = 0;

  let htmlCobros = `
    <div class="print-only-container">
    <h3 style="text-align: center;">Detalle de Rendición: ${rNum}</h3>
    <h3>Cobros Percibidos</h3>
    <table class="table print-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>N° acta</th>
          <th>N° Factura</th>
          <th>RENSPA</th>
          <th>Nombre</th>
          <th>Importe</th>
          <th>Forma de Pago / Detalle</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (cobrosRend.length === 0) {
    htmlCobros += '<tr><td colspan="7" style="text-align:center;">No hay cobros asociados</td></tr>';
  } else {
    cobrosRend.forEach(c => {
      const impActa = Number(c.importeActa) || 0;
      const impEf = Number(c.importeEfectivo) || 0;
      const impTr = c.transferencias ? c.transferencias.reduce((s, t) => s + (Number(t.monto) || 0), 0) : 0;
      const impCh = c.cheques ? c.cheques.reduce((s, ch) => s + (Number(ch.importe) || 0), 0) : 0;
      const totalF = impEf + impTr + impCh;
      const finalImp = (totalF > 0 ? totalF : impActa);
      totalCobros += finalImp;

      const vRef = vacunaciones.find(v => String(v.acta).trim() === String(c.acta).trim());
      const nroFactura = vRef?.nroFactura || "-";

      let detallePago = "";
      if (c.pagada === "si") {
        const medios = [];
        if (impEf > 0) {
          medios.push(`Efectivo (Destino: ${c.efectivoDestino || "Caja"})`);
        }
        if (c.transferencias && c.transferencias.length > 0) {
          c.transferencias.forEach(t => {
            medios.push(`Transf. $${(Number(t.monto) || 0).toFixed(2)} (N°: ${t.numero || "-"}, Origen: ${t.bancoOrigen || "-"}, Destino: ${t.bancoDestino || "-"})`);
          });
        }
        if (c.cheques && c.cheques.length > 0) {
          c.cheques.forEach(ch => {
            medios.push(`Cheque $${(Number(ch.importe) || 0).toFixed(2)} (Banco: ${ch.banco || "-"}, N°: ${ch.numero || "-"}, F.Cheque: ${ch.fechaCheque || "-"}, F.Cobro: ${ch.fechaCobro || "-"}, Destino: ${ch.destino || "-"})`);
          });
        }
        detallePago = medios.join("<br>");
      } else {
        detallePago = "Pendiente";
      }

      htmlCobros += `
        <tr>
          <td>${c.fechaCobro || ""}</td>
          <td>${c.acta || ""}</td>
          <td>${nroFactura}</td>
          <td>${c.renspa || ""}</td>
          <td>${c.nombre || ""}</td>
          <td>$${finalImp.toFixed(2)}</td>
          <td style="font-size: 0.85rem;">${detallePago}</td>
        </tr>
      `;
    });
  }
  htmlCobros += `
      </tbody>
      <tfoot>
        <tr>
          <th colspan="5">TOTAL COBROS</th>
          <th colspan="2" style="text-align:right; font-size:1.1rem;">$${totalCobros.toFixed(2)}</th>
        </tr>
      </tfoot>
    </table>
  `;

  let htmlPagos = `
    <h3 style="margin-top:30px;">Pagos a Vacunadores</h3>
    <table class="table print-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Vacunador</th>
          <th>Actas</th>
          <th>Mano Obra</th>
          <th>Movilidad</th>
          <th>Importe Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (pagosRend.length === 0) {
    htmlPagos += '<tr><td colspan="6" style="text-align:center;">No hay pagos asociados</td></tr>';
  } else {
    pagosRend.forEach(p => {
      const mano = Number(p.importeManoObra) || 0;
      const mov = Number(p.importeMovilidad) || 0;
      const tot = Number(p.importeTotal) || 0;
      totalPagos += tot;

      let actasStr = "";
      if (Array.isArray(p.actas)) {
        actasStr = p.actas.map(a => a.acta).join(", ");
      } else {
        actasStr = p.acta || "";
      }

      htmlPagos += `
        <tr>
          <td>${p.fechaPago || ""}</td>
          <td>${p.vacunadorNombre || ""}</td>
          <td>${actasStr}</td>
          <td>$${mano.toFixed(2)}</td>
          <td>$${mov.toFixed(2)}</td>
          <td>$${tot.toFixed(2)}</td>
        </tr>
      `;
    });
  }
  htmlPagos += `
      </tbody>
      <tfoot>
        <tr>
          <th colspan="5">TOTAL PAGOS</th>
          <th style="text-align:right; font-size:1.1rem;">$${totalPagos.toFixed(2)}</th>
        </tr>
      </tfoot>
    </table>
  `;

  const saldo = totalCobros - totalPagos;
  const htmlResumen = `
    <div style="margin-top:30px; border:2px solid #ccc; padding:15px; border-radius:8px; background:#f9f9f9;">
      <h3 style="margin-top:0;">Resumen Consolidado</h3>
      <div style="display:flex; justify-content:space-between; font-size:1.2rem;">
        <span>Total Cobros:</span>
        <strong>$${totalCobros.toFixed(2)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:1.2rem; color:#d32f2f;">
        <span>Total Pagos:</span>
        <strong>- $${totalPagos.toFixed(2)}</strong>
      </div>
      <hr>
      <div style="display:flex; justify-content:space-between; font-size:1.5rem; color:#1565c0;">
        <span>SALDO NETO:</span>
        <strong>$${saldo.toFixed(2)}</strong>
      </div>
    </div>
    </div>
  `;

  body.innerHTML = htmlCobros + htmlPagos + htmlResumen;
}

function imprimirCobrosPorForma(forma) {
  const modal = document.getElementById("modal-detalle-rendicion");
  const titulo = document.getElementById("modal-rend-titulo");
  const body = document.getElementById("modal-rend-body");
  if (!modal || !body) return;

  const fDesde = document.getElementById("filtro-finanzas-desde")?.value || "";
  const fHasta = document.getElementById("filtro-finanzas-hasta")?.value || "";
  const fFactura = (document.getElementById("filtro-finanzas-factura")?.value || "").toLowerCase();
  const fActa = (document.getElementById("filtro-finanzas-acta")?.value || "").toLowerCase();
  const fRenspa = (document.getElementById("filtro-finanzas-renspa")?.value || "").toLowerCase();
  const fCheque = (document.getElementById("filtro-finanzas-cheque")?.value || "").toLowerCase();
  const fFecCobro = document.getElementById("filtro-finanzas-fec-cobro")?.value;

  titulo.textContent = `Detalle de Cobros: ${forma.toUpperCase()}`;
  document.body.classList.add("printing-settlement");
  modal.classList.remove("hidden");

  let cobs = cobros.filter(c => c.pagada === "si");
  if (fDesde) cobs = cobs.filter(c => (c.fechaCobro || c.fecha) >= fDesde);
  if (fHasta) cobs = cobs.filter(c => (c.fechaCobro || c.fecha) <= fHasta);
  if (fFecCobro) cobs = cobs.filter(c => (c.fechaCobro || c.fecha) === fFecCobro);
  if (fActa) cobs = cobs.filter(c => String(c.acta).toLowerCase().includes(fActa));

  // Filtrar por RENSPA y Factura (necesitamos vRef)
  cobs = cobs.filter(c => {
    let renspa = "-";
    const vRef = vacunaciones.find(v => String(v.acta).trim() === String(c.acta).trim());
    if (vRef) renspa = (vRef.renspa || "-").toLowerCase();

    if (fRenspa && !renspa.includes(fRenspa)) return false;
    const nFact = (vRef?.nroFactura || "-").toLowerCase();
    if (fFactura && !nFact.includes(fFactura)) return false;
    return true;
  });

  if (forma === "efectivo") {
    cobs = cobs.filter(c => (Number(c.importeEfectivo) || 0) > 0 && !fCheque);
  } else if (forma === "transferencia") {
    cobs = cobs.filter(c => c.transferencias && c.transferencias.some(t => (Number(t.monto) || 0) > 0) && !fCheque);
  } else if (forma === "cheque") {
    cobs = cobs.filter(c => c.cheques && c.cheques.length > 0);
    // Filtrar cobs si algun cheque coincide con fCheque
    if (fCheque) {
      cobs = cobs.filter(c => c.cheques.some(ch => String(ch.numero).toLowerCase().includes(fCheque)));
    }
  }

  let total = 0;
  let html = `<div class="print-only-container">
    <h2 style="text-align: center;">Detalle de Cobros en ${forma.toUpperCase()}</h2>
    <h4 style="text-align: center;">Período: ${fDesde || "S/F"} - ${fHasta || "S/F"}</h4>
    <table class="table print-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Acta</th>
          <th>Factura</th>
          <th>Nombre</th>
          <th>Detalle / Destino</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
  `;

  cobs.forEach(c => {
    let impTotalFila = 0;
    let detFila = "";
    if (forma === "efectivo") {
      impTotalFila = Number(c.importeEfectivo) || 0;
      detFila = `Destino: ${c.efectivoDestino || "Caja"}`;
      total += impTotalFila;
      agregarFila(c, impTotalFila, detFila);
    } else if (forma === "transferencia") {
      if (c.transferencias) {
        c.transferencias.forEach(t => {
          const m = Number(t.monto) || 0;
          total += m;
          agregarFila(c, m, `N° ${t.numero || "-"}, Origen: ${t.bancoOrigen || "-"}, Destino: ${t.bancoDestino || "-"}`);
        });
      }
    } else if (forma === "cheque") {
      if (c.cheques) {
        c.cheques.forEach(ch => {
          if (fCheque && !String(ch.numero).toLowerCase().includes(fCheque)) return;
          const m = Number(ch.importe) || 0;
          total += m;
          agregarFila(c, m, `Ch. ${ch.numero || "-"} (${ch.banco || "-"}), F.Cheque: ${ch.fechaCheque || "-"}, F.Cobro: ${ch.fechaCobro || "-"}, Destino: ${ch.destino || "-"}`);
        });
      }
    }

    function agregarFila(cob, monto, detalle) {
      const vRef = vacunaciones.find(v => String(v.acta).trim() === String(cob.acta).trim());
      const nroFactura = vRef?.nroFactura || "-";
      html += `
        <tr>
          <td>${cob.fechaCobro || ""}</td>
          <td>${cob.acta || ""}</td>
          <td>${nroFactura}</td>
          <td>${cob.nombre || ""}</td>
          <td style="font-size: 0.85rem;">${detalle}</td>
          <td>$${monto.toFixed(2)}</td>
        </tr>
      `;
    }
  });

  html += `</tbody>
      <tfoot>
        <tr>
          <th colspan="5" style="text-align: right;">TOTAL</th>
          <th>$${total.toFixed(2)}</th>
        </tr>
      </tfoot>
    </table>
  </div>`;

  body.innerHTML = html;
}

function cerrarModalRendicion() {
  const modal = document.getElementById("modal-detalle-rendicion");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("printing-settlement");
}

function renderActasEntrega() {
  const tbody = document.getElementById("tbody-entregas");
  if (!tbody) return;
  const filtroActa = (document.getElementById("filtro-ent-acta")?.value || "").toLowerCase();
  const filtroFechaDesde = document.getElementById("filtro-ent-fecha-desde")?.value || "";
  const filtroFechaHasta = document.getElementById("filtro-ent-fecha-hasta")?.value || "";
  const filtroVacunador = document.getElementById("filtro-ent-vacunador")?.value || "";

  const filas = actasEntrega.filter(a => {
    if (filtroActa && !(a.acta && a.acta.toLowerCase().includes(filtroActa))) return false;
    if (filtroFechaDesde && a.fecha < filtroFechaDesde) return false;
    if (filtroFechaHasta && a.fecha > filtroFechaHasta) return false;
    if (filtroVacunador && String(a.vacunadorId).trim() !== filtroVacunador.trim()) return false;
    return true;
  }).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b.id - a.id);

  tbody.innerHTML = "";
  filas.forEach(a => {
    const vac = vacunadores.find(v => v.id === a.vacunadorId);
    const nombreVac = vac ? vac.nombre : "Desconocido";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.fecha || ""}</td>
      <td>${a.acta || ""}</td>
      <td>${nombreVac}</td>
      <td>${a.numDesde ? a.numDesde : ""} - ${a.numHasta ? a.numHasta : ""}</td>
      <td>${a.cantActas || 0}</td>
      <td>${a.aftDosis || 0} / ${a.aftFrascos || 0}</td>
      <td>${a.bruDosis || 0} / ${a.bruFrascos || 0}</td>
      <td>
        <button type="button" data-action="edit-entrega" data-id="${a.id}" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-entrega" data-id="${a.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderActasRecepcion() {
  const tbody = document.getElementById("tbody-recepciones");
  if (!tbody) return;
  const filtroActa = (document.getElementById("filtro-rec-acta")?.value || "").toLowerCase();
  const filtroFechaDesde = document.getElementById("filtro-rec-fecha-desde")?.value || "";
  const filtroFechaHasta = document.getElementById("filtro-rec-fecha-hasta")?.value || "";
  const filtroVacunador = document.getElementById("filtro-rec-vacunador")?.value || "";

  const filas = actasRecepcion.filter(a => {
    if (filtroActa && !(a.acta && a.acta.toLowerCase().includes(filtroActa))) return false;
    if (filtroFechaDesde && a.fecha < filtroFechaDesde) return false;
    if (filtroFechaHasta && a.fecha > filtroFechaHasta) return false;
    if (filtroVacunador && String(a.vacunadorId) !== filtroVacunador) return false;
    return true;
  }).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b.id - a.id);

  tbody.innerHTML = "";
  filas.forEach(a => {
    const vac = vacunadores.find(v => v.id === a.vacunadorId);
    const nombreVac = vac ? vac.nombre : "Desconocido";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.fecha || ""}</td>
      <td>${a.acta || ""}</td>
      <td>${nombreVac}</td>
      <td>${a.cantActas || 0}</td>
      <td>${a.aftDosis || 0} / ${a.aftFrascos || 0}</td>
      <td>${a.bruDosis || 0} / ${a.bruFrascos || 0}</td>
      <td>
        <button type="button" data-action="edit-recepcion" data-id="${a.id}" class="icon-btn" title="Editar">✎</button>
        <button type="button" data-action="delete-recepcion" data-id="${a.id}" class="icon-btn icon-danger" title="Eliminar">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function registrarEventosActas() {
  const entAftDosis = document.getElementById("ent-aft-dosis");
  const entAftFrascos = document.getElementById("ent-aft-frascos");
  const entBruDosis = document.getElementById("ent-bru-dosis");
  const entBruFrascos = document.getElementById("ent-bru-frascos");

  const entAftDosisFrasco = document.getElementById("ent-aft-dosis-frasco");
  const entBruDosisFrasco = document.getElementById("ent-bru-dosis-frasco");

  const calcFrascosAft = () => {
    const v = Number(entAftDosis.value) || 0;
    const df = Number(entAftDosisFrasco.value) || 125;
    entAftFrascos.value = v > 0 ? Math.ceil(v / df) : 0;
  };

  const calcFrascosBru = () => {
    const v = Number(entBruDosis.value) || 0;
    const df = Number(entBruDosisFrasco.value) || 10;
    entBruFrascos.value = v > 0 ? Math.ceil(v / df) : 0;
  };

  if (entAftDosis && entAftFrascos && entAftDosisFrasco) {
    entAftDosis.addEventListener("input", calcFrascosAft);
    entAftDosisFrasco.addEventListener("input", calcFrascosAft);
  }
  if (entBruDosis && entBruFrascos && entBruDosisFrasco) {
    entBruDosis.addEventListener("input", calcFrascosBru);
    entBruDosisFrasco.addEventListener("input", calcFrascosBru);
  }

  const entNumDesde = document.getElementById("ent-num-desde");
  const entNumHasta = document.getElementById("ent-num-hasta");
  const entCantActas = document.getElementById("ent-cant-actas");

  const recalcCantActas = () => {
    const d = Number(entNumDesde.value) || 0;
    const h = Number(entNumHasta.value) || 0;
    if (d > 0 && h >= d) {
      entCantActas.value = h - d + 1;
    } else {
      entCantActas.value = "";
    }
  };

  if (entNumDesde && entNumHasta && entCantActas) {
    entNumDesde.addEventListener("input", recalcCantActas);
    entNumHasta.addEventListener("input", recalcCantActas);
  }

  const entAftMarca = document.getElementById("ent-aft-marca");
  const entAftSerie = document.getElementById("ent-aft-serie");
  const entAftVenc = document.getElementById("ent-aft-venc");

  function autoVencAftosa() {
    const s = entAftSerie?.value.trim() || "";
    const m = entAftMarca?.value.trim() || "";
    if (!s) return;
    const cand = movimientos.filter(x => x.tipo === "compra" && (x.serie || "").trim() === s && (!m || (x.marca || "").trim() === m)).sort((a, b) => b.creadoEn - a.creadoEn);
    if (cand.length && entAftVenc && cand[0].fechaVencimiento) {
      entAftVenc.value = cand[0].fechaVencimiento;
    }
  }
  if (entAftMarca) { entAftMarca.addEventListener("blur", autoVencAftosa); entAftMarca.addEventListener("change", autoVencAftosa); }
  if (entAftSerie) { entAftSerie.addEventListener("blur", autoVencAftosa); entAftSerie.addEventListener("change", autoVencAftosa); }

  const entBruMarca = document.getElementById("ent-bru-marca");
  const entBruSerie = document.getElementById("ent-bru-serie");
  const entBruVenc = document.getElementById("ent-bru-venc");

  function autoVencBrucelosis() {
    const s = entBruSerie?.value.trim() || "";
    const m = entBruMarca?.value.trim() || "";
    if (!s) return;
    const cand = movimientos.filter(x => x.tipo === "compra" && (x.serie || "").trim() === s && (!m || (x.marca || "").trim() === m)).sort((a, b) => b.creadoEn - a.creadoEn);
    if (cand.length && entBruVenc && cand[0].fechaVencimiento) {
      entBruVenc.value = cand[0].fechaVencimiento;
    }
  }
  if (entBruMarca) { entBruMarca.addEventListener("blur", autoVencBrucelosis); entBruMarca.addEventListener("change", autoVencBrucelosis); }
  if (entBruSerie) { entBruSerie.addEventListener("blur", autoVencBrucelosis); entBruSerie.addEventListener("change", autoVencBrucelosis); }

  // Formulario de Entregas
  const formEntrega = document.getElementById("form-actas-entrega");
  if (formEntrega) {
    formEntrega.addEventListener("submit", (e) => {
      e.preventDefault();
      const datos = {
        fecha: formEntrega.fecha.value,
        acta: formEntrega.acta.value,
        vacunadorId: Number(formEntrega.vacunador.value),
        entregador: formEntrega.entregador.value,
        numDesde: Number(formEntrega.numDesde.value) || 0,
        numHasta: Number(formEntrega.numHasta.value) || 0,
        cantActas: Number(formEntrega.cantActas.value) || 0,
        aftDosis: Number(formEntrega.aftDosis.value) || 0,
        aftFrascos: Number(formEntrega.aftFrascos.value) || 0,
        aftDosisFrasco: Number(formEntrega.aftDosisFrasco.value) || 125,
        aftMarca: formEntrega.aftMarca.value,
        aftSerie: formEntrega.aftSerie.value,
        aftVenc: formEntrega.aftVenc.value,
        bruDosis: Number(formEntrega.bruDosis.value) || 0,
        bruFrascos: Number(formEntrega.bruFrascos.value) || 0,
        bruDosisFrasco: Number(formEntrega.bruDosisFrasco.value) || 10,
        bruMarca: formEntrega.bruMarca.value,
        bruSerie: formEntrega.bruSerie.value,
        bruVenc: formEntrega.bruVenc.value
      };

      if (datos.acta) {
        const repetido = actasEntrega.find(a => a.acta === datos.acta && a.id !== actaEntregaEditandoId);
        if (repetido) {
          alert("Ese Número de Acta de Entrega ya existe. No se puede repetir.");
          return;
        }
      }

      if (datos.numDesde || datos.numHasta) {
        if (!datos.numDesde || !datos.numHasta || datos.numDesde > datos.numHasta) {
          alert("Rango de numeración de actas de vacunación inválido.");
          return;
        }
        const ocupados = new Set();
        actasEntrega.forEach(a => {
          if (a.id === actaEntregaEditandoId) return;
          if (a.numDesde && a.numHasta) {
            for (let i = a.numDesde; i <= a.numHasta; i++) ocupados.add(i);
          }
        });
        actasRecepcion.forEach(a => {
          if (a.numDesde && a.numHasta) {
            for (let i = a.numDesde; i <= a.numHasta; i++) ocupados.delete(i);
          }
        });
        for (let i = datos.numDesde; i <= datos.numHasta; i++) {
          if (ocupados.has(i)) {
            alert(`El número de acta ${i} ya fue entregado a un vacunador y no ha sido devuelto en una recepción.`);
            return;
          }
        }
      }

      if (actaEntregaEditandoId) {
        datos.id = actaEntregaEditandoId;
        actasEntrega = actasEntrega.map(a => a.id === actaEntregaEditandoId ? datos : a);
        actaEntregaEditandoId = null;
        const btnSubmit = document.getElementById("btn-submit-entrega");
        if (btnSubmit) btnSubmit.textContent = "Guardar acta de entrega";
        const btnCancel = document.getElementById("btn-cancelar-entrega");
        if (btnCancel) btnCancel.classList.add("hidden");
      } else {
        datos.id = Date.now();
        actasEntrega.push(datos);
        // Guardar persistencia solo en nuevas o ambas, depende, pero guardaremos siempre la ultima enviada
        ultimaActaEntregaData = {
          entregador: datos.entregador,
          aftMarca: datos.aftMarca,
          aftSerie: datos.aftSerie,
          aftVenc: datos.aftVenc,
          bruMarca: datos.bruMarca,
          bruSerie: datos.bruSerie,
          bruVenc: datos.bruVenc
        };
      }
      guardarActasEntrega();
      actualizarListas();
      formEntrega.reset();

      // Reconectar los campos persistentes
      formEntrega.entregador.value = ultimaActaEntregaData.entregador;
      formEntrega.aftMarca.value = ultimaActaEntregaData.aftMarca;
      formEntrega.aftSerie.value = ultimaActaEntregaData.aftSerie;
      formEntrega.aftVenc.value = ultimaActaEntregaData.aftVenc;
      formEntrega.bruMarca.value = ultimaActaEntregaData.bruMarca;
      formEntrega.bruSerie.value = ultimaActaEntregaData.bruSerie;
      formEntrega.bruVenc.value = ultimaActaEntregaData.bruVenc;

      renderActasEntrega();
    });
  }

  document.getElementById("btn-cancelar-entrega")?.addEventListener("click", () => {
    actaEntregaEditandoId = null;
    formEntrega.reset();

    formEntrega.entregador.value = ultimaActaEntregaData.entregador;
    formEntrega.aftMarca.value = ultimaActaEntregaData.aftMarca;
    formEntrega.aftSerie.value = ultimaActaEntregaData.aftSerie;
    formEntrega.aftVenc.value = ultimaActaEntregaData.aftVenc;
    formEntrega.bruMarca.value = ultimaActaEntregaData.bruMarca;
    formEntrega.bruSerie.value = ultimaActaEntregaData.bruSerie;
    formEntrega.bruVenc.value = ultimaActaEntregaData.bruVenc;

    const btnSubmit = document.getElementById("btn-submit-entrega");
    if (btnSubmit) btnSubmit.textContent = "Guardar acta de entrega";
    document.getElementById("btn-cancelar-entrega").classList.add("hidden");
  });

  document.getElementById("tbody-entregas")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "edit-entrega") {
      const acta = actasEntrega.find(a => a.id === id);
      if (!acta) return;
      formEntrega.fecha.value = acta.fecha || "";
      formEntrega.acta.value = acta.acta || "";
      formEntrega.vacunador.value = acta.vacunadorId || "";
      formEntrega.entregador.value = acta.entregador || "";
      formEntrega.numDesde.value = acta.numDesde || "";
      formEntrega.numHasta.value = acta.numHasta || "";
      formEntrega.cantActas.value = acta.cantActas || "";
      formEntrega.aftDosis.value = acta.aftDosis || 0;
      formEntrega.aftFrascos.value = acta.aftFrascos || 0;
      formEntrega.aftDosisFrasco.value = acta.aftDosisFrasco || 125;
      formEntrega.aftMarca.value = acta.aftMarca || "";
      formEntrega.aftSerie.value = acta.aftSerie || "";
      formEntrega.aftVenc.value = acta.aftVenc || "";
      formEntrega.bruDosis.value = acta.bruDosis || 0;
      formEntrega.bruFrascos.value = acta.bruFrascos || 0;
      formEntrega.bruDosisFrasco.value = acta.bruDosisFrasco || 10;
      formEntrega.bruMarca.value = acta.bruMarca || "";
      formEntrega.bruSerie.value = acta.bruSerie || "";
      formEntrega.bruVenc.value = acta.bruVenc || "";

      actaEntregaEditandoId = id;
      document.getElementById("btn-submit-entrega").textContent = "Actualizar acta de entrega";
      document.getElementById("btn-cancelar-entrega").classList.remove("hidden");
      formEntrega.scrollIntoView({ behavior: 'smooth' });
    } else if (btn.dataset.action === "delete-entrega") {
      if (confirm("¿Estás seguro de eliminar esta acta de entrega?")) {
        actasEntrega = actasEntrega.filter(a => a.id !== id);
        guardarActasEntrega();
        renderActasEntrega();
      }
    }
  });

  // Filtros Entrega
  document.getElementById("filtro-ent-acta")?.addEventListener("input", renderActasEntrega);
  document.getElementById("filtro-ent-fecha-desde")?.addEventListener("change", renderActasEntrega);
  document.getElementById("filtro-ent-fecha-hasta")?.addEventListener("change", renderActasEntrega);
  document.getElementById("filtro-ent-vacunador")?.addEventListener("change", renderActasEntrega);

  // Informe Clientes
  document.getElementById("btn-generar-cli-sin-vac")?.addEventListener("click", renderInformeClientesSinVac);
  document.getElementById("filtro-cli-sin-vac-renspa")?.addEventListener("input", renderInformeClientesSinVac);
  document.getElementById("filtro-cli-sin-vac-nombre")?.addEventListener("input", renderInformeClientesSinVac);

  const inputAnioVac = document.getElementById("filtro-cli-vac-anio");
  if (inputAnioVac) {
    inputAnioVac.value = new Date().getFullYear();
  }
  document.getElementById("btn-generar-cli-vac")?.addEventListener("click", renderInformeClientesVac);

  // Informe Finanzas
  document.getElementById("btn-generar-finanzas")?.addEventListener("click", renderFinanzasGlobales);
  document.getElementById("filtro-rendiciones-texto")?.addEventListener("input", renderFinanzasGlobales);

  // Formulario de Recepción
  const formRecepcion = document.getElementById("form-actas-recepcion");
  if (formRecepcion) {
    formRecepcion.addEventListener("submit", (e) => {
      e.preventDefault();
      const datos = {
        fecha: formRecepcion.fecha.value,
        acta: formRecepcion.acta.value,
        vacunadorId: Number(formRecepcion.vacunador.value),
        recibidor: formRecepcion.recibidor.value,
        numDesde: Number(formRecepcion.numDesde.value) || 0,
        numHasta: Number(formRecepcion.numHasta.value) || 0,
        cantActas: Number(formRecepcion.cantActas.value) || 0,
        aftDosis: Number(formRecepcion.aftDosis.value) || 0,
        aftFrascos: Number(formRecepcion.aftFrascos.value) || 0,
        bruDosis: Number(formRecepcion.bruDosis.value) || 0,
        bruFrascos: Number(formRecepcion.bruFrascos.value) || 0
      };

      if (actaRecepcionEditandoId) {
        datos.id = actaRecepcionEditandoId;
        actasRecepcion = actasRecepcion.map(a => a.id === actaRecepcionEditandoId ? datos : a);
        actaRecepcionEditandoId = null;
        const btnSubmit = document.getElementById("btn-submit-recepcion");
        if (btnSubmit) btnSubmit.textContent = "Guardar acta de recepción";
        const btnCancel = document.getElementById("btn-cancelar-recepcion");
        if (btnCancel) btnCancel.classList.add("hidden");
      } else {
        datos.id = Date.now();
        actasRecepcion.push(datos);
        ultimaActaRecepcionData = { recibidor: datos.recibidor };
      }
      guardarActasRecepcion();
      actualizarListas();
      formRecepcion.reset();

      formRecepcion.recibidor.value = ultimaActaRecepcionData.recibidor;

      renderActasRecepcion();
    });
  }

  document.getElementById("btn-cancelar-recepcion")?.addEventListener("click", () => {
    actaRecepcionEditandoId = null;
    formRecepcion.reset();
    formRecepcion.recibidor.value = ultimaActaRecepcionData.recibidor;

    const btnSubmit = document.getElementById("btn-submit-recepcion");
    if (btnSubmit) btnSubmit.textContent = "Guardar acta de recepción";
    document.getElementById("btn-cancelar-recepcion").classList.add("hidden");
  });

  document.getElementById("tbody-recepciones")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "edit-recepcion") {
      const acta = actasRecepcion.find(a => a.id === id);
      if (!acta) return;
      formRecepcion.fecha.value = acta.fecha || "";
      formRecepcion.acta.value = acta.acta || "";
      formRecepcion.vacunador.value = acta.vacunadorId || "";
      formRecepcion.recibidor.value = acta.recibidor || "";
      formRecepcion.numDesde.value = acta.numDesde || "";
      formRecepcion.numHasta.value = acta.numHasta || "";
      formRecepcion.cantActas.value = acta.cantActas || "";
      formRecepcion.aftDosis.value = acta.aftDosis || 0;
      formRecepcion.aftFrascos.value = acta.aftFrascos || 0;
      formRecepcion.bruDosis.value = acta.bruDosis || 0;
      formRecepcion.bruFrascos.value = acta.bruFrascos || 0;

      actaRecepcionEditandoId = id;
      document.getElementById("btn-submit-recepcion").textContent = "Actualizar acta de recepción";
      document.getElementById("btn-cancelar-recepcion").classList.remove("hidden");
      formRecepcion.scrollIntoView({ behavior: 'smooth' });
    } else if (btn.dataset.action === "delete-recepcion") {
      if (confirm("¿Estás seguro de eliminar esta acta de recepción?")) {
        actasRecepcion = actasRecepcion.filter(a => a.id !== id);
        guardarActasRecepcion();
        renderActasRecepcion();
      }
    }
  });

  // Filtros Recepción
  document.getElementById("filtro-rec-acta")?.addEventListener("input", renderActasRecepcion);
  document.getElementById("filtro-rec-fecha-desde")?.addEventListener("change", renderActasRecepcion);
  document.getElementById("filtro-rec-fecha-hasta")?.addEventListener("change", renderActasRecepcion);
  document.getElementById("filtro-rec-vacunador")?.addEventListener("change", renderActasRecepcion);

  // Filtro Dashboard Vacunador
  document.getElementById("filtro-vacunador-dashboard")?.addEventListener("change", renderDashboardVacunador);
  document.getElementById("filtro-dash-vac-acta")?.addEventListener("input", renderDashboardVacunador);
  document.getElementById("filtro-dash-vac-desde")?.addEventListener("change", renderDashboardVacunador);
  document.getElementById("filtro-dash-vac-hasta")?.addEventListener("change", renderDashboardVacunador);

  // Generar Informe
  document.getElementById("btn-generar-informe")?.addEventListener("click", renderInformesGlobales);
  document.getElementById("btn-generar-campania")?.addEventListener("click", renderInformeCampania);
}

function renderInformeCampania() {
  const inputInicio = document.getElementById("filtro-campania-inicio");
  const inputFin = document.getElementById("filtro-campania-fin");
  if (!inputInicio || !inputFin) return;

  const fechaInicio = inputInicio.value;
  const fechaFin = inputFin.value;

  if (!fechaInicio || !fechaFin) {
    alert("Completá ambas fechas para generar el Informe de Campaña.");
    return;
  }
  if (fechaInicio > fechaFin) {
    alert("La Fecha de Inicio no puede ser mayor a la Fecha de Fin.");
    return;
  }

  const getStockAtDate = (dateLimit, inclusive) => {
    let provAft = 0, provBru = 0;
    let helAft = 0, helBru = 0;
    let vacAft = 0, vacBru = 0;

    movimientos.forEach(m => {
      // Si inclusive=false (Stock Inicial), ignoramos fechas MAYORES o IGUALES al inicio
      if (!inclusive && typeof m.fecha === 'string' && m.fecha >= dateLimit) return;
      // Si inclusive=true (Stock Final), ignoramos fechas MAYORES al fin
      if (inclusive && typeof m.fecha === 'string' && m.fecha > dateLimit) return;

      const dosis = Number(m.cantidadDosis) || Number(m.cantidad) || 0;
      if (m.tipo === "compra") {
        if (m.vacuna.toLowerCase().includes("aftosa")) provAft += dosis;
        if (m.vacuna.toLowerCase().includes("brucelosis")) provBru += dosis;
      } else if (m.tipo === "entrega") {
        if (m.vacuna.toLowerCase().includes("aftosa")) {
          provAft -= dosis;
          helAft += dosis;
        }
        if (m.vacuna.toLowerCase().includes("brucelosis")) {
          provBru -= dosis;
          helBru += dosis;
        }
      }
    });

    actasEntrega.forEach(a => {
      if (!inclusive && typeof a.fecha === 'string' && a.fecha >= dateLimit) return;
      if (inclusive && typeof a.fecha === 'string' && a.fecha > dateLimit) return;
      helAft -= (Number(a.aftDosis) || 0);
      helBru -= (Number(a.bruDosis) || 0);
      vacAft += (Number(a.aftDosis) || 0);
      vacBru += (Number(a.bruDosis) || 0);
    });

    actasRecepcion.forEach(a => {
      if (!inclusive && typeof a.fecha === 'string' && a.fecha >= dateLimit) return;
      if (inclusive && typeof a.fecha === 'string' && a.fecha > dateLimit) return;
      vacAft -= (Number(a.aftDosis) || 0);
      vacBru -= (Number(a.bruDosis) || 0);
      helAft += (Number(a.aftDosis) || 0);
      helBru += (Number(a.bruDosis) || 0);
    });

    vacunaciones.forEach(v => {
      if (!inclusive && typeof v.fecha === 'string' && v.fecha >= dateLimit) return;
      if (inclusive && typeof v.fecha === 'string' && v.fecha > dateLimit) return;
      vacAft -= (Number(v.aftosa?.total) || 0);
      vacBru -= (Number(v.brucelosis?.terneras) || 0);
    });

    return { provAft, provBru, helAft, helBru, vacAft, vacBru };
  };

  const inicial = getStockAtDate(fechaInicio, false);
  const final = getStockAtDate(fechaFin, true);

  const tbodyIni = document.getElementById("tbody-campania-inicial");
  const tbodyFin = document.getElementById("tbody-campania-final");

  if (tbodyIni) {
    tbodyIni.innerHTML = `
      <tr>
        <td>Proveedores (Sin Entregar)</td>
        <td>${inicial.provAft}</td>
        <td>${inicial.provBru}</td>
      </tr>
      <tr>
        <td>Heladera</td>
        <td>${inicial.helAft}</td>
        <td>${inicial.helBru}</td>
      </tr>
      <tr>
        <td>Stock Vacunadores</td>
        <td>${inicial.vacAft}</td>
        <td>${inicial.vacBru}</td>
      </tr>
      <tr style="background:#e3f2fd; font-weight:bold;">
        <td>TOTAL INICIAL</td>
        <td>${inicial.provAft + inicial.helAft + inicial.vacAft}</td>
        <td>${inicial.provBru + inicial.helBru + inicial.vacBru}</td>
      </tr>
    `;
  }

  if (tbodyFin) {
    tbodyFin.innerHTML = `
      <tr>
        <td>Proveedores (Sin Entregar)</td>
        <td>${final.provAft}</td>
        <td>${final.provBru}</td>
      </tr>
      <tr>
        <td>Heladera</td>
        <td>${final.helAft}</td>
        <td>${final.helBru}</td>
      </tr>
      <tr>
        <td>Stock Vacunadores</td>
        <td>${final.vacAft}</td>
        <td>${final.vacBru}</td>
      </tr>
      <tr style="background:#e3f2fd; font-weight:bold;">
        <td>TOTAL FINAL</td>
        <td>${final.provAft + final.helAft + final.vacAft}</td>
        <td>${final.provBru + final.helBru + final.vacBru}</td>
      </tr>
    `;
  }

  const unicosRenspas = new Set();
  const unicosUPs = new Set();

  vacunaciones.forEach(v => {
    if (v.fecha >= fechaInicio && v.fecha <= fechaFin) {
      if (v.renspa) {
        const renspaCompleto = v.renspa.trim();
        if (renspaCompleto) {
          unicosUPs.add(renspaCompleto);
          const parts = renspaCompleto.split('/');
          if (parts[0]) unicosRenspas.add(parts[0].trim());
        }
      }
    }
  });

  document.getElementById("campania-establecimientos").textContent = unicosRenspas.size;
  document.getElementById("campania-ups").textContent = unicosUPs.size;
}

function renderLotesCompraTemporales() {
  const tbody = document.getElementById("tbody-compra-lotes");
  if (!tbody) return;
  tbody.innerHTML = "";
  lotesCompraTemporales.forEach((l, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.serie || ""}</td>
      <td>${l.fechaVencimiento || ""}</td>
      <td>${l.cantidad || 0}</td>
      <td style="text-align: right;">
        <button type="button" class="icon-btn icon-danger" onclick="quitarLoteCompra(${index})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function quitarLoteCompra(index) {
  lotesCompraTemporales.splice(index, 1);
  renderLotesCompraTemporales();
}

function initialize() {
  cargarDesdeStorage();
  registrarEventos();
  registrarEventosActas();
  activateSection("proveedores");
  actualizarListas();
  renderResumenGlobalVacunas();
  renderResumenPorVacunaGlobal();
  renderListaProveedores();
  renderProveedores();
  actualizarListasClientes();
  renderClientes();
  aplicarValoresPorDefectoCliente();
  aplicarValoresPorDefectoVacunacion();
  renderVacunadores();
  renderResumenYMovimientos();
  renderHistorial();
  renderPrecios();
  renderHistorialPrecios();
  renderCobros();
  renderActasPendientesCobro();
  renderActasPorVacunador();
  renderPagosVacunadores();
  renderPagoVacSeleccion();
  actualizarDatalistDestinos();
  const inputEntFecha = document.getElementById("ent-fecha");
  const inputRecFecha = document.getElementById("rec-fecha");
  if (inputEntFecha && !inputEntFecha.value) {
    inputEntFecha.valueAsDate = new Date();
  }
  if (inputRecFecha && !inputRecFecha.value) {
    inputRecFecha.valueAsDate = new Date();
  }

  renderActasEntrega();
  renderActasRecepcion();

  const inputFactura = document.getElementById("fact-nro-factura");
  if (inputFactura) {
    if (!inputFactura.value) inputFactura.value = "00006-";
    inputFactura.addEventListener("input", (e) => {
      let val = e.target.value.replace(/[^-0-9]/g, "");
      if (val.length > 5 && val[5] !== "-") {
        val = val.slice(0, 5) + "-" + val.slice(5);
      }
      e.target.value = val.slice(0, 14).toUpperCase();
    });
    const btnFin = document.getElementById("btn-generar-finanzas");
    if (btnFin) {
      btnFin.addEventListener("click", renderFinanzasGlobales);
    }
    ["filtro-finanzas-desde", "filtro-finanzas-hasta", "filtro-finanzas-factura", "filtro-finanzas-acta", "filtro-finanzas-renspa", "filtro-finanzas-cheque", "filtro-finanzas-fec-cobro-desde", "filtro-finanzas-fec-cobro-hasta", "filtro-finanzas-venc-desde", "filtro-finanzas-venc-hasta"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const ev = el.tagName === "INPUT" && (el.type === "text" || el.type === "number") ? "input" : "change";
        el.addEventListener(ev, renderFinanzasGlobales);
      }
    });
    document.getElementById("btn-limpiar-finanzas")?.addEventListener("click", () => {
      ["filtro-finanzas-desde", "filtro-finanzas-hasta", "filtro-finanzas-factura", "filtro-finanzas-acta", "filtro-finanzas-renspa", "filtro-finanzas-cheque", "filtro-finanzas-fec-cobro-desde", "filtro-finanzas-fec-cobro-hasta"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      renderFinanzasGlobales();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
