// src/utils/geography.ts
// ✅ SISTEMA GEOGRÁFICO INTELIGENTE - Colombia, US, España
// Siguiendo "La Forma Eklesa" - Centralizados en constants

export interface GeographyData {
    [countryCode: string]: {
      name: string;
      states: {
        [stateName: string]: string[];
      };
    };
  }
  
  export const GEOGRAPHY_DATA: GeographyData = {
    // ============================================
    // 🇨🇴 COLOMBIA - Departamentos y Ciudades
    // ============================================
    CO: {
      name: 'Colombia',
      states: {
        'Valle del Cauca': [
          'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 
          'Yumbo', 'Candelaria', 'Florida', 'Pradera', 'Dagua', 'La Cumbre'
        ],
        'Antioquia': [
          'Medellín', 'Envigado', 'Itagüí', 'Bello', 'Sabaneta', 'La Estrella', 
          'Caldas', 'Copacabana', 'Girardota', 'Barbosa', 'Rionegro', 'Apartadó'
        ],
        'Cundinamarca': [
          'Bogotá', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Madrid', 
          'Funza', 'Mosquera', 'Fusagasugá', 'Girardot', 'Villeta'
        ],
        'Atlántico': [
          'Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande', 'Galapa', 
          'Puerto Colombia', 'Sabanalarga'
        ],
        'Bolívar': [
          'Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'San Jacinto', 
          'El Carmen de Bolívar'
        ],
        'Santander': [
          'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 
          'San Gil', 'Socorro', 'Málaga'
        ],
        'Norte de Santander': [
          'Cúcuta', 'Villa del Rosario', 'Los Patios', 'Ocaña', 'Pamplona', 
          'Villa Caro'
        ],
        'Risaralda': [
          'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 
          'Marsella', 'Belén de Umbría'
        ],
        'Caldas': [
          'Manizales', 'Villamaría', 'Chinchiná', 'La Dorada', 'Riosucio', 
          'Anserma'
        ],
        'Quindío': [
          'Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 
          'Circasia'
        ],
        'Tolima': [
          'Ibagué', 'Espinal', 'Melgar', 'Honda', 'Chaparral', 'Líbano'
        ],
        'Huila': [
          'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'San Agustín', 'Isnos'
        ],
        'Nariño': [
          'Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'Samaniego'
        ],
        'Cauca': [
          'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía'
        ],
        'Córdoba': [
          'Montería', 'Cereté', 'Lorica', 'Sahagún', 'Planeta Rica'
        ],
        'Sucre': [
          'Sincelejo', 'Corozal', 'Sampués', 'San Marcos'
        ],
        'Magdalena': [
          'Santa Marta', 'Ciénaga', 'Fundación', 'Aracataca'
        ],
        'La Guajira': [
          'Riohacha', 'Maicao', 'Uribia', 'Manaure'
        ],
        'Cesar': [
          'Valledupar', 'Aguachica', 'Bosconia', 'Codazzi'
        ],
        'Boyacá': [
          'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Villa de Leyva'
        ],
        'Meta': [
          'Villavicencio', 'Acacías', 'Granada', 'San Martín'
        ],
        'Casanare': [
          'Yopal', 'Aguazul', 'Villanueva', 'Monterrey'
        ],
        'Putumayo': [
          'Mocoa', 'Puerto Asís', 'Orito'
        ],
        'Caquetá': [
          'Florencia', 'San Vicente del Caguán', 'La Montañita'
        ],
        'Arauca': [
          'Arauca', 'Saravena', 'Fortul'
        ],
        'Amazonas': [
          'Leticia', 'Puerto Nariño'
        ],
        'Chocó': [
          'Quibdó', 'Istmina', 'Condoto'
        ],
        'San Andrés y Providencia': [
          'San Andrés', 'Providencia'
        ],
        'Vichada': [
          'Puerto Carreño', 'La Primavera'
        ],
        'Guainía': [
          'Inírida'
        ],
        'Vaupés': [
          'Mitú'
        ],
        'Guaviare': [
          'San José del Guaviare'
        ]
      }
    },
  
    // ============================================
    // 🇺🇸 ESTADOS UNIDOS - Estados y Ciudades
    // ============================================
    US: {
      name: 'Estados Unidos',
      states: {
        'California': [
          'Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland', 
          'Fresno', 'Long Beach', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine'
        ],
        'New York': [
          'New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 
          'Yonkers', 'New Rochelle', 'Utica'
        ],
        'Texas': [
          'Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 
          'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'
        ],
        'Florida': [
          'Miami', 'Orlando', 'Tampa', 'Jacksonville', 'St. Petersburg', 
          'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Pembroke Pines'
        ],
        'Illinois': [
          'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 
          'Peoria', 'Elgin'
        ],
        'Pennsylvania': [
          'Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 
          'Scranton', 'Bethlehem'
        ],
        'Ohio': [
          'Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'
        ],
        'Georgia': [
          'Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens'
        ],
        'North Carolina': [
          'Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville'
        ],
        'Michigan': [
          'Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor'
        ],
        'New Jersey': [
          'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge'
        ],
        'Virginia': [
          'Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria'
        ],
        'Washington': [
          'Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent'
        ],
        'Arizona': [
          'Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale'
        ],
        'Massachusetts': [
          'Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton'
        ],
        'Tennessee': [
          'Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro'
        ],
        'Indiana': [
          'Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers'
        ],
        'Missouri': [
          'Kansas City', 'St. Louis', 'Springfield', 'Independence', 'Columbia'
        ],
        'Maryland': [
          'Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Hagerstown'
        ],
        'Wisconsin': [
          'Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton'
        ],
        'Colorado': [
          'Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton'
        ]
      }
    },
  
    // ============================================
    // 🇪🇸 ESPAÑA - Comunidades Autónomas y Ciudades
    // ============================================
    ES: {
      name: 'España',
      states: {
        'Madrid': [
          'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 
          'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas'
        ],
        'Cataluña': [
          'Barcelona', 'Hospitalet de Llobregat', 'Badalona', 'Terrassa', 'Sabadell', 
          'Lleida', 'Tarragona', 'Mataró', 'Santa Coloma de Gramenet', 'Reus'
        ],
        'Andalucía': [
          'Sevilla', 'Málaga', 'Córdoba', 'Granada', 'Almería', 'Huelva', 
          'Jaén', 'Cádiz', 'Algeciras', 'Marbella', 'Jerez de la Frontera'
        ],
        'Valencia': [
          'Valencia', 'Alicante', 'Elche', 'Castellón de la Plana', 'Torrevieja', 
          'Orihuela', 'Benidorm', 'Alcoy', 'Sagunto', 'Gandía'
        ],
        'País Vasco': [
          'Bilbao', 'Vitoria-Gasteiz', 'San Sebastián', 'Barakaldo', 'Getxo', 
          'Irun', 'Portugalete', 'Santurtzi'
        ],
        'Galicia': [
          'Vigo', 'A Coruña', 'Santiago de Compostela', 'Ourense', 'Lugo', 
          'Pontevedra', 'Ferrol', 'Narón'
        ],
        'Castilla y León': [
          'Valladolid', 'Burgos', 'Salamanca', 'León', 'Palencia', 'Zamora', 
          'Ávila', 'Segovia', 'Soria'
        ],
        'Canarias': [
          'Las Palmas de Gran Canaria', 'Santa Cruz de Tenerife', 'Telde', 
          'San Cristóbal de La Laguna', 'Arona', 'Santa Lucía de Tirajana'
        ],
        'Murcia': [
          'Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Alcantarilla', 'Mazarrón'
        ],
        'Aragón': [
          'Zaragoza', 'Huesca', 'Teruel', 'Calatayud', 'Ejea de los Caballeros'
        ],
        'Castilla-La Mancha': [
          'Albacete', 'Toledo', 'Ciudad Real', 'Guadalajara', 'Cuenca', 
          'Talavera de la Reina', 'Puertollano'
        ],
        'Asturias': [
          'Oviedo', 'Gijón', 'Avilés', 'Siero', 'Langreo', 'Mieres'
        ],
        'Baleares': [
          'Palma', 'Calvià', 'Ibiza', 'Llucmajor', 'Manacor', 'Inca'
        ],
        'Extremadura': [
          'Badajoz', 'Cáceres', 'Mérida', 'Plasencia', 'Don Benito', 'Almendralejo'
        ],
        'Cantabria': [
          'Santander', 'Torrelavega', 'Camargo', 'Piélagos', 'El Astillero'
        ],
        'Navarra': [
          'Pamplona', 'Tudela', 'Barañáin', 'Burlada', 'Estella-Lizarra'
        ],
        'La Rioja': [
          'Logroño', 'Calahorra', 'Arnedo', 'Haro', 'Santo Domingo de la Calzada'
        ]
      }
    }
  };
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Obtiene los estados/departamentos de un país
   */
  export const getStatesByCountry = (countryCode: string): string[] => {
    const country = GEOGRAPHY_DATA[countryCode];
    return country ? Object.keys(country.states) : [];
  };
  
  /**
   * Obtiene las ciudades de un estado/departamento
   */
  export const getCitiesByState = (countryCode: string, stateName: string): string[] => {
    const country = GEOGRAPHY_DATA[countryCode];
    return country?.states[stateName] || [];
  };
  
  /**
   * Obtiene el nombre del país por código
   */
  export const getCountryName = (countryCode: string): string => {
    return GEOGRAPHY_DATA[countryCode]?.name || '';
  };
  
  /**
   * Busca estados por término
   */
  export const searchStates = (countryCode: string, searchTerm: string): string[] => {
    const states = getStatesByCountry(countryCode);
    if (!searchTerm) return states;
    
    const search = searchTerm.toLowerCase();
    return states.filter(state => 
      state.toLowerCase().includes(search)
    );
  };
  
  /**
   * Busca ciudades por término
   */
  export const searchCities = (countryCode: string, stateName: string, searchTerm: string): string[] => {
    const cities = getCitiesByState(countryCode, stateName);
    if (!searchTerm) return cities;
    
    const search = searchTerm.toLowerCase();
    return cities.filter(city => 
      city.toLowerCase().includes(search)
    );
  };
  
  /**
   * Verifica si un país tiene datos geográficos
   */
  export const hasGeographyData = (countryCode: string): boolean => {
    return countryCode in GEOGRAPHY_DATA;
  };