// Per-country address shape: what fields to show, what to call them, and what
// to offer as a dropdown. All of this is offline data — the form must be fully
// usable with no network, because the autocomplete services we use make no
// availability guarantee (see addressLookup.ts).
//
// Why this exists: "postcode" is not a universal concept. Roughly 40 countries
// have none at all — the UAE included, which is our launch market. Showing a
// Dubai tenant a postcode field asks for something that does not exist. And the
// name changes everywhere it does exist: ZIP code, Eircode, PIN code, PLZ, CEP.
// Same for the level above a city: State, Province, Emirate, Prefecture, County.

export type FieldSpec = {
  label: string;
  placeholder: string;
  required: boolean;
};

export type SubdivisionSpec = FieldSpec & {
  /** Fixed list — these are stable, so they are a dropdown rather than typing. */
  options: { code: string; name: string }[];
};

export type AddressFormat = {
  /** State / Province / Emirate / Prefecture. Null when the country does not use one in addresses. */
  subdivision: SubdivisionSpec | null;
  /** Postcode / ZIP / Eircode. Null for countries without a postal code system. */
  postal: FieldSpec | null;
  city: FieldSpec;
  street: FieldSpec;
  /**
   * Unit / apartment / flat. Required only where a dwelling is normally
   * identified by one — a UK terraced house at "48 Devonshire Road" has no unit
   * number, and demanding one blocks the signup entirely. In the Gulf, where
   * most rentals are apartments in named towers, it is how the flat is found.
   */
  unit: FieldSpec;
  /** Approximate [minLon, minLat, maxLon, maxLat] — biases autocomplete to this country. */
  bbox: [number, number, number, number];
};

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
] as const;

const CA_PROVINCES = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'],
  ['NT', 'Northwest Territories'], ['NU', 'Nunavut'], ['ON', 'Ontario'],
  ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
] as const;

const AU_STATES = [
  ['ACT', 'Australian Capital Territory'], ['NSW', 'New South Wales'],
  ['NT', 'Northern Territory'], ['QLD', 'Queensland'], ['SA', 'South Australia'],
  ['TAS', 'Tasmania'], ['VIC', 'Victoria'], ['WA', 'Western Australia'],
] as const;

const AE_EMIRATES = [
  ['AZ', 'Abu Dhabi'], ['DU', 'Dubai'], ['SH', 'Sharjah'], ['AJ', 'Ajman'],
  ['UQ', 'Umm Al Quwain'], ['RK', 'Ras Al Khaimah'], ['FU', 'Fujairah'],
] as const;

const IN_STATES = [
  ['AN', 'Andaman and Nicobar Islands'], ['AP', 'Andhra Pradesh'], ['AR', 'Arunachal Pradesh'],
  ['AS', 'Assam'], ['BR', 'Bihar'], ['CH', 'Chandigarh'], ['CT', 'Chhattisgarh'],
  ['DH', 'Dadra and Nagar Haveli and Daman and Diu'], ['DL', 'Delhi'], ['GA', 'Goa'],
  ['GJ', 'Gujarat'], ['HR', 'Haryana'], ['HP', 'Himachal Pradesh'], ['JK', 'Jammu and Kashmir'],
  ['JH', 'Jharkhand'], ['KA', 'Karnataka'], ['KL', 'Kerala'], ['LA', 'Ladakh'],
  ['LD', 'Lakshadweep'], ['MP', 'Madhya Pradesh'], ['MH', 'Maharashtra'], ['MN', 'Manipur'],
  ['ML', 'Meghalaya'], ['MZ', 'Mizoram'], ['NL', 'Nagaland'], ['OR', 'Odisha'],
  ['PY', 'Puducherry'], ['PB', 'Punjab'], ['RJ', 'Rajasthan'], ['SK', 'Sikkim'],
  ['TN', 'Tamil Nadu'], ['TG', 'Telangana'], ['TR', 'Tripura'], ['UP', 'Uttar Pradesh'],
  ['UT', 'Uttarakhand'], ['WB', 'West Bengal'],
] as const;

