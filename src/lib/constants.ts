export const ZONES_CORDOBA = [
  // Zona Norte
  'Mendiolaza',
  'Valle Escondido',
  'Villa Allende',
  'Unquillo',
  'La Calera',
  'Rio Ceballos',
  'Salsipuedes',
  'Villa Rivera Indarte',
  'Malagueño',
  // Barrios/Countries Valle Escondido
  'Los Cielos',
  'Santina Norte',
  'Los Árboles',
  'Los Sueños',
  'Lomas de Villa Allende',
  'Sierra Nueva',
  'Valle del Sol',
  // Capital
  'Nueva Córdoba',
  'Villa Belgrano',
  'Cerro de las Rosas',
  'General Paz',
  'Argüello',
  'Urca',
  'Güemes',
  'Centro',
  'Alberdi',
  'Villa del Parque',
  'Jardín',
  // Sur/Otros
  'Carlos Paz',
  'Alta Gracia',
  'Villa María',
  'Río Cuarto',
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
}

export const FINANCING_LABELS: Record<string, string> = {
  efectivo: 'Efectivo / EFVO',
  credito: 'Crédito Hipotecario',
  ambos: 'Efectivo o Crédito',
}
