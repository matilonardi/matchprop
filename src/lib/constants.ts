export const ZONES_CORDOBA = [
  // ── Capital – Zona Norte ──
  'Villa Belgrano',
  'Cerro de las Rosas',
  'Alto Verde',
  'Jardín',
  'Argüello',
  'Urca',
  'Villa del Parque',
  'Villa Warcalde',
  'Chateau Carreras',
  'Altos del Chateau',
  'Hermitage',
  'El Prado',
  'Colinas de Vélez Sársfield',
  'Country Club Jockey',
  'Granja de Funes',
  // ── Capital – Centro / Clásicos ──
  'Centro',
  'Nueva Córdoba',
  'Güemes',
  'General Paz',
  'Alberdi',
  'Cofico',
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
  'Villa Cabrera',
  'Bajo Palermo',
  'Empalme',
  'Los Plátanos',
  'Parque Vélez Sársfield',
  'Poeta Lugones',
  'Residencial América',
  'Los Boulevares',
  'Crisol Norte',
  'Crisol Sur',
  'Los Naranjos',
  'Villa El Libertador',
  // ── Capital – Zona Sur ──
  'Manantiales',
  'Manantiales I',
  'Manantiales II',
  'La Luisita',
  'Fontanas del Sur',
  'Residencial San Carlos',
  'San Antonio',
  'Parque Montecristo',
  'Tablada Park',
  'Los Pinos',
  'Nueva Italia',
  'Yofre Sud',
  'San Fernando',
  'Hipódromo',
  'Mansos del Sur',
  // ── Gran Córdoba Norte/Oeste ──
  'Mendiolaza',
  'Talar',
  'Valle Escondido',
  'Tropezon',
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
  'Chacras de la Villa',
  'Comarca',
  'Sierra Nueva',
  'Valle del Sol',
  'La Morada',
  'Quintas de San Isidro',
  'Los Carolinos',
  'La Reserva',
  'El Bosque',
  'Cañuelas Country',
  'La Carolina',
  // ── Countries / Barrios Privados Sur ──
  'Villasol',
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
  // ── Más pedidos (de grupos reales) ──
  { id: 'apta_credito', label: 'Apta crédito hipotecario' },
  { id: 'una_sola_planta', label: 'Una sola planta / Planta baja' },
  { id: 'con_escritura', label: 'Con escritura al día' },
  { id: 'desocupado', label: 'Desocupada / Sin inquilinos' },
  { id: 'patio', label: 'Con patio' },
  { id: 'cochera_techada', label: 'Cochera techada / Cubierta' },
  { id: 'en_pozo', label: 'En pozo / A estrenar' },
  // ── Características adicionales ──
  { id: 'pileta', label: 'Pileta' },
  { id: 'gas_natural', label: 'Gas natural' },
  { id: 'calles_asfaltadas', label: 'Calles asfaltadas' },
  { id: 'jardin', label: 'Jardín / Patio grande' },
  { id: 'sum', label: 'SUM / Amenities' },
  { id: 'luz_natural', label: 'Buena iluminación natural' },
  { id: 'cocina_amplia', label: 'Cocina amplia / Separada' },
  { id: 'living_amplio', label: 'Living / Espacio social amplio' },
  { id: 'dvh', label: 'Aberturas DVH' },
  { id: 'calefaccion_central', label: 'Calefacción central' },
  { id: 'antiguedad', label: 'Menos de 15 años de antigüedad' },
  { id: 'terraza', label: 'Terraza / Balcón' },
]

// Specific security types (replaces the generic "seguridad" requirement)
export const SEGURIDAD_TIPOS = [
  { id: 'rejas', label: 'Rejas' },
  { id: 'guardia_cuadra', label: 'Guardia en la cuadra' },
  { id: 'housing', label: 'Housing' },
  { id: 'barrio_cerrado', label: 'Barrio cerrado' },
  { id: 'country', label: 'Country' },
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
  { id: 'pack_3',         credits: 3,   price_ars: 80000,  label: '3 créditos',        price_per_ars: 26667, popular: false, unlimited: false },
  { id: 'pack_5',         credits: 5,   price_ars: 100000, label: '5 créditos',        price_per_ars: 20000, popular: true,  unlimited: false },
  { id: 'pack_10',        credits: 10,  price_ars: 180000, label: '10 créditos',       price_per_ars: 18000, popular: false, unlimited: false },
  { id: 'pack_unlimited', credits: 999, price_ars: 350000, label: 'Ilimitado mensual', price_per_ars: 0,     popular: false, unlimited: true  },
]

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  duplex: 'Dúplex',
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