const NG_STATES = [
  ['AB', 'Abia'], ['AD', 'Adamawa'], ['AK', 'Akwa Ibom'], ['AN', 'Anambra'],
  ['BA', 'Bauchi'], ['BY', 'Bayelsa'], ['BE', 'Benue'], ['BO', 'Borno'],
  ['CR', 'Cross River'], ['DE', 'Delta'], ['EB', 'Ebonyi'], ['ED', 'Edo'],
  ['EK', 'Ekiti'], ['EN', 'Enugu'], ['FC', 'Federal Capital Territory'], ['GO', 'Gombe'],
  ['IM', 'Imo'], ['JI', 'Jigawa'], ['KD', 'Kaduna'], ['KN', 'Kano'], ['KT', 'Katsina'],
  ['KE', 'Kebbi'], ['KO', 'Kogi'], ['KW', 'Kwara'], ['LA', 'Lagos'], ['NA', 'Nasarawa'],
  ['NI', 'Niger'], ['OG', 'Ogun'], ['ON', 'Ondo'], ['OS', 'Osun'], ['OY', 'Oyo'],
  ['PL', 'Plateau'], ['RI', 'Rivers'], ['SO', 'Sokoto'], ['TA', 'Taraba'],
  ['YO', 'Yobe'], ['ZA', 'Zamfara'],
] as const;

const ZA_PROVINCES = [
  ['EC', 'Eastern Cape'], ['FS', 'Free State'], ['GP', 'Gauteng'],
  ['KZN', 'KwaZulu-Natal'], ['LP', 'Limpopo'], ['MP', 'Mpumalanga'],
  ['NC', 'Northern Cape'], ['NW', 'North West'], ['WC', 'Western Cape'],
] as const;

const IE_COUNTIES = [
  ['CW', 'Carlow'], ['CN', 'Cavan'], ['CE', 'Clare'], ['CO', 'Cork'], ['DL', 'Donegal'],
  ['D', 'Dublin'], ['G', 'Galway'], ['KY', 'Kerry'], ['KE', 'Kildare'], ['KK', 'Kilkenny'],
  ['LS', 'Laois'], ['LM', 'Leitrim'], ['LK', 'Limerick'], ['LD', 'Longford'], ['LH', 'Louth'],
  ['MO', 'Mayo'], ['MH', 'Meath'], ['MN', 'Monaghan'], ['OY', 'Offaly'], ['RN', 'Roscommon'],
  ['SO', 'Sligo'], ['TA', 'Tipperary'], ['WD', 'Waterford'], ['WH', 'Westmeath'],
  ['WX', 'Wexford'], ['WW', 'Wicklow'],
] as const;

