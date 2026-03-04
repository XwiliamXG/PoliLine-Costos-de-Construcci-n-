/**
 * calculadora-logica.js
 * Lógica de negocio para la Calculadora de Costos de Construcción
 * Santiago de Surco, Lima - Perú (2024)
 */

// ─────────────────────────────────────────────
// TABLA DE PRECIOS REFERENCIALES (S/. 2024)
// ─────────────────────────────────────────────
const PRECIOS = {
  calidad: {
    economica: 3500,
    estandar:  4500,
    premium:   6000,
    lujo:      8000,
  },

  sotano: {
    estacionamiento: 2800,
    mixto:           3200,
    comercial:       3800,
  },

  acabados: {
    basicos:   0.85,
    estandar:  1.00,
    altos:     1.25,
    lujo:      1.60,
  },

  servicios: {
    ascensor:          80_000,
    electrogeno:       35_000,
    seguridad:         15_000,
    panelesSolares:    25_000,
  },

  licencias: {
    licenciaObra:   0.030,  // 3 %
    municipal:      0.020,  // 2 %
    servicios:      0.015,  // 1.5 %
  },
};

// Constantes del proyecto (fijas)
const NUM_PISOS   = 5;
const NUM_SOTANOS = 2;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Formatea un número como moneda peruana: S/ 1,234,567
 * @param {number} monto
 * @returns {string}
 */
function formatearMoneda(monto) {
  return 'S/ ' + Math.round(monto).toLocaleString('es-PE');
}

/**
 * Calcula el tiempo de construcción estimado en meses.
 * Fórmula base: 8 meses fijos + 0.5 mes por cada 100 m² totales.
 * @param {number} areaTotalM2
 * @returns {number}
 */
function calcularTiempoObra(areaTotalM2) {
  return Math.round(8 + (areaTotalM2 / 100) * 0.5);
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL DE CÁLCULO
// ─────────────────────────────────────────────

/**
 * Calcula el costo total del proyecto según los parámetros ingresados.
 *
 * @param {object} params
 * @param {number}  params.areaPorPiso       - m² por planta
 * @param {string}  params.calidad           - 'economica' | 'estandar' | 'premium' | 'lujo'
 * @param {string}  params.usoSotano         - 'estacionamiento' | 'mixto' | 'comercial'
 * @param {string}  params.acabados          - 'basicos' | 'estandar' | 'altos' | 'lujo'
 * @param {object}  params.serviciosExtras   - { ascensor, electrogeno, seguridad, panelesSolares }
 * @param {boolean} params.incluirLicencias  - true = se suman al total
 *
 * @returns {object} Desglose completo y totales
 */
function calcularCosto(params) {
  const {
    areaPorPiso,
    calidad,
    usoSotano,
    acabados,
    serviciosExtras = {},
    incluirLicencias = true,
  } = params;

  // ── Áreas ──────────────────────────────────
  const areaPisos   = areaPorPiso * NUM_PISOS;
  const areaSotanos = areaPorPiso * NUM_SOTANOS;
  const areaTotal   = areaPisos + areaSotanos;

  // ── Precios base ───────────────────────────
  const precioCalidadM2  = PRECIOS.calidad[calidad]   ?? PRECIOS.calidad.estandar;
  const precioSotanoM2   = PRECIOS.sotano[usoSotano]  ?? PRECIOS.sotano.mixto;
  const multAcabados     = PRECIOS.acabados[acabados] ?? PRECIOS.acabados.estandar;

  // ── Costos de pisos (estructura 60% / acabados 40%) ──
  const costoEstructura = areaPisos * precioCalidadM2 * 0.60 * multAcabados;
  const costoAcabados   = areaPisos * precioCalidadM2 * 0.40 * multAcabados;

  // ── Sótanos ────────────────────────────────
  const costoSotanos = areaSotanos * precioSotanoM2 * multAcabados;

  // ── Servicios adicionales ──────────────────
  let costoServicios = 0;
  const detalleServicios = {};

  for (const [clave, precio] of Object.entries(PRECIOS.servicios)) {
    if (serviciosExtras[clave]) {
      costoServicios += precio;
      detalleServicios[clave] = precio;
    }
  }

  // ── Subtotal antes de licencias ────────────
  const subtotal = costoEstructura + costoAcabados + costoSotanos + costoServicios;

  // ── Licencias y permisos ───────────────────
  const tasaLicencias =
    PRECIOS.licencias.licenciaObra +
    PRECIOS.licencias.municipal    +
    PRECIOS.licencias.servicios;

  const costoLicencias = incluirLicencias ? subtotal * tasaLicencias : 0;

  // ── Total general ──────────────────────────
  const total = subtotal + costoLicencias;

  // ── Costo por m² total ─────────────────────
  const costoPorM2 = total / areaTotal;

  // ── Porcentajes para barras de progreso ────
  const porcentajes = {
    estructura: (costoEstructura / total) * 100,
    acabados:   (costoAcabados   / total) * 100,
    sotanos:    (costoSotanos    / total) * 100,
    servicios:  (costoServicios  / total) * 100,
    licencias:  (costoLicencias  / total) * 100,
  };

  return {
    // Áreas
    areaPisos,
    areaSotanos,
    areaTotal,

    // Costos individuales
    costoEstructura,
    costoAcabados,
    costoSotanos,
    costoServicios,
    detalleServicios,
    costoLicencias,

    // Totales
    subtotal,
    total,
    costoPorM2,

    // Auxiliares para UI
    porcentajes,
    tiempoObrasMeses: calcularTiempoObra(areaTotal),

    // Texto formateado listo para mostrar
    formato: {
      total:           formatearMoneda(total),
      costoPorM2:      formatearMoneda(costoPorM2) + '/m²',
      costoEstructura: formatearMoneda(costoEstructura),
      costoAcabados:   formatearMoneda(costoAcabados),
      costoSotanos:    formatearMoneda(costoSotanos),
      costoServicios:  formatearMoneda(costoServicios),
      costoLicencias:  formatearMoneda(costoLicencias),
      areaTotal:       areaTotal.toLocaleString('es-PE') + ' m²',
    },
  };
}

// ─────────────────────────────────────────────
// EXPORTAR (compatible con ES Modules y <script>)
// ─────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  // Node / CommonJS
  module.exports = { calcularCosto, formatearMoneda, calcularTiempoObra, PRECIOS };
} else if (typeof window !== 'undefined') {
  // Navegador: expone globalmente
  window.CalculadoraLogica = { calcularCosto, formatearMoneda, calcularTiempoObra, PRECIOS };
}
