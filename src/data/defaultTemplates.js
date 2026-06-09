/**
 * Plantillas base por rubro.
 *
 * Cada entrada define los ítems sugeridos para un rubro específico.
 * Los precios se dejan en 0 para que el usuario los complete según su zona/tarifa.
 * Las plantillas NO se usan directamente: se copian a Firestore del usuario
 * para que pueda editarlas sin afectar el modelo original.
 */

/** @typedef {{ name: string, defaultPrice: number, unit: string }} TemplateItem */
/** @typedef {{ key: string, name: string, category: string, items: TemplateItem[] }} DefaultTemplate */

/** @type {Record<string, DefaultTemplate>} */
export const DEFAULT_TEMPLATES = {
  mecanico: {
    key: 'mecanico',
    name: 'Servicios de Mecánica',
    category: 'Mecánica',
    items: [
      { name: 'Cambio de aceite y filtro', defaultPrice: 0, unit: 'servicio' },
      { name: 'Cambio de pastillas de freno', defaultPrice: 0, unit: 'servicio' },
      { name: 'Alineación y balanceo', defaultPrice: 0, unit: 'servicio' },
      { name: 'Diagnóstico electrónico', defaultPrice: 0, unit: 'servicio' },
      { name: 'Cambio de correa de distribución', defaultPrice: 0, unit: 'servicio' },
      { name: 'Mano de obra por hora', defaultPrice: 0, unit: 'hora' },
    ],
  },

  costurero: {
    key: 'costurero',
    name: 'Servicios de Costura',
    category: 'Costura',
    items: [
      { name: 'Arreglo de ruedo', defaultPrice: 0, unit: 'prenda' },
      { name: 'Cambio de cierre', defaultPrice: 0, unit: 'prenda' },
      { name: 'Confección de prenda simple', defaultPrice: 0, unit: 'unidad' },
      { name: 'Confección de prenda compleja', defaultPrice: 0, unit: 'unidad' },
      { name: 'Ajuste de talle', defaultPrice: 0, unit: 'prenda' },
      { name: 'Bordado / aplique', defaultPrice: 0, unit: 'unidad' },
    ],
  },

  developer: {
    key: 'developer',
    name: 'Servicios de Desarrollo',
    category: 'Desarrollo de Software',
    items: [
      { name: 'Hora de desarrollo', defaultPrice: 0, unit: 'hora' },
      { name: 'Landing page', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Sitio web (hasta 5 páginas)', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Integración de API', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Corrección de bugs', defaultPrice: 0, unit: 'hora' },
      { name: 'Mantenimiento mensual', defaultPrice: 0, unit: 'mes' },
    ],
  },

  disenador: {
    key: 'disenador',
    name: 'Servicios de Diseño',
    category: 'Diseño Gráfico',
    items: [
      { name: 'Diseño de logo', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Identidad visual completa', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Pieza para redes sociales', defaultPrice: 0, unit: 'unidad' },
      { name: 'Pack de contenido mensual', defaultPrice: 0, unit: 'mes' },
      { name: 'Diseño de flyer / afiche', defaultPrice: 0, unit: 'unidad' },
      { name: 'Hora de diseño', defaultPrice: 0, unit: 'hora' },
    ],
  },

  community: {
    key: 'community',
    name: 'Community Management',
    category: 'Community Manager',
    items: [
      { name: 'Gestión mensual de redes (1 red)', defaultPrice: 0, unit: 'mes' },
      { name: 'Gestión mensual de redes (2 redes)', defaultPrice: 0, unit: 'mes' },
      { name: 'Creación de contenido (por post)', defaultPrice: 0, unit: 'unidad' },
      { name: 'Campaña de publicidad', defaultPrice: 0, unit: 'campaña' },
      { name: 'Informe de métricas mensual', defaultPrice: 0, unit: 'mes' },
      { name: 'Estrategia de contenido', defaultPrice: 0, unit: 'proyecto' },
    ],
  },

  albanil: {
    key: 'albanil',
    name: 'Servicios de Albañilería',
    category: 'Albañilería',
    items: [
      { name: 'Mano de obra por m²', defaultPrice: 0, unit: 'm2' },
      { name: 'Mano de obra por hora', defaultPrice: 0, unit: 'hora' },
      { name: 'Colocación de cerámico', defaultPrice: 0, unit: 'm2' },
      { name: 'Reparación de pared', defaultPrice: 0, unit: 'servicio' },
      { name: 'Revoque fino', defaultPrice: 0, unit: 'm2' },
      { name: 'Contrapiso', defaultPrice: 0, unit: 'm2' },
    ],
  },

  fotografo: {
    key: 'fotografo',
    name: 'Servicios de Fotografía',
    category: 'Fotografía',
    items: [
      { name: 'Sesión de fotos (2 horas)', defaultPrice: 0, unit: 'servicio' },
      { name: 'Sesión de fotos (jornada completa)', defaultPrice: 0, unit: 'servicio' },
      { name: 'Edición de fotos (por hora)', defaultPrice: 0, unit: 'hora' },
      { name: 'Pack de fotos editadas (20 imágenes)', defaultPrice: 0, unit: 'pack' },
      { name: 'Fotografía de producto', defaultPrice: 0, unit: 'sesión' },
      { name: 'Video clip (hasta 3 min)', defaultPrice: 0, unit: 'proyecto' },
    ],
  },

  dj: {
    key: 'dj',
    name: 'Servicios de DJ / Sonido',
    category: 'DJ / Sonido',
    items: [
      { name: 'DJ set (4 horas)', defaultPrice: 0, unit: 'servicio' },
      { name: 'DJ set (hora adicional)', defaultPrice: 0, unit: 'hora' },
      { name: 'Equipo de sonido (alquiler)', defaultPrice: 0, unit: 'evento' },
      { name: 'Iluminación (alquiler)', defaultPrice: 0, unit: 'evento' },
      { name: 'Sonorización de evento', defaultPrice: 0, unit: 'evento' },
      { name: 'Traslado de equipos', defaultPrice: 0, unit: 'viaje' },
    ],
  },

  jardinero: {
    key: 'jardinero',
    name: 'Servicios de Jardinería',
    category: 'Jardinería',
    items: [
      { name: 'Mantenimiento mensual de jardín', defaultPrice: 0, unit: 'mes' },
      { name: 'Poda de árboles', defaultPrice: 0, unit: 'unidad' },
      { name: 'Corte de pasto', defaultPrice: 0, unit: 'servicio' },
      { name: 'Diseño de jardín', defaultPrice: 0, unit: 'proyecto' },
      { name: 'Plantación', defaultPrice: 0, unit: 'hora' },
      { name: 'Fumigación', defaultPrice: 0, unit: 'servicio' },
    ],
  },

  electricista: {
    key: 'electricista',
    name: 'Servicios Eléctricos',
    category: 'Electricidad',
    items: [
      { name: 'Instalación de tomacorriente', defaultPrice: 0, unit: 'unidad' },
      { name: 'Instalación de luminaria', defaultPrice: 0, unit: 'unidad' },
      { name: 'Tablero eléctrico (revisión)', defaultPrice: 0, unit: 'servicio' },
      { name: 'Instalación de disyuntor', defaultPrice: 0, unit: 'unidad' },
      { name: 'Cableado por metro lineal', defaultPrice: 0, unit: 'ml' },
      { name: 'Mano de obra por hora', defaultPrice: 0, unit: 'hora' },
    ],
  },

  plomero: {
    key: 'plomero',
    name: 'Servicios de Plomería',
    category: 'Plomería',
    items: [
      { name: 'Destapación de cañería', defaultPrice: 0, unit: 'servicio' },
      { name: 'Cambio de canilla', defaultPrice: 0, unit: 'unidad' },
      { name: 'Cambio de inodoro', defaultPrice: 0, unit: 'unidad' },
      { name: 'Reparación de pérdida', defaultPrice: 0, unit: 'servicio' },
      { name: 'Instalación de calefón', defaultPrice: 0, unit: 'servicio' },
      { name: 'Mano de obra por hora', defaultPrice: 0, unit: 'hora' },
    ],
  },

  general: {
    key: 'general',
    name: 'Servicios Generales',
    category: 'General',
    items: [
      { name: 'Servicio básico', defaultPrice: 0, unit: 'servicio' },
      { name: 'Hora de trabajo', defaultPrice: 0, unit: 'hora' },
      { name: 'Materiales', defaultPrice: 0, unit: 'unidad' },
      { name: 'Traslado / viático', defaultPrice: 0, unit: 'viaje' },
    ],
  },
};

/**
 * Normaliza un string: minúsculas, sin tildes, sin espacios extra.
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Palabras clave por rubro para el matching del sector libre del usuario.
 * El orden importa: el primer match gana.
 */
const SECTOR_KEYWORDS = {
  electricista: ['electrico', 'electricista', 'instalacion electrica', 'luminaria', 'tablero'],
  plomero:      ['plomero', 'plomeria', 'cañeria', 'sanitario', 'gas', 'desague'],
  albanil:      ['albanil', 'albanileria', 'construccion', 'obra', 'revoque', 'mamposteria'],
  mecanico:     ['mecanico', 'mecanica', 'taller', 'motor', 'automovil', 'vehiculo', 'auto'],
  costurero:    ['costura', 'costurero', 'costurera', 'modista', 'ropa', 'tela', 'indumentaria'],
  developer:    ['developer', 'programador', 'programacion', 'desarrollo', 'software', 'web', 'app', 'it', 'tecnologia', 'informatica'],
  disenador:    ['diseño', 'disenador', 'disenadora', 'grafico', 'grafica', 'ilustrador', 'branding', 'identidad visual'],
  community:    ['community', 'redes sociales', 'social media', 'marketing digital', 'contenido', 'instagram'],
  fotografo:    ['fotografo', 'fotografia', 'foto', 'sesion', 'video', 'audiovisual'],
  dj:           ['dj', 'sonido', 'audio', 'musica', 'animacion', 'evento'],
  jardinero:    ['jardin', 'jardinero', 'jardineria', 'poda', 'paisajismo', 'planta', 'cesped'],
};

/**
 * Detecta el rubro de un sector ingresado libremente por el usuario.
 * Si no hay coincidencia, retorna 'general'.
 *
 * @param {string} sector - Rubro ingresado por el usuario (texto libre).
 * @returns {string} Clave del rubro: 'electricista', 'plomero', ..., 'general'.
 */
export function matchSectorToKey(sector) {
  if (!sector?.trim()) return 'general';
  const norm = normalize(sector);
  for (const [key, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some(kw => norm.includes(kw))) {
      return key;
    }
  }
  return 'general';
}

/**
 * Retorna la plantilla base para un sector dado.
 * Siempre retorna algo (fallback a 'general').
 *
 * @param {string} sector - Rubro del usuario (texto libre).
 * @returns {DefaultTemplate}
 */
export function getDefaultTemplate(sector) {
  const key = matchSectorToKey(sector);
  return DEFAULT_TEMPLATES[key] ?? DEFAULT_TEMPLATES.general;
}