const GB_COUNTIES = [
  // England — ceremonial counties. Royal Mail dropped the postal-county
  // requirement in 1996 (postcode + post town is sufficient), so this field is
  // OPTIONAL. It exists because people expect to see it and because shire
  // addresses still commonly carry it.
  ['BDF','Bedfordshire'],['BRK','Berkshire'],['BST','Bristol'],['BKM','Buckinghamshire'],
  ['CAM','Cambridgeshire'],['CHS','Cheshire'],['CON','Cornwall'],['CMA','Cumbria'],
  ['DBY','Derbyshire'],['DEV','Devon'],['DOR','Dorset'],['DUR','County Durham'],
  ['ESX','East Sussex'],['ERY','East Riding of Yorkshire'],['ESS','Essex'],
  ['GLS','Gloucestershire'],['LON','Greater London'],['GTM','Greater Manchester'],
  ['HAM','Hampshire'],['HEF','Herefordshire'],['HRT','Hertfordshire'],['IOW','Isle of Wight'],
  ['KEN','Kent'],['LAN','Lancashire'],['LEC','Leicestershire'],['LIN','Lincolnshire'],
  ['MSY','Merseyside'],['NFK','Norfolk'],['NYK','North Yorkshire'],['NTH','Northamptonshire'],
  ['NBL','Northumberland'],['NTT','Nottinghamshire'],['OXF','Oxfordshire'],['RUT','Rutland'],
  ['SHR','Shropshire'],['SOM','Somerset'],['SYK','South Yorkshire'],['STS','Staffordshire'],
  ['SFK','Suffolk'],['SRY','Surrey'],['TWR','Tyne and Wear'],['WAR','Warwickshire'],
  ['WMD','West Midlands'],['WSX','West Sussex'],['WYK','West Yorkshire'],['WIL','Wiltshire'],
  ['WOR','Worcestershire'],
  // Scotland — council areas (the practical equivalent in addresses)
  ['ABE','Aberdeen City'],['ABD','Aberdeenshire'],['ANS','Angus'],['AGB','Argyll and Bute'],
  ['CLK','Clackmannanshire'],['DGY','Dumfries and Galloway'],['DND','Dundee City'],
  ['EAY','East Ayrshire'],['EDU','East Dunbartonshire'],['ELN','East Lothian'],
  ['ERW','East Renfrewshire'],['EDH','City of Edinburgh'],['FAL','Falkirk'],['FIF','Fife'],
  ['GLG','Glasgow City'],['HLD','Highland'],['IVC','Inverclyde'],['MLN','Midlothian'],
  ['MRY','Moray'],['NAY','North Ayrshire'],['NLK','North Lanarkshire'],['ORK','Orkney Islands'],
  ['PKN','Perth and Kinross'],['RFW','Renfrewshire'],['SCB','Scottish Borders'],
  ['ZET','Shetland Islands'],['SAY','South Ayrshire'],['SLK','South Lanarkshire'],
  ['STG','Stirling'],['WDU','West Dunbartonshire'],['WLN','West Lothian'],['ELS','Na h-Eileanan Siar'],
  // Wales — principal areas
  ['BGW','Blaenau Gwent'],['BGE','Bridgend'],['CAY','Caerphilly'],['CRF','Cardiff'],
  ['CMN','Carmarthenshire'],['CGN','Ceredigion'],['CWY','Conwy'],['DEN','Denbighshire'],
  ['FLN','Flintshire'],['GWN','Gwynedd'],['AGY','Isle of Anglesey'],['MTY','Merthyr Tydfil'],
  ['MON','Monmouthshire'],['NTL','Neath Port Talbot'],['NWP','Newport'],['PEM','Pembrokeshire'],
  ['POW','Powys'],['RCT','Rhondda Cynon Taf'],['SWA','Swansea'],['TOF','Torfaen'],
  ['VGL','Vale of Glamorgan'],['WRX','Wrexham'],
  // Northern Ireland
  ['ANT','County Antrim'],['ARM','County Armagh'],['DOW','County Down'],
  ['FER','County Fermanagh'],['LDY','County Londonderry'],['TYR','County Tyrone'],
] as const;

const NZ_REGIONS = [
  ['AUK', 'Auckland'], ['BOP', 'Bay of Plenty'], ['CAN', 'Canterbury'], ['GIS', 'Gisborne'],
  ['HKB', "Hawke's Bay"], ['MBH', 'Marlborough'], ['MWT', 'Manawatū-Whanganui'],
  ['NSN', 'Nelson'], ['NTL', 'Northland'], ['OTA', 'Otago'], ['STL', 'Southland'],
  ['TAS', 'Tasman'], ['TKI', 'Taranaki'], ['WKO', 'Waikato'], ['WGN', 'Wellington'],
  ['WTC', 'West Coast'],
] as const;

const MY_STATES = [
  ['JHR', 'Johor'], ['KDH', 'Kedah'], ['KTN', 'Kelantan'], ['KUL', 'Kuala Lumpur'],
  ['LBN', 'Labuan'], ['MLK', 'Malacca'], ['NSN', 'Negeri Sembilan'], ['PHG', 'Pahang'],
  ['PNG', 'Penang'], ['PRK', 'Perak'], ['PLS', 'Perlis'], ['PJY', 'Putrajaya'],
  ['SBH', 'Sabah'], ['SWK', 'Sarawak'], ['SGR', 'Selangor'], ['TRG', 'Terengganu'],
] as const;

