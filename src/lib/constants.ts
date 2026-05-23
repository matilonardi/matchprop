export const ZONES_CORDOBA = [
  // ── Capital – Zona Norte ──
  'Villa Belgrano',
  'Cerro de las Rosas',
  'Jardín',
  'Argüello',
  'Urca',
  'Villa del Parque',
  'Villa Warcalde',
  'Hermitage',
  'El Prado',
  'Colinas de Vélez Sársfield',
  'Country Club Jockey',
  // ── Capital – Centro / Clásicos ──
  'Centro',
  'Nueva Córdoba',
  'Güemes',
  'General Paz',
  'Alberdi',
  'Alta Córdoba',
  'San Martín',
  'Observatorio',
  'Talleres',
  'Pueyrredón',
  'San Vicente',
  'Ayacucho',
  'Bella Vista',
  'Villa Páez',
  'Juniors',
  'Villa Revol',
  'Bajo Palermo',
  'Empalme',
  'Los Plátanos',
  'Parque Vélez Sársfield',
  'Poeta Lugones',
  'Residencial América',
  'Los Boulevares',
  'Crisol Norte',
  'Los Naranjos',
  'Villa El Libertador',
  // ── Gran Córdoba Norte ──
  'Mendiolaza',
  'Valle Escondido',
  'Villa Allende',
  'Unquillo',
  'La Calera',
  'Río Ceballos',
  'Salsipuedes',
  'Villa Rivera Indarte',
  'Malagueño',
  'Bouwer',
  'Toledo',
  // ── Countries / Barrios Privados Norte ──
  'Los Cielos',
  'Santina Norte',
  'Los Árboles',
  'Los Sueños',
  'Lomas de Villa Allende',
  'Sierra Nueva',
  'Valle del Sol',
  'La Morada',
  'Quintas de San Isidro',
  'Los Carolinos',
  'La Reserva',
  'El Bosque',
  'Cañuelas Country',
  // ── Norte Provincial ──
  'Jesús María',
  'Colonia Caroya',
  'Sinsacate',
  'Ascochinga',
  // ── Zona Serrana (Punilla) ──
  'Villa Carlos Paz',
  'Cosquín',
  'La Falda',
  'La Cumbre',
  'Cruz del Eje',
  'Capilla del Monte',
  'Valle Hermoso',
  'Villa Giardino',
  // ── Zona Calamuchita / Sur Serrano ──
  'Alta Gracia',
  'Anisacate',
  'Villa del Dique',
  'Los Reartes',
  'Santa Rosa de Calamuchita',
  'La Cumbrecita',
  'Villa General Belgrano',
  // ── Interior Provincial ──
  'Villa María',
  'Río Cuarto',
  'Río Tercero',
  'San Francisco',
  'Bell Ville',
  'Marcos Juárez',
  'Oncativo',
  'Laguna Larga',
  'Pilar',
]

export const REQUIREMENTS = [
  { id: 'pileta', label: 'Pileta' },
  { id: 'cochera', label: 'Cochera cubierta' },
  { id: 'seguridad', label: 'Barrio con seguridad' },
  { id: 'gas_natural', label: 'Gas natural' },
  { id: 'calles_asfaltadas', label: 'Calles asfaltadas' },
  { id: 'jardin', label: 'Jardín' },
  { id: 'sum', label: 'SUM / Amenities' },
  { id: 'luz_natural', label: 'Buena iluminación natural' },
  { id: 'cocina_amplia', label: 'Cocina amplia' },
  { id: 'living_amplio', label: 'Living amplio' },
  { id: 'dvh', label: 'Aberturas DVH' },
  { id: 'calefaccion_central', label: 'Calefacción central' },
  { id: 'antiguedad', label: 'Menos de 10 años de antigüedad' },
  { id: 'terraza', label: 'Terraza / Balcón' },
]

export const PRIORITY_OPTIONS = [
  { id: 'zona_exacta', label: '📍 La zona es clave, no me muevo de ahí' },
  { id: 'precio_fijo', label: '💰 El presupuesto es fijo, no me excedo' },
  { id: 'tamano', label: '📐 El tamaño (m² / dormitorios) no es negociable' },
  { id: 'sin_reformas', label: '🔑 Sin reformas, listo para entrar' },
  { id: 'nuevo', label: '✨ Quiero algo nuevo o casi nuevo (< 10 años)' },
  { id: 'disponibilidad', label: '⚡ Necesito disponibilidad inmediata' },
]

export const URGENCY_OPTIONS = [
  { id: 'esta_semana', label: 'Esta semana' },
  { id: 'este_mes', label: 'Este mes' },
  { id: 'en_3_meses', label: 'En los próximos 3 meses' },
  { id: 'flexible', label: 'Flexible, cuando aparezca lo ideal' },
]

export const CREDIT_PACKS = [
  { id: 'pack_5', credits: 5, price_usd: 25, label: '5 créditos', price_per: 5 },
  { id: 'pack_20', credits: 20, price_usd: 80, label: '20 créditos', price_per: 4, popular: true },
  { id: 'pack_50', credits: 50, price_usd: 150, label: '50 créditos', price_per: 3 },
]

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  duplex: 'Dúplex',
  ph: 'PH',
  terreno: 'Terreno',
  local: 'Local Comercial',
  renta: 'Inversión para renta',
  revaluo: 'Inversión para revalúo',
}

export const FINANCING_LABELS: Record<string, string> = {
  efectivo: 'Efectivo / EFVO',
  credito: 'Crédito Hipotecario',
  ambos: 'Efectivo o Crédito',
}

export const CAR_BRANDS = [
  'Toyota', 'Ford', 'Volkswagen', 'Chevrolet', 'Renault', 'Peugeot',
  'Fiat', 'Honda', 'Hyundai', 'Jeep', 'Nissan', 'Kia', 'Citroën',
  'Suzuki', 'Dodge', 'Otro',
]

export const CAR_BODY_STYLES: { id: string; label: string; icon: string }[] = [
  { id: 'sedan', label: 'Sedán', icon: '🚗' },
  { id: 'suv', label: 'SUV / 4x4', icon: '🚙' },
  { id: 'hatchback', label: 'Hatchback', icon: '🚗' },
  { id: 'pickup', label: 'Pickup', icon: '🛻' },
  { id: 'monovolumen', label: 'Monovolumen', icon: '🚐' },
  { id: 'coupe', label: 'Coupé / Sport', icon: '🏎️' },
]

export const CAR_FUEL_TYPES: { id: string; label: string }[] = [
  { id: 'nafta', label: 'Nafta' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'gnc', label: 'GNC' },
  { id: 'electrico', label: 'Eléctrico' },
  { id: 'hibrido', label: 'Híbrido' },
]

export const CAR_TRANSMISSION_OPTIONS = [
  { id: 'manual', label: 'Manual' },
  { id: 'automatico', label: 'Automático' },
  { id: 'cualquiera', label: 'Cualquiera' },
]

export const CAR_CONDITION_OPTIONS = [
  { id: 'nuevo', label: '✨ 0km / Nuevo' },
  { id: 'usado', label: '🔑 Usado' },
  { id: 'cualquiera', label: '🔄 Cualquiera' },
]

export const CAR_BODY_STYLE_LABELS: Record<string, string> = {
  sedan: 'Sedán',
  suv: 'SUV / 4x4',
  hatchback: 'Hatchback',
  pickup: 'Pickup',
  monovolumen: 'Monovolumen',
  coupe: 'Coupé',
}
