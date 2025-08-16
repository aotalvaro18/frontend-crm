// src/utils/geography.ts
// ✅ SISTEMA GEOGRÁFICO INTELIGENTE CON CÓDIGOS POSTALES
// Colombia, US, España con códigos postales automáticos

export interface CityData {
    name: string;
    postalCodes: string[];
    mainPostalCode?: string; // Código principal/más común
  }
  
  export interface StateData {
    name: string;
    cities: Record<string, CityData>;
  }
  
  export interface CountryData {
    name: string;
    states: Record<string, StateData>;
  }
  
  export interface GeographyData {
    [countryCode: string]: CountryData;
  }
  
  export const GEOGRAPHY_DATA: GeographyData = {
    // ============================================
    // 🇨🇴 COLOMBIA - Departamentos, Ciudades y Códigos Postales
    // ============================================
    CO: {
      name: 'Colombia',
      states: {
        'Valle del Cauca': {
          name: 'Valle del Cauca',
          cities: {
            'Cali': { 
              name: 'Cali', 
              postalCodes: ['760001', '760010', '760020', '760030', '760040', '760050'], 
              mainPostalCode: '760001'
            },
            'Palmira': { 
              name: 'Palmira', 
              postalCodes: ['763533', '763534'], 
              mainPostalCode: '763533'
            },
            'Buenaventura': { 
              name: 'Buenaventura', 
              postalCodes: ['765001', '765002'], 
              mainPostalCode: '765001'
            },
            'Tuluá': { 
              name: 'Tuluá', 
              postalCodes: ['763041', '763042'], 
              mainPostalCode: '763041'
            },
            'Cartago': { 
              name: 'Cartago', 
              postalCodes: ['762021', '762022'], 
              mainPostalCode: '762021'
            },
            'Buga': { 
              name: 'Buga', 
              postalCodes: ['762001', '762002'], 
              mainPostalCode: '762001'
            },
            'Jamundí': { 
              name: 'Jamundí', 
              postalCodes: ['763051'], 
              mainPostalCode: '763051'
            },
            'Yumbo': { 
              name: 'Yumbo', 
              postalCodes: ['764001'], 
              mainPostalCode: '764001'
            }
          }
        },
        'Cundinamarca': {
          name: 'Cundinamarca',
          cities: {
            'Bogotá': { 
              name: 'Bogotá', 
              postalCodes: ['110111', '110121', '110131', '110141', '110211', '110221'], 
              mainPostalCode: '110111'
            },
            'Soacha': { 
              name: 'Soacha', 
              postalCodes: ['250050', '250051'], 
              mainPostalCode: '250050'
            },
            'Chía': { 
              name: 'Chía', 
              postalCodes: ['250001', '250002'], 
              mainPostalCode: '250001'
            },
            'Zipaquirá': { 
              name: 'Zipaquirá', 
              postalCodes: ['250251', '250252'], 
              mainPostalCode: '250251'
            },
            'Facatativá': { 
              name: 'Facatativá', 
              postalCodes: ['250040', '250041'], 
              mainPostalCode: '250040'
            }
          }
        },
        'Antioquia': {
          name: 'Antioquia',
          cities: {
            'Medellín': { 
              name: 'Medellín', 
              postalCodes: ['050001', '050010', '050020', '050030'], 
              mainPostalCode: '050001'
            },
            'Envigado': { 
              name: 'Envigado', 
              postalCodes: ['055040'], 
              mainPostalCode: '055040'
            },
            'Itagüí': { 
              name: 'Itagüí', 
              postalCodes: ['055010'], 
              mainPostalCode: '055010'
            },
            'Bello': { 
              name: 'Bello', 
              postalCodes: ['051001'], 
              mainPostalCode: '051001'
            }
          }
        }
      }
    },
  
    // ============================================
    // 🇺🇸 ESTADOS UNIDOS - Estados, Ciudades y ZIP Codes
    // ============================================
    US: {
      name: 'Estados Unidos',
      states: {
        'California': {
          name: 'California',
          cities: {
            'Los Angeles': { 
              name: 'Los Angeles', 
              postalCodes: ['90001', '90002', '90210', '90211', '90212'], 
              mainPostalCode: '90001'
            },
            'San Francisco': { 
              name: 'San Francisco', 
              postalCodes: ['94102', '94103', '94104', '94105'], 
              mainPostalCode: '94102'
            },
            'San Diego': { 
              name: 'San Diego', 
              postalCodes: ['92101', '92102', '92103'], 
              mainPostalCode: '92101'
            },
            'Sacramento': { 
              name: 'Sacramento', 
              postalCodes: ['95814', '95815', '95816'], 
              mainPostalCode: '95814'
            }
          }
        },
        'New York': {
          name: 'New York',
          cities: {
            'New York City': { 
              name: 'New York City', 
              postalCodes: ['10001', '10002', '10003', '10004', '10005'], 
              mainPostalCode: '10001'
            },
            'Buffalo': { 
              name: 'Buffalo', 
              postalCodes: ['14201', '14202', '14203'], 
              mainPostalCode: '14201'
            },
            'Rochester': { 
              name: 'Rochester', 
              postalCodes: ['14604', '14605', '14606'], 
              mainPostalCode: '14604'
            }
          }
        },
        'Florida': {
          name: 'Florida',
          cities: {
            'Miami': { 
              name: 'Miami', 
              postalCodes: ['33101', '33102', '33109', '33125'], 
              mainPostalCode: '33101'
            },
            'Orlando': { 
              name: 'Orlando', 
              postalCodes: ['32801', '32802', '32803'], 
              mainPostalCode: '32801'
            },
            'Tampa': { 
              name: 'Tampa', 
              postalCodes: ['33601', '33602', '33603'], 
              mainPostalCode: '33601'
            }
          }
        }
      }
    },
  
    // ============================================
    // 🇪🇸 ESPAÑA - Comunidades, Ciudades y Códigos Postales
    // ============================================
    ES: {
      name: 'España',
      states: {
        'Madrid': {
          name: 'Madrid',
          cities: {
            'Madrid': { 
              name: 'Madrid', 
              postalCodes: ['28001', '28002', '28003', '28004', '28005'], 
              mainPostalCode: '28001'
            },
            'Móstoles': { 
              name: 'Móstoles', 
              postalCodes: ['28931', '28932'], 
              mainPostalCode: '28931'
            },
            'Alcalá de Henares': { 
              name: 'Alcalá de Henares', 
              postalCodes: ['28801', '28802'], 
              mainPostalCode: '28801'
            }
          }
        },
        'Cataluña': {
          name: 'Cataluña',
          cities: {
            'Barcelona': { 
              name: 'Barcelona', 
              postalCodes: ['08001', '08002', '08003', '08004'], 
              mainPostalCode: '08001'
            },
            'Hospitalet de Llobregat': { 
              name: 'Hospitalet de Llobregat', 
              postalCodes: ['08901', '08902'], 
              mainPostalCode: '08901'
            },
            'Badalona': { 
              name: 'Badalona', 
              postalCodes: ['08911', '08912'], 
              mainPostalCode: '08911'
            }
          }
        },
        'Valencia': {
          name: 'Valencia',
          cities: {
            'Valencia': { 
              name: 'Valencia', 
              postalCodes: ['46001', '46002', '46003'], 
              mainPostalCode: '46001'
            },
            'Alicante': { 
              name: 'Alicante', 
              postalCodes: ['03001', '03002', '03003'], 
              mainPostalCode: '03001'
            }
          }
        }
      }
    }
  };
  
  // ============================================
  // UTILITY FUNCTIONS MEJORADAS
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
    const state = country?.states[stateName];
    return state ? Object.keys(state.cities) : [];
  };
  
  /**
   * ✅ NUEVO: Obtiene los códigos postales de una ciudad específica
   */
  export const getPostalCodesByCity = (countryCode: string, stateName: string, cityName: string): string[] => {
    const country = GEOGRAPHY_DATA[countryCode];
    const state = country?.states[stateName];
    const city = state?.cities[cityName];
    return city?.postalCodes || [];
  };
  
  /**
   * ✅ NUEVO: Obtiene el código postal principal de una ciudad
   */
  export const getMainPostalCode = (countryCode: string, stateName: string, cityName: string): string => {
    const country = GEOGRAPHY_DATA[countryCode];
    const state = country?.states[stateName];
    const city = state?.cities[cityName];
    return city?.mainPostalCode || city?.postalCodes[0] || '';
  };
  
  /**
   * ✅ NUEVO: Verifica si una ciudad tiene códigos postales automáticos
   */
  export const hasCityPostalCodes = (countryCode: string, stateName: string, cityName: string): boolean => {
    const postalCodes = getPostalCodesByCity(countryCode, stateName, cityName);
    return postalCodes.length > 0;
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
  
  /**
   * ✅ NUEVO: Obtiene información completa de una ubicación
   */
  export const getLocationInfo = (countryCode: string, stateName: string, cityName: string) => {
    const country = GEOGRAPHY_DATA[countryCode];
    const state = country?.states[stateName];
    const city = state?.cities[cityName];
    
    return {
      country: country?.name || '',
      state: state?.name || '',
      city: city?.name || '',
      postalCodes: city?.postalCodes || [],
      mainPostalCode: city?.mainPostalCode || city?.postalCodes[0] || '',
      hasPostalCodes: (city?.postalCodes?.length || 0) > 0
    };
  };