const SA_REGIONS = [
  ['RD', 'Riyadh'], ['MK', 'Makkah'], ['MD', 'Madinah'], ['EP', 'Eastern Province'],
  ['AS', 'Asir'], ['TB', 'Tabuk'], ['HA', "Ha'il"], ['NB', 'Northern Borders'],
  ['JZ', 'Jazan'], ['NJ', 'Najran'], ['BH', 'Al Bahah'], ['JF', 'Al Jawf'], ['QS', 'Qassim'],
] as const;

const BR_STATES = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'],
  ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'],
  ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
  ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'],
] as const;

const opts = (rows: readonly (readonly [string, string])[]) =>
  rows.map(([code, name]) => ({ code, name }));

/** City/street specs shared by most countries; overridden where the wording differs. */
const CITY = (label = 'City', placeholder = 'Start typing your city'): FieldSpec => ({
  label,
  placeholder,
  required: true,
});
const STREET = (placeholder: string, label = 'Street address'): FieldSpec => ({
  label,
  placeholder,
  required: true,
});

const FORMATS: Record<string, AddressFormat> = {
  AE: {
    // The UAE has no postal codes — deliveries use building name + area + PO box.
    subdivision: {
      label: 'Emirate',
      placeholder: 'Select emirate',
      required: true,
      options: opts(AE_EMIRATES),
    },
    postal: null,
    city: CITY('Area or community', 'e.g. Dubai Marina'),
    street: STREET('e.g. Marina Heights, Al Marsa Street', 'Building and street'),
    unit: { label: 'Unit or apartment number', placeholder: 'e.g. 1205', required: true },
    bbox: [51.0, 22.6, 56.4, 26.1],
  },
  GB: {
    // Optional by design: Royal Mail dropped the postal-county requirement in
    // 1996 and postcode + post town is sufficient. Requiring it would block
    // signups for correctly-formatted London addresses that have no county.
    subdivision: {
      label: 'County (optional)',
      placeholder: 'Select county',
      required: false,
      options: opts(GB_COUNTIES),
    },
    postal: { label: 'Postcode', placeholder: 'e.g. SW1A 1AA', required: true },
    city: CITY('Town or city', 'e.g. London'),
    street: STREET('e.g. 48 Devonshire Road'),
    unit: { label: 'Flat or apartment (optional)', placeholder: 'e.g. Flat 2', required: false },
    bbox: [-8.6, 49.9, 1.8, 60.9],
  },
  US: {
    subdivision: { label: 'State', placeholder: 'Select state', required: true, options: opts(US_STATES) },
    postal: { label: 'ZIP code', placeholder: 'e.g. 90210', required: true },
    city: CITY('City', 'e.g. Beverly Hills'),
    street: STREET('e.g. 1600 Pennsylvania Ave NW'),
    unit: { label: 'Apt, suite or unit (optional)', placeholder: 'e.g. Apt 4B', required: false },
    bbox: [-125.0, 24.4, -66.9, 49.4],
  },
  CA: {
    subdivision: { label: 'Province', placeholder: 'Select province', required: true, options: opts(CA_PROVINCES) },
    postal: { label: 'Postal code', placeholder: 'e.g. M5V 2T6', required: true },
    city: CITY('City', 'e.g. Toronto'),
    street: STREET('e.g. 12 Bloor St W'),
    unit: { label: 'Unit or suite (optional)', placeholder: 'e.g. Suite 804', required: false },
    bbox: [-141.0, 41.7, -52.6, 70.0],
  },
  AU: {
    subdivision: { label: 'State or territory', placeholder: 'Select state', required: true, options: opts(AU_STATES) },
    postal: { label: 'Postcode', placeholder: 'e.g. 2000', required: true },
    city: CITY('Suburb', 'e.g. Sydney'),
    street: STREET('e.g. 1 Macquarie Street'),
    unit: { label: 'Unit (optional)', placeholder: 'e.g. Unit 5', required: false },
    bbox: [112.9, -43.7, 153.7, -10.0],
  },
  TR: {
    subdivision: null, // 81 provinces; the postcode resolves them, so keep it light.
    postal: { label: 'Posta kodu (postcode)', placeholder: 'e.g. 34000', required: true },
    city: CITY('City', 'e.g. Istanbul'),
    street: STREET('e.g. Bağdat Caddesi 12'),
    unit: { label: 'Daire (apartment, optional)', placeholder: 'e.g. Daire 3', required: false },
    bbox: [25.6, 35.8, 44.8, 42.2],
  },
  IE: {
    subdivision: { label: 'County', placeholder: 'Select county', required: true, options: opts(IE_COUNTIES) },
    postal: { label: 'Eircode', placeholder: 'e.g. D02 X285', required: false },
    city: CITY('Town or city', 'e.g. Dublin'),
    street: STREET('e.g. 12 Grafton Street'),
    unit: { label: 'Apartment (optional)', placeholder: 'e.g. Apt 12', required: false },
    bbox: [-10.6, 51.4, -5.9, 55.4],
  },
  IN: {
    subdivision: { label: 'State', placeholder: 'Select state', required: true, options: opts(IN_STATES) },
    postal: { label: 'PIN code', placeholder: 'e.g. 110001', required: true },
    city: CITY('City', 'e.g. New Delhi'),
    street: STREET('e.g. 24 Connaught Place'),
    unit: { label: 'Flat or house number', placeholder: 'e.g. 24B', required: true },
    bbox: [68.1, 6.5, 97.4, 35.5],
  },
  NG: {
    subdivision: { label: 'State', placeholder: 'Select state', required: true, options: opts(NG_STATES) },
    postal: { label: 'Postal code', placeholder: 'e.g. 101241', required: false },
    city: CITY('City', 'e.g. Lagos'),
    street: STREET('e.g. 12 Adeola Odeku Street'),
    unit: { label: 'Flat or house number (optional)', placeholder: 'e.g. Flat 3', required: false },
    bbox: [2.6, 4.2, 14.7, 13.9],
  },
  ZA: {
    subdivision: { label: 'Province', placeholder: 'Select province', required: true, options: opts(ZA_PROVINCES) },
    postal: { label: 'Postal code', placeholder: 'e.g. 8001', required: true },
    city: CITY('City', 'e.g. Cape Town'),
    street: STREET('e.g. 1 Long Street'),
    unit: { label: 'Unit (optional)', placeholder: 'e.g. Unit 7', required: false },
    bbox: [16.4, -34.9, 32.9, -22.1],
  },
  NZ: {
    subdivision: { label: 'Region', placeholder: 'Select region', required: true, options: opts(NZ_REGIONS) },
    postal: { label: 'Postcode', placeholder: 'e.g. 6011', required: true },
    city: CITY('Suburb or city', 'e.g. Wellington'),
    street: STREET('e.g. 10 Lambton Quay'),
    unit: { label: 'Unit (optional)', placeholder: 'e.g. Unit 2', required: false },
    bbox: [166.3, -47.4, 178.6, -34.3],
  },
  MY: {
    subdivision: { label: 'State', placeholder: 'Select state', required: true, options: opts(MY_STATES) },
    postal: { label: 'Postcode', placeholder: 'e.g. 50450', required: true },
    city: CITY('City', 'e.g. Kuala Lumpur'),
    street: STREET('e.g. 12 Jalan Ampang'),
    unit: { label: 'Unit (optional)', placeholder: 'e.g. A-12-3', required: false },
    bbox: [99.6, 0.8, 119.3, 7.4],
  },
  SA: {
    subdivision: { label: 'Region', placeholder: 'Select region', required: true, options: opts(SA_REGIONS) },
    postal: { label: 'Postal code', placeholder: 'e.g. 11564', required: false },
    city: CITY('City', 'e.g. Riyadh'),
    street: STREET('e.g. King Fahd Road 7'),
    unit: { label: 'Apartment (optional)', placeholder: 'e.g. Apt 9', required: false },
    bbox: [34.5, 16.3, 55.7, 32.2],
  },
  BR: {
    subdivision: { label: 'State', placeholder: 'Select state', required: true, options: opts(BR_STATES) },
    postal: { label: 'CEP', placeholder: 'e.g. 01310-100', required: true },
    city: CITY('City', 'e.g. São Paulo'),
    street: STREET('e.g. Av. Paulista 1578'),
    unit: { label: 'Apartamento (optional)', placeholder: 'e.g. Apto 51', required: false },
    bbox: [-74.0, -33.8, -34.8, 5.3],
  },
  DE: {
    subdivision: null,
    postal: { label: 'PLZ (postcode)', placeholder: 'e.g. 10115', required: true },
    city: CITY('City', 'e.g. Berlin'),
    street: STREET('e.g. Torstraße 12'),
    unit: { label: 'Wohnung (apartment, optional)', placeholder: 'e.g. 3. OG links', required: false },
    bbox: [5.9, 47.3, 15.0, 55.1],
  },
  FR: {
    subdivision: null,
    postal: { label: 'Code postal', placeholder: 'e.g. 75001', required: true },
    city: CITY('City', 'e.g. Paris'),
    street: STREET('e.g. 12 Rue de Rivoli'),
    unit: { label: 'Appartement (optional)', placeholder: 'e.g. Apt 12', required: false },
    bbox: [-5.1, 41.3, 9.6, 51.1],
  },
  NL: {
    subdivision: null,
    postal: { label: 'Postcode', placeholder: 'e.g. 1011 AB', required: true },
    city: CITY('City', 'e.g. Amsterdam'),
    street: STREET('e.g. Damrak 12'),
    unit: { label: 'Toevoeging (optional)', placeholder: 'e.g. 2-hoog', required: false },
    bbox: [3.3, 50.7, 7.2, 53.6],
  },
  ES: {
    subdivision: null,
    postal: { label: 'Código postal', placeholder: 'e.g. 28001', required: true },
    city: CITY('City', 'e.g. Madrid'),
    street: STREET('e.g. Calle de Alcalá 12'),
    unit: { label: 'Piso o puerta (optional)', placeholder: 'e.g. 3ºB', required: false },
    bbox: [-18.2, 27.6, 4.3, 43.8],
  },
  IT: {
    subdivision: null,
    postal: { label: 'CAP (postcode)', placeholder: 'e.g. 00118', required: true },
    city: CITY('City', 'e.g. Rome'),
    street: STREET('e.g. Via del Corso 12'),
    unit: { label: 'Interno (optional)', placeholder: 'e.g. Int. 5', required: false },
    bbox: [6.6, 35.5, 18.5, 47.1],
  },
  HK: {
    // Hong Kong has no postal codes; district + building is the address.
    subdivision: null,
    postal: null,
    city: CITY('District', 'e.g. Wan Chai'),
    street: STREET('e.g. 12 Queen’s Road East'),
    unit: { label: 'Flat and floor', placeholder: 'e.g. Flat A, 12/F', required: true },
    bbox: [113.8, 22.1, 114.4, 22.6],
  },
};

/** Countries not listed above get a sensible generic shape. */
const DEFAULT_FORMAT: AddressFormat = {
  subdivision: null,
  postal: { label: 'Postal code', placeholder: 'Postal code', required: false },
  city: CITY(),
  street: STREET('Street and number'),
  unit: { label: 'Unit or apartment (optional)', placeholder: 'e.g. 4B', required: false },
  bbox: [-180, -90, 180, 90],
};

export function addressFormat(countryCode: string): AddressFormat {
  return FORMATS[countryCode] ?? DEFAULT_FORMAT;
}

/** True when the country uses postal codes at all. */
export function hasPostalCode(countryCode: string): boolean {
  return addressFormat(countryCode).postal !== null;
}

/** Look up a subdivision's display name from its code, for summaries. */
export function subdivisionName(countryCode: string, code: string): string {
  const spec = addressFormat(countryCode).subdivision;
  return spec?.options.find((o) => o.code === code)?.name ?? code;
}